import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { dashboard, updateRevision } from '../controllers/progress.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { revisionStatusSchema } from '../validations/progress.validation.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.LEARNER));
router.get('/dashboard', dashboard);
router.patch('/revisions/:revisionId', validate(revisionStatusSchema), updateRevision);
export default router;
