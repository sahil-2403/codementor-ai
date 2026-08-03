import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getLearnerAIStatus } from '../services/aiUsage.service.js';

export const status = asyncHandler(async (req, res) => {
  const aiStatus = await getLearnerAIStatus(req.user._id);
  sendResponse(res, 200, 'Gemini availability', { ai: aiStatus });
});
