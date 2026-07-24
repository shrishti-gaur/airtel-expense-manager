/**
 * OCR Service Placeholder
 */
export class OcrService {
  /**
   * Parse text and entities from receipt document
   * TODO: Integrate real OCR services (Tesseract, Document AI, AWS Textract).
   */
  async processReceipt(filePath) {
    console.log(`[OCR Service] Scanning receipt file path: ${filePath}`);

    // Simulate OCR extraction latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Return mock receipt metadata entities
    return {
      vendor: 'Airtel Broadband Services',
      amount: 1499.0,
      currency: 'INR',
      date: new Date('2026-07-20'),
      taxAmount: 228.66,
      extractedItems: [
        { desc: 'Broadband Subscription Plan - July', amount: 1270.34 },
        { desc: 'CGST @ 9%', amount: 114.33 },
        { desc: 'SGST @ 9%', amount: 114.33 },
      ],
      confidenceScore: 0.94,
    };
  }
}

export const ocrService = new OcrService();
