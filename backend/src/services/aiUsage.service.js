import crypto from 'crypto';
import { AIUsageLog } from '../models/AIUsageLog.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { startOfToday } from '../utils/date.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const limitMap = {
  [AI_FEATURES.MENTOR_CHAT]: () => env.aiLimits.mentor,
  [AI_FEATURES.ROADMAP_GENERATION]: () => env.aiLimits.roadmap,
  [AI_FEATURES.QUIZ_EXPLANATION]: () => env.aiLimits.quizExplanation,
  [AI_FEATURES.WEEKLY_REPORT]: () => env.aiLimits.weeklyReport,
  [AI_FEATURES.PROJECT_REVIEW]: () => env.aiLimits.projectReview,
  [AI_FEATURES.INTERVIEW_FEEDBACK]: () => env.aiLimits.interviewFeedback
};

export const createPromptFingerprint = (value = '') => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
export const estimateTokens = (value = '') => Math.ceil(String(value).split(/\s+/).filter(Boolean).length * 1.35);

export const checkAIUsageLimit = async (userId, feature) => {
  const limit = limitMap[feature]?.() ?? 5;
  const count = await AIUsageLog.countDocuments({ user: userId, feature, status: 'success', createdAt: { $gte: startOfToday() } });
  if (count >= limit) {
    await AIUsageLog.create({ user: userId, feature, status: 'blocked', model: env.geminiModel, provider: 'gemini', metadata: { limit } });
    throw new ApiError(429, `Daily AI limit reached for ${feature}`);
  }
};

export const logAIUsage = async ({
  user,
  feature,
  status = 'success',
  model = env.geminiModel,
  provider = 'gemini',
  inputTokens = 0,
  outputTokens = 0,
  estimatedCost = 0,
  latencyMs = 0,
  promptFingerprint = '',
  contextSources = [],
  metadata = {},
  errorMessage = ''
}) => AIUsageLog.create({
  user,
  feature,
  status,
  model,
  provider,
  inputTokens,
  outputTokens,
  estimatedCost,
  latencyMs,
  promptFingerprint,
  contextSourceCount: contextSources.length,
  contextSources,
  metadata,
  errorMessage
});
