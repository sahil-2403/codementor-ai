import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getLessonById } from '../services/lesson.service.js';
import { markLessonComplete } from '../services/progress.service.js';
import { logActivity } from '../services/activityLog.service.js';
import { ApiError } from '../utils/ApiError.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';

export const getLesson = asyncHandler(async (req, res) => {
  const course = await CoursePlan.findOne({ user: req.user._id, status: 'active', isActive: true });
  const belongsToActiveCourse = course?.modules?.some((module) => module.lessons?.some((item) => item.lesson.toString() === req.params.lessonId.toString()));
  if (!belongsToActiveCourse && req.user.role !== 'admin') throw new ApiError(403, 'Lesson is not part of your active roadmap');
  const lesson = await getLessonById(req.params.lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  const progress = course ? await Progress.findOne({ user: req.user._id, coursePlan: course._id }).select('completedLessons') : null;
  const isCompleted = Boolean(progress?.completedLessons?.some((id) => id.toString() === req.params.lessonId.toString()));
  sendResponse(res, 200, 'Lesson details', { lesson, isCompleted });
});

export const completeLesson = asyncHandler(async (req, res) => {
  const progress = await markLessonComplete({ userId: req.user._id, lessonId: req.params.lessonId });
  if (!progress) throw new ApiError(404, 'Lesson not found in your active roadmap');
  await logActivity({ user: req.user._id, action: 'lesson_completed', entityType: 'Lesson', entityId: req.params.lessonId, message: 'Learner completed a lesson', req });
  sendResponse(res, 200, 'Lesson marked complete', { progress, isCompleted: true });
});
