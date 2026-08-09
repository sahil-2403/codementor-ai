import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getAssessmentQuestions, submitAssessment, getAssessmentReport } from '../services/assessment.service.js';

export const startAssessment = asyncHandler(async (req, res) => {
  const { level, enrollmentId } = req.query;
  const data = await getAssessmentQuestions({ userId: req.user._id, enrollmentId, level });
  sendResponse(res, 200, 'Assessment questions', data);
});

export const submit = asyncHandler(async (req, res) => {
  const result = await submitAssessment({ userId: req.user._id, ...req.body });
  sendResponse(res, 201, 'Assessment submitted. Review diagnostic report before creating roadmap.', result);
});

export const report = asyncHandler(async (req, res) => {
  const result = await getAssessmentReport({ userId: req.user._id, assessmentId: req.params.assessmentId });
  sendResponse(res, 200, 'Assessment report', { report: result });
});
