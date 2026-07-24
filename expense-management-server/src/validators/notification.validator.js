import { param } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';

export const markReadValidator = [
  param('id')
    .notEmpty()
    .withMessage('Notification ID is required in URL parameters'),
  validateRequest,
];
