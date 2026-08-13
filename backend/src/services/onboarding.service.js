import { Enrollment } from '../models/Enrollment.js';
import { Course } from '../models/Course.js';
import { LearningPath } from '../models/LearningPath.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Assessment } from '../models/Assessment.js';
import { ONBOARDING_NEXT_PATH, ONBOARDING_STATES, isOnboardingState } from '../constants/onboardingStates.js';
import { ApiError } from '../utils/ApiError.js';
import {
  getActiveCourseForUser,
  getCurrentEnrollmentForUser,
  setCurrentEnrollmentForUser
} from './dataIntegrity.service.js';

const incompleteStates = [
  ONBOARDING_STATES.LEVEL_PENDING,
  ONBOARDING_STATES.PREFERENCES_PENDING,
  ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING,
  ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS,
  ONBOARDING_STATES.ASSESSMENT_COMPLETED,
  ONBOARDING_STATES.ROADMAP_PENDING,
  ONBOARDING_STATES.ROADMAP_FAILED
];

const enrollmentPopulate = [
  { path: 'course', select: 'title slug description category technologies primaryTechnology availableLevels status', populate: { path: 'technologies primaryTechnology', select: 'name slug type iconKey' } },
  { path: 'learningPath', select: 'title slug description category technologies availableLevels courses status', populate: [{ path: 'technologies', select: 'name slug type iconKey' }, { path: 'courses.course', select: 'title slug category availableLevels status' }] },
  { path: 'currentCourse', select: 'title slug description category technologies primaryTechnology availableLevels status', populate: { path: 'technologies primaryTechnology', select: 'name slug type iconKey' } }
];

const findPendingEnrollment = (userId) => Enrollment.findOne({
  user: userId,
  status: 'draft',
  onboardingState: { $in: incompleteStates }
}).sort({ updatedAt: -1 });

const requireCurrentEnrollment = async ({ userId, enrollmentId = null, allowActive = true }) => {
  const filter = { user: userId };
  if (enrollmentId) filter._id = enrollmentId;
  else filter.status = allowActive ? { $in: ['draft', 'active'] } : 'draft';

  const enrollment = await Enrollment.findOne(filter).sort({ updatedAt: -1 });
  if (!enrollment) throw new ApiError(404, 'Enrollment not found', [], 'ENROLLMENT_NOT_FOUND');
  return enrollment;
};

const deriveState = ({ enrollment, activeCourse, assessment }) => {
  if (!enrollment) return activeCourse ? ONBOARDING_STATES.COMPLETED : ONBOARDING_STATES.CATALOG_PENDING;
  if (enrollment.onboardingState === ONBOARDING_STATES.ROADMAP_FAILED) return ONBOARDING_STATES.ROADMAP_FAILED;

  if (enrollment.onboardingState === ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS) {
    return assessment?.status === 'completed'
      ? ONBOARDING_STATES.ASSESSMENT_COMPLETED
      : ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS;
  }
  if (enrollment.onboardingState === ONBOARDING_STATES.ASSESSMENT_COMPLETED) return ONBOARDING_STATES.ASSESSMENT_COMPLETED;

  if (activeCourse?.enrollment?.toString?.() === enrollment._id.toString() && ['active', 'completed'].includes(enrollment.status)) {
    return ONBOARDING_STATES.COMPLETED;
  }
  if (enrollment.onboardingState === ONBOARDING_STATES.ROADMAP_PENDING) {
    return ONBOARDING_STATES.ROADMAP_PENDING;
  }
  if (assessment?.status === 'started') return ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS;
  if (assessment?.status === 'completed' && enrollment.assessmentPreference === 'take') return ONBOARDING_STATES.ASSESSMENT_COMPLETED;
  if (enrollment.onboardingState && isOnboardingState(enrollment.onboardingState)) return enrollment.onboardingState;
  if (!enrollment.level) return ONBOARDING_STATES.LEVEL_PENDING;
  if (!enrollment.preferencesCompletedAt) return ONBOARDING_STATES.PREFERENCES_PENDING;
  if (enrollment.assessmentPreference === 'skip' || enrollment.level === 'beginner') return ONBOARDING_STATES.ROADMAP_PENDING;
  return ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING;
};

const persistDerivedState = async (enrollment, state) => {
  if (!enrollment || enrollment.onboardingState === state) return;
  enrollment.onboardingState = state;
  if (state === ONBOARDING_STATES.COMPLETED && enrollment.status !== 'completed') {
    enrollment.status = 'active';
    enrollment.onboardingCompletedAt = enrollment.onboardingCompletedAt || new Date();
  }
  await enrollment.save();
};

const resolveSelection = async ({ type, courseId, learningPathId }) => {
  if (type === 'course') {
    const course = await Course.findOne({ _id: courseId, status: 'published' });
    if (!course) throw new ApiError(404, 'Course is not available', [], 'COURSE_NOT_AVAILABLE');
    return { course, learningPath: null, currentCourse: course };
  }

  const learningPath = await LearningPath.findOne({ _id: learningPathId, status: 'published' })
    .populate({ path: 'courses.course', match: { status: 'published' }, select: '_id title slug availableLevels status' });
  if (!learningPath) throw new ApiError(404, 'Learning path is not available', [], 'LEARNING_PATH_NOT_AVAILABLE');

  const firstCourseEntry = (learningPath.courses || [])
    .filter((item) => Boolean(item.course))
    .sort((a, b) => a.order - b.order)[0];
  if (!firstCourseEntry?.course) {
    throw new ApiError(409, 'Learning path has no available courses', [], 'LEARNING_PATH_EMPTY');
  }

  return { course: null, learningPath, currentCourse: firstCourseEntry.course };
};

export const getOnboardingStatus = async (userId) => {
  const [pendingEnrollment, activeCourse] = await Promise.all([
    findPendingEnrollment(userId),
    getActiveCourseForUser({ userId })
  ]);

  let currentEnrollment = pendingEnrollment;
  if (!currentEnrollment && activeCourse?.enrollment) {
    currentEnrollment = await Enrollment.findById(activeCourse.enrollment);
  }
  if (!currentEnrollment) {
    currentEnrollment = await getCurrentEnrollmentForUser(userId);
  }

  const latestAssessment = currentEnrollment
    ? await Assessment.findOne({ user: userId, enrollment: currentEnrollment._id })
      .select('_id status score completedAt level course enrollment')
      .sort({ createdAt: -1 })
    : null;

  const state = deriveState({ enrollment: currentEnrollment, activeCourse, assessment: latestAssessment });
  await persistDerivedState(currentEnrollment, state);

  let nextPath = ONBOARDING_NEXT_PATH[state];
  if (state === ONBOARDING_STATES.ASSESSMENT_COMPLETED && latestAssessment?._id) {
    nextPath = `/onboarding/assessment-report/${latestAssessment._id}`;
  }

  if (currentEnrollment) {
    await currentEnrollment.populate(enrollmentPopulate);
  }

  return {
    state,
    nextPath,
    hasActiveCourse: Boolean(activeCourse),
    hasPendingEnrollment: Boolean(pendingEnrollment),
    activeCourse,
    currentEnrollment,
    latestAssessment,
    canResume: Boolean(pendingEnrollment),
    error: state === ONBOARDING_STATES.ROADMAP_FAILED
      ? {
        code: currentEnrollment?.onboardingErrorCode || 'ROADMAP_GENERATION_FAILED',
        message: currentEnrollment?.onboardingErrorMessage || 'Roadmap generation failed'
      }
      : null
  };
};

export const listLearnerEnrollments = async (userId) => {
  const currentEnrollment = await getCurrentEnrollmentForUser(userId);
  const enrollments = await Enrollment.find({
    user: userId,
    status: { $in: ['active', 'completed'] }
  }).populate(enrollmentPopulate).sort({ updatedAt: -1 });

  const ids = enrollments.map((item) => item._id);
  const plans = ids.length
    ? await CoursePlan.find({ user: userId, enrollment: { $in: ids }, status: 'active', isActive: true })
      .select('_id enrollment title level version course learningPath')
      .lean()
    : [];
  const planByEnrollment = new Map(plans.map((plan) => [plan.enrollment.toString(), plan]));

  return enrollments.map((enrollment) => ({
    ...enrollment.toObject(),
    isCurrent: currentEnrollment?._id?.toString() === enrollment._id.toString(),
    roadmap: planByEnrollment.get(enrollment._id.toString()) || null
  }));
};

export const switchLearnerEnrollment = async ({ userId, enrollmentId }) => {
  const enrollment = await setCurrentEnrollmentForUser({ userId, enrollmentId });
  await enrollment.populate(enrollmentPopulate);
  return enrollment;
};

export const selectEnrollmentTarget = async ({ userId, type, courseId = null, learningPathId = null }) => {
  const selection = await resolveSelection({ type, courseId, learningPathId });
  let enrollment = await findPendingEnrollment(userId);

  if (!enrollment) enrollment = new Enrollment({ user: userId, type });

  const previousTarget = enrollment.type === 'course'
    ? enrollment.course?.toString?.()
    : enrollment.learningPath?.toString?.();
  const nextTarget = type === 'course' ? selection.course._id.toString() : selection.learningPath._id.toString();
  const changedTarget = enrollment.type !== type || previousTarget !== nextTarget;

  enrollment.type = type;
  enrollment.course = selection.course?._id || null;
  enrollment.learningPath = selection.learningPath?._id || null;
  enrollment.currentCourse = selection.currentCourse?._id || null;
  enrollment.status = 'draft';
  enrollment.onboardingState = ONBOARDING_STATES.LEVEL_PENDING;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';

  if (changedTarget) {
    enrollment.level = null;
    enrollment.preferencesCompletedAt = null;
    enrollment.assessmentChoiceAt = null;
    enrollment.assessmentPreference = 'not_applicable';
  }

  await enrollment.save();
  await enrollment.populate(enrollmentPopulate);
  return enrollment;
};

export const saveLevelSelection = async ({ userId, enrollmentId = null, level }) => {
  const enrollment = await requireCurrentEnrollment({ userId, enrollmentId, allowActive: true });
  const offering = enrollment.type === 'course'
    ? await Course.findById(enrollment.course).select('availableLevels status')
    : await LearningPath.findById(enrollment.learningPath).select('availableLevels status');

  if (!offering || offering.status !== 'published') {
    throw new ApiError(409, 'Selected learning option is no longer available', [], 'OFFERING_NOT_AVAILABLE');
  }
  if (!(offering.availableLevels || []).includes(level)) {
    throw new ApiError(400, 'Selected level is not available for this learning option', [], 'LEVEL_NOT_AVAILABLE');
  }

  enrollment.level = level;
  enrollment.assessmentPreference = 'not_applicable';
  enrollment.assessmentChoiceAt = null;
  enrollment.preferencesCompletedAt = null;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';
  enrollment.onboardingState = ONBOARDING_STATES.PREFERENCES_PENDING;
  await enrollment.save();
  return enrollment;
};

export const savePreferencesOnly = async ({ userId, enrollmentId = null, preferences }) => {
  const enrollment = await requireCurrentEnrollment({ userId, enrollmentId, allowActive: true });
  if (!enrollment.level) throw new ApiError(409, 'Choose your current level first', [], 'ONBOARDING_STEP_REQUIRED');

  Object.assign(enrollment, preferences);
  enrollment.preferencesCompletedAt = new Date();
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';

  if (enrollment.level === 'beginner') {
    enrollment.assessmentPreference = 'not_applicable';
    enrollment.onboardingState = ONBOARDING_STATES.ROADMAP_PENDING;
  } else {
    enrollment.onboardingState = ONBOARDING_STATES.ASSESSMENT_CHOICE_PENDING;
  }

  await enrollment.save();
  return enrollment;
};

export const markAssessmentSkipped = async ({ userId, enrollmentId = null }) => {
  const enrollment = await requireCurrentEnrollment({ userId, enrollmentId, allowActive: true });
  if (!enrollment.level) throw new ApiError(409, 'Choose your current level first', [], 'ONBOARDING_STEP_REQUIRED');

  enrollment.assessmentPreference = enrollment.level === 'beginner' ? 'not_applicable' : 'skip';
  enrollment.assessmentChoiceAt = new Date();
  enrollment.onboardingState = ONBOARDING_STATES.ROADMAP_PENDING;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';
  await enrollment.save();
  return enrollment;
};

export const markAssessmentStarted = async ({ userId, enrollmentId }) => {
  const enrollment = await requireCurrentEnrollment({ userId, enrollmentId, allowActive: true });
  enrollment.assessmentPreference = 'take';
  enrollment.assessmentChoiceAt = enrollment.assessmentChoiceAt || new Date();
  enrollment.onboardingState = ONBOARDING_STATES.ASSESSMENT_IN_PROGRESS;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';
  await enrollment.save();
  return enrollment;
};

export const markAssessmentCompleted = async ({ userId, enrollmentId }) => {
  const enrollment = await requireCurrentEnrollment({ userId, enrollmentId, allowActive: true });
  enrollment.assessmentPreference = 'take';
  enrollment.onboardingState = ONBOARDING_STATES.ASSESSMENT_COMPLETED;
  enrollment.onboardingErrorCode = '';
  enrollment.onboardingErrorMessage = '';
  await enrollment.save();
  return enrollment;
};

export const setRoadmapOnboardingState = async ({
  userId,
  enrollmentId,
  state,
  errorCode = '',
  errorMessage = ''
}) => {
  if (![ONBOARDING_STATES.ROADMAP_PENDING, ONBOARDING_STATES.ROADMAP_FAILED, ONBOARDING_STATES.COMPLETED].includes(state)) {
    throw new ApiError(500, 'Invalid roadmap onboarding state', [], 'INVALID_ONBOARDING_STATE');
  }

  const enrollment = await requireCurrentEnrollment({ userId, enrollmentId, allowActive: true });
  enrollment.onboardingState = state;
  enrollment.onboardingErrorCode = errorCode;
  enrollment.onboardingErrorMessage = errorMessage;
  if (state === ONBOARDING_STATES.COMPLETED && enrollment.status !== 'completed') {
    enrollment.status = 'active';
    enrollment.onboardingCompletedAt = enrollment.onboardingCompletedAt || new Date();
  }
  await enrollment.save();
  return enrollment;
};
