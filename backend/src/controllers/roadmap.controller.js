import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import {
  createCourseFromAssessment,
  createCourseFromTemplate,
  getActiveRoadmapForEnrollment,
  getRoadmapVersions,
  personalizeCurrentRoadmapLater
} from '../services/roadmap.service.js';
import { getActiveCourseForUser } from '../services/dataIntegrity.service.js';
import { getOnboardingStatus, setRoadmapOnboardingState } from '../services/onboarding.service.js';
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

export const generateOrGetRoadmap = asyncHandler(async (req, res) => {
  const onboarding = await getOnboardingStatus(req.user._id);
  const enrollment = onboarding.currentEnrollment;
  if (!enrollment) return sendResponse(res, 400, 'Choose a course or learning path before generating a roadmap');

  const existingCourse = await getActiveRoadmapForEnrollment({
    userId: req.user._id,
    enrollmentId: enrollment._id
  });
  if (existingCourse) {
    return sendResponse(res, 200, 'Existing roadmap found', { course: existingCourse, mode: 'existing' });
  }

  const roadmapType = enrollment.assessmentPreference === 'not_applicable'
    ? ROADMAP_TYPES.TEMPLATE_AI_ADJUSTED
    : ROADMAP_TYPES.TEMPLATE;

  try {
    const course = await createCourseFromTemplate({
      userId: req.user._id,
      enrollmentId: enrollment._id,
      roadmapType,
      generatedReason: enrollment.assessmentPreference === 'skip' ? 'initial_template' : 'preference_adjusted'
    });
    return sendResponse(res, 201, 'Roadmap created', { course, mode: 'created' });
  } catch (error) {
    await markRoadmapFailed({ userId: req.user._id, enrollmentId: enrollment._id, error });
    throw error;
  }
});

export const currentRoadmap = asyncHandler(async (req, res) => {
  const course = await getActiveCourseForUser({ userId: req.user._id, populate: true });
  if (course) {
    course.modules.forEach((module) => {
      module.lessons = (module.lessons || []).filter((item) => Boolean(item.lesson));
    });
  }
  sendResponse(res, 200, 'Current roadmap', { course });
});

export const generateFromAssessment = asyncHandler(async (req, res) => {
  const { enrollmentId, assessmentId, forceNewVersion = false } = req.body;

  if (!forceNewVersion) {
    const existingCourse = await getActiveRoadmapForEnrollment({ userId: req.user._id, enrollmentId });
    if (existingCourse?.generatedReason === 'assessment_personalized') {
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
