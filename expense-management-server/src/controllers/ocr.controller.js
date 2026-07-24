import { ocrService } from '../services/ocr.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

export class OcrController {
  /**
   * Process receipt document scanning
   */
  async scanReceipt(req, res, next) {
    try {
      if (!req.file) {
        return sendError(res, 'Receipt document file is missing in form-data', {}, 400);
      }
      
      const ocrResults = await ocrService.processReceipt(req.file.path);
      return sendSuccess(res, 'Receipt processed successfully via OCR scanner', ocrResults);
    } catch (error) {
      next(error);
    }
  }
}

export const ocrController = new OcrController();
