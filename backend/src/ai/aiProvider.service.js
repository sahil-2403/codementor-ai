import { env, isGeminiAvailable } from '../config/env.js';
import { geminiClient } from './geminiClient.js';
import { AI_ERROR_CODES, AIServiceError } from './aiErrors.js';
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

const ensureGeminiAvailable = () => {
  if (!env.enableAi) {
    throw new AIServiceError(AI_ERROR_CODES.DISABLED, 'Gemini is disabled for this environment');
  }
  if (!isGeminiAvailable()) {
    throw new AIServiceError(AI_ERROR_CODES.NOT_CONFIGURED, 'Gemini is not configured for this environment');
  }
};

const resultInfo = (result) => ({ model: result.model, aiAvailable: true });

export const aiProvider = {
  async generateRoadmap({ template, enrollment, course, assessment }) {
    ensureGeminiAvailable();
    const result = await geminiClient.generate({
      ...buildRoadmapPrompt({ template, enrollment, course, assessment }),
      schema: roadmapResponseSchema,
      validationMessage: 'Gemini roadmap response did not match the roadmap schema'
    });
    return { ...result.data, ...resultInfo(result) };
  },

  async answerMentorQuestion({ question, lesson, weakTopics, course, currentModule, recentMistakes = [], relatedContext = [], promptType = 'freeform' }) {
    ensureGeminiAvailable();
    const sources = relatedContext.map((item) => item.source).filter(Boolean);
    const result = await geminiClient.generate(buildMentorPrompt({
      question,
      promptType,
      level: course?.level || 'learner',
      lessonTitle: lesson?.title || currentModule?.title || 'your current learning path',
      currentModule: currentModule?.title,
      weakTopics,
      recentMistakes,
      relatedContext
    }));
    return { answer: result.text, sources, ...resultInfo(result) };
  },

  async explainQuizMistakes({ weakTopics, wrongAnswers = [], relatedContext = [], userLevel = 'learner' }) {
    ensureGeminiAvailable();
    const sources = relatedContext.map((item) => item.source).filter(Boolean);
    const result = await geminiClient.generate(buildQuizExplanationPrompt({
      userLevel,
      weakTopics,
      wrongAnswers,
      relatedContext
    }));
    return {
      feedback: result.text,
      focusTopics: weakTopics?.map((item) => item.topic) || [],
      sources,
      ...resultInfo(result)
    };
  },

  async reviewProjectSubmission({ task, submission, userLevel = 'learner', weakTopics = [] }) {
    ensureGeminiAvailable();
    const result = await geminiClient.generate({
      ...buildProjectReviewPrompt({ task, submission, userLevel, weakTopics }),
      schema: projectReviewResponseSchema,
      validationMessage: 'Gemini project review did not match the expected schema'
    });
    return { ...result.data, ...resultInfo(result) };
  },

  async reviewInterviewAnswer({ question, answer, userLevel = 'learner' }) {
    ensureGeminiAvailable();
    const result = await geminiClient.generate({
      ...buildInterviewFeedbackPrompt({ question, answer, userLevel }),
      schema: interviewReviewResponseSchema,
      validationMessage: 'Gemini interview feedback did not match the expected schema'
    });
    return { ...result.data, ...resultInfo(result) };
  },

  async generateWeeklyReport({ progress }) {
    ensureGeminiAvailable();
    const result = await geminiClient.generate({
      ...buildWeeklyReportPrompt({ progress }),
      schema: weeklyReportResponseSchema,
      validationMessage: 'Gemini weekly report response did not match the expected schema'
    });
    return { ...result.data, ...resultInfo(result) };
  }
};
