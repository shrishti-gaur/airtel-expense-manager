import { query, body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const financeAuditValidator = [
  query('status')
    .optional()
    .isIn(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSED'])
    .withMessage('Invalid status filter value'),
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit must be a positive integer'),
  validateRequest,
];

export const bulkProcessValidator = [
  body('claimIds')
    .isArray({ min: 1 })
    .withMessage('claimIds must be a non-empty array of strings'),
  body('action')
    .isIn(['APPROVE', 'PROCESS_PAYMENT'])
    .withMessage('Action must be either APPROVE or PROCESS_PAYMENT'),
  validateRequest,
];
