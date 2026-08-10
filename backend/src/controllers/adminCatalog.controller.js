import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import * as adminContent from '../services/adminContent.service.js';

const listResponse = (label, key, service) => asyncHandler(async (req, res) => {
  const { items, pagination } = await service(req.query);
  sendResponse(res, 200, label, { [key]: items, pagination });
});

export const listTechnologies = listResponse('Technologies', 'technologies', adminContent.listTechnologies);
export const getTechnology = asyncHandler(async (req, res) => sendResponse(res, 200, 'Technology details', { technology: await adminContent.getTechnology(req.params.id) }));
export const createTechnology = asyncHandler(async (req, res) => sendResponse(res, 201, 'Technology draft created', { technology: await adminContent.createTechnology(req.body) }));
export const updateTechnology = asyncHandler(async (req, res) => sendResponse(res, 200, 'Technology updated', { technology: await adminContent.updateTechnology({ id: req.params.id, payload: req.body }) }));
export const updateTechnologyStatus = asyncHandler(async (req, res) => sendResponse(res, 200, 'Technology status updated', { technology: await adminContent.changeTechnologyStatusSafely({ id: req.params.id, ...req.body }) }));
export const deleteTechnology = asyncHandler(async (req, res) => sendResponse(res, 200, 'Technology permanently deleted', { technology: await adminContent.deleteTechnologySafely(req.params.id) }));

export const listCourses = listResponse('Courses', 'courses', adminContent.listCourses);
export const getCourse = asyncHandler(async (req, res) => sendResponse(res, 200, 'Course details', { course: await adminContent.getCourse(req.params.id) }));
export const createCourse = asyncHandler(async (req, res) => sendResponse(res, 201, 'Course draft created', { course: await adminContent.createCourse(req.body) }));
export const updateCourse = asyncHandler(async (req, res) => sendResponse(res, 200, 'Course updated', { course: await adminContent.updateCourse({ id: req.params.id, payload: req.body }) }));
export const updateCourseStatus = asyncHandler(async (req, res) => sendResponse(res, 200, 'Course status updated', { course: await adminContent.changeCourseStatusSafely({ id: req.params.id, ...req.body }) }));
export const deleteCourse = asyncHandler(async (req, res) => sendResponse(res, 200, 'Course permanently deleted', { course: await adminContent.deleteCourseSafely(req.params.id) }));

export const listLearningPaths = listResponse('Learning paths', 'learningPaths', adminContent.listLearningPaths);
export const getLearningPath = asyncHandler(async (req, res) => sendResponse(res, 200, 'Learning path details', { learningPath: await adminContent.getLearningPath(req.params.id) }));
export const createLearningPath = asyncHandler(async (req, res) => sendResponse(res, 201, 'Learning path draft created', { learningPath: await adminContent.createLearningPath(req.body) }));
export const updateLearningPath = asyncHandler(async (req, res) => sendResponse(res, 200, 'Learning path updated', { learningPath: await adminContent.updateLearningPath({ id: req.params.id, payload: req.body }) }));
export const updateLearningPathStatus = asyncHandler(async (req, res) => sendResponse(res, 200, 'Learning path status updated', { learningPath: await adminContent.changeLearningPathStatus({ id: req.params.id, ...req.body }) }));
export const deleteLearningPath = asyncHandler(async (req, res) => sendResponse(res, 200, 'Learning path permanently deleted', { learningPath: await adminContent.deleteLearningPathSafely(req.params.id) }));
