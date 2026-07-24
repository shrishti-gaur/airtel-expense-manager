import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { aiAnalyzeValidator } from '../validators/ai.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all AI routes
router.use(requireAuth);

router.post('/analyze', aiAnalyzeValidator, aiController.analyzeExpense);

export default router;
