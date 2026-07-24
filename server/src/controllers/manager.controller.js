import { managerService } from '../services/manager.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class ManagerController {
  /**
   * Fetch list of claims pending approval
   */
  async getPendingClaims(req, res, next) {
    try {
      const claims = await managerService.getClaimsPendingApproval(req.user.id);
      return sendSuccess(res, 'Pending claims retrieved successfully', { claims });
    } catch (error) {
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
      const reviewResult = await managerService.reviewClaim(id, req.user.id, status, remarks);
      return sendSuccess(res, `Claim has been successfully ${status.toLowerCase()}`, reviewResult);
    } catch (error) {
      next(error);
    }
  }
}

export const managerController = new ManagerController();
