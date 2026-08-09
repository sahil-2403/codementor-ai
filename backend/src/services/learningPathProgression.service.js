import { Enrollment } from '../models/Enrollment.js';
import { LearningPath } from '../models/LearningPath.js';
import { Progress } from '../models/Progress.js';
import { User } from '../models/User.js';
import { invalidateUserLearningCache } from './cacheInvalidation.service.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';

const idOf = (value) => value?._id?.toString?.() || value?.toString?.() || '';

const courseLessonIds = (coursePlan) => (coursePlan?.modules || [])
  .flatMap((module) => module.lessons || [])
  .map((item) => idOf(item.lesson))
  .filter(Boolean);

const isCoursePlanComplete = async ({ userId, coursePlan }) => {
  const lessonIds = courseLessonIds(coursePlan);
  if (!lessonIds.length) return false;

  const progress = await Progress.findOne({ user: userId, coursePlan: coursePlan._id })
    .select('completedLessons')
    .lean();
  if (!progress) return false;

  const completed = new Set((progress.completedLessons || []).map(idOf));
  return lessonIds.every((lessonId) => completed.has(lessonId));
};

/**
 * Advances one LearningPath Enrollment only after every Lesson in its current
 * CoursePlan is complete. It never affects the learner's other Course enrollments.
 *
 * Returns:
 * - { advanced: false } when this is not a LearningPath or is not complete yet.
 * - { advanced: true, completedPath: true } after the final Course.
 * - { advanced: true, completedPath: false, enrollmentId, nextCourseId } when the
 *   next Course is ready for roadmap generation.
 */
export const advanceLearningPathIfComplete = async ({ userId, coursePlan }) => {
  if (!coursePlan?.enrollment || !coursePlan?.learningPath) return { advanced: false };
  if (!(await isCoursePlanComplete({ userId, coursePlan }))) return { advanced: false };

  const enrollment = await Enrollment.findOne({
    _id: coursePlan.enrollment,
    user: userId,
    type: 'learning_path',
    status: { $in: ['active', 'draft'] }
  });
  if (!enrollment) return { advanced: false };

  const learningPath = await LearningPath.findById(enrollment.learningPath)
    .select('_id status courses')
    .populate({ path: 'courses.course', select: '_id title status availableLevels' });
  if (!learningPath) return { advanced: false };

  const orderedCourses = (learningPath.courses || [])
    .filter((entry) => entry.course)
    .sort((left, right) => left.order - right.order);
  const currentCourseId = idOf(enrollment.currentCourse || coursePlan.course);
  const currentIndex = orderedCourses.findIndex((entry) => idOf(entry.course) === currentCourseId);
  if (currentIndex < 0) return { advanced: false };

  const nextEntry = orderedCourses[currentIndex + 1];
  if (!nextEntry) {
    enrollment.status = 'completed';
    enrollment.onboardingState = ONBOARDING_STATES.COMPLETED;
    enrollment.onboardingCompletedAt = enrollment.onboardingCompletedAt || new Date();
    enrollment.onboardingErrorCode = '';
    enrollment.onboardingErrorMessage = '';
    await enrollment.save();
    await User.updateOne({ _id: userId }, { $set: { currentEnrollment: enrollment._id } });
    await invalidateUserLearningCache(userId);
    return { advanced: true, completedPath: true, enrollmentId: enrollment._id };
  }

  // Keep the completed CoursePlan as history. The next generated CoursePlan becomes
  // the single active plan for this Enrollment.
  coursePlan.status = 'archived';
  coursePlan.isActive = false;
  await coursePlan.save();

  enrollment.currentCourse = nextEntry.course._id;
  enrollment.status = 'draft';
  enrollment.onboardingState = ONBOARDING_STATES.ROADMAP_PENDING;
  enrollment.roadmapJob = null;
  enrollment.assessmentPreference = 'not_applicable';
  enrollment.assessmentChoiceAt = null;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';
  // Enrollment's pre-save hook resolves currentCourseLevel from this path entry's
  // defaultLevel or falls back to the overall path level.
  await enrollment.save();

  await User.updateOne({ _id: userId }, { $set: { currentEnrollment: enrollment._id } });
  await invalidateUserLearningCache(userId);

  return {
    advanced: true,
    completedPath: false,
    enrollmentId: enrollment._id,
    nextCourseId: nextEntry.course._id,
    nextCourseLevel: enrollment.currentCourseLevel
  };
};
