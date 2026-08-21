import { Router } from 'express';
import { managerController } from '../controllers/manager.controller.js';
import { reviewClaimValidator } from '../validators/manager.validator.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all manager routes with Manager role restrictions
router.use(requireAuth);
router.use(requireRole('Manager'));

router.get('/pending', managerController.getPendingClaims);
router.get('/search', managerController.searchEmployeeClaims);
router.post('/review/:id', reviewClaimValidator, managerController.reviewClaim);

export default router;
