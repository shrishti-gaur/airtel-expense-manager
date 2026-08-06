import { config } from '../config/env.js';
import { localParserService } from './localParser.service.js';

export class GeminiService {
  /**
   * Structure raw OCR text using Gemini 2.5 Flash
   * @param {string} rawText
   * @returns {Promise<object>} Structured expense data
   */
  async parseExpense(rawText) {
    console.log(`[Gemini Service] Formatting raw text. Length: ${rawText?.length || 0}`);

    // [Audit Log - Step 1: Raw OCR Output]
    console.log(
      `[Audit Log - Step 1: Raw OCR Output]:\n-------------------\n${rawText || '(empty)'}\n-------------------`
    );

    if (!rawText || !rawText.trim()) {
      return this.getDefaultStructure();
    }

    // --- Preprocessing Layer ---
    // 1. Extract fields using local parser (regex) on the original unmasked raw text
    const localParsed = localParserService.parse(rawText);

    // [Audit Log - Step 2: Regex Output]
    console.log(
      `[Audit Log - Step 2: Regex Output]:\n-------------------\n${JSON.stringify(localParsed, null, 2)}\n-------------------`
    );

    // 2. Format a payload text: mask sensitive fields directly in the full OCR raw text
    const maskedPayloadText = localParserService.maskSensitiveFields(rawText);

    // 3. Estimate token reduction
    const estimateTokens = (text) => Math.ceil((text || '').length / 4);
    const rawTokens = estimateTokens(rawText);
    const maskedTokens = estimateTokens(maskedPayloadText);
    const tokenReduction = rawTokens - maskedTokens;
    const reductionPercent = rawTokens > 0 ? ((tokenReduction / rawTokens) * 100).toFixed(2) : '0.00';

    // Log reduction metadata
    console.log(`[Local Preprocessor] [Audit Log] Raw OCR text length: ${rawText.length}`);
    console.log(`[Local Preprocessor] [Audit Log] Token reduction achieved via masking: ${tokenReduction} tokens (${reductionPercent}% reduction)`);

    const apiKey = process.env.GEMINI_API_KEY;

    // Log API key loaded (without exposing the whole key)
    console.log(
      `[Gemini Service] [Audit Log] API Key Loaded: ${apiKey ? `YES (length: ${apiKey.length}, starts with: ${apiKey.substring(0, 3)}...)` : 'NO'}`
    );

    if (!apiKey) {
      console.warn(
        '[Gemini Service] GEMINI_API_KEY is not configured in .env. Returning default empty structure.'
      );
      return this.getDefaultStructure();
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `You are an enterprise-grade corporate expense and invoice extraction engine.
The input OCR text may contain spelling mistakes, missing characters, Hindi, English, or mixed languages (mixed English-Hindi text), low-quality scans, rotated pages, blurred text, or slight handwritten annotations.

Tasks:
1. Correct OCR mistakes dynamically as you parse the document.
2. Translate Hindi content to English if required. Merchant names may remain in Hindi if no English translation exists.
3. Detect the merchant/vendor name.
4. Detect GSTIN, PAN, and invoice number.
5. Extract the invoice or transaction date.
6. Extract subtotal, CGST, SGST, IGST, GST/VAT and total amount.
7. Detect currency.
8. Predict the expense category from merchant and purchased items.
9. Return a confidence score (0-1).
10. If a value is missing, return an empty string or 0 instead of guessing.
11. Return ONLY valid JSON matching the required schema.

Strictly adhere to these instruction mappings:
- "merchantName": Extracted merchant/vendor name. It may remain in Hindi if no English translation exists. If missing, return empty string.
- "invoiceNumber": Extracted invoice, receipt, or transaction number. If missing, return empty string.
- "invoiceDate": Extracted transaction date in YYYY-MM-DD format. If missing, return empty string.
- "amount": The total transaction or payable amount as a float/number. If missing, return 0.
- "gst": The total tax, GST, or VAT amount as a float/number. If missing, return 0.
- "currency": Three-letter currency code (e.g., "INR", "USD", "EUR"). Default is "INR".
- "category": Choose exactly ONE of the allowed categories:
  - "Travel"
  - "Meals & Entertainment"
  - "Internet & Communications"
  - "Office Supplies"
  - "Software Licences"
  - "Accommodation"
  - "Utilities"
  - "Others"
- "confidence": Float score between 0.0 and 1.0. If confidence score is low (less than 0.5), you MUST set "category" to "Others".
- "gstin": Extracted GSTIN number. If missing, return empty string.
- "pan": Extracted PAN number. If missing, return empty string.
- "subtotal": Extracted subtotal amount (before tax). If missing, return 0.
- "cgst": Extracted CGST amount. If missing, return 0.
- "sgst": Extracted SGST amount. If missing, return 0.
- "igst": Extracted IGST amount. If missing, return 0.

Raw OCR Text:
"""
${maskedPayloadText}
"""`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              merchantName: { type: 'STRING' },
              invoiceNumber: { type: 'STRING' },
              invoiceDate: { type: 'STRING', description: 'YYYY-MM-DD formatted date string' },
              amount: { type: 'NUMBER' },
              gst: { type: 'NUMBER' },
              currency: { type: 'STRING' },
              category: { type: 'STRING' },
              confidence: { type: 'NUMBER' },
              gstin: { type: 'STRING' },
              pan: { type: 'STRING' },
              subtotal: { type: 'NUMBER' },
              cgst: { type: 'NUMBER' },
              sgst: { type: 'NUMBER' },
              igst: { type: 'NUMBER' },
            },
            required: [
              'merchantName',
              'invoiceNumber',
              'invoiceDate',
              'amount',
              'gst',
              'currency',
              'category',
              'confidence',
              'gstin',
              'pan',
              'subtotal',
              'cgst',
              'sgst',
              'igst',
            ],
          },
        },
      };

      // [Audit Log - Step 3: JSON Sent to Gemini]
      console.log(
        `[Audit Log - Step 3: JSON Sent to Gemini]:\n-------------------\n${JSON.stringify(payload, null, 2)}\n-------------------`
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log(`[Gemini Service] [Audit Log] Gemini API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();

      // [Audit Log - Step 4: Gemini Response]
      console.log(
        `[Audit Log - Step 4: Gemini Response]:\n-------------------\n${JSON.stringify(responseData, null, 2)}\n-------------------`
      );

      const textResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('Empty response from Gemini API');
      }

      const parsedJson = JSON.parse(textResponse.trim());

      // Restore unmasked sensitive fields from local parser
      const finalJson = {
        ...parsedJson,
        gstin: localParsed.gstin || parsedJson.gstin || '',
        pan: localParsed.pan || parsedJson.pan || '',
      };

      // Clean up placeholders in case Gemini returned them
      if (finalJson.gstin === '[MASKED_GSTIN]') finalJson.gstin = '';
      if (finalJson.pan === '[MASKED_PAN]') finalJson.pan = '';

      // [Audit Log - Step 5: Final JSON returned to frontend]
      console.log(
        `[Audit Log - Step 5: Final JSON returned to frontend]:\n-------------------\n${JSON.stringify(finalJson, null, 2)}\n-------------------`
      );

      return finalJson;
    } catch (error) {
      console.error('[Gemini Service] [Audit Log] Error calling Gemini API:', error.message);
      return this.getDefaultStructure();
    }
  }

  getDefaultStructure() {
    return {
      merchantName: '',
      invoiceNumber: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      amount: 0,
      gst: 0,
      currency: 'INR',
      category: 'Others',
      confidence: 0.0,
      gstin: '',
      pan: '',
      subtotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
    };
  }
}

export const geminiService = new GeminiService();
