import { dashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class DashboardController {
  /**
   * Get role-specific metrics summaries
   */
  async getSummary(req, res, next) {
    try {
      console.log(`[Trace Log - Controller] GET /api/v1/dashboard/summary for user ${req.user.id} (${req.user.role}). Date range: ${req.query.startDate} to ${req.query.endDate}`);
      const metrics = await dashboardService.getMetrics(req.user.id, req.user.role, req.query);
      console.log('[Trace Log - Controller] GET /api/v1/dashboard/summary success.');
      return sendSuccess(res, 'Dashboard metrics compiled successfully', metrics);
    } catch (error) {
      console.error('[Trace Log - Controller] GET /api/v1/dashboard/summary error:', error);
      next(error);
    }
  }

  /**
   * Fetch activity logs
   */
  async getActivityLogs(req, res, next) {
    try {
      console.log(`[Trace Log - Controller] GET /api/v1/dashboard/activity-logs for user ${req.user.id} (${req.user.role})`);
      const logs = await dashboardService.getActivityLogs(req.user.id, req.user.role);
      console.log(`[Trace Log - Controller] GET /api/v1/dashboard/activity-logs success. Found ${logs.length} logs.`);
      return sendSuccess(res, 'Activity logs retrieved successfully', { logs });
    } catch (error) {
      console.error('[Trace Log - Controller] GET /api/v1/dashboard/activity-logs error:', error);
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
