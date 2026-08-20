import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { getLesson, completeLesson } from '../controllers/lesson.controller.js';
import { lessonIdParamSchema } from '../validations/common.validation.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.LEARNER));
router.get('/:lessonId', validate(lessonIdParamSchema), getLesson);
router.post('/:lessonId/complete', validate(lessonIdParamSchema), completeLesson);
export default router;
