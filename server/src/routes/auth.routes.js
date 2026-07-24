import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { loginValidator } from '../validators/auth.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.post('/login', loginValidator, authController.login);

// Protected routes
router.get('/profile', requireAuth, authController.getProfile);
router.post('/logout', requireAuth, authController.logout);

export default router;
