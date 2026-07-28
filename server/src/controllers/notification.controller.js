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
      return sendSuccess(res, 'Notification marked as read successfully', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllRead(req, res, next) {
    try {
      const status = await notificationService.markAllRead(req.user.id);
      return sendSuccess(res, 'All notifications marked as read', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear a single notification
   */
  async clearNotification(req, res, next) {
    try {
      const { id } = req.params;
      const status = await notificationService.clearNotification(id, req.user.id);
      return sendSuccess(res, 'Notification cleared successfully', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(req, res, next) {
    try {
      const status = await notificationService.clearAllNotifications(req.user.id);
      return sendSuccess(res, 'All notifications cleared successfully', status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a custom notification
   */
  async createNotification(req, res, next) {
    try {
      const notif = await notificationService.createNotification(req.user.id, req.body);
      return sendSuccess(res, 'Notification created successfully', notif, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
