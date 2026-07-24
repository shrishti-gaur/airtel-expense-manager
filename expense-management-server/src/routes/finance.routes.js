import { Router } from 'express';
import { financeController } from '../controllers/finance.controller.js';
import { financeAuditValidator, bulkProcessValidator } from '../validators/finance.validator.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all finance routes with Finance role restrictions
router.use(requireAuth);
router.use(requireRole('Finance'));

router.get('/audit', financeAuditValidator, financeController.getAuditClaims);
router.post('/bulk-process', bulkProcessValidator, financeController.processBulkPayments);

export default router;
