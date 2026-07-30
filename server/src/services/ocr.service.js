import path from 'path';
import fs from 'fs/promises';
import { createWorker } from 'tesseract.js';
import { geminiService } from './gemini.service.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const WordExtractor = require('word-extractor');

export class OcrService {
  /**
   * Parse text and entities from receipt document
   * @param {string} filePath Absolute path of uploaded file
   * @returns {Promise<object>} Combined OCR & Gemini structured response
   */
  async processReceipt(filePath) {
    console.log(`[OCR Service] Scanning receipt file path: ${filePath}`);

    let rawText = '';
    const ext = path.extname(filePath).toLowerCase();

    try {
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        rawText = await this.extractTextFromImage(filePath);
      } else if (ext === '.pdf') {
        rawText = await this.extractTextFromPdf(filePath);
      } else if (['.doc', '.docx'].includes(ext)) {
        rawText = await this.extractTextFromWord(filePath);
      } else {
        throw new Error(`Unsupported file extension: ${ext}`);
      }
    } catch (err) {
      console.error(`[OCR Service] Error extracting raw text from ${ext} file:`, err.message);
      // Fall back to empty rawText so Gemini/Fallback service can handle gracefully
      rawText = '';
    }

    console.log(`[OCR Service] Raw text extracted successfully. Length: ${rawText.length}`);

    // Convert raw OCR text to structured expense data via Gemini 2.5 Flash
    const parsed = await geminiService.parseExpense(rawText);

    // Build the final response payload with both required fields and compatibility fields
    const confidenceScore = parsed.confidence || 0.0;
    const confidencePct = Math.round(confidenceScore * 100);

    return {
      // Required endpoint keys
      merchantName: parsed.merchantName || '',
      invoiceNumber: parsed.invoiceNumber || '',
      invoiceDate: parsed.invoiceDate || '',
      amount: parsed.amount || 0,
      gst: parsed.gst || 0,
      currency: parsed.currency || 'INR',
      category: parsed.category || 'Others',
      confidence: confidenceScore,

      // Existing client UI compatibility keys
      vendor: parsed.merchantName || '',
      date: parsed.invoiceDate || '',
      taxAmount: parsed.gst || 0,
      confidenceScore: confidenceScore,
      ocrConfidence: {
        merchant: confidencePct,
        invoiceNumber: confidencePct,
        amount: confidencePct,
        tax: confidencePct,
        date: confidencePct,
        category: confidencePct,
      },
      extractedItems: [],
      description: `OCR Extracted Expense from ${parsed.merchantName || 'Merchant'}`,
    };
  }

  /**
   * Extract raw text from image files via Tesseract.js
   * @param {string} filePath
   */
  async extractTextFromImage(filePath) {
    console.log(`[OCR Service] Extracting text from image via Tesseract.js: ${filePath}`);
    const worker = await createWorker('eng');
    try {
      const {
        data: { text },
      } = await worker.recognize(filePath);
      await worker.terminate();
      return text || '';
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  }

  /**
   * Extract raw text from PDF files via pdf-parse
   * @param {string} filePath
   */
  async extractTextFromPdf(filePath) {
    console.log(`[OCR Service] Extracting text from PDF: ${filePath}`);
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  }

  /**
   * Extract raw text from Word documents via word-extractor
   * @param {string} filePath
   */
  async extractTextFromWord(filePath) {
    console.log(`[OCR Service] Extracting text from Word document: ${filePath}`);
    const extractor = new WordExtractor();
    const doc = await extractor.extract(filePath);
    return doc.getBody() || '';
  }
}

export const ocrService = new OcrService();
