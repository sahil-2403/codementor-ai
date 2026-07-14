import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getProjectTask, listMySubmissions, listProjectTasks, reviewProjectSubmission, submitProjectTask } from '../services/project.service.js';
import { logActivity } from '../services/activityLog.service.js';

export const getProjectTasks = asyncHandler(async (req, res) => {
  const tasks = await listProjectTasks({ userId: req.user._id, difficulty: req.query.difficulty, tag: req.query.tag });
  sendResponse(res, 200, 'Project tasks', { tasks });
});

export const getProjectTaskById = asyncHandler(async (req, res) => {
  const data = await getProjectTask({ taskId: req.params.taskId, userId: req.user._id });
  sendResponse(res, 200, 'Project task', data);
});

export const createProjectSubmission = asyncHandler(async (req, res) => {
  const submission = await submitProjectTask({ userId: req.user._id, ...req.body });
  await logActivity({ user: req.user._id, action: 'project_submitted', entityType: 'ProjectSubmission', entityId: submission._id, message: 'Learner submitted a project task', metadata: { projectTaskId: req.body.projectTaskId }, req });
  sendResponse(res, 201, 'Project submission saved', { submission });
});

export const reviewSubmission = asyncHandler(async (req, res) => {
  const submission = await reviewProjectSubmission({ user: req.user, submissionId: req.params.submissionId });
  await logActivity({ user: req.user._id, action: 'project_ai_review_completed', entityType: 'ProjectSubmission', entityId: submission._id, message: 'AI reviewed a project submission', metadata: { score: submission.score }, req });
  sendResponse(res, 200, 'Project submission reviewed', { submission });
});

export const getMySubmissions = asyncHandler(async (req, res) => {
  const submissions = await listMySubmissions({ userId: req.user._id });
  sendResponse(res, 200, 'Project submissions', { submissions });
});
