const KNOWN_MERCHANTS = [
  'Airtel',
  'Jio',
  'Vodafone',
  'Idea',
  'BSNL',
  'Uber',
  'Ola',
  'Lyft',
  'Grab',
  'Swiggy',
  'Zomato',
  'Foodpanda',
  'Amazon',
  'Flipkart',
  'Myntra',
  'Ajio',
  'Decathlon',
  'Starbucks',
  'McDonald',
  'KFC',
  'Google',
  'Microsoft',
  'AWS',
  'GitHub',
  'Slack',
  'Zoom',
  'MakeMyTrip',
  'Goibibo',
  'Yatra',
  'IRCTC',
  'IndiGo',
  'Air India',
  'Uber Eats',
  'Dominos',
  'Pizza Hut',
];

export class LocalParserService {
  /**
   * Parse key fields from raw OCR text using regular expressions.
   * @param {string} rawText
   * @returns {object} Extracted fields
   */
  parse(rawText) {
    if (!rawText) {
      return {
        merchantName: '',
        invoiceNumber: '',
        invoiceDate: '',
        amount: 0,
        gst: 0,
        currency: 'INR',
        gstin: '',
        pan: '',
      };
    }

    return {
      merchantName: this.extractMerchantName(rawText),
      invoiceNumber: this.extractInvoiceNumber(rawText),
      invoiceDate: this.extractInvoiceDate(rawText),
      amount: this.extractAmount(rawText),
      gst: this.extractGST(rawText),
      currency: this.extractCurrency(rawText),
      gstin: this.extractGSTIN(rawText),
      pan: this.extractPAN(rawText),
    };
  }

  extractMerchantName(rawText) {
    const lowerText = rawText.toLowerCase();
    for (const merchant of KNOWN_MERCHANTS) {
      if (lowerText.includes(merchant.toLowerCase())) {
        const regex = new RegExp(`\\b${merchant}\\b`, 'i');
        const match = rawText.match(regex);
        return match ? match[0] : merchant;
      }
    }

    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const excludePatterns = [
      /invoice/i,
      /bill/i,
      /receipt/i,
      /tax/i,
      /date/i,
      /gstin/i,
      /pan/i,
      /phone/i,
      /tel/i,
      /mobile/i,
      /email/i,
      /address/i,
      /www\./i,
      /http/i,
      /customer/i,
      /client/i,
      /buyer/i,
      /seller/i,
      /welcome/i,
      /original/i,
      /duplicate/i,
      /triplicate/i,
      /challan/i,
      /payment/i,
      /order/i,
      /store/i,
      /cash/i,
      /card/i,
      /page/i,
      /no:/i,
      /#:/i,
      /no\./i,
      /^[0-9\W]+$/,
    ];

    for (let i = 0; i < Math.min(lines.length, 6); i++) {
      const line = lines[i];
      if (line.length < 3 || line.length > 80) continue;
      const matchesExclude = excludePatterns.some((pattern) => pattern.test(line));
      if (!matchesExclude) {
        return line;
      }
    }

    return lines[0] || '';
  }

  extractInvoiceNumber(rawText) {
    const invNumPatterns = [
      /(?:invoice|bill|receipt|txn|transaction|order|doc|document)\s*(?:no|number|id|#)[:.\s-]*([A-Z0-9\-\/]+)/i,
      /(?:invoice|bill|receipt|txn|transaction|order|doc|document)[:.\s-]*([A-Z0-9\-\/]+)/i,
      /inv[-_]?no[:.\s-]*([A-Z0-9\-\/]+)/i,
      /invoice\s*#:?\s*([A-Z0-9\-\/]+)/i,
      /bill\s*#:?\s*([A-Z0-9\-\/]+)/i,
    ];

    for (const pattern of invNumPatterns) {
      const match = rawText.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        const val = match[1].trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && !/^\d+$/.test(val) && val.length < 30) {
          return val;
        }
      }
    }

    const lines = rawText.split('\n');
    for (const line of lines) {
      if (/invoice|bill|receipt/i.test(line)) {
        const tokens = line.split(/\s+/);
        for (const token of tokens) {
          if (/[A-Z]+[-/]\d+/.test(token) || /\d+[-/][A-Z\d]+/.test(token)) {
            return token.replace(/[^A-Z0-9\-\/]/gi, '');
          }
        }
      }
    }

    return '';
  }

  extractInvoiceDate(rawText) {
    const dateLabelRegex =
      /(?:invoice\s*date|date\s*of\s*issue|txn\s*date|transaction\s*date|billing\s*date|date|dated)[:\s-]*([^\n]+)/i;
    const labelMatch = rawText.match(dateLabelRegex);
    if (labelMatch && labelMatch[1]) {
      const candidate = labelMatch[1].trim();
      const parsedDate = this.parseAndNormalizeDate(candidate);
      if (parsedDate) return parsedDate;
    }

    return this.parseAndNormalizeDate(rawText) || '';
  }

  parseAndNormalizeDate(text) {
    if (!text) return null;

    // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
    const ymdRegex = /\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/;
    let match = text.match(ymdRegex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = String(parseInt(match[2], 10)).padStart(2, '0');
      const day = String(parseInt(match[3], 10)).padStart(2, '0');
      if (this.isValidDate(year, month, day)) {
        return `${year}-${month}-${day}`;
      }
    }

    // Pattern 2: DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
    const dmyRegex = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/;
    match = text.match(dmyRegex);
    if (match) {
      const day = String(parseInt(match[1], 10)).padStart(2, '0');
      const month = String(parseInt(match[2], 10)).padStart(2, '0');
      const year = parseInt(match[3], 10);
      if (this.isValidDate(year, month, day)) {
        return `${year}-${month}-${day}`;
      }
    }

    // Pattern 3: DD-MM-YY or DD/MM/YY
    const dmyShortRegex = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})\b/;
    match = text.match(dmyShortRegex);
    if (match) {
      const day = String(parseInt(match[1], 10)).padStart(2, '0');
      const month = String(parseInt(match[2], 10)).padStart(2, '0');
      let year = parseInt(match[3], 10);
      year = year + 2000;
      if (this.isValidDate(year, month, day)) {
        return `${year}-${month}-${day}`;
      }
    }

    // Pattern 4: DD Month YYYY or Month DD, YYYY
    const monthNames =
      'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
    const monthMap = {
      jan: '01',
      january: '01',
      feb: '02',
      february: '02',
      mar: '03',
      march: '03',
      apr: '04',
      april: '04',
      may: '05',
      jun: '06',
      june: '06',
      jul: '07',
      july: '07',
      aug: '08',
      august: '08',
      sep: '09',
      september: '09',
      oct: '10',
      october: '10',
      nov: '11',
      november: '11',
      dec: '12',
      december: '12',
    };

    const textMonthRegex1 = new RegExp(
      `\\b(\\d{1,2})\\s+(${monthNames})\\s+(\\d{4})\\b`,
      'i'
    );
    match = text.match(textMonthRegex1);
    if (match) {
      const day = String(parseInt(match[1], 10)).padStart(2, '0');
      const monthStr = match[2].toLowerCase();
      const month = monthMap[monthStr] || monthStr.substring(0, 3);
      const year = parseInt(match[3], 10);
      if (this.isValidDate(year, month, day)) {
        return `${year}-${month}-${day}`;
      }
    }

    const textMonthRegex2 = new RegExp(
      `\\b(${monthNames})\\s+(\\d{1,2})\\,?\\s+(\\d{4})\\b`,
      'i'
    );
    match = text.match(textMonthRegex2);
    if (match) {
      const monthStr = match[1].toLowerCase();
      const month = monthMap[monthStr] || monthStr.substring(0, 3);
      const day = String(parseInt(match[2], 10)).padStart(2, '0');
      const year = parseInt(match[3], 10);
      if (this.isValidDate(year, month, day)) {
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  }

  isValidDate(y, m, d) {
    const year = parseInt(y, 10);
    const month = parseInt(m, 10) - 1;
    const day = parseInt(d, 10);
    const date = new Date(year, month, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  }

  extractAmount(rawText) {
    const totalKeywords =
      /(?:total|grand\s*total|net\s*payable|amount\s*due|amount\s*paid|total\s*payable|total\s*amount|gross\s*amount|total\s*due|net\s*amount|payable)/i;
    const numberRegex =
      /(?:₹|Rs\.?|\$|€|£)?\s*(\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b\d+(?:\.\d{2})?\b)(?!\s*%)/g;

    const lines = rawText.split('\n');
    let candidates = [];

    for (const line of lines) {
      if (totalKeywords.test(line)) {
        let match;
        numberRegex.lastIndex = 0;
        while ((match = numberRegex.exec(line)) !== null) {
          const numStr = match[1].replace(/,/g, '');
          const val = parseFloat(numStr);
          if (!isNaN(val) && val > 0) {
            let score = 1;
            if (/grand\s*total/i.test(line)) score += 3;
            if (/total\s*amount/i.test(line)) score += 2;
            if (/net/i.test(line)) score += 1;
            if (/cgst|sgst|igst|tax|gst|vat|discount/i.test(line)) score -= 1;

            candidates.push({ val, score, line });
          }
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) =>
        b.score !== a.score ? b.score - a.score : b.val - a.val
      );
      return candidates[0].val;
    }

    let allNumbers = [];
    const matches =
      rawText.match(
        /(?:₹|Rs\.?|\$|€|£)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)(?!\s*%)/gi
      ) || [];
    for (const m of matches) {
      const cleanNum = m.replace(/[^0-9.]/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0 && val < 1000000) {
        allNumbers.push(val);
      }
    }

    if (allNumbers.length > 0) {
      return Math.max(...allNumbers);
    }

    const decimalRegex = /\b\d+(?:\.\d{2})\b/g;
    let match;
    let fallbackNumbers = [];
    while ((match = decimalRegex.exec(rawText)) !== null) {
      const val = parseFloat(match[0]);
      if (!isNaN(val) && val > 0 && val < 1000000) {
        fallbackNumbers.push(val);
      }
    }

    if (fallbackNumbers.length > 0) {
      return Math.max(...fallbackNumbers);
    }

    return 0;
  }

  extractGST(rawText) {
    const gstKeywords =
      /(?:gst|cgst|sgst|igst|tax|vat|service\s*tax|total\s*tax)/i;
    const numberRegex =
      /(?:₹|Rs\.?|\$|€|£)?\s*(\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b\d+(?:\.\d{2})?\b)(?!\s*%)/g;

    const lines = rawText.split('\n');

    for (const line of lines) {
      if (/(?:total\s*tax|total\s*gst|tax\s*amount)/i.test(line)) {
        numberRegex.lastIndex = 0;
        const match = numberRegex.exec(line);
        if (match) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(val) && val > 0) {
            return val;
          }
        }
      }
    }

    let taxComponents = { cgst: 0, sgst: 0, igst: 0, gst: 0, tax: 0 };

    for (const line of lines) {
      if (gstKeywords.test(line)) {
        numberRegex.lastIndex = 0;
        const match = numberRegex.exec(line);
        if (match) {
          const val = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(val) && val > 0) {
            if (/cgst/i.test(line)) taxComponents.cgst = val;
            else if (/sgst/i.test(line)) taxComponents.sgst = val;
            else if (/igst/i.test(line)) taxComponents.igst = val;
            else if (/gst/i.test(line)) taxComponents.gst = val;
            else if (/tax|vat/i.test(line)) taxComponents.tax = val;
          }
        }
      }
    }

    if (taxComponents.cgst > 0 || taxComponents.sgst > 0) {
      return taxComponents.cgst + taxComponents.sgst;
    }
    if (taxComponents.igst > 0) return taxComponents.igst;
    if (taxComponents.gst > 0) return taxComponents.gst;
    if (taxComponents.tax > 0) return taxComponents.tax;

    return 0;
  }

  extractCurrency(rawText) {
    const text = rawText.toUpperCase();
    if (text.includes('₹') || text.includes('INR') || /\bRS\.?\b/.test(text)) {
      return 'INR';
    }
    if (text.includes('$') || text.includes('USD') || text.includes('DOLLAR')) {
      return 'USD';
    }
    if (text.includes('€') || text.includes('EUR') || text.includes('EURO')) {
      return 'EUR';
    }
    if (text.includes('£') || text.includes('GBP') || text.includes('POUND')) {
      return 'GBP';
    }
    return 'INR';
  }

  extractGSTIN(rawText) {
    const gstinRegex =
      /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}\b/gi;
    const match = rawText.match(gstinRegex);
    return match ? match[0].toUpperCase() : '';
  }

  extractPAN(rawText) {
    const panRegex = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi;
    const gstinRegex =
      /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}\b/gi;

    // Find all GSTIN intervals
    const gstinIntervals = [];
    let gstinMatch;
    // Reset regex state
    gstinRegex.lastIndex = 0;
    while ((gstinMatch = gstinRegex.exec(rawText)) !== null) {
      gstinIntervals.push({
        start: gstinMatch.index,
        end: gstinRegex.lastIndex,
      });
    }

    // Find first PAN that is not inside any GSTIN interval
    let panMatch;
    panRegex.lastIndex = 0;
    while ((panMatch = panRegex.exec(rawText)) !== null) {
      const start = panMatch.index;
      const isInsideGstin = gstinIntervals.some(
        (interval) => start >= interval.start && start < interval.end
      );
      if (!isInsideGstin) {
        return panMatch[0].toUpperCase();
      }
    }

    // Fallback: If no standalone PAN is found, extract from GSTIN
    const gstin = this.extractGSTIN(rawText);
    if (gstin && gstin.length === 15) {
      return gstin.substring(2, 12);
    }

    return '';
  }

  /**
   * Mask sensitive fields from text content.
   * @param {string} text
   * @returns {string} Masked text
   */
  maskSensitiveFields(text) {
    if (!text) return '';
    let masked = text;

    // 1. GSTIN (15 chars)
    const gstinRegex =
      /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}\b/gi;
    masked = masked.replace(gstinRegex, '[MASKED_GSTIN]');

    // 2. PAN (10 chars)
    const panRegex = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi;
    masked = masked.replace(panRegex, '[MASKED_PAN]');

    // 3. Email IDs
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    masked = masked.replace(emailRegex, '[MASKED_EMAIL]');

    // 4. UPI IDs
    const upiRegex =
      /\b[a-zA-Z0-9.\-_]+@(apb|ybl|upi|okaxis|okhdfcbank|okicici|oksbi|paytm|barodampay|ibhdfc|payloop)\b/gi;
    masked = masked.replace(upiRegex, '[MASKED_UPI]');

    // 5. Phone Numbers (Indian and standard formats)
    const phoneRegex =
      /(?:\+?91[\-\s]?)?\b[6-9]\d{9}\b|\b\d{3}[\-\s]?\d{3}[\-\s]?\d{4}\b/g;
    masked = masked.replace(phoneRegex, '[MASKED_PHONE]');

    // 6. Credit/Debit Card Numbers
    const cardRegex = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g;
    masked = masked.replace(cardRegex, '[MASKED_CARD]');

    // 7. Bank Account Numbers
    const accountRegex =
      /\b(?:A\/C|A[cC][cC]?[oO]?[uU]?[nN]?[tT]?)\s*(?:[nN][oO]|[nN]?[uU]?[mM]?[bB]?[eE]?[rR]?)?[:\-\s]*\d{9,18}\b/gi;
    masked = masked.replace(accountRegex, (match) => {
      return match.replace(/\d+/g, '[MASKED_ACCOUNT]');
    });

    // 8. IFSC
    const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi;
    masked = masked.replace(ifscRegex, '[MASKED_IFSC]');

    // 9. Employee IDs
    const empIdRegex =
      /\bEMP(?:LOYEE)?[-_\s]?ID\s*[:\-]?\s*[A-Z0-9_-]+\b|\bEMP\d{4,6}\b/gi;
    masked = masked.replace(empIdRegex, '[MASKED_EMPLOYEE_ID]');

    return masked;
  }
}

export const localParserService = new LocalParserService();
