import { expenseService } from '../services/expense.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class ExpenseController {
  /**
   * Submit an expense claim (create new claim or draft)
   */
  async submitClaim(req, res, next) {
    try {
      console.log(`[Trace Log - Controller] POST /api/v1/expense - submitClaim for user ${req.user.id}. Payload:`, req.body);
      const claim = await expenseService.createClaim(req.user.id, req.body);
      console.log(`[Trace Log - Controller] POST /api/v1/expense - submitClaim success. Claim ID: ${claim.id}`);
      return sendSuccess(res, 'Expense claim submitted successfully', claim, 201);
    } catch (error) {
      console.error(`[Trace Log - Controller] POST /api/v1/expense - submitClaim error:`, error);
      next(error);
    }
  }

  /**
   * Fetch claim history of the logged-in user
   */
  async getMyClaims(req, res, next) {
    try {
      console.log(`[Trace Log - Controller] GET /api/v1/expense/my-claims for user ${req.user.id}`);
      const claims = await expenseService.getClaimsByUser(req.user.id);
      console.log(`[Trace Log - Controller] GET /api/v1/expense/my-claims success. Retrieved ${claims.length} claims.`);
      return sendSuccess(res, 'Claims retrieved successfully', { claims });
    } catch (error) {
      console.error(`[Trace Log - Controller] GET /api/v1/expense/my-claims error:`, error);
      next(error);
    }
  }

  /**
   * Fetch details of a single claim
   */
  async getClaimDetails(req, res, next) {
    try {
      console.log(`[Trace Log - Controller] GET /api/v1/expense/${req.params.id} for user ${req.user.id}`);
      const claim = await expenseService.getClaimById(req.params.id);
      console.log(`[Trace Log - Controller] GET /api/v1/expense/${req.params.id} success.`);
      return sendSuccess(res, 'Claim details retrieved successfully', claim);
    } catch (error) {
      console.error(`[Trace Log - Controller] GET /api/v1/expense/${req.params.id} error:`, error);
      next(error);
    }
  }

  /**
   * Update an existing draft claim
   */
  async updateClaim(req, res, next) {
    try {
      console.log(`[Trace Log - Controller] PUT /api/v1/expense/${req.params.id} for user ${req.user.id}. Payload:`, req.body);
      const claim = await expenseService.updateClaim(req.params.id, req.user.id, req.body);
      console.log(`[Trace Log - Controller] PUT /api/v1/expense/${req.params.id} success.`);
      return sendSuccess(res, 'Claim updated successfully', claim);
    } catch (error) {
      console.error(`[Trace Log - Controller] PUT /api/v1/expense/${req.params.id} error:`, error);
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
