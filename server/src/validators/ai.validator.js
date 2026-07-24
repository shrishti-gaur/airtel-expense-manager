import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const aiAnalyzeValidator = [
  body('expenseText')
    .notEmpty()
    .withMessage('Expense narrative text is required for AI audit classification')
    .trim(),
  validateRequest,
];
