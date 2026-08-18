import { CoursePlan } from '../models/CoursePlan.js';
import { Enrollment } from '../models/Enrollment.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

const activePlanFilterForEnrollment = ({ userId, enrollment }) => {
  const filter = {
    user: userId,
    enrollment: enrollment._id,
    status: 'active',
    isActive: true
  };

  if (enrollment.type === 'course' && enrollment.level) {
    filter.level = enrollment.level;
  }
  if (enrollment.type === 'learning_path' && enrollment.currentCourse) {
    filter.course = enrollment.currentCourse;
  }

  return filter;
};

export const getCurrentEnrollmentForUser = async (userId) => {
  const user = await User.findById(userId).select('currentEnrollment');
  if (!user) return null;

  if (user.currentEnrollment) {
    const selected = await Enrollment.findOne({
      _id: user.currentEnrollment,
      user: userId,
      status: { $in: ['draft', 'active', 'completed'] }
    });
    if (selected) return selected;
  }

  let fallback = await Enrollment.findOne({ user: userId, status: 'active' }).sort({ updatedAt: -1 });
  if (!fallback) {
    fallback = await Enrollment.findOne({ user: userId, status: 'completed' }).sort({ updatedAt: -1 });
  }

  if (fallback) {
    await User.findByIdAndUpdate(userId, { currentEnrollment: fallback._id });
  }

  return fallback;
};

export const setCurrentEnrollmentForUser = async ({ userId, enrollmentId }) => {
  const enrollment = await Enrollment.findOne({
    _id: enrollmentId,
    user: userId,
    status: { $in: ['active', 'completed'] }
  });
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');

  const coursePlan = await CoursePlan.findOne(activePlanFilterForEnrollment({ userId, enrollment }));
  if (!coursePlan) throw new ApiError(409, 'This enrollment does not have an active roadmap yet');

  await User.findByIdAndUpdate(userId, { currentEnrollment: enrollment._id });
  return enrollment;
};

export const getActiveCourseForUser = async ({ userId, populate = false, lean = false } = {}) => {
  const enrollment = await getCurrentEnrollmentForUser(userId);
  if (!enrollment) return null;

  let query = CoursePlan.findOne(activePlanFilterForEnrollment({ userId, enrollment }))
    .sort({ createdAt: -1 });

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
