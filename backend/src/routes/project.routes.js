import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitProjectSchema } from '../validations/project.validation.js';
import { taskIdParamSchema, submissionIdParamSchema } from '../validations/common.validation.js';
import { createProjectSubmission, getMySubmissions, getProjectTaskById, getProjectTasks, reviewSubmission } from '../controllers/project.controller.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/tasks', getProjectTasks);
router.get('/tasks/:taskId', validate(taskIdParamSchema), getProjectTaskById);
router.get('/submissions', getMySubmissions);
router.post('/submissions', validate(submitProjectSchema), createProjectSubmission);
router.post('/submissions/:submissionId/review', aiRouteLimiter, validate(submissionIdParamSchema), reviewSubmission);

export default router;
