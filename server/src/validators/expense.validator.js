import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const createExpenseValidator = [
  body('amount')
    .isNumeric()
    .withMessage('Expense amount must be a numeric value')
    .custom((value) => value > 0)
    .withMessage('Expense amount must be greater than zero'),
  body('category')
    .notEmpty()
    .withMessage('Expense category is required')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Expense description is required')
    .trim(),
  body('date')
    .isISO8601()
    .withMessage('A valid ISO8601 date is required'),
  validateRequest,
];
