import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import {
  listProjectTasks,
  getProjectTask,
  createProjectTask,
  updateProjectTask,
  changeProjectTaskStatus,
  deleteProjectTask
} from '../services/adminContent/projectTask.service.js';

export const listAdminProjectTasks = asyncHandler(async (req, res) => {
  const { items, pagination } = await listProjectTasks(req.query);
  sendResponse(res, 200, 'Project tasks', { projectTasks: items, pagination });
});

export const getAdminProjectTask = asyncHandler(async (req, res) => {
  const projectTask = await getProjectTask(req.params.id);
  sendResponse(res, 200, 'Project task details', { projectTask });
});

export const createAdminProjectTask = asyncHandler(async (req, res) => {
  const projectTask = await createProjectTask(req.body);
  sendResponse(res, 201, 'Project task draft created', { projectTask });
});

export const updateAdminProjectTask = asyncHandler(async (req, res) => {
  const projectTask = await updateProjectTask({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Project task updated', { projectTask });
});

export const updateAdminProjectTaskStatus = asyncHandler(async (req, res) => {
  const projectTask = await changeProjectTaskStatus({ id: req.params.id, ...req.body });
  sendResponse(res, 200, `Project task ${projectTask.status}`, { projectTask });
});

export const deleteAdminProjectTask = asyncHandler(async (req, res) => {
  const projectTask = await deleteProjectTask(req.params.id);
  sendResponse(res, 200, 'Project task permanently deleted', { projectTask });
});
