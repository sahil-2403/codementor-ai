import { WeeklyReport } from '../models/WeeklyReport.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';
import { aiProvider } from '../ai/aiProvider.service.js';

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

export const generateWeeklyReportForUser = async (userId) => {
  const course = await CoursePlan.findOne({ user: userId, status: 'active' });
  if (!course) return null;
  const progress = await Progress.findOne({ user: userId, coursePlan: course._id });
  if (!progress) return null;

  let reportContent;
  try {
    reportContent = await aiProvider.generateWeeklyReport({ progress });
  } catch {
    reportContent = buildProgressSummary(progress);
  }

  return WeeklyReport.create({
    user: userId,
    coursePlan: course._id,
    completedLessons: progress.completedLessons,
    weakTopics: progress.weakTopics.map((item) => item.topic),
    strongTopics: [],
    summary: reportContent.summary,
    nextWeekFocus: reportContent.nextWeekFocus || []
  });
};

export const getReports = async (userId) => WeeklyReport.find({ user: userId }).sort({ createdAt: -1 });
