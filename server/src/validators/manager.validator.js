import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const reviewClaimValidator = [
  param('id').notEmpty().withMessage('Expense ID is required in URL parameters'),
  body('status')
    .isIn(['Approved', 'Returned'])
    .withMessage('Status must be either Approved or Returned'),
  body('remarks').optional().trim(),
  validateRequest,
];
