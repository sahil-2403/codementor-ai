import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';
import { generateFromAssessmentSchema, roadmapJobParamSchema } from '../validations/roadmap.validation.js';
import {
  currentRoadmap,
  generateFromAssessment,
  generateOrGetRoadmap,
  personalizeLater,
  retryRoadmapJob,
  roadmapJobStatus,
  versions
} from '../controllers/roadmap.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/current', currentRoadmap);
router.get('/versions', versions);
router.post('/generate-or-get', aiRouteLimiter, generateOrGetRoadmap);
router.get('/jobs/:jobId', validate(roadmapJobParamSchema), roadmapJobStatus);
router.post('/jobs/:jobId/retry', aiRouteLimiter, validate(roadmapJobParamSchema), retryRoadmapJob);
router.post('/from-assessment', aiRouteLimiter, validate(generateFromAssessmentSchema), generateFromAssessment);
router.post('/personalize-later', personalizeLater);
export default router;
