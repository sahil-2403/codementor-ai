import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { aiRouteLimiter } from '../middlewares/rateLimit.middleware.js';
import { reports, generateReport } from '../controllers/report.controller.js';

const router = Router();
router.use(requireAuth);
router.get('/', reports);
router.post('/generate', aiRouteLimiter, generateReport);
export default router;
