import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { markReadValidator } from '../validators/notification.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Secure all notification endpoints
router.use(requireAuth);

router.get('/', notificationController.getMyNotifications);
router.post('/', notificationController.createNotification);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', markReadValidator, notificationController.markRead);
router.delete('/:id', notificationController.clearNotification);
router.delete('/', notificationController.clearAllNotifications);

export default router;
