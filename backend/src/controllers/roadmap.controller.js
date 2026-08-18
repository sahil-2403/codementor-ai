import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import {
  createCourseFromAssessment,
  createCourseFromTemplate,
  getActiveRoadmapForEnrollment,
  getRoadmapVersions,
  personalizeCurrentRoadmapLater
} from '../services/roadmap.service.js';
import { createProgressForCourse, getNextAvailableCourseLevel } from '../services/progress.service.js';
import { getActiveCourseForUser, setCurrentEnrollmentForUser } from '../services/dataIntegrity.service.js';
import { getOnboardingStatus, setRoadmapOnboardingState } from '../services/onboarding.service.js';
import { Progress } from '../models/Progress.js';
import { ROADMAP_TYPES } from '../constants/roadmapTypes.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';

const markRoadmapFailed = async ({ userId, enrollmentId, error }) => {
  try {
    await setRoadmapOnboardingState({
      userId,
      enrollmentId,
      state: ONBOARDING_STATES.ROADMAP_FAILED,
      errorCode: error.code || 'ROADMAP_GENERATION_FAILED',
      errorMessage: 'Roadmap generation could not be completed. Please retry.'
    });
  } catch {
    // Preserve the original generation error if enrollment state could not be updated.
  }
};

const markRoadmapCompleted = ({ userId, enrollmentId }) => setRoadmapOnboardingState({
  userId,
  enrollmentId,
  state: ONBOARDING_STATES.COMPLETED
});

const repairExistingRoadmap = async ({ userId, enrollmentId, course }) => {
  await createProgressForCourse({ userId, coursePlanId: course._id });
  await markRoadmapCompleted({ userId, enrollmentId });
  await setCurrentEnrollmentForUser({ userId, enrollmentId });
};

export const generateOrGetRoadmap = asyncHandler(async (req, res) => {
  const onboarding = await getOnboardingStatus(req.user._id);
  const enrollment = onboarding.currentEnrollment;
  if (!enrollment) return sendResponse(res, 400, 'Choose a course or learning path before generating a roadmap');

  const existingCourse = await getActiveRoadmapForEnrollment({
    userId: req.user._id,
    enrollmentId: enrollment._id
  });
  if (existingCourse) {
    await repairExistingRoadmap({ userId: req.user._id, enrollmentId: enrollment._id, course: existingCourse });
    return sendResponse(res, 200, 'Existing roadmap found', { course: existingCourse, mode: 'existing' });
  }

  try {
    const course = await createCourseFromTemplate({
      userId: req.user._id,
      enrollmentId: enrollment._id,
      roadmapType: ROADMAP_TYPES.TEMPLATE,
      generatedReason: 'initial_template'
    });
    return sendResponse(res, 201, 'Roadmap created', { course, mode: 'created' });
  } catch (error) {
    await markRoadmapFailed({ userId: req.user._id, enrollmentId: enrollment._id, error });
    throw error;
  }
});

export const currentRoadmap = asyncHandler(async (req, res) => {
  const course = await getActiveCourseForUser({ userId: req.user._id, populate: true });
  let completion = { isComplete: false, nextLevel: null, enrollmentId: null };

  if (course) {
    course.modules.forEach((module) => {
      module.lessons = (module.lessons || []).filter((item) => Boolean(item.lesson));
    });

    const progress = await Progress.findOne({ user: req.user._id, coursePlan: course._id }).select('overallCompletion').lean();
    const isComplete = (progress?.overallCompletion || 0) >= 100;
    completion = {
      isComplete,
      nextLevel: isComplete ? await getNextAvailableCourseLevel(course) : null,
      enrollmentId: course.enrollment
    };
  }

  sendResponse(res, 200, 'Current roadmap', { course, completion });
});

export const generateFromAssessment = asyncHandler(async (req, res) => {
  const { enrollmentId, assessmentId, forceNewVersion = false } = req.body;

  if (!forceNewVersion) {
    const existingCourse = await getActiveRoadmapForEnrollment({ userId: req.user._id, enrollmentId });
    if (existingCourse?.generatedReason === 'assessment_personalized') {
      await repairExistingRoadmap({ userId: req.user._id, enrollmentId, course: existingCourse });
      return sendResponse(res, 200, 'Existing personalized roadmap found', { course: existingCourse, mode: 'existing' });
    }
  }

  try {
    const course = await createCourseFromAssessment({ userId: req.user._id, enrollmentId, assessmentId });
    return sendResponse(res, 201, 'Personalized roadmap version created from assessment', { course, mode: 'created' });
  } catch (error) {
    await markRoadmapFailed({ userId: req.user._id, enrollmentId, error });
    throw error;
  }
});

export const versions = asyncHandler(async (req, res) => {
  const roadmapVersions = await getRoadmapVersions(req.user._id);
  sendResponse(res, 200, 'Roadmap versions', { roadmapVersions });
});

export const personalizeLater = asyncHandler(async (req, res) => {
  const result = await personalizeCurrentRoadmapLater({ userId: req.user._id });
  sendResponse(res, 200, 'Personalization flow ready', result);
});
