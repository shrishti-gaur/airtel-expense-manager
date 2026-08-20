import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { config } from '../config/env.js';

const execFilePromise = promisify(execFile);

export class ScreenshotDetectorService {
  /**
   * Run heuristics to determine if file is a screenshot.
   * @param {string} filePath File location on disk
   * @param {string} originalName Submitter's original file name
   * @returns {Promise<{isScreenshot: boolean, heuristic?: string, reason?: string}>}
   */
  static async detectScreenshot(filePath, originalName) {
    console.log(`[Screenshot Detector] Auditing file: ${originalName || filePath}`);

    // Heuristic 1: Filename patterns
    if (originalName) {
      const lowerName = originalName.toLowerCase();
      if (
        lowerName.includes('screenshot') ||
        lowerName.includes('screen shot') ||
        lowerName.includes('screen-shot')
      ) {
        const heuristicName = 'Filename Pattern Match';
        console.log(`[Screenshot Detector] Rejection Heuristic Triggered: ${heuristicName}`);
        return {
          isScreenshot: true,
          heuristic: heuristicName,
          reason: 'Please upload the original receipt, invoice, or PDF instead of a screenshot.',
        };
      }
    }

    // Heuristic 2: Buffer metadata checks (checks for common screenshot EXIF software labels)
    try {
      const fileBuffer = await fs.readFile(filePath);
      const bufferString = fileBuffer.toString('binary');
      if (
        bufferString.includes('Screen Shot') ||
        bufferString.includes('Screenshot') ||
        bufferString.includes('Apple System Profile')
      ) {
        const heuristicName = 'File Metadata Signature Match';
        console.log(`[Screenshot Detector] Rejection Heuristic Triggered: ${heuristicName}`);
        return {
          isScreenshot: true,
          heuristic: heuristicName,
          reason: 'Please upload the original receipt, invoice, or PDF instead of a screenshot.',
        };
      }
    } catch (err) {
      console.warn('[Screenshot Detector] Failed to read buffer metadata:', err);
    }

    // Heuristic 3: OCR text search
    try {
      const args = [filePath, 'stdout', '-l', config.ocrLang];
      const env = { ...process.env };
      if (config.tessdataPrefix) {
        env.TESSDATA_PREFIX = config.tessdataPrefix;
      }

      const { stdout } = await execFilePromise(config.tesseractPath, args, { env });

      const text = (stdout || '').toLowerCase();
      console.log(`[Screenshot Detector] Extracted raw text length for analysis: ${text.length}`);

      // Keywords specified in the prompt
      const screenshotKeywords = [
        'localhost',
        'chrome',
        'vs code',
        'scan receipt',
        'employee workspace',
      ];

      for (const keyword of screenshotKeywords) {
        if (text.includes(keyword)) {
          const heuristicName = `OCR Keyword Match (${keyword})`;
          console.log(`[Screenshot Detector] Rejection Heuristic Triggered: ${heuristicName}`);
          return {
            isScreenshot: true,
            heuristic: heuristicName,
            reason: 'Please upload the original receipt, invoice, or PDF instead of a screenshot.',
          };
        }
      }

      // Check browser URL patterns / localhost addresses
      const urlRegex =
        /(http:\/\/localhost|localhost:|chrome:\/\/|chrome-extension:\/\/|file:\/\/\/)/i;
      if (urlRegex.test(text)) {
        const heuristicName = 'Browser URL/Protocol Pattern Match';
        console.log(`[Screenshot Detector] Rejection Heuristic Triggered: ${heuristicName}`);
        return {
          isScreenshot: true,
          heuristic: heuristicName,
          reason: 'Please upload the original receipt, invoice, or PDF instead of a screenshot.',
        };
      }

      // Check window borders / scrollbars keywords
      const borderKeywords = [
        'scrollbar',
        'scroll bar',
        'minimise',
        'maximise',
        'active window',
        'window frame',
      ];
      for (const keyword of borderKeywords) {
        if (text.includes(keyword)) {
          const heuristicName = `Window Element Match (${keyword})`;
          console.log(`[Screenshot Detector] Rejection Heuristic Triggered: ${heuristicName}`);
          return {
            isScreenshot: true,
            heuristic: heuristicName,
            reason: 'Please upload the original receipt, invoice, or PDF instead of a screenshot.',
          };
        }
      }
    } catch (err) {
      console.error('[Screenshot Detector] OCR pre-check failed:', err);
    }

    console.log('[Screenshot Detector] File audit complete. Duplicate found: NO');
    return { isScreenshot: false };
  }
}
