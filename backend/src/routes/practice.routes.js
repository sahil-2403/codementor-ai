import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitPracticeSchema } from '../validations/practice.validation.js';
import { taskIdParamSchema, submissionIdParamSchema } from '../validations/common.validation.js';
import { createPracticeSubmission, getMyPracticeSubmissions, getPracticeTaskById, getPracticeTasks, reviewSubmission } from '../controllers/practice.controller.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/tasks', getPracticeTasks);
router.get('/tasks/:taskId', validate(taskIdParamSchema), getPracticeTaskById);
router.get('/submissions', getMyPracticeSubmissions);
router.post('/submissions', validate(submitPracticeSchema), createPracticeSubmission);
router.post('/submissions/:submissionId/review', aiRouteLimiter, validate(submissionIdParamSchema), reviewSubmission);

export default router;
