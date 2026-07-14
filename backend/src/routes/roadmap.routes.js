import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { generateFromAssessmentSchema, roadmapJobParamSchema } from '../validations/roadmap.validation.js';
import { currentRoadmap, generateFromAssessment, generateOrGetRoadmap, personalizeLater, versions, roadmapJobStatus } from '../controllers/roadmap.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/current', currentRoadmap);
router.get('/versions', versions);
router.post('/generate-or-get', generateOrGetRoadmap);
router.get('/jobs/:jobId', validate(roadmapJobParamSchema), roadmapJobStatus);
router.post('/from-assessment', validate(generateFromAssessmentSchema), generateFromAssessment);
router.post('/personalize-later', personalizeLater);
export default router;
