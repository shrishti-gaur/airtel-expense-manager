import { managerService } from '../services/manager.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class ManagerController {
  /**
   * Fetch list of claims pending approval
   */
  async getPendingClaims(req, res, next) {
    try {
      console.log(
        `[Trace Log - Controller] GET /api/v1/manager/pending for manager ${req.user.id}`
      );
      const claims = await managerService.getClaimsPendingApproval(req.user.id);
      console.log(
        `[Trace Log - Controller] GET /api/v1/manager/pending success. Found ${claims.length} claims.`
      );
      return sendSuccess(res, 'Pending claims retrieved successfully', { claims });
    } catch (error) {
      console.error('[Trace Log - Controller] GET /api/v1/manager/pending error:', error);
      next(error);
    }
  }

  /**
   * Review (approve or reject) a claim
   */
  async reviewClaim(req, res, next) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;
      console.log(
        `[Trace Log - Controller] POST /api/v1/manager/review/${id} for manager ${req.user.id}. Action: ${status}, Remarks: ${remarks}`
      );
      const reviewResult = await managerService.reviewClaim(id, req.user.id, status, remarks);
      console.log(
        `[Trace Log - Controller] POST /api/v1/manager/review/${id} success. Final status: ${reviewResult.status}`
      );
      return sendSuccess(res, `Claim has been successfully ${status.toLowerCase()}`, reviewResult);
    } catch (error) {
      console.error(
        `[Trace Log - Controller] POST /api/v1/manager/review/${req.params.id} error:`,
        error
      );
      next(error);
    }
  }
}

export const managerController = new ManagerController();
