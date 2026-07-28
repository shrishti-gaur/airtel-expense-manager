import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const createExpenseValidator = [
  body('status').optional(),
  body('amount')
    .custom((value, { req }) => {
      if (req.body.status === 'Draft') return true;
      if (value === undefined || value === null || value === '') {
        throw new Error('Expense amount must be a numeric value');
      }
      const num = Number(value);
      if (isNaN(num) || num <= 0) {
        throw new Error('Expense amount must be a numeric value greater than zero');
      }
      return true;
    }),
  body('category')
    .custom((value, { req }) => {
      if (req.body.status === 'Draft') return true;
      if (!value || !value.trim()) {
        throw new Error('Expense category is required');
      }
      return true;
    }),
  body('description')
    .custom((value, { req }) => {
      if (req.body.status === 'Draft') return true;
      if (!value || !value.trim()) {
        throw new Error('Expense description is required');
      }
      return true;
    }),
  body('invoiceDate')
    .custom((value, { req }) => {
      if (req.body.status === 'Draft') return true;
      const targetDate = value || req.body.date;
      if (!targetDate || isNaN(Date.parse(targetDate))) {
        throw new Error('A valid ISO8601 date is required');
      }
      return true;
    }),
  validateRequest,
];
