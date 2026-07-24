import { financeService } from '../services/finance.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class FinanceController {
  /**
   * Audit claims listings
   */
  async getAuditClaims(req, res, next) {
    try {
      const filters = req.query;
      const claims = await financeService.getAuditLogs(filters);
      return sendSuccess(res, 'Audit claims logs retrieved successfully', { claims });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk process payments
   */
  async processBulkPayments(req, res, next) {
    try {
      const { claimIds, action } = req.body;
      const processResults = await financeService.bulkProcessClaims(claimIds, action);
      return sendSuccess(res, 'Bulk payment processing completed successfully', { processed: processResults });
    } catch (error) {
      next(error);
    }
  }
}

export const financeController = new FinanceController();
