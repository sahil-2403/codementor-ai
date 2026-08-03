import crypto from 'crypto';
import { AIUsageLog } from '../models/AIUsageLog.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { startOfToday } from '../utils/date.js';
import { ApiError } from '../utils/ApiError.js';
import { env, isGeminiAvailable } from '../config/env.js';

const limitMap = {
  [AI_FEATURES.MENTOR_CHAT]: () => env.aiLimits.mentor,
  [AI_FEATURES.ROADMAP_GENERATION]: () => env.aiLimits.roadmap,
  [AI_FEATURES.QUIZ_EXPLANATION]: () => env.aiLimits.quizExplanation,
  [AI_FEATURES.WEEKLY_REPORT]: () => env.aiLimits.weeklyReport,
  [AI_FEATURES.PROJECT_REVIEW]: () => env.aiLimits.projectReview,
  [AI_FEATURES.INTERVIEW_FEEDBACK]: () => env.aiLimits.interviewFeedback
};

const learnerFeatures = Object.freeze([
  AI_FEATURES.MENTOR_CHAT,
  AI_FEATURES.ROADMAP_GENERATION,
  AI_FEATURES.QUIZ_EXPLANATION,
  AI_FEATURES.WEEKLY_REPORT,
  AI_FEATURES.PROJECT_REVIEW,
  AI_FEATURES.INTERVIEW_FEEDBACK
]);

const nextDailyReset = () => {
  const resetAt = startOfToday();
  resetAt.setDate(resetAt.getDate() + 1);
  return resetAt;
};

export const createPromptFingerprint = (value = '') => crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
export const estimateTokens = (value = '') => Math.ceil(String(value).split(/\s+/).filter(Boolean).length * 1.35);

export const checkAIUsageLimit = async (userId, feature) => {
  const limit = limitMap[feature]?.() ?? 5;
  const count = await AIUsageLog.countDocuments({ user: userId, feature, status: 'success', createdAt: { $gte: startOfToday() } });
  if (count >= limit) {
    await AIUsageLog.create({ user: userId, feature, status: 'blocked', model: env.geminiModel, provider: 'gemini', metadata: { limit } });
    throw new ApiError(429, `Daily AI limit reached for ${feature}`, [], 'AI_DAILY_LIMIT_REACHED');
  }
};

export const getLearnerAIStatus = async (userId) => {
  const enabled = env.enableAi;
  const configured = Boolean(env.geminiApiKey);
  const available = isGeminiAvailable();
  const resetAt = nextDailyReset();

  const usage = await AIUsageLog.aggregate([
    {
      $match: {
        user: userId,
        feature: { $in: learnerFeatures },
        status: 'success',
        createdAt: { $gte: startOfToday() }
      }
    },
    { $group: { _id: '$feature', used: { $sum: 1 } } }
  ]);

  const usedByFeature = new Map(usage.map((item) => [item._id, item.used]));
  const limits = Object.fromEntries(
    learnerFeatures.map((feature) => {
      const limit = limitMap[feature]?.() ?? 0;
      const used = usedByFeature.get(feature) || 0;
      return [feature, {
        limit,
        used,
        remaining: Math.max(0, limit - used)
      }];
    })
  );

  return {
    provider: 'gemini',
    enabled,
    configured,
    available,
    reason: available ? null : (!enabled ? 'GEMINI_DISABLED' : 'GEMINI_NOT_CONFIGURED'),
    resetAt,
    limits
  };
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
