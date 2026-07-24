/**
 * Standard API Response Utilities for the Enterprise Expense Management System.
 */

/**
 * Send a standardized success response.
 * @param {Object} res - Express response object
 * @param {string} message - User-friendly success message
 * @param {Object|Array} data - Payload data
 * @param {number} statusCode - HTTP status code (default 200)
 */
export const sendSuccess = (res, message = 'Success', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardized error response.
 * @param {Object} res - Express response object
 * @param {string} message - User-friendly error descriptor
 * @param {Object|string} error - Diagnostic error details
 * @param {number} statusCode - HTTP status code (default 500)
 */
export const sendError = (res, message = 'An error occurred', error = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: typeof error === 'string' ? { message: error } : error,
  });
};
