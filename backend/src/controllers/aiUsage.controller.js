import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { AIUsageLog } from '../models/AIUsageLog.js';

export const myUsage = asyncHandler(async (req, res) => {
  const logs = await AIUsageLog.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  sendResponse(res, 200, 'My AI usage', { logs });
});
