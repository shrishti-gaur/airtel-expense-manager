import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { dashboardMetricsValidator } from '../validators/dashboard.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all dashboard routes
router.use(requireAuth);

router.get('/metrics', dashboardMetricsValidator, dashboardController.getSummary);
router.get('/activity-logs', dashboardController.getActivityLogs);

export default router;
