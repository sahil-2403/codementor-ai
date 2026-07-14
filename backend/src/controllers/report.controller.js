import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { generateWeeklyReportForUser, getReports } from '../services/report.service.js';

export const reports = asyncHandler(async (req, res) => {
  const items = await getReports(req.user._id);
  sendResponse(res, 200, 'Weekly reports', { reports: items });
});

export const generateReport = asyncHandler(async (req, res) => {
  const report = await generateWeeklyReportForUser(req.user._id);
  sendResponse(res, 201, 'Weekly report generated', { report });
});
