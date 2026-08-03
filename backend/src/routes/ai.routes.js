import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { status } from '../controllers/ai.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/status', status);

export default router;
