/**
 * Notification Service Placeholder
 */
export class NotificationService {
  /**
   * Fetch active alerts for a user
   * TODO: Implement database query.
   */
  async getNotifications(userId) {
    console.log(`[Notification Service] Retrieving notifications for user: ${userId}`);
    return [
      {
        id: 'NOTIF-101',
        userId,
        title: 'Expense Approved',
        body: 'Your broadband claim EXP-2 was approved by David Finance.',
        isRead: false,
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Mark alert as read
   */
  async markAsRead(notificationId, userId) {
    console.log(`[Notification Service] User ${userId} marking read: ${notificationId}`);
    return {
      id: notificationId,
      isRead: true,
      updatedAt: new Date(),
    };
  }
}

export const notificationService = new NotificationService();
