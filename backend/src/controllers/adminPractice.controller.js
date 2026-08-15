import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import {
  listPracticeTasks,
  getPracticeTask,
  createPracticeTask,
  updatePracticeTask,
  changePracticeTaskStatus,
  deletePracticeTask
} from '../services/adminContent/practiceTask.service.js';

export const listAdminPracticeTasks = asyncHandler(async (req, res) => {
  const { items, pagination } = await listPracticeTasks(req.query);
  sendResponse(res, 200, 'Practice tasks', { practiceTasks: items, pagination });
});

export const getAdminPracticeTask = asyncHandler(async (req, res) => {
  const practiceTask = await getPracticeTask(req.params.id);
  sendResponse(res, 200, 'Practice task details', { practiceTask });
});

export const createAdminPracticeTask = asyncHandler(async (req, res) => {
  const practiceTask = await createPracticeTask(req.body);
  sendResponse(res, 201, 'Practice task draft created', { practiceTask });
});

export const updateAdminPracticeTask = asyncHandler(async (req, res) => {
  const practiceTask = await updatePracticeTask({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Practice task updated', { practiceTask });
});

export const updateAdminPracticeTaskStatus = asyncHandler(async (req, res) => {
  const practiceTask = await changePracticeTaskStatus({ id: req.params.id, ...req.body });
  sendResponse(res, 200, `Practice task ${practiceTask.status}`, { practiceTask });
});

export const deleteAdminPracticeTask = asyncHandler(async (req, res) => {
  const practiceTask = await deletePracticeTask(req.params.id);
  sendResponse(res, 200, 'Practice task permanently deleted', { practiceTask });
});
