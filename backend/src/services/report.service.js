import { WeeklyReport } from '../models/WeeklyReport.js';
import { Progress } from '../models/Progress.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { PracticeTask } from '../models/PracticeTask.js';
import { PracticeSubmission } from '../models/PracticeSubmission.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';
import { MentorChat } from '../models/MentorChat.js';
import { AI_FEATURES } from '../constants/aiFeatures.js';
import { aiProvider } from '../ai/aiProvider.service.js';
import { checkAIUsageLimit, logAIUsage } from './aiUsage.service.js';
import { getActiveCourseForUser } from './dataIntegrity.service.js';
import { env, isGeminiAvailable } from '../config/env.js';
import { getUtcWeekStart } from '../utils/week.js';
import { ApiError } from '../utils/ApiError.js';

const toId = (value) => String(value?._id || value || '');

const buildFallbackReport = ({ activity, weakTopics, improvements }) => {
  const summary = [
    `This week you completed ${activity.lessonsCompleted} lesson${activity.lessonsCompleted === 1 ? '' : 's'} and ${activity.quizAttempts} quiz attempt${activity.quizAttempts === 1 ? '' : 's'}.`,
    `You submitted ${activity.practiceAttempts} practice attempt${activity.practiceAttempts === 1 ? '' : 's'}, completed ${activity.interviewAttempts} interview attempt${activity.interviewAttempts === 1 ? '' : 's'}, and asked the mentor ${activity.mentorQuestions} question${activity.mentorQuestions === 1 ? '' : 's'}.`,
    improvements.length ? `Progress noted: ${improvements.join(' ')}` : '',
    weakTopics.length ? `Topics to keep working on: ${weakTopics.slice(0, 3).join(', ')}.` : 'No weak topics are currently recorded.'
  ].filter(Boolean).join(' ');

  return {
    summary,
    nextWeekFocus: weakTopics.length
      ? weakTopics.slice(0, 3)
      : ['Continue the next available lesson', 'Complete one practice or quiz activity', 'Review your recent lesson notes']
  };
};

const buildImprovements = ({ previousReport, progress, weakTopics }) => {
  if (!previousReport) return { items: [], resolvedTopics: [] };

  const items = [];
  const currentCompletion = Number(progress.overallCompletion || 0);
  const previousCompletion = Number(previousReport.overallCompletion || 0);
  const currentQuizAverage = Number(progress.quizStats?.averageScore || 0);
  const previousQuizAverage = Number(previousReport.quizAverage || 0);

  if (currentCompletion > previousCompletion) {
    items.push(`Course completion increased from ${previousCompletion}% to ${currentCompletion}%.`);
  }

  if (currentQuizAverage > previousQuizAverage && previousQuizAverage > 0) {
    items.push(`Quiz average improved from ${previousQuizAverage}% to ${currentQuizAverage}%.`);
  }

  const currentWeakSet = new Set(weakTopics);
  const resolvedTopics = (previousReport.weakTopics || []).filter((topic) => !currentWeakSet.has(topic));
  resolvedTopics.slice(0, 3).forEach((topic) => {
    items.push(`${topic} is no longer listed as a weak topic.`);
  });

  return { items, resolvedTopics };
};

const buildWeeklyActivity = async ({ userId, course, weekStart }) => {
  const lessonIds = (course.modules || [])
    .flatMap((module) => module.lessons || [])
    .map((item) => item.lesson?._id || item.lesson)
    .filter(Boolean);

  const [practiceTasks, interviewQuestions] = await Promise.all([
    PracticeTask.find({ course: course.course, status: 'published' }).select('_id').lean(),
    InterviewQuestion.find({ course: course.course, status: 'published' }).select('_id').lean()
  ]);

  const practiceTaskIds = practiceTasks.map((item) => item._id);
  const interviewQuestionIds = interviewQuestions.map((item) => item._id);

  const [lessonLogs, quizAttempts, practiceAttempts, interviewAttempts, mentorChats] = await Promise.all([
    ActivityLog.find({
      user: userId,
      action: 'lesson_completed',
      entityId: { $in: lessonIds },
      createdAt: { $gte: weekStart }
    }).select('entityId').lean(),
    QuizAttempt.find({ user: userId, coursePlan: course._id, createdAt: { $gte: weekStart } }).select('_id').lean(),
    PracticeSubmission.find({
      user: userId,
      practiceTask: { $in: practiceTaskIds },
      createdAt: { $gte: weekStart }
    }).select('_id').lean(),
    InterviewAttempt.find({
      user: userId,
      question: { $in: interviewQuestionIds },
      createdAt: { $gte: weekStart }
    }).select('_id').lean(),
    MentorChat.find({
      user: userId,
      coursePlan: course._id,
      'messages.createdAt': { $gte: weekStart }
    }).select('messages.role messages.createdAt').lean()
  ]);

  const completedLessonIds = [...new Set(lessonLogs.map((item) => toId(item.entityId)).filter(Boolean))];
  const mentorQuestions = mentorChats.reduce((count, chat) => count + (chat.messages || []).filter(
    (message) => message.role === 'user' && new Date(message.createdAt) >= weekStart
  ).length, 0);

  return {
    completedLessonIds,
    activity: {
      lessonsCompleted: completedLessonIds.length,
      quizAttempts: quizAttempts.length,
      practiceAttempts: practiceAttempts.length,
      interviewAttempts: interviewAttempts.length,
      mentorQuestions
    }
  };
};

const saveUsage = async (payload) => {
  try {
    await logAIUsage(payload);
  } catch (error) {
    console.error('Weekly report usage logging failed:', error.message);
  }
};

export const generateWeeklyReportForUser = async (userId) => {
  const course = await getActiveCourseForUser({ userId });
  if (!course) return null;

  const progress = await Progress.findOne({ user: userId, coursePlan: course._id });
  if (!progress) return null;

  const weekStart = getUtcWeekStart();
  const existing = await WeeklyReport.findOne({ user: userId, coursePlan: course._id, weekStart });
  if (existing) {
    throw new ApiError(409, 'A weekly report has already been created for this week.');
  }

  const previousReport = await WeeklyReport.findOne({
    user: userId,
    coursePlan: course._id,
    weekStart: { $lt: weekStart }
  }).sort({ weekStart: -1 });

  const { completedLessonIds, activity } = await buildWeeklyActivity({ userId, course, weekStart });
  const weakTopics = progress.weakTopics.map((item) => item.topic).filter(Boolean);
  const { items: improvements, resolvedTopics } = buildImprovements({ previousReport, progress, weakTopics });
  const reportData = {
    activity,
    improvements,
    weakTopics,
    quizAverage: Number(progress.quizStats?.averageScore || 0),
    overallCompletion: Number(progress.overallCompletion || 0)
  };

  let reportContent = buildFallbackReport(reportData);
  let generationMode = 'fallback';

  if (isGeminiAvailable()) {
    try {
      await checkAIUsageLimit(userId, AI_FEATURES.WEEKLY_REPORT);
      const aiResult = await aiProvider.generateWeeklyReport({ reportData });
      reportContent = aiResult;
      generationMode = 'ai';
      await saveUsage({
        user: userId,
        feature: AI_FEATURES.WEEKLY_REPORT,
        model: aiResult.model || env.geminiModel
      });
    } catch (error) {
      reportContent = buildFallbackReport(reportData);
      await saveUsage({
        user: userId,
        feature: AI_FEATURES.WEEKLY_REPORT,
        status: 'failed',
        errorMessage: error.message
      });
    }
  }

  return WeeklyReport.create({
    user: userId,
    coursePlan: course._id,
    weekStart,
    completedLessons: completedLessonIds,
    activity,
    improvements,
    weakTopics,
    strongTopics: resolvedTopics,
    quizAverage: reportData.quizAverage,
    overallCompletion: reportData.overallCompletion,
    summary: reportContent.summary,
    nextWeekFocus: reportContent.nextWeekFocus || [],
    generationMode
  });
};

export const getReports = async (userId, limit = 20) => {
  const course = await getActiveCourseForUser({ userId });
  if (!course) return [];
  return WeeklyReport.find({ user: userId, coursePlan: course._id })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(Number(limit) || 20, 1), 50));
};
