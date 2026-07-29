import { sendError } from '../utils/response.util.js';

import { authService } from '../services/auth.service.js';

/**
 * Middleware checking Authorization Headers and extracting the user payload from MongoDB.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization credentials not found', { code: 'UNAUTHORIZED' }, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const sessionUser = await authService.verifySession(token);
    req.user = sessionUser;
    next();
  } catch (error) {
    return sendError(res, 'Token validation failed', { code: 'INVALID_TOKEN', details: error.message }, 403);
  }
};

/**
 * Middleware ensuring the authenticated user possesses the correct role scope.
 * @param {Array<string>|string} allowedRoles - Single role or list of allowed roles.
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'User session not initialized', { code: 'UNAUTHORIZED' }, 401);
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. Required scope: [${roles.join(', ')}]. Current role: ${req.user.role}`,
        { code: 'FORBIDDEN' },
        403
      );
    }

    next();
  };
};
