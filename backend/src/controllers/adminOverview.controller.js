import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getContentOverview } from '../services/adminContent.service.js';

export const contentOverview = asyncHandler(async (req, res) => {
  const overview = await getContentOverview();
  sendResponse(res, 200, 'Admin content overview', overview);
});
