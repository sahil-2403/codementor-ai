import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getPracticeTask, listMyPracticeSubmissions, listPracticeTasks, reviewPracticeSubmission, submitPracticeTask } from '../services/practice.service.js';
import { logActivity } from '../services/activityLog.service.js';

export const getPracticeTasks = asyncHandler(async (req, res) => {
  const tasks = await listPracticeTasks({ userId: req.user._id, difficulty: req.query.difficulty, tag: req.query.tag });
  sendResponse(res, 200, 'Practice tasks', { tasks });
});

export const getPracticeTaskById = asyncHandler(async (req, res) => {
  const data = await getPracticeTask({ taskId: req.params.taskId, userId: req.user._id });
  sendResponse(res, 200, 'Practice task', data);
});

export const createPracticeSubmission = asyncHandler(async (req, res) => {
  const submission = await submitPracticeTask({ userId: req.user._id, ...req.body });
  await logActivity({ user: req.user._id, action: 'practice_submitted', entityType: 'PracticeSubmission', entityId: submission._id, message: 'Learner submitted a practice task', metadata: { practiceTaskId: req.body.practiceTaskId }, req });
  sendResponse(res, 201, 'Practice submission saved', { submission });
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await reviewPracticeSubmission({ user: req.user, submissionId: req.params.submissionId });
  await logActivity({ user: req.user._id, action: 'practice_ai_review_completed', entityType: 'PracticeSubmission', entityId: submission._id, message: 'AI reviewed a practice submission', metadata: { score: submission.score }, req });
  sendResponse(res, 200, 'Practice submission reviewed', { submission });
});

export const getMyPracticeSubmissions = asyncHandler(async (req, res) => {
  const submissions = await listMyPracticeSubmissions({ userId: req.user._id });
  sendResponse(res, 200, 'Practice submissions', { submissions });
});
