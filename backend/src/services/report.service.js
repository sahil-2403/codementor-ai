import { WeeklyReport } from '../models/WeeklyReport.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';
import { aiProvider } from '../ai/aiProvider.service.js';

export const generateWeeklyReportForUser = async (userId) => {
  const course = await CoursePlan.findOne({ user: userId, status: 'active' });
  if (!course) return null;
  const progress = await Progress.findOne({ user: userId, coursePlan: course._id });
  if (!progress) return null;

  const ai = await aiProvider.generateWeeklyReport({ progress });
  return WeeklyReport.create({
    user: userId,
    coursePlan: course._id,
    completedLessons: progress.completedLessons,
    weakTopics: progress.weakTopics.map((item) => item.topic),
    strongTopics: [],
    summary: ai.summary,
    nextWeekFocus: ai.nextWeekFocus || []
  });
};

export const getReports = async (userId) => WeeklyReport.find({ user: userId }).sort({ createdAt: -1 });
