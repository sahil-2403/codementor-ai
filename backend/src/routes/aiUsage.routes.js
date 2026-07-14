import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { myUsage } from '../controllers/aiUsage.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/me', myUsage);
export default router;
