import crypto from 'crypto';
import { AIUsageLog } from '../models/AIUsageLog.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { startOfToday } from '../utils/date.js';
import { ApiError } from '../utils/ApiError.js';
import { invalidateAdminAnalyticsCache } from './cacheInvalidation.service.js';

const limitMap = {
  [AI_FEATURES.MENTOR_CHAT]: () => Number(process.env.DAILY_MENTOR_LIMIT || 10),
  [AI_FEATURES.ROADMAP_GENERATION]: () => Number(process.env.DAILY_ROADMAP_LIMIT || 1),
  [AI_FEATURES.QUIZ_EXPLANATION]: () => Number(process.env.DAILY_QUIZ_EXPLANATION_LIMIT || 3),
  [AI_FEATURES.WEEKLY_REPORT]: () => Number(process.env.WEEKLY_REPORT_LIMIT || 1),
  [AI_FEATURES.PROJECT_REVIEW]: () => Number(process.env.DAILY_PROJECT_REVIEW_LIMIT || 5),
  [AI_FEATURES.INTERVIEW_FEEDBACK]: () => Number(process.env.DAILY_INTERVIEW_FEEDBACK_LIMIT || 5)
};

export const createPromptFingerprint = (value = '') => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);

export const estimateTokens = (value = '') => Math.ceil(String(value).split(/\s+/).filter(Boolean).length * 1.35);

export const checkAIUsageLimit = async (userId, feature) => {
  const limit = limitMap[feature]?.() ?? 5;
  const count = await AIUsageLog.countDocuments({
    user: userId,
    feature,
    status: 'success',
    createdAt: { $gte: startOfToday() }
  });

  if (count >= limit) {
    await AIUsageLog.create({
      user: userId,
      feature,
      status: 'blocked',
      model: process.env.AI_PROVIDER || 'mock',
      provider: process.env.AI_PROVIDER || 'mock',
      metadata: { limit }
    });
    await invalidateAdminAnalyticsCache();
    throw new ApiError(429, `Daily AI limit reached for ${feature}`);
  }
};

export const logAIUsage = async ({
  user,
  feature,
  status = 'success',
  model = 'mock',
  provider = process.env.AI_PROVIDER || 'mock',
  inputTokens = 0,
  outputTokens = 0,
  estimatedCost = 0,
  latencyMs = 0,
  promptFingerprint = '',
  contextSources = [],
  metadata = {},
  errorMessage = ''
}) => {
  const log = await AIUsageLog.create({
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
  await invalidateAdminAnalyticsCache();
  return log;
};
