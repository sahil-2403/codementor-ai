import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getPublishedCatalog } from '../services/catalog.service.js';

export const catalog = asyncHandler(async (req, res) => {
  const data = await getPublishedCatalog();
  sendResponse(res, 200, 'Learning catalog', data);
});
