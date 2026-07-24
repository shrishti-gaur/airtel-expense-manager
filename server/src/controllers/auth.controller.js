import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

/**
 * Auth Controller Handling Authentication operations.
 */
export class AuthController {
  /**
   * Handle user login credentials
   */
  async login(req, res, _next) {
    try {
      const { email, password } = req.body;
      // TODO: Perform active LDAP or Microsoft Entra ID verify.
      const authData = await authService.authenticateUser(email, password);
      
      return sendSuccess(res, 'Authentication successful', authData);
    } catch (error) {
      return sendError(res, 'Authentication failed', error.message, 401);
    }
  }

  /**
   * Fetch current authenticated user profile
   */
  async getProfile(req, res, next) {
    try {
      // User is attached by the requireAuth middleware
      if (!req.user) {
        return sendError(res, 'User session not found', {}, 401);
      }
      return sendSuccess(res, 'User profile retrieved successfully', { user: req.user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Terminate active session
   */
  async logout(req, res, next) {
    try {
      // TODO: Invalidate token block if needed.
      return sendSuccess(res, 'Session terminated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
