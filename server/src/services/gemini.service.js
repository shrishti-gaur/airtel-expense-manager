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

    if (!rawText || !rawText.trim()) {
      return this.getDefaultStructure();
    }

    const startLocal = Date.now();
    // 1. Run Local Extraction First
    const { values: localParsed, confidences } = localParserService.parse(rawText);
    const localParseTime = Date.now() - startLocal;
    console.log('[Local Parser Output]:', JSON.stringify(localParsed, null, 2));
    console.log('[Local Parser Confidences]:', JSON.stringify(confidences, null, 2));

    // Determine target fields for Gemini extraction based on low confidence (< 0.8)
    const targetFields = [];
    if (confidences.merchantName < 0.8) targetFields.push('merchantName');
    if (confidences.invoiceNumber < 0.8) targetFields.push('invoiceNumber');
    if (confidences.invoiceDate < 0.8) targetFields.push('invoiceDate');
    if (confidences.amount < 0.8) targetFields.push('amount');
    if (confidences.gst < 0.8) targetFields.push('gst');
    if (confidences.category < 0.8) targetFields.push('category');
    if (confidences.discount < 0.8) targetFields.push('discount');

    // Also include other fields if they are missing/empty in local extraction
    if (!localParsed.gstin) targetFields.push('gstin');
    if (!localParsed.pan) targetFields.push('pan');
    if (!localParsed.subtotal) targetFields.push('subtotal');
    if (!localParsed.cgst) targetFields.push('cgst');
    if (!localParsed.sgst) targetFields.push('sgst');
    if (!localParsed.igst) targetFields.push('igst');
    if (!localParsed.currency) targetFields.push('currency');
    if (localParsed.discount === undefined || localParsed.discount === null)
      targetFields.push('discount');

    // If everything is high confidence, skip Gemini completely!
    if (targetFields.length === 0) {
      console.log(
        '[Gemini Service] Bypassing Gemini API: Local parsing confidence is high for all fields.'
      );
      console.log(`[OCR Pipeline Local Parser Audit]:
--------------------------------------------------
- Local Parser Time:  ${localParseTime} ms
- Gemini Saved Calls: 1 (Bypassed)
--------------------------------------------------`);
      return this.validateFinalOutput({
        ...localParsed,
        confidence: 0.95,
      });
    }

    console.log('[Gemini Service] Selective fields for Gemini extraction:', targetFields);

    // Limit/minimize the text payload sent to Gemini based on target fields
    let textPayload = '';
    const hasOnlyTopFields = targetFields.every((field) =>
      ['merchantName', 'invoiceNumber', 'invoiceDate', 'currency'].includes(field)
    );
    const hasOnlyBottomFields = targetFields.every((field) =>
      ['amount', 'gst', 'subtotal', 'cgst', 'sgst', 'igst', 'discount'].includes(field)
    );

    if (hasOnlyTopFields) {
      textPayload = rawText.slice(0, 1500);
      console.log('[Gemini Service] Token Optimization: Sending only top 1500 chars of OCR text.');
    } else if (hasOnlyBottomFields) {
      textPayload = rawText.slice(-1500);
      console.log(
        '[Gemini Service] Token Optimization: Sending only bottom 1500 chars of OCR text.'
      );
    } else {
      textPayload = rawText.slice(0, 4000);
      console.log('[Gemini Service] Token Optimization: Sending truncated 4000 chars of OCR text.');
    }

    // Mask sensitive fields in the payload we send to Gemini
    const maskedPayloadText = localParserService.maskSensitiveFields(textPayload);

    // Estimate tokens
    const estimateTokens = (text) => Math.ceil((text || '').length / 4);
    const payloadTokens = estimateTokens(maskedPayloadText);
    const originalTokens = estimateTokens(rawText);
    const tokenReduction = originalTokens - payloadTokens;
    console.log(
      `[Gemini Service] Token Reduction Achieved: Saved ${tokenReduction} tokens (Original: ${originalTokens}, Sent: ${payloadTokens})`
    );

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn(
        '[Gemini Service] GEMINI_API_KEY is not configured in .env. Returning local parser results.'
      );
      return localParsed;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      // Dynamically construct response schema
      const allProperties = {
        merchantName: { type: 'STRING' },
        invoiceNumber: { type: 'STRING' },
        invoiceDate: { type: 'STRING', description: 'YYYY-MM-DD formatted date string' },
        amount: { type: 'NUMBER' },
        gst: { type: 'NUMBER' },
        currency: { type: 'STRING' },
        category: { type: 'STRING' },
        gstin: { type: 'STRING' },
        pan: { type: 'STRING' },
        subtotal: { type: 'NUMBER' },
        discount: { type: 'NUMBER' },
        cgst: { type: 'NUMBER' },
        sgst: { type: 'NUMBER' },
        igst: { type: 'NUMBER' },
      };

      const properties = {
        confidence: {
          type: 'NUMBER',
          description: 'Overall extraction confidence for requested fields (0.0 to 1.0)',
        },
      };
      const required = ['confidence'];

      for (const field of targetFields) {
        if (allProperties[field]) {
          properties[field] = allProperties[field];
          required.push(field);
        }
      }

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `You are an enterprise-grade corporate expense and invoice extraction engine.
The input OCR text may contain spelling mistakes, missing characters, Hindi, English, or mixed languages.

Task: Extract ONLY the requested fields: ${targetFields.join(', ')}. Do not guess or extract other fields.
Return a confidence score (0-1) for these fields.
Return ONLY valid JSON matching the required schema.

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
            properties,
            required,
          },
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      const textResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Empty response from Gemini API');
      }

      const parsedJson = JSON.parse(textResponse.trim());

      // Merge localParsed with selective Gemini output
      const finalJson = {
        ...localParsed,
        ...parsedJson,
        confidence: parsedJson.confidence !== undefined ? parsedJson.confidence : 0.85,
      };

      // Restore unmasked sensitive fields if Gemini returned them masked
      if (finalJson.gstin === '[MASKED_GSTIN]') finalJson.gstin = localParsed.gstin || '';
      if (finalJson.pan === '[MASKED_PAN]') finalJson.pan = localParsed.pan || '';

      console.log(`[Gemini Service Local Parser Audit]:
--------------------------------------------------
- Local Parser Time:  ${localParseTime} ms
- Gemini Saved Tokens: ${tokenReduction}
--------------------------------------------------`);

      return this.validateFinalOutput(finalJson);
    } catch (error) {
      console.error('[Gemini Service] Error calling Gemini API:', error.message);
      return this.validateFinalOutput(localParsed);
    }
  }

  validateFinalOutput(json) {
    const finalAmount = json.amount || 0;
    const finalSubtotal = json.subtotal || 0;
    const finalGst = json.gst || 0;
    const finalDiscount = json.discount || 0;
    const finalCgst = json.cgst || 0;
    const finalSgst = json.sgst || 0;
    const finalIgst = json.igst || 0;

    let isFinalInconsistent = false;

    // Rule 1: GST cannot be greater than amount
    if (finalAmount > 0 && finalGst > finalAmount) {
      console.warn(
        `[Gemini Service Audit] Mathematical validation failed: GST (${finalGst}) is greater than Amount (${finalAmount})`
      );
      isFinalInconsistent = true;
    }

    // Rule 2: CGST and SGST must be equal (allow small rounding diff <= 1.0)
    if (finalCgst > 0 && finalSgst > 0 && Math.abs(finalCgst - finalSgst) > 1.0) {
      console.warn(
        `[Gemini Service Audit] Mathematical validation failed: CGST (${finalCgst}) does not match SGST (${finalSgst})`
      );
      isFinalInconsistent = true;
    }

    // Rule 3: Cannot have both IGST and CGST/SGST
    if (finalIgst > 0 && (finalCgst > 0 || finalSgst > 0)) {
      console.warn(
        `[Gemini Service Audit] Mathematical validation failed: Cannot have both IGST (${finalIgst}) and CGST/SGST (${finalCgst}/${finalSgst})`
      );
      isFinalInconsistent = true;
    }

    // Rule 4: Subtotal consistency check
    if (json.category !== 'Utilities' && finalSubtotal > 0 && finalAmount > 0) {
      const calculatedTotal = finalSubtotal + finalGst - finalDiscount;
      const difference = Math.abs(calculatedTotal - finalAmount);
      if (difference > 1.0) {
        console.warn(
          `[Gemini Service Audit] Mathematical validation failed! Subtotal (${finalSubtotal}) + GST (${finalGst}) - Discount (${finalDiscount}) = ${calculatedTotal}, but Grand Total is ${finalAmount}. Diff: ${difference}`
        );
        isFinalInconsistent = true;
      }
    }

    if (isFinalInconsistent) {
      return {
        ...json,
        confidence: 0.0,
      };
    }

    return json;
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
