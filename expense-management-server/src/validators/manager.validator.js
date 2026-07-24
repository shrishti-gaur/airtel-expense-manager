import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const reviewClaimValidator = [
  param('id')
    .notEmpty()
    .withMessage('Expense ID is required in URL parameters'),
  body('status')
    .isIn(['APPROVED', 'REJECTED'])
    .withMessage('Status must be either APPROVED or REJECTED'),
  body('remarks')
    .optional()
    .trim(),
  validateRequest,
];
