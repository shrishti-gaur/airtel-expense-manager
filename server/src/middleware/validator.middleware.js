import { validationResult } from 'express-validator';
import { sendError } from '../utils/response.util.js';

/**
 * Common request validation handler that intercept Express Validator errors.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[Validator Error Log] Validation failed for payload:', req.body, 'Errors:', errors.array());
    return sendError(res, 'Validation of request payload failed', { errors: errors.array() }, 400);
  }
  next();
};
