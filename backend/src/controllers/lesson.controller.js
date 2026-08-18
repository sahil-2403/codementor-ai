import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getLessonById, getLessonNavigation } from '../services/lesson.service.js';
import { markLessonComplete } from '../services/progress.service.js';
import { logActivity } from '../services/activityLog.service.js';
import { getActiveCourseForUser } from '../services/dataIntegrity.service.js';
import { ApiError } from '../utils/ApiError.js';
import { Progress } from '../models/Progress.js';

export const getLesson = asyncHandler(async (req, res) => {
  const course = await getActiveCourseForUser({ userId: req.user._id });
  const belongsToActiveCourse = course?.modules?.some((module) => module.lessons?.some((item) => item.lesson.toString() === req.params.lessonId.toString()));
  if (!belongsToActiveCourse && req.user.role !== 'admin') throw new ApiError(403, 'Lesson is not part of your active roadmap');
  const lesson = await getLessonById(req.params.lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  const progress = course ? await Progress.findOne({ user: req.user._id, coursePlan: course._id }).select('completedLessons') : null;
  const isCompleted = Boolean(progress?.completedLessons?.some((id) => id.toString() === req.params.lessonId.toString()));
  const navigation = course
    ? getLessonNavigation({ course, lessonId: req.params.lessonId })
    : { previousLessonId: null, nextLessonId: null };
  sendResponse(res, 200, 'Lesson details', { lesson, isCompleted, navigation });
});

export const completeLesson = asyncHandler(async (req, res) => {
  const result = await markLessonComplete({ userId: req.user._id, lessonId: req.params.lessonId });
  if (!result) throw new ApiError(404, 'Lesson not found in your active roadmap');
  await logActivity({ user: req.user._id, action: 'lesson_completed', entityType: 'Lesson', entityId: req.params.lessonId, message: 'Learner completed a lesson', req });

  let navigation = { previousLessonId: null, nextLessonId: null };
  if (!result.nextPath) {
    const course = await getActiveCourseForUser({ userId: req.user._id });
    if (course) navigation = getLessonNavigation({ course, lessonId: req.params.lessonId });
  }

  sendResponse(res, 200, 'Lesson marked complete', { ...result, isCompleted: true, navigation });
});
