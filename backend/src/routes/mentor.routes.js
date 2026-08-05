import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { askMentorSchema, mentorSuggestionsSchema } from '../validations/mentor.validation.js';
import { ask, history, suggestions } from '../controllers/mentor.controller.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();
router.use(requireAuth);
router.post('/ask', aiRouteLimiter, validate(askMentorSchema), ask);
router.get('/history', history);
router.get('/suggestions', validate(mentorSuggestionsSchema), suggestions);
export default router;
