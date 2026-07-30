import { config } from '../config/env.js';

export class GeminiService {
  /**
   * Structure raw OCR text using Gemini 2.5 Flash
   * @param {string} rawText
   * @returns {Promise<object>} Structured expense data
   */
  async parseExpense(rawText) {
    console.log(`[Gemini Service] Formatting raw text. Length: ${rawText?.length || 0}`);

    // Log OCR extracted text
    console.log(
      `[Gemini Service] [Audit Log] OCR Extracted Text:\n-------------------\n${rawText || '(empty)'}\n-------------------`
    );

    if (!rawText || !rawText.trim()) {
      return this.getDefaultStructure();
    }

    const apiKey = process.env.GEMINI_API_KEY;

    console.log("Config Key:", config.geminiApiKey);
    console.log("Process Key:", process.env.GEMINI_API_KEY);

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
                text: `You are an enterprise-grade corporate expense and invoice parser. Your task is to analyze the raw OCR text extracted from an uploaded receipt, bill, or invoice and return structured data.

Strictly adhere to these instructions:
1. Extract the merchant/vendor name into "merchantName" (e.g. "Airtel", "Uber", "Zomato", "Microsoft"). Remove common corporate suffixes like "Inc.", "Ltd.", "Pvt. Ltd." unless necessary for clarity. If not found, use an empty string.
2. Extract the invoice, receipt, or transaction number into "invoiceNumber" (empty string if not found).
3. Extract the transaction or invoice date into "invoiceDate" in YYYY-MM-DD format (empty string if not found).
4. Extract the total transaction or payable amount as a float/number into "amount" (0 if not found). Do not include currency symbols or commas.
5. Extract the tax, GST, CGST, SGST, VAT, or service tax amount as a float/number into "gst" (0 if not found).
6. Extract the three-letter currency code (e.g. "INR", "USD", "EUR") into "currency" (default: "INR").
7. Classify the expense category into "category" based on the merchant name and content of the receipt. You MUST choose exactly ONE of the following allowed categories:
   - "Travel": For taxi/cab rides, flight tickets, train bookings, fuel/petrol, vehicle rentals, tolls (e.g. Uber, Ola, IRCTC, Indigo, Air India, Indian Oil, HP Petrol, tolls, parking).
   - "Meals & Entertainment": For food delivery, restaurants, coffee shops, fast food (e.g. Swiggy, Zomato, Starbucks, McDonald's, dine-in, cafes).
   - "Internet & Communications": For mobile bills, broadband, phone recharges, sim cards (e.g. Airtel, Jio, Vodafone, Idea, broadband providers).
   - "Office Supplies": For stationery, printing, office furniture, shipping/freight, laptops, IT hardware (e.g. HP Store, Dell, Lenovo, Gujarat Freight Tools, stationery, printer supplies).
   - "Software Licences": For software subscriptions, SaaS tools, IDEs, cloud hosting (e.g. Microsoft, Adobe, JetBrains, IntelliJ, Github, Slack, Zoom, AWS).
   - "Accommodation": For hotel bookings, lodge stays, guest houses (e.g. Taj, Marriott, OYO, FabHotels, Airbnb).
   - "Utilities": For household/office utility bills like electricity, gas, water (e.g. Electricity, Water Bill, Gas Bill).
   - "Others": Any expense that does not fit into the categories above.
8. Determine a confidence score between 0.0 and 1.0 based on how clear and complete the information is in the OCR text.

CRITICAL RULES:
- The category value MUST be one of the 8 allowed values listed above. You must never return any other category.
- If the confidence score is low (less than 0.5), you MUST set "category" to "Others".

Raw OCR Text:
"""
${rawText}
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
            ],
          },
        },
      };

      // Log Gemini request payload and target model
      console.log('[Gemini Service] [Audit Log] Sending request to Gemini 2.5 Flash API...');
      console.log(`[Gemini Service] [Audit Log] Request URL: ${url}`);
      console.log(
        '[Gemini Service] [Audit Log] Request Payload:',
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Log Gemini response status
      console.log(`[Gemini Service] [Audit Log] Gemini API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();

      // Log raw Gemini API response JSON
      console.log(
        '[Gemini Service] [Audit Log] Gemini API raw response data:',
        JSON.stringify(responseData, null, 2)
      );

      const textResponse = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) {
        throw new Error('Empty response from Gemini API');
      }

      const parsedJson = JSON.parse(textResponse.trim());

      // Log parsed JSON
      console.log('[Gemini Service] [Audit Log] Parsed JSON successfully:', parsedJson);

      return parsedJson;
    } catch (error) {
      console.error('[Gemini Service] [Audit Log] Error calling Gemini API:', error.message);
      return this.getDefaultStructure();
    }
  }

  /**
   * Return a default empty structured payload on error or missing API key
   */
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
    };
  }
}

export const geminiService = new GeminiService();
