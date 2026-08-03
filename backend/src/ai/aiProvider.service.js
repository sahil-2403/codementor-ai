import { env } from '../config/env.js';
import { geminiClient } from './geminiClient.js';
import {
  interviewReviewResponseSchema,
  projectReviewResponseSchema,
  roadmapResponseSchema,
  weeklyReportResponseSchema
} from './aiSchemas.js';
import {
  buildInterviewFeedbackPrompt,
  buildMentorPrompt,
  buildProjectReviewPrompt,
  buildQuizExplanationPrompt,
  buildRoadmapPrompt,
  buildWeeklyReportPrompt
} from './promptBuilders.js';

const mockDelay = () => new Promise((resolve) => setTimeout(resolve, 250));
const roughTokens = (text = '') => Math.ceil(String(text).split(/\s+/).filter(Boolean).length * 1.35);

const sourceListText = (sources = []) => sources.length
  ? `\n\nBased on these learning sources:\n${sources.map((source, index) => `${index + 1}. ${source.title}`).join('\n')}`
  : '';

const estimateGeminiCost = ({ inputTokens = 0, outputTokens = 0 }) =>
  Number((((inputTokens / 1_000_000) * 0.10) + ((outputTokens / 1_000_000) * 0.40)).toFixed(6));

const withCost = (result) => ({
  ...result,
  estimatedCost: estimateGeminiCost(result)
});

const usesFallbackMode = () => !env.enableAi || env.aiProvider === 'mock';

const ensureGeminiProvider = () => {
  if (env.aiProvider !== 'gemini') {
    throw new Error(`Gemini is the only supported real AI provider. Received: ${env.aiProvider}`);
  }
};

export const aiProvider = {
  async generateRoadmap({ template, goal, assessment }) {
    await mockDelay();

    if (usesFallbackMode()) {
      const focusNote = assessment?.weakTopics?.length
        ? `Personalized focus added for: ${assessment.weakTopics.map((item) => item.topic).join(', ')}.`
        : `Pace adjusted for ${goal?.dailyStudyTime || 90} minutes/day and ${goal?.learningStyle || 'project-based'} learning.`;

      return {
        title: `${template.title} — Personalized`,
        description: `${template.description} ${focusNote}`,
        modules: template.modules.map((module, index) => ({
          ...module,
          description: `${module.description || ''} ${index === 0 ? focusNote : ''}`.trim()
        })),
        model: 'mock-roadmap-v2',
        provider: 'mock',
        inputTokens: roughTokens(JSON.stringify({ template: template.title, goal, assessment })),
        outputTokens: roughTokens(template.description || '') + 120,
        estimatedCost: 0
      };
    }

    ensureGeminiProvider();
    const prompt = buildRoadmapPrompt({ template, goal, assessment });
    const result = await geminiClient.generate({
      ...prompt,
      schema: roadmapResponseSchema,
      validationMessage: 'Gemini roadmap response did not match the roadmap schema'
    });

    return withCost({
      ...result.data,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs
    });
  },

  async answerMentorQuestion({ question, lesson, weakTopics, course, currentModule, recentMistakes = [], relatedContext = [], promptType = 'freeform' }) {
    await mockDelay();

    const sources = relatedContext.map((item) => item.source).filter(Boolean);
    const lessonTitle = lesson?.title || currentModule?.title || 'your current learning path';
    const level = course?.level || 'learner';
    const weakTopicText = weakTopics?.length ? weakTopics.slice(0, 3).map((item) => item.topic).join(', ') : '';
    const mistakeText = recentMistakes?.length ? recentMistakes.slice(0, 2).map((item) => `${item.topic}: ${item.selectedAnswer} → ${item.correctAnswer}`).join('; ') : '';

    if (usesFallbackMode()) {
      const answer = [
        `You are asking about: "${question}".`,
        `I am answering in the context of ${lessonTitle}${level ? ` for a ${level} learner` : ''}.`,
        weakTopicText ? `Your current weak areas include ${weakTopicText}, so focus on the core idea before moving to advanced examples.` : '',
        mistakeText ? `From your recent quiz mistakes, pay special attention to: ${mistakeText}.` : '',
        'Simple explanation: connect the concept to a small MERN project flow. First understand what problem the concept solves, then read the code example line by line, then write a tiny version yourself without copying.',
        promptType === 'interview_answer' ? 'Interview-ready answer: define the concept clearly, explain why it is used, mention one real project example, and finish with a common mistake to avoid.' : '',
        promptType === 'practice_question' ? 'Practice task: create a tiny example for this concept, intentionally make one mistake, then debug it and write what changed.' : '',
        sourceListText(sources)
      ].filter(Boolean).join('\n\n');

      return {
        answer,
        sources,
        model: 'mock-mentor-v2',
        provider: 'mock',
        inputTokens: roughTokens(JSON.stringify({ question, lessonTitle, weakTopics, recentMistakes, sourceCount: sources.length })),
        outputTokens: roughTokens(answer),
        estimatedCost: 0
      };
    }

    ensureGeminiProvider();
    const prompt = buildMentorPrompt({
      question,
      promptType,
      level,
      lessonTitle,
      currentModule: currentModule?.title,
      weakTopics,
      recentMistakes,
      relatedContext
    });
    const result = await geminiClient.generate(prompt);

    return withCost({
      answer: result.text,
      sources,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs
    });
  },

  async explainQuizMistakes({ weakTopics, wrongAnswers = [], relatedContext = [], userLevel = 'learner' }) {
    await mockDelay();
    const sources = relatedContext.map((item) => item.source).filter(Boolean);
    const topics = weakTopics?.map((item) => item.topic) || [];
    const answerReview = wrongAnswers.slice(0, 4).map((answer, index) => `${index + 1}. ${answer.topic}: you selected "${answer.selectedAnswer || 'blank'}", correct answer is "${answer.correctAnswer}".`).join('\n');

    if (usesFallbackMode()) {
      const feedback = topics.length
        ? [
          `Your main revision focus should be: ${topics.join(', ')}.`,
          answerReview ? `Mistake breakdown:\n${answerReview}` : '',
          `For a ${userLevel} learner, the best next step is to revise the related lesson, solve two smaller questions, then retry a mixed quiz. Do not just memorize the correct option; explain why the wrong option was tempting.`,
          sourceListText(sources)
        ].filter(Boolean).join('\n\n')
        : 'Good attempt. Continue to the next lesson and revise your notes once.';

      return {
        feedback,
        focusTopics: topics,
        sources,
        model: 'mock-quiz-explainer-v2',
        provider: 'mock',
        inputTokens: roughTokens(JSON.stringify({ weakTopics, wrongAnswers, sourceCount: sources.length })),
        outputTokens: roughTokens(feedback),
        estimatedCost: 0
      };
    }

    ensureGeminiProvider();
    const result = await geminiClient.generate(buildQuizExplanationPrompt({
      userLevel,
      weakTopics,
      wrongAnswers,
      relatedContext
    }));

    return withCost({
      feedback: result.text,
      focusTopics: topics,
      sources,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs
    });
  },

  async reviewProjectSubmission({ task, submission, userLevel = 'learner', weakTopics = [] }) {
    await mockDelay();
    const checklist = task?.evaluationChecklist || [];
    const submittedText = `${submission?.submittedCode || ''}\n${submission?.submittedExplanation || ''}`;

    if (usesFallbackMode()) {
      const hasCode = Boolean((submission?.submittedCode || '').trim());
      const hasExplanation = Boolean((submission?.submittedExplanation || '').trim());
      const score = Math.min(95, Math.max(35, 45 + (hasCode ? 25 : 0) + (hasExplanation ? 15 : 0) + Math.min(checklist.length * 3, 10)));
      const relatedWeak = weakTopics?.slice(0, 2).map((item) => item.topic).filter(Boolean) || [];
      const summary = `Your submission for "${task?.title}" has been reviewed. For a ${userLevel} learner, the main goal is to prove the requirements clearly, explain tradeoffs, and connect the solution to real MERN usage.`;
      const improvements = [
        hasCode ? 'Add small comments around the most important logic so an interviewer can follow your thought process.' : 'Add code or pseudocode so the review can evaluate implementation quality.',
        hasExplanation ? 'Make the explanation more structured: problem, approach, edge cases, and final output.' : 'Add a short explanation of your approach and decisions.',
        relatedWeak.length ? `Revise related weak areas: ${relatedWeak.join(', ')}.` : 'Add one edge case and one validation case to make the solution stronger.'
      ];

      return {
        score,
        summary,
        strengths: [
          hasCode ? 'You included implementation details instead of only theory.' : 'You attempted the task and can now improve it with concrete code.',
          hasExplanation ? 'You explained your approach, which helps during interview discussions.' : 'The task requirements give you a clear checklist to complete next.'
        ],
        improvements,
        checklist: checklist.map((item, index) => ({
          item,
          passed: index < Math.ceil(checklist.length * (score / 100)),
          feedback: index < Math.ceil(checklist.length * (score / 100)) ? 'Covered or partially covered.' : 'Needs more evidence in code/explanation.'
        })),
        weakTopicsDetected: improvements.slice(0, 2).map(() => ({
          topic: task?.moduleTitle || 'Project implementation',
          score: Math.max(35, 100 - score)
        })),
        model: 'mock-project-review-v1',
        provider: 'mock',
        inputTokens: roughTokens(JSON.stringify({ task, submittedText })),
        outputTokens: roughTokens(summary + improvements.join(' ')),
        estimatedCost: 0
      };
    }

    ensureGeminiProvider();
    const result = await geminiClient.generate({
      ...buildProjectReviewPrompt({ task, submission, userLevel, weakTopics }),
      schema: projectReviewResponseSchema,
      validationMessage: 'Gemini project review did not match the expected schema'
    });

    return withCost({
      ...result.data,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs
    });
  },

  async reviewInterviewAnswer({ question, answer, userLevel = 'learner' }) {
    await mockDelay();

    if (usesFallbackMode()) {
      const answerLength = String(answer || '').split(/\s+/).filter(Boolean).length;
      const checklist = question?.answerChecklist || [];
      const score = Math.min(92, Math.max(30, 35 + Math.min(answerLength, 80) * 0.45 + checklist.length * 4));
      const summary = `Your answer was reviewed for a ${userLevel} interview level. A strong answer should include definition, example, real project use case, and one common mistake.`;
      return {
        score: Math.round(score),
        summary,
        expectedAnswer: question?.expectedAnswer || '',
        strengths: answerLength > 35 ? ['You gave enough detail to evaluate your understanding.'] : ['You started the answer clearly.'],
        improvements: [
          'Structure the answer as: definition → example → project use case → common mistake.',
          'Use one concrete MERN example from CodeMentor AI or HireFlow.',
          answerLength < 35 ? 'Expand the answer with more explanation and one code/example reference.' : 'Tighten the answer so it stays concise under interview pressure.'
        ],
        weakTopicsDetected: [{
          topic: question?.topic || 'Interview communication',
          score: Math.max(25, 100 - Math.round(score))
        }],
        model: 'mock-interview-review-v1',
        provider: 'mock',
        inputTokens: roughTokens(JSON.stringify({ question: question?.question, answer })),
        outputTokens: roughTokens(summary),
        estimatedCost: 0
      };
    }

    ensureGeminiProvider();
    const result = await geminiClient.generate({
      ...buildInterviewFeedbackPrompt({ question, answer, userLevel }),
      schema: interviewReviewResponseSchema,
      validationMessage: 'Gemini interview feedback did not match the expected schema'
    });

    return withCost({
      ...result.data,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs
    });
  },

  async generateWeeklyReport({ progress }) {
    await mockDelay();

    if (usesFallbackMode()) {
      const weakTopics = progress?.weakTopics?.map((item) => item.topic) || [];
      const summary = `You completed ${progress?.completedLessons?.length || 0} lessons this week. Keep your streak active and revise weak areas regularly.`;
      return {
        summary,
        nextWeekFocus: weakTopics.slice(0, 3),
        model: 'mock-weekly-report-v2',
        provider: 'mock',
        inputTokens: roughTokens(JSON.stringify(progress || {})),
        outputTokens: roughTokens(summary),
        estimatedCost: 0
      };
    }

    ensureGeminiProvider();
    const result = await geminiClient.generate({
      ...buildWeeklyReportPrompt({ progress }),
      schema: weeklyReportResponseSchema,
      validationMessage: 'Gemini weekly report did not match the expected schema'
    });

    return withCost({
      ...result.data,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs
    });
  }
};
