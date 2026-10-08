import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { startAssessmentSchema, submitAssessmentSchema } from '../validations/assessment.validation.js';
import { assessmentIdReportSchema } from '../validations/common.validation.js';
import { startAssessment, submit, report } from '../controllers/assessment.controller.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.LEARNER));
router.get('/start', validate(startAssessmentSchema), startAssessment);
router.post('/submit', validate(submitAssessmentSchema), submit);
router.get('/:assessmentId/report', validate(assessmentIdReportSchema), report);
export default router;
