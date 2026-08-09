import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  levelSchema,
  preferencesSchema,
  selectionSchema,
  skipAssessmentSchema
} from '../validations/onboarding.validation.js';
import { saveLevel, savePreferences, selectOffering, skipAssessment, status } from '../controllers/onboarding.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/status', status);
router.post('/selection', validate(selectionSchema), selectOffering);
router.put('/level', validate(levelSchema), saveLevel);
router.post('/preferences', validate(preferencesSchema), savePreferences);
router.post('/assessment/skip', validate(skipAssessmentSchema), skipAssessment);
export default router;
