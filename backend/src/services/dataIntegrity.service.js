import { CoursePlan } from '../models/CoursePlan.js';
import { ApiError } from '../utils/ApiError.js';

export const getActiveCourseForUser = async ({ userId, populate = false, lean = false } = {}) => {
  let query = CoursePlan.findOne({ user: userId, status: 'active', isActive: true }).sort({ createdAt: -1 });
  if (populate) {
    query = query
      .populate({ path: 'modules.lessons.lesson', match: { status: 'published' } })
      .populate({ path: 'modules.quizQuestions', match: { status: 'published' } });
  }
  if (lean) query = query.lean();
  return query;
};

export const requireActiveCourseForUser = async (options = {}) => {
  const course = await getActiveCourseForUser(options);
  if (!course) throw new ApiError(404, 'Active course not found');
  return course;
};

export {
  assertModuleBelongsToCourse,
  assertModuleUnlocked,
  assertQuestionsBelongToModule,
  findModuleInCourse
} from '../domain/quizPolicy.js';

export const lessonBelongsToCourse = ({ course, lessonId }) => course?.modules?.some((module) =>
  module.lessons?.some((item) => {
    const value = item.lesson?._id || item.lesson;
    return value?.toString() === lessonId?.toString();
  })
) || false;

export const assertLessonBelongsToCourse = ({ course, lessonId }) => {
  if (!lessonBelongsToCourse({ course, lessonId })) {
    throw new ApiError(403, 'Lesson does not belong to your active roadmap');
  }
  return true;
};

export const requireUserOwnedAttempt = async ({ model, userId, attemptId, populate }) => {
  let query = model.findOne({ _id: attemptId, user: userId });
  if (populate) query = query.populate(populate);
  const attempt = await query;
  if (!attempt) throw new ApiError(404, 'Resource not found');
  return attempt;
};
