import { sendError } from '../utils/response.util.js';
import { config } from '../config/env.js';

/**
 * Central Error Catching Middleware
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error Middleware] Code: ${statusCode} - Message: ${message}`);
  if (config.nodeEnv === 'development' && err.stack) {
    console.error(err.stack);
  }

  const errorDetail = {
    code: err.code || 'INTERNAL_ERROR',
  };

  if (config.nodeEnv === 'development') {
    errorDetail.stack = err.stack;
    errorDetail.details = err.details || null;
  }

  return sendError(res, message, errorDetail, statusCode);
};
