import { CoursePlan } from '../models/CoursePlan.js';
import { ApiError } from '../utils/ApiError.js';

export const getActiveCourseForUser = async ({ userId, populate = false, lean = false } = {}) => {
  let query = CoursePlan.findOne({ user: userId, status: 'active', isActive: true }).sort({ createdAt: -1 });
  if (populate) query = query.populate('modules.lessons.lesson').populate('modules.quizQuestions');
  if (lean) query = query.lean();
  return query;
};

export const requireActiveCourseForUser = async (options = {}) => {
  const course = await getActiveCourseForUser(options);
  if (!course) throw new ApiError(404, 'Active course not found');
  return course;
};

export const findModuleInCourse = (course, moduleId) => {
  if (!course || !moduleId) return null;
  if (typeof course.modules?.id === 'function') return course.modules.id(moduleId);
  return course.modules?.find((module) => module._id?.toString() === moduleId.toString()) || null;
};

export const assertModuleBelongsToCourse = ({ course, moduleId }) => {
  const module = findModuleInCourse(course, moduleId);
  if (!module) throw new ApiError(404, 'Module not found in active course');
  return module;
};

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

export const assertQuestionsBelongToModule = ({ module, questionIds = [], requireExactSet = false }) => {
  const allowedIds = (module.quizQuestions || []).map((question) => (question._id || question).toString());
  const allowedQuestionIds = new Set(allowedIds);
  const normalizedQuestionIds = questionIds.map((id) => id.toString());
  const uniqueQuestionIds = new Set(normalizedQuestionIds);

  if (uniqueQuestionIds.size !== normalizedQuestionIds.length) throw new ApiError(400, 'Duplicate quiz question submitted');
  if (!normalizedQuestionIds.length) throw new ApiError(400, 'Submit at least one quiz answer');
  if (!normalizedQuestionIds.every((id) => allowedQuestionIds.has(id))) {
    throw new ApiError(403, 'Quiz question does not belong to this module');
  }

  if (requireExactSet) {
    if (allowedIds.length !== normalizedQuestionIds.length) throw new ApiError(400, 'Submit answers for every quiz question in this module');
    const missingIds = allowedIds.filter((id) => !uniqueQuestionIds.has(id));
    if (missingIds.length) throw new ApiError(400, 'Missing answers for required quiz questions');
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
