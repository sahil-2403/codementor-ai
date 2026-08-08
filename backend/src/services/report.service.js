import { WeeklyReport } from '../models/WeeklyReport.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, createPromptFingerprint, logAIUsage } from './aiUsage.service.js';
import { env, isGeminiAvailable } from '../config/env.js';
import { getUtcWeekStart } from '../utils/week.js';
import { ApiError } from '../utils/ApiError.js';

const buildProgressSummary = (progress) => {
  const completedCount = progress?.completedLessons?.length || 0;
  const weakTopics = progress?.weakTopics?.map((item) => item.topic).filter(Boolean) || [];
  const quizAttempts = progress?.quizStats?.totalAttempts || 0;
  const averageScore = progress?.quizStats?.averageScore || 0;

  const summaryParts = [
    `You have completed ${completedCount} lesson${completedCount === 1 ? '' : 's'}.`,
    quizAttempts
      ? `You completed ${quizAttempts} quiz attempt${quizAttempts === 1 ? '' : 's'} with an average score of ${averageScore}%.`
      : 'No quiz attempts were recorded yet.',
    weakTopics.length
      ? `Your current revision priorities are ${weakTopics.slice(0, 3).join(', ')}.`
      : 'No weak topics are currently recorded.'
  ];

  return {
    summary: summaryParts.join(' '),
    nextWeekFocus: weakTopics.length
      ? weakTopics.slice(0, 3)
      : ['Continue the next available lesson', 'Complete one quiz', 'Review your lesson notes']
  };
};

const logReportUsage = async (payload) => {
  try {
    await logAIUsage(payload);
  } catch (error) {
    console.error('Weekly report usage logging failed:', error.message);
  }
};

export const generateWeeklyReportForUser = async (userId) => {
  const course = await CoursePlan.findOne({ user: userId, status: 'active', isActive: true });
  if (!course) return null;
  const progress = await Progress.findOne({ user: userId, coursePlan: course._id });
  if (!progress) return null;

  const weekStart = getUtcWeekStart();
  const existing = await WeeklyReport.findOne({ user: userId, coursePlan: course._id, weekStart });
  if (existing) {
    throw new ApiError(409, 'A weekly report has already been created for this week.');
  }

  const startedAt = Date.now();
  const promptFingerprint = createPromptFingerprint(`${userId}:${course._id}:${weekStart.toISOString()}`);
  let reportContent = buildProgressSummary(progress);
  let generationMode = 'fallback';

  if (isGeminiAvailable()) {
    try {
      await checkAIUsageLimit(userId, AI_FEATURES.WEEKLY_REPORT);
      const aiResult = await aiProvider.generateWeeklyReport({ progress });
      reportContent = aiResult;
      generationMode = 'ai';
      await logReportUsage({
        user: userId,
        feature: AI_FEATURES.WEEKLY_REPORT,
        model: aiResult.model || env.geminiModel,
        provider: 'gemini',
        inputTokens: aiResult.inputTokens || 0,
        outputTokens: aiResult.outputTokens || 0,
        latencyMs: Date.now() - startedAt,
        promptFingerprint,
        contextSources: [{ type: 'course_plan', title: course.title, refId: course._id.toString() }],
        metadata: { coursePlanId: course._id, weekStart }
      });
    } catch (error) {
      reportContent = buildProgressSummary(progress);
      await logReportUsage({
        user: userId,
        feature: AI_FEATURES.WEEKLY_REPORT,
        status: 'failed',
        model: env.geminiModel,
        provider: 'gemini',
        latencyMs: Date.now() - startedAt,
        promptFingerprint,
        contextSources: [{ type: 'course_plan', title: course.title, refId: course._id.toString() }],
        metadata: { coursePlanId: course._id, weekStart, errorType: 'provider_failure' },
        errorMessage: error.message
      });
    }
  }

  try {
    return await WeeklyReport.create({
      user: userId,
      coursePlan: course._id,
      weekStart,
      completedLessons: progress.completedLessons,
      weakTopics: progress.weakTopics.map((item) => item.topic),
      strongTopics: [],
      summary: reportContent.summary,
      nextWeekFocus: reportContent.nextWeekFocus || [],
      generationMode
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'A weekly report has already been created for this week.');
    }
    throw error;
  }
};

export const getReports = async (userId, limit = 20) => WeeklyReport.find({ user: userId })
  .sort({ createdAt: -1 })
  .limit(Math.min(Math.max(Number(limit) || 20, 1), 50));
