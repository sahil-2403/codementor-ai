import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  goalSchema,
  levelSchema,
  preferencesSchema,
  saveGoalSchema,
  skipAssessmentSchema
} from '../validations/onboarding.validation.js';
import { createGoal, saveGoal, saveLevel, savePreferences, skipAssessment, status } from '../controllers/onboarding.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/status', status);
router.post('/goal', validate(goalSchema), createGoal);
router.put('/goal', validate(saveGoalSchema), saveGoal);
router.put('/level', validate(levelSchema), saveLevel);
router.post('/preferences', validate(preferencesSchema), savePreferences);
router.post('/assessment/skip', validate(skipAssessmentSchema), skipAssessment);
export default router;
