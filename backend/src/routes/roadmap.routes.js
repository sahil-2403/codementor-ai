import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';
import { generateFromAssessmentSchema } from '../validations/roadmap.validation.js';
import {
  currentRoadmap,
  generateFromAssessment,
  generateOrGetRoadmap
} from '../controllers/roadmap.controller.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.LEARNER));
router.get('/current', currentRoadmap);
router.post('/generate-or-get', aiRouteLimiter, generateOrGetRoadmap);
router.post('/from-assessment', aiRouteLimiter, validate(generateFromAssessmentSchema), generateFromAssessment);
export default router;
