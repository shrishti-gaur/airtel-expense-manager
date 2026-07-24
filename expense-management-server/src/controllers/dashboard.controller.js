import { dashboardService } from '../services/dashboard.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class DashboardController {
  /**
   * Get role-specific metrics summaries
   */
  async getSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const metrics = await dashboardService.getMetrics(req.user.id, req.user.role, { startDate, endDate });
      return sendSuccess(res, 'Dashboard metrics compiled successfully', metrics);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
