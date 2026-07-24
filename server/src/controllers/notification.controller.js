import { notificationService } from '../services/notification.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class NotificationController {
  /**
   * Get user's notifications
   */
  async getMyNotifications(req, res, next) {
    try {
      const alerts = await notificationService.getNotifications(req.user.id);
      return sendSuccess(res, 'Notifications retrieved successfully', { notifications: alerts });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   */
  async markRead(req, res, next) {
    try {
      const { id } = req.params;
      const status = await notificationService.markAsRead(id, req.user.id);
      return sendSuccess(res, 'Notification updated successfully', status);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
