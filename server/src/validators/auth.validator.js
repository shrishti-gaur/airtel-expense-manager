import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Corporate email or OLM ID is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateRequest,
];
