import { validateRequest } from '../middleware/validator.middleware.js';

export const ocrUploadValidator = [
  // Express-validator runs on req.body/params/headers. 
  // We explicitly assert that req.file exists in a custom check middleware.
  (req, res, next) => {
    if (!req.file) {
      throw new Error('A receipt document/image file upload is required');
    }
    next();
  },
  validateRequest,
];
