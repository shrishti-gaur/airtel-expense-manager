import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('A valid corporate email address is required')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validateRequest,
];
