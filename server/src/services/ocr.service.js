import path from 'path';
import fs from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/env.js';
import { geminiService } from './gemini.service.js';
import { createRequire } from 'module';
import crypto from 'crypto';
import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { ScreenshotDetectorService } from './screenshotDetector.service.js';
import { fileURLToPath } from 'url';

const execFilePromise = promisify(execFile);
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const WordExtractor = require('word-extractor');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OcrService {
  /**
   * Parse text and entities from receipt document
   * @param {string} filePath Absolute path of uploaded file
   * @returns {Promise<object>} Combined OCR & Gemini structured response
   */
  async processReceipt(filePath) {
    console.log(`[OCR Service] Scanning receipt file path: ${filePath}`);
    console.log('[OCR] Language: eng+hin');
    console.log('[OCR] OCR Engine: Native Tesseract');
    console.log('[OCR] Hindi support enabled');

    // Screenshot detection check before processing
    const screenshotResult = await ScreenshotDetectorService.detectScreenshot(filePath, path.basename(filePath));
    if (screenshotResult.isScreenshot) {
      const err = new Error('Screenshot Detected');
      err.code = 'SCREENSHOT_DETECTED';
      err.status = 422;
      err.reason = 'Please upload the original receipt, invoice, or PDF instead of a screenshot.';
      err.heuristic = screenshotResult.heuristic;
      throw err;
    }

    // Calculate receiptHash
    const fileBuffer = await fs.readFile(filePath);
    const receiptHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Compare receiptHash with existing claims
    const existingHashClaim = await ExpenseClaim.findOne({ receiptHash });
    if (existingHashClaim) {
      console.log(`[OCR] Duplicate Type: Exact File Match`);
      console.log(`[OCR] receiptHash: ${receiptHash}`);
      console.log(`[OCR] invoiceFingerprint: null`);
      console.log(`[OCR] Existing Claim ID: ${existingHashClaim.id}`);

      const err = new Error('Duplicate Receipt Detected');
      err.code = 'DUPLICATE_RECEIPT';
      err.status = 409;
      err.duplicateType = 'Exact File Match';
      err.existingClaim = {
        id: existingHashClaim.id,
        submissionDate: existingHashClaim.submissionDate || existingHashClaim.createdAt,
        employeeName: existingHashClaim.employeeName || 'Unknown Employee'
      };
      throw err;
    }

    let rawText = '';
    const ext = path.extname(filePath).toLowerCase();
    
    const totalStart = Date.now();
    let preprocessTime = 0;
    let ocrTime = 0;
    let preprocessMeta = null;

    try {
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const ocrResult = await this.extractTextFromImage(filePath);
        rawText = ocrResult.text;
        preprocessTime = ocrResult.performance.preprocessTime;
        ocrTime = ocrResult.performance.ocrTime;
        preprocessMeta = ocrResult.performance.preprocessMeta;
      } else if (ext === '.pdf') {
        const startPdf = Date.now();
        rawText = await this.extractTextFromPdf(filePath);
        ocrTime = Date.now() - startPdf;
      } else if (['.doc', '.docx'].includes(ext)) {
        const startWord = Date.now();
        rawText = await this.extractTextFromWord(filePath);
        ocrTime = Date.now() - startWord;
      } else {
        throw new Error(`Unsupported file extension: ${ext}`);
      }
    } catch (err) {
      console.error(`[OCR Service] Error extracting raw text from ${ext} file:`, err.message);
      rawText = '';
    }

    console.log(`[OCR Service] Raw text extracted successfully. Length: ${rawText.length}`);

    // Convert raw OCR text to structured expense data via Gemini 2.5 Flash
    const startGemini = Date.now();
    const parsed = await geminiService.parseExpense(rawText);
    const geminiTime = Date.now() - startGemini;
    const totalTime = Date.now() - totalStart;

    console.log(`
[OCR Pipeline Performance Audit Log]:
--------------------------------------------------
- File Name:          ${path.basename(filePath)}
- File Extension:     ${ext}
- Preprocessing Time: ${preprocessTime} ms
- OCR Execution Time: ${ocrTime} ms
- Gemini Service Time: ${geminiTime} ms
- Total Pipeline Time: ${totalTime} ms
--------------------------------------------------`);

    // Generate invoiceFingerprint
    const normMerchant = String(parsed.merchantName || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const normInvoiceNo = String(parsed.invoiceNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    
    let normDate = '';
    if (parsed.invoiceDate) {
      try {
        const d = new Date(parsed.invoiceDate);
        if (!isNaN(d.getTime())) {
          normDate = d.toISOString().split('T')[0];
        } else {
          normDate = String(parsed.invoiceDate).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        }
      } catch (e) {
        normDate = String(parsed.invoiceDate).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
      }
    }

    const normAmount = parsed.amount !== undefined && parsed.amount !== null ? Number(parsed.amount).toFixed(2) : '0.00';

    let invoiceFingerprint = null;
    if (normMerchant && normDate && parsed.amount !== undefined && parsed.amount !== null) {
      const rawString = `${normMerchant}|${normInvoiceNo}|${normDate}|${normAmount}`;
      invoiceFingerprint = crypto.createHash('sha256').update(rawString).digest('hex');

      // Compare invoiceFingerprint with existing claims
      const existingFingerprintClaim = await ExpenseClaim.findOne({ invoiceFingerprint });
      if (existingFingerprintClaim) {
        console.log(`[OCR] Duplicate Type: Invoice Match`);
        console.log(`[OCR] receiptHash: ${receiptHash}`);
        console.log(`[OCR] invoiceFingerprint: ${invoiceFingerprint}`);
        console.log(`[OCR] Existing Claim ID: ${existingFingerprintClaim.id}`);

        const err = new Error('Duplicate Receipt Detected');
        err.code = 'DUPLICATE_RECEIPT';
        err.status = 409;
        err.duplicateType = 'Invoice Match';
        err.existingClaim = {
          id: existingFingerprintClaim.id,
          submissionDate: existingFingerprintClaim.submissionDate || existingFingerprintClaim.createdAt,
          employeeName: existingFingerprintClaim.employeeName || 'Unknown Employee'
        };
        throw err;
      }
    }

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
      gstin: parsed.gstin || '',
      pan: parsed.pan || '',
      subtotal: parsed.subtotal || 0,
      cgst: parsed.cgst || 0,
      sgst: parsed.sgst || 0,
      igst: parsed.igst || 0,

      // Duplicate detection keys
      receiptHash,
      invoiceFingerprint,

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
      description: (() => {
        let desc = `OCR Extracted Expense from ${parsed.merchantName || 'Merchant'}`;
        if (parsed.pnr) desc += ` | PNR: ${parsed.pnr}`;
        if (parsed.checkInDate && parsed.checkOutDate) desc += ` | Stay: ${parsed.checkInDate} to ${parsed.checkOutDate}`;
        if (parsed.litres && parsed.rate) desc += ` | Fuel: ${parsed.litres} Ltrs @ ₹${parsed.rate}/Ltr`;
        if (parsed.accountNumber) desc += ` | Acc No: ${parsed.accountNumber}`;
        if (parsed.billingPeriod) desc += ` | Period: ${parsed.billingPeriod}`;
        return desc;
      })(),
    };
  }

  /**
   * Extract raw text from image files via native Tesseract executable with Preprocessing
   * @param {string} filePath
   * @returns {Promise<object>} { text, performance }
   */
  async extractTextFromImage(filePath) {
    console.log(`[OCR Service] Extracting text from image via native Tesseract: ${filePath}`);
    
    let preprocessMeta = null;
    let preprocessedPath = filePath;
    const ext = path.extname(filePath).toLowerCase();
    const isTempProcessed = ['.png', '.jpg', '.jpeg'].includes(ext);

    const preprocessStart = Date.now();
    if (isTempProcessed) {
      preprocessedPath = path.join(
        path.dirname(filePath),
        `temp_ocr_preprocessed_${Date.now()}_${path.basename(filePath)}`
      );
      try {
        const scriptPath = path.join(__dirname, 'preprocess.py');
        const pythonCmd = 'python3';
        
        console.log(`[OCR Service] Invoking Python Preprocessor: ${scriptPath}`);
        const { stdout } = await execFilePromise(pythonCmd, [scriptPath, filePath, preprocessedPath]);
        
        preprocessMeta = JSON.parse(stdout.trim());
        console.log(`[OCR Preprocessor Results]:`, preprocessMeta);
      } catch (err) {
        console.error(`[OCR Service] Image preprocessing failed, falling back to original:`, err.message);
        preprocessedPath = filePath;
      }
    }
    const preprocessTime = Date.now() - preprocessStart;

    const ocrStart = Date.now();
    let text = '';
    try {
      // PSM 4 is optimal for single-column receipt grids. We also preserve interword spaces.
      const args = [
        preprocessedPath, 
        'stdout', 
        '-l', config.ocrLang,
        '--psm', '4',
        '-c', 'preserve_interword_spaces=1'
      ];
      
      const env = { ...process.env };
      if (config.tessdataPrefix) {
        env.TESSDATA_PREFIX = config.tessdataPrefix;
      }
      
      const { stdout } = await execFilePromise(config.tesseractPath, args, { env });
      text = stdout || '';
      
      // Fallback pass: if the text length is very low (< 50 chars), perform a fallback pass using PSM 3 (auto page segmentation)
      if (text.trim().length < 50) {
        console.log(`[OCR Service] OCR pass 1 confidence very low (length: ${text.trim().length}). Triggering PSM 3 fallback pass...`);
        const fallbackArgs = [
          preprocessedPath,
          'stdout',
          '-l', config.ocrLang,
          '--psm', '3',
          '-c', 'preserve_interword_spaces=1'
        ];
        const fallbackRes = await execFilePromise(config.tesseractPath, fallbackArgs, { env });
        const fallbackText = fallbackRes.stdout || '';
        if (fallbackText.trim().length > text.trim().length) {
          text = fallbackText;
          console.log(`[OCR Service] Fallback pass succeeded. New length: ${text.trim().length}`);
        }
      }
    } catch (error) {
      console.error(`[OCR Service] Tesseract image OCR failed for: ${preprocessedPath}`, error.message);
    }
    const ocrTime = Date.now() - ocrStart;

    // Clean up temporary preprocessed image if we created one
    if (isTempProcessed && preprocessedPath !== filePath) {
      try {
        await fs.unlink(preprocessedPath);
      } catch (e) {
        console.warn(`[OCR Service] Could not unlink temp preprocessed file:`, preprocessedPath, e.message);
      }
    }

    return {
      text,
      performance: {
        preprocessTime,
        ocrTime,
        preprocessMeta
      }
    };
  }

  /**
   * Extract raw text from PDF files. Falls back to pdftoppm + native Tesseract OCR if scanned.
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  async extractTextFromPdf(filePath) {
    console.log(`[OCR Service] Extracting text from PDF: ${filePath}`);
    
    let text = '';
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text || '';
    } catch (err) {
      console.warn(`[OCR Service] pdf-parse failed for: ${filePath}`, err.message);
    }

    // Clean up text for detection
    const cleanedText = text.replace(/\s+/g, '').trim();

    // If the PDF is scanned or has little embedded text, convert it to images and run Tesseract OCR
    if (cleanedText.length < 50) {
      console.log(`[OCR Service] Scanned or low-text PDF detected (${cleanedText.length} chars). Falling back to native Tesseract OCR...`);
      let tempDir = null;
      try {
        // Create unique temporary directory in uploads folder to respect workspace constraint
        const uploadsDir = path.dirname(filePath);
        tempDir = await fs.mkdtemp(path.join(uploadsDir, 'tmp-ocr-'));
        
        console.log(`[OCR Service] Converting PDF to images in temporary directory: ${tempDir}`);
        
        // Convert PDF to images using pdftoppm (1 image per page)
        const pdftoppmPath = process.env.PDFTOPPM_PATH || 'pdftoppm';
        const pdftoppmArgs = ['-png', '-r', '150', filePath, path.join(tempDir, 'page')];
        await execFilePromise(pdftoppmPath, pdftoppmArgs);

        // Find and sort all generated page images numerically
        const files = await fs.readdir(tempDir);
        const pageImages = files
          .filter(file => file.startsWith('page-') && file.endsWith('.png'))
          .sort((a, b) => {
            const numA = parseInt(a.replace('page-', '').replace('.png', ''), 10);
            const numB = parseInt(b.replace('page-', '').replace('.png', ''), 10);
            return numA - numB;
          });

        console.log(`[OCR Service] Performing native Tesseract OCR on ${pageImages.length} extracted page images...`);
        let ocrText = '';
        for (const img of pageImages) {
          const imgPath = path.join(tempDir, img);
          const pageOcrResult = await this.extractTextFromImage(imgPath);
          const pageText = pageOcrResult.text;
          ocrText += pageText + '\n';
        }

        return ocrText.trim();
      } catch (ocrError) {
        console.error(`[OCR Service] Failed to perform PDF OCR fallback for: ${filePath}`, ocrError.message);
        return text; // Return whatever partial text pdf-parse found
      } finally {
        // Clean up temporary image files and directories
        if (tempDir) {
          try {
            console.log(`[OCR Service] Cleaning up temporary directory: ${tempDir}`);
            const files = await fs.readdir(tempDir);
            for (const file of files) {
              await fs.unlink(path.join(tempDir, file));
            }
            await fs.rmdir(tempDir);
          } catch (cleanupError) {
            console.warn(`[OCR Service] Cleanup failed for directory: ${tempDir}`, cleanupError.message);
          }
        }
      }
    }

    return text;
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
