import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { goalSchema, preferencesSchema, skipAssessmentSchema } from '../validations/onboarding.validation.js';
import { status, createGoal, savePreferences, skipAssessment } from '../controllers/onboarding.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/status', status);
router.post('/goal', validate(goalSchema), createGoal);
router.post('/preferences', validate(preferencesSchema), savePreferences);
router.post('/assessment/skip', validate(skipAssessmentSchema), skipAssessment);
export default router;
