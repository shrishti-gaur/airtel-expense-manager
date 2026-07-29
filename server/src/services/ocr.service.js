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

    // Return empty OCR fields to ensure the form starts completely blank for user entry
    return {
      vendor: '',
      amount: '',
      currency: 'INR',
      date: '',
      taxAmount: '',
      extractedItems: [],
      confidenceScore: 1.0,
    };
  }
}

export const ocrService = new OcrService();
