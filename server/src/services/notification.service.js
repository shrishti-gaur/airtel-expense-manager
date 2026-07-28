import { Notification } from '../models/Notification.js';

export class NotificationService {
  /**
   * Fetch active alerts for a user
   */
  async getNotifications(userId) {
    console.log(`[Notification Service] Retrieving notifications for user: ${userId}`);
    return await Notification.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Mark alert as read
   */
  async markAsRead(notificationId, userId) {
    console.log(`[Notification Service] User ${userId} marking read: ${notificationId}`);
    
    const notif = await Notification.findOneAndUpdate(
      { id: notificationId, userId },
      { read: true },
      { new: true }
    );
    
    if (!notif) {
      throw new Error(`Notification not found with ID ${notificationId}`);
    }

    return notif;
  }

  /**
   * Mark all alerts as read for a user
   */
  async markAllRead(userId) {
    console.log(`[Notification Service] User ${userId} marking all notifications read`);
    await Notification.updateMany({ userId }, { read: true });
    return { success: true };
  }

  /**
   * Clear a specific notification
   */
  async clearNotification(notificationId, userId) {
    console.log(`[Notification Service] User ${userId} deleting notification: ${notificationId}`);
    await Notification.findOneAndDelete({ id: notificationId, userId });
    return { success: true };
  }

  /**
   * Clear all notifications for a user
   */
  async clearAllNotifications(userId) {
    console.log(`[Notification Service] User ${userId} deleting all notifications`);
    await Notification.deleteMany({ userId });
    return { success: true };
  }

  /**
   * Create a notification manually (e.g. from frontend action)
   */
  async createNotification(userId, data) {
    console.log(`[Notification Service] Creating notification for user: ${userId}`);
    const notificationId = `NOTIF-${Date.now()}`;
    const newNotif = new Notification({
      id: notificationId,
      userId,
      title: data.title,
      description: data.description,
      type: data.type || 'info',
      read: false,
      timestamp: new Date()
    });
    return await newNotif.save();
  }
}

export const notificationService = new NotificationService();
