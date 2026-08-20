import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitQuizSchema } from '../validations/quiz.validation.js';
import { moduleIdParamSchema, attemptIdParamSchema } from '../validations/common.validation.js';
import { getModuleQuiz, submitModuleQuiz, getAttempt, explainAttempt } from '../controllers/quiz.controller.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.LEARNER));
router.get('/module/:moduleId', validate(moduleIdParamSchema), getModuleQuiz);
router.post('/submit', validate(submitQuizSchema), submitModuleQuiz);
router.get('/attempts/:attemptId', validate(attemptIdParamSchema), getAttempt);
router.post('/attempts/:attemptId/explain', aiRouteLimiter, validate(attemptIdParamSchema), explainAttempt);
export default router;
