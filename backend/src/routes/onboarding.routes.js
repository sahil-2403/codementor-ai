import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  levelSchema,
  selectionSchema,
  skipAssessmentSchema
} from '../validations/onboarding.validation.js';
import { enrollmentIdParamSchema } from '../validations/common.validation.js';
import {
  enrollments,
  saveLevel,
  selectOffering,
  skipAssessment,
  status,
  switchEnrollment
} from '../controllers/onboarding.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/status', status);
router.get('/enrollments', enrollments);
router.post('/enrollments/:enrollmentId/current', validate(enrollmentIdParamSchema), switchEnrollment);
router.post('/selection', validate(selectionSchema), selectOffering);
router.put('/level', validate(levelSchema), saveLevel);
router.post('/assessment/skip', validate(skipAssessmentSchema), skipAssessment);
export default router;
