import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import {
  getOnboardingStatus,
  markAssessmentSkipped,
  saveLevelSelection,
  savePreferencesOnly,
  selectEnrollmentTarget
} from '../services/onboarding.service.js';

export const status = asyncHandler(async (req, res) => {
  const data = await getOnboardingStatus(req.user._id);
  sendResponse(res, 200, 'Onboarding status', data);
});

export const selectOffering = asyncHandler(async (req, res) => {
  const enrollment = await selectEnrollmentTarget({ userId: req.user._id, ...req.body });
  sendResponse(res, 200, 'Learning option selected', { enrollment });
});

export const saveLevel = asyncHandler(async (req, res) => {
  const enrollment = await saveLevelSelection({ userId: req.user._id, ...req.body });
  sendResponse(res, 200, 'Current level saved', { enrollment });
});

export const savePreferences = asyncHandler(async (req, res) => {
  const { enrollmentId, ...preferences } = req.body;
  const enrollment = await savePreferencesOnly({ userId: req.user._id, enrollmentId, preferences });
  sendResponse(res, 200, 'Preferences saved', { enrollment });
});

export const skipAssessment = asyncHandler(async (req, res) => {
  const enrollment = await markAssessmentSkipped({ userId: req.user._id, enrollmentId: req.body.enrollmentId });
  sendResponse(res, 200, 'Assessment choice saved', { enrollment });
});
