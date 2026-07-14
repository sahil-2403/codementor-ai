import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { createLearningGoal, getOnboardingStatus, savePreferencesOnly, markAssessmentSkipped } from '../services/onboarding.service.js';

export const status = asyncHandler(async (req, res) => {
  const data = await getOnboardingStatus(req.user._id);
  sendResponse(res, 200, 'Onboarding status', data);
});

export const createGoal = asyncHandler(async (req, res) => {
  const goal = await createLearningGoal({ userId: req.user._id, ...req.body });
  sendResponse(res, 201, 'Learning goal created', { goal });
});

export const savePreferences = asyncHandler(async (req, res) => {
  const { learningGoalId, ...preferences } = req.body;
  const goal = await savePreferencesOnly({ userId: req.user._id, learningGoalId, preferences });
  sendResponse(res, 200, 'Preferences saved. Continue to roadmap generation.', { goal });
});

export const skipAssessment = asyncHandler(async (req, res) => {
  const goal = await markAssessmentSkipped({ userId: req.user._id, learningGoalId: req.body.learningGoalId });
  sendResponse(res, 200, 'Assessment skipped. Continue to roadmap generation.', { goal });
});
