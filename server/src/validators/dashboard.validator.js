import { query } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const dashboardMetricsValidator = [
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid ISO8601 date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid ISO8601 date'),
  validateRequest,
];
