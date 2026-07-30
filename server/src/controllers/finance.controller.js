import { financeService } from '../services/finance.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class FinanceController {
  /**
   * Audit claims listings
   */
  async getAuditClaims(req, res, next) {
    try {
      console.log('[Trace Log - Controller] GET /api/v1/finance/audit. Filters:', req.query);
      const claims = await financeService.getAuditLogs(req.query);
      console.log(
        `[Trace Log - Controller] GET /api/v1/finance/audit success. Found ${claims.length} claims.`
      );
      return sendSuccess(res, 'Audit claims logs retrieved successfully', { claims });
    } catch (error) {
      console.error('[Trace Log - Controller] GET /api/v1/finance/audit error:', error);
      next(error);
    }
  }

  /**
   * Bulk process payments
   */
  async processBulkPayments(req, res, next) {
    try {
      const { claimIds, action, comments } = req.body;
      console.log(
        `[Trace Log - Controller] POST /api/v1/finance/bulk-process for user ${req.user.id}. Action: ${action}, Claims count: ${claimIds?.length}, Claims:`,
        claimIds
      );
      const processResults = await financeService.bulkProcessClaims(
        claimIds,
        action,
        comments,
        req.user.id
      );
      console.log(
        `[Trace Log - Controller] POST /api/v1/finance/bulk-process success. Processed ${processResults.length} claims.`
      );
      return sendSuccess(res, 'Bulk payment processing completed successfully', {
        processed: processResults,
      });
    } catch (error) {
      console.error('[Trace Log - Controller] POST /api/v1/finance/bulk-process error:', error);
      next(error);
    }
  }
}

export const financeController = new FinanceController();
