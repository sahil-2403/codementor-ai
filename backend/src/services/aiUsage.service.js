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
  [AI_FEATURES.PRACTICE_REVIEW]: () => env.aiLimits.practiceReview,
  [AI_FEATURES.INTERVIEW_FEEDBACK]: () => env.aiLimits.interviewFeedback
};

export const checkAIUsageLimit = async (userId, feature) => {
  const limit = limitMap[feature]?.() ?? 5;
  const count = await AIUsageLog.countDocuments({
    user: userId,
    feature,
    status: 'success',
    createdAt: { $gte: startOfToday() }
  });

  if (count >= limit) {
    throw new ApiError(429, `Daily AI limit reached for ${feature}`, [], 'AI_DAILY_LIMIT_REACHED');
  }
};

export const logAIUsage = async ({
  user,
  feature,
  status = 'success',
  model = env.geminiModel,
  errorMessage = ''
}) => AIUsageLog.create({ user, feature, status, model, errorMessage });
