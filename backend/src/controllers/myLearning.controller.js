import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { listMyLearning, selectCurrentLearning } from '../services/myLearning.service.js';

export const getMyLearning = asyncHandler(async (req, res) => {
  const data = await listMyLearning(req.user._id);
  sendResponse(res, 200, 'My learning', data);
});

export const selectMyLearning = asyncHandler(async (req, res) => {
  const data = await selectCurrentLearning({ userId: req.user._id, enrollmentId: req.params.enrollmentId });
  sendResponse(res, 200, 'Current learning course updated', data);
});
