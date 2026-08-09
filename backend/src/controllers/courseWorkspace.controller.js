import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getCourseWorkspace } from '../services/adminContent/courseWorkspace.service.js';

export const courseWorkspace = asyncHandler(async (req, res) => {
  const data = await getCourseWorkspace(req.params.id);
  sendResponse(res, 200, 'Course workspace', data);
});
