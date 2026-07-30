import { query, body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const financeAuditValidator = [
  query('status')
    .optional()
    .isIn(['Draft', 'Submitted', 'Returned', 'Approved', 'Reimbursed', 'Rejected'])
    .withMessage('Invalid status filter value'),
  query('limit').optional().isInt({ min: 1 }).withMessage('Limit must be a positive integer'),
  validateRequest,
];

export const bulkProcessValidator = [
  body('claimIds').isArray({ min: 1 }).withMessage('claimIds must be a non-empty array of strings'),
  body('action')
    .isIn(['APPROVE', 'PROCESS_PAYMENT', 'REJECT_PAYMENT'])
    .withMessage('Action must be APPROVE, PROCESS_PAYMENT, or REJECT_PAYMENT'),
  body('comments').optional().isString().trim(),
  validateRequest,
];
