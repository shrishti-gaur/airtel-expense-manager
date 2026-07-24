import { Router } from 'express';
import { ocrController } from '../controllers/ocr.controller.js';
import { ocrUploadValidator } from '../validators/ocr.validator.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Secure all OCR endpoints
router.use(requireAuth);

// Handles multipart form-data upload for 'receipt' field
router.post('/scan', upload.single('receipt'), ocrUploadValidator, ocrController.scanReceipt);

export default router;
