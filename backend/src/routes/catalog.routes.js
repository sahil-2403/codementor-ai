import { Router } from 'express';
import { catalog } from '../controllers/catalog.controller.js';

const router = Router();
router.get('/', catalog);

export default router;
