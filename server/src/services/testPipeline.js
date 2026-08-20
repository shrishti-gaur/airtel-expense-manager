import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { ocrService } from './ocr.service.js';
import { ExpenseClaim } from '../models/ExpenseClaim.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function test() {
  console.log('[Test Pipeline] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Test Pipeline] MongoDB connected successfully.');

  // Stub database lookup to test pipeline end-to-end without duplicate blocks
  ExpenseClaim.findOne = () => Promise.resolve(null);

  const uploadDir = path.resolve(process.cwd(), 'uploads');

  // Pick some sample receipts representing different layouts and styles
  const testFiles = [
    'receipt-1785405256810-933194057.jpg',
    'receipt-1785412118097-390716037.png',
    'receipt-1785309079215-778753747.pdf',
  ];

  for (const filename of testFiles) {
    const filePath = path.join(uploadDir, filename);
    console.log('\n==================================================');
    console.log(`[Test Pipeline] Processing test file: ${filename}`);
    console.log('==================================================');

    try {
      const result = await ocrService.processReceipt(filePath);
      console.log('[Test Pipeline] Resulting Data:');
      console.log(
        JSON.stringify(
          {
            merchantName: result.merchantName,
            invoiceNumber: result.invoiceNumber,
            invoiceDate: result.invoiceDate,
            amount: result.amount,
            gst: result.gst,
            category: result.category,
            confidence: result.confidence,
            gstin: result.gstin,
            pan: result.pan,
          },
          null,
          2
        )
      );
    } catch (err) {
      console.error(`[Test Pipeline] Failed to process ${filename}:`, err.message);
    }
  }

  console.log('\n[Test Pipeline] Disconnecting Mongoose...');
  await mongoose.disconnect();
  console.log('[Test Pipeline] Test complete.');
}

test().catch((err) => {
  console.error('[Test Pipeline] Crash:', err);
  mongoose.disconnect();
});
