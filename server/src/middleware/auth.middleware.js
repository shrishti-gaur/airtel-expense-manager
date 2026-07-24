import { sendError } from '../utils/response.util.js';

/**
 * Middleware checking Authorization Headers and extracting the user payload.
 * Stub implementation for Enterprise Entra ID integration.
 */
export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Authorization credentials not found', { code: 'UNAUTHORIZED' }, 401);
  }

  const token = authHeader.split(' ')[1];

  // TODO: Add Microsoft Entra ID JWT verification logic here.
  // For now, we mock-decode the token or verify custom mock tokens.
  try {
    if (token === 'mock-employee-token') {
      req.user = { id: 'emp_123', name: 'John Employee', role: 'Employee' };
    } else if (token === 'mock-manager-token') {
      req.user = { id: 'mgr_456', name: 'Sarah Manager', role: 'Manager' };
    } else if (token === 'mock-finance-token') {
      req.user = { id: 'fin_789', name: 'David Finance', role: 'Finance' };
    } else {
      // General mock user if code is passed
      req.user = { id: 'user_gen', name: 'General User', role: 'Employee' };
    }

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
