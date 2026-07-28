import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller.js';
import { createExpenseValidator } from '../validators/expense.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all expense routes
router.use(requireAuth);

router.post('/', createExpenseValidator, expenseController.submitClaim);
router.get('/my-claims', expenseController.getMyClaims);
router.get('/:id', expenseController.getClaimDetails);
router.put('/:id', createExpenseValidator, expenseController.updateClaim);

export default router;
