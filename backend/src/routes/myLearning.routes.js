import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { idParamSchema } from '../validations/admin.validation.js';
import { getMyLearning, selectMyLearning } from '../controllers/myLearning.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', getMyLearning);
router.post('/:enrollmentId/select', validate(idParamSchema), selectMyLearning);

export default router;
