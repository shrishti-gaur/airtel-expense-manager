import { expenseService } from '../services/expense.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class ExpenseController {
  /**
   * Submit an expense claim (create new claim or draft)
   */
  async submitClaim(req, res, next) {
    try {
      const claim = await expenseService.createClaim(req.user.id, req.body);
      return sendSuccess(res, 'Expense claim submitted successfully', claim, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch claim history of the logged-in user
   */
  async getMyClaims(req, res, next) {
    try {
      const claims = await expenseService.getClaimsByUser(req.user.id);
      return sendSuccess(res, 'Claims retrieved successfully', { claims });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch details of a single claim
   */
  async getClaimDetails(req, res, next) {
    try {
      const claim = await expenseService.getClaimById(req.params.id);
      return sendSuccess(res, 'Claim details retrieved successfully', claim);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update an existing draft claim
   */
  async updateClaim(req, res, next) {
    try {
      const claim = await expenseService.updateClaim(req.params.id, req.user.id, req.body);
      return sendSuccess(res, 'Claim updated successfully', claim);
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
