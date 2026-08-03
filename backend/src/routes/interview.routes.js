import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { submitInterviewSchema } from '../validations/interview.validation.js';
import { attemptIdParamSchema, questionIdParamSchema } from '../validations/common.validation.js';
import { createInterviewAttempt, getInterviewAttempts, getInterviewQuestionById, getInterviewQuestions, retryInterviewReview } from '../controllers/interview.controller.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/questions', getInterviewQuestions);
router.get('/questions/:questionId', validate(questionIdParamSchema), getInterviewQuestionById);
router.get('/attempts', getInterviewAttempts);
router.post('/attempts', aiRouteLimiter, validate(submitInterviewSchema), createInterviewAttempt);
router.post('/attempts/:attemptId/review', aiRouteLimiter, validate(attemptIdParamSchema), retryInterviewReview);

export default router;
