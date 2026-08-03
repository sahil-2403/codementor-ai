import { env } from '../config/env.js';
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

const estimateGeminiCost = ({ inputTokens = 0, outputTokens = 0 }) =>
  Number((((inputTokens / 1_000_000) * 0.10) + ((outputTokens / 1_000_000) * 0.40)).toFixed(6));

const withCost = (result) => ({
  ...result,
  estimatedCost: estimateGeminiCost(result)
});

const ensureGeminiAvailable = () => {
  if (!env.enableAi) {
    throw new AIServiceError(
      AI_ERROR_CODES.DISABLED,
      'Gemini is disabled for this environment'
    );
  }

  if (env.aiProvider !== 'gemini' || !env.geminiApiKey) {
    throw new AIServiceError(
      AI_ERROR_CODES.NOT_CONFIGURED,
      'Gemini is not configured for this environment'
    );
  }
};

export const aiProvider = {
  async generateRoadmap({ template, goal, assessment }) {
    ensureGeminiAvailable();
    const result = await geminiClient.generate({
      ...buildRoadmapPrompt({ template, goal, assessment }),
      schema: roadmapResponseSchema,
      validationMessage: 'Gemini roadmap response did not match the roadmap schema'
    });

    return withCost({
      ...result.data,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      aiAvailable: true
    });
  },

  async answerMentorQuestion({
    question,
    lesson,
    weakTopics,
    course,
    currentModule,
    recentMistakes = [],
    relatedContext = [],
    promptType = 'freeform'
  }) {
    ensureGeminiAvailable();

    const sources = relatedContext.map((item) => item.source).filter(Boolean);
    const lessonTitle = lesson?.title || currentModule?.title || 'your current learning path';
    const level = course?.level || 'learner';
    const result = await geminiClient.generate(buildMentorPrompt({
      question,
      promptType,
      level,
      lessonTitle,
      currentModule: currentModule?.title,
      weakTopics,
      recentMistakes,
      relatedContext
    }));

    return withCost({
      answer: result.text,
      sources,
      model: result.model,
      provider: result.provider,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
      aiAvailable: true
    });
  },

  async explainQuizMistakes({ weakTopics, wrongAnswers = [], relatedContext = [], userLevel = 'learner' }) {
    ensureGeminiAvailable();

    const sources = relatedContext.map((item) => item.source).filter(Boolean);
    const topics = weakTopics?.map((item) => item.topic) || [];
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
      latencyMs: result.latencyMs,
      aiAvailable: true
    });
  },

  async reviewProjectSubmission({ task, submission, userLevel = 'learner', weakTopics = [] }) {
    ensureGeminiAvailable();

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
      latencyMs: result.latencyMs,
      aiAvailable: true
    });
  },

  async reviewInterviewAnswer({ question, answer, userLevel = 'learner' }) {
    ensureGeminiAvailable();

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
      latencyMs: result.latencyMs,
      aiAvailable: true
    });
  },

  async generateWeeklyReport({ progress }) {
    ensureGeminiAvailable();

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
      latencyMs: result.latencyMs,
      aiAvailable: true
    });
  }
};
