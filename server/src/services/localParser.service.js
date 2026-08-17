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
   * Parse key fields and compute field-level confidence scores.
   * @param {string} rawText
   * @returns {object} { values, confidences }
   */
  parse(rawText) {
    if (!rawText) {
      return {
        values: {
          merchantName: '',
          invoiceNumber: '',
          invoiceDate: '',
          amount: 0,
          gst: 0,
          currency: 'INR',
          gstin: '',
          pan: '',
          category: 'Others',
          subtotal: 0,
          discount: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          // Category-specific fields
          litres: 0,
          rate: 0,
          pnr: '',
          checkInDate: '',
          checkOutDate: '',
          accountNumber: '',
          billingPeriod: '',
        },
        confidences: {
          merchantName: 0.0,
          invoiceNumber: 0.0,
          invoiceDate: 0.0,
          amount: 0.0,
          gst: 0.0,
          currency: 0.0,
          gstin: 0.0,
          pan: 0.0,
          category: 0.0,
          discount: 0.0,
        }
      };
    }

    const cleanText = rawText.trim();
    const gstin = this.extractGSTIN(cleanText);
    const pan = this.extractPAN(cleanText);
    const currency = this.extractCurrency(cleanText);

    // Extract Merchant
    const merchantRes = this.extractMerchantNameWithConfidence(cleanText);
    
    // Extract Invoice Number
    const invNumRes = this.extractInvoiceNumberWithConfidence(cleanText);
    
    // Extract Date
    const dateRes = this.extractInvoiceDateWithConfidence(cleanText);
    
    // Determine category locally first based on keywords
    const categoryRes = this.classifyCategoryLocally(merchantRes.value, cleanText);
    const category = categoryRes.value;

    // Extract Tax Components & Subtotal
    const taxRes = this.extractTaxAndSubtotalWithConfidence(cleanText);
    
    // Extract Discount
    const discountRes = this.extractDiscountWithConfidence(cleanText);
    
    // Extract Amount
    const amountRes = this.extractAmountWithConfidence(cleanText, taxRes.amountCandidates);

    // Category-specific extraction engine
    let litres = 0;
    let rate = 0;
    let pnr = '';
    let checkInDate = '';
    let checkOutDate = '';
    let accountNumber = '';
    let billingPeriod = '';

    let amountConfidence = amountRes.confidence;
    let gstConfidence = taxRes.confidence;
    let subtotalConfidence = taxRes.subtotal > 0 ? 0.85 : 0.0;
    let discountConfidence = discountRes.confidence;

    if (category === 'Meals') {
      // Food & Meals rules: Ensure we capture taxes and discount accurately
      console.log('[Local Parser] Running Food & Meals rules...');
    } else if (category === 'Travel' || category === 'Accommodation') {
      console.log('[Local Parser] Running Travel & Lodging rules...');
      // Extract PNR
      const pnrMatch = cleanText.match(/\b(?:pnr|booking\s*(?:reference|ref)|pnr\s*no)[:\s-]*([A-Z0-9]{6})\b/i);
      if (pnrMatch) pnr = pnrMatch[1].toUpperCase();

      // Extract Lodging stay dates
      const checkInMatch = cleanText.match(/(?:check[-_ ]*in|arrival)[:\s-]*([^\n]+)/i);
      const checkOutMatch = cleanText.match(/(?:check[-_ ]*out|departure)[:\s-]*([^\n]+)/i);
      if (checkInMatch) checkInDate = this.parseAndNormalizeDate(checkInMatch[1]);
      if (checkOutMatch) checkOutDate = this.parseAndNormalizeDate(checkOutMatch[1]);
    } else if (category === 'Utilities' && /(?:petrol|diesel|fuel|litre|ltr|pump)/i.test(cleanText)) {
      // Refined Category: Fuel
      console.log('[Local Parser] Running Fuel rules...');
      
      // Extract Litres
      const litresMatch = cleanText.match(/\b(\d+(?:\.\d{1,3})?)\s*(?:litres?|ltrs?|ltr|volume|qty)\b/i) || 
                          cleanText.match(/(?:volume|litres?|qty)[^0-9]*?(\d+(?:\.\d{1,3})?)/i);
      if (litresMatch) litres = parseFloat(litresMatch[1]);

      // Extract Rate per litre
      const rateMatch = cleanText.match(/(?:rate|price\/ltr|price|@)[^0-9]*?(\d+(?:\.\d{2})?)/i) ||
                        cleanText.match(/@\s*(\d+(?:\.\d{2})?)/i);
      if (rateMatch) rate = parseFloat(rateMatch[1]);
      
      // Validate fuel calculations: Litres * Rate ≈ Amount
      if (litres > 0 && rate > 0) {
        const calculatedAmount = litres * rate;
        const diff = Math.abs(calculatedAmount - amountRes.value);
        if (diff < 5.0) {
          console.log(`[Local Parser] Fuel validation passed! ${litres} Ltrs @ ₹${rate} = ₹${calculatedAmount.toFixed(2)} (Diff: ${diff.toFixed(2)})`);
          amountConfidence = 0.95;
        } else if (amountRes.value === 0 || amountRes.confidence < 0.7) {
          // Fallback to calculated amount
          console.log(`[Local Parser] Overwriting amount with validated fuel product sum: ₹${calculatedAmount.toFixed(2)}`);
          amountRes.value = calculatedAmount;
          amountConfidence = 0.90;
        } else {
          console.warn(`[Local Parser] Fuel mathematical validation failed! Calculated: ${calculatedAmount.toFixed(2)}, Extracted: ${amountRes.value}`);
          amountConfidence = 0.0;
        }
      }
    } else if (category === 'Internet & Communications') {
      console.log('[Local Parser] Running Telecom / Internet rules...');
      // Extract Account Number
      const accMatch = cleanText.match(/(?:account\s*no|subscriber\s*(?:no|number)|tel\s*no|mobile\s*no|phone\s*no)[:\s-]*(\d{8,12})/i);
      if (accMatch) accountNumber = accMatch[1];

      // Extract Billing Period
      const periodMatch = cleanText.match(/(?:bill|billing)\s*period[:\s-]*([^\n]+)/i);
      if (periodMatch) billingPeriod = periodMatch[1].trim();
    }

    // Validate calculations mathematically
    const finalAmount = amountRes.value;
    const finalSubtotal = taxRes.subtotal;
    const finalGst = taxRes.gst;
    const finalDiscount = discountRes.value;
    const finalCgst = taxRes.cgst;
    const finalSgst = taxRes.sgst;
    const finalIgst = taxRes.igst;

    let isMathInconsistent = false;

    // Rule 1: GST cannot be greater than amount
    if (finalAmount > 0 && finalGst > finalAmount) {
      console.warn(`[Local Parser] Mathematical validation failed: GST (${finalGst}) is greater than Amount (${finalAmount})`);
      isMathInconsistent = true;
    }

    // Rule 2: CGST and SGST must be equal (allow small rounding diff <= 1.0)
    if (finalCgst > 0 && finalSgst > 0 && Math.abs(finalCgst - finalSgst) > 1.0) {
      console.warn(`[Local Parser] Mathematical validation failed: CGST (${finalCgst}) does not match SGST (${finalSgst})`);
      isMathInconsistent = true;
    }

    // Rule 3: Cannot have both IGST and CGST/SGST
    if (finalIgst > 0 && (finalCgst > 0 || finalSgst > 0)) {
      console.warn(`[Local Parser] Mathematical validation failed: Cannot have both IGST (${finalIgst}) and CGST/SGST (${finalCgst}/${finalSgst})`);
      isMathInconsistent = true;
    }

    // Rule 4: Subtotal consistency check
    if (category !== 'Utilities' && finalSubtotal > 0 && finalAmount > 0) {
      const calculatedTotal = finalSubtotal + finalGst - finalDiscount;
      const difference = Math.abs(calculatedTotal - finalAmount);
      
      // If difference is greater than 1.0, it's inconsistent!
      if (difference > 1.0) {
        console.warn(`[Local Parser] Mathematical validation failed! Subtotal (${finalSubtotal}) + GST (${finalGst}) - Discount (${finalDiscount}) = ${calculatedTotal}, but Grand Total is ${finalAmount}. Diff: ${difference}`);
        isMathInconsistent = true;
      }
    }

    if (isMathInconsistent) {
      // Reprocess/mark fields as low confidence (0.0) so Gemini fallback takes over
      amountConfidence = 0.0;
      gstConfidence = 0.0;
      subtotalConfidence = 0.0;
      discountConfidence = 0.0;
    } else if (category !== 'Utilities' && finalSubtotal > 0 && finalAmount > 0) {
      console.log(`[Local Parser] Mathematical validation passed! Subtotal (${finalSubtotal}) + GST (${finalGst}) - Discount (${finalDiscount}) matches Grand Total (${finalAmount}).`);
    }

    return {
      values: {
        merchantName: merchantRes.value,
        invoiceNumber: invNumRes.value,
        invoiceDate: dateRes.value,
        amount: finalAmount,
        gst: finalGst,
        currency,
        gstin,
        pan,
        category,
        subtotal: finalSubtotal,
        discount: finalDiscount,
        cgst: taxRes.cgst,
        sgst: taxRes.sgst,
        igst: taxRes.igst,
        // Category-specific fields
        litres,
        rate,
        pnr,
        checkInDate,
        checkOutDate,
        accountNumber,
        billingPeriod,
      },
      confidences: {
        merchantName: merchantRes.confidence,
        invoiceNumber: invNumRes.confidence,
        invoiceDate: dateRes.confidence,
        amount: amountConfidence,
        gst: gstConfidence,
        currency: 0.9,
        gstin: gstin ? 0.95 : 0.0,
        pan: pan ? 0.95 : 0.0,
        category: categoryRes.confidence,
        discount: discountConfidence,
      }
    };
  }

  extractMerchantNameWithConfidence(rawText) {
    const lowerText = rawText.toLowerCase();
    for (const merchant of KNOWN_MERCHANTS) {
      if (lowerText.includes(merchant.toLowerCase())) {
        const regex = new RegExp(`\\b${merchant}\\b`, 'i');
        const match = rawText.match(regex);
        return {
          value: match ? match[0] : merchant,
          confidence: 0.95
        };
      }
    }

    // Fallback: look at top non-empty lines
    const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const genericPatterns = [
      /^(?:tax\s+)?invoice$/i, /^(?:cash\s+)?bill$/i, /^receipt$/i, /^original$/i, /^duplicate$/i,
      /^triplicate/i, /^challan$/i, /^payment$/i, /^order$/i, /^store$/i, /^cash$/i,
      /^card$/i, /^page$/i, /^[0-9\W]+$/, /^check[-_ ]*in/i, /^check[-_ ]*out/i, /^arrival/i, /^departure/i
    ];
    const generalExcludePatterns = [
      /gstin/i, /pan/i, /phone/i, /\btel\b/i, /mobile/i, /email/i, /address/i, /www\./i, /http/i, /customer/i,
      /client/i, /buyer/i, /seller/i, /welcome/i, /no:/i, /#:/i, /no\./i, /total/i, /amount/i, /subtotal/i
    ];

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (line.length < 3 || line.length > 80) continue;
      
      const matchesGeneric = genericPatterns.some((pattern) => pattern.test(line));
      const matchesExclude = generalExcludePatterns.some((pattern) => pattern.test(line));
      
      if (!matchesGeneric && !matchesExclude) {
        const cleanedVal = line.replace(/(?:\s+stay)?\s+(?:receipt|invoice|bill|challan|slip|payment)$/i, '').trim();
        return {
          value: cleanedVal,
          confidence: 0.70
        };
      }
    }

    return {
      value: lines[0] || '',
      confidence: 0.30
    };
  }

  extractInvoiceNumberWithConfidence(rawText) {
    const invNumPatterns = [
      /(?:invoice|bill|receipt|txn|transaction|order|doc|document)\s*(?:no|number|id|#)[:.\s-]*([A-Z0-9\-\/]{3,20})/i,
      /(?:invoice|bill|receipt|txn|transaction|order|doc|document)[:.\s-]*([A-Z0-9\-\/]{3,20})/i,
      /inv[-_]?no[:.\s-]*([A-Z0-9\-\/]{3,20})/i,
      /invoice\s*#:?\s*([A-Z0-9\-\/]{3,20})/i,
      /bill\s*#:?\s*([A-Z0-9\-\/]{3,20})/i,
    ];

    for (const pattern of invNumPatterns) {
      const match = rawText.match(pattern);
      if (match && match[1]) {
        const val = match[1].trim();
        // Validation: Must not look like a date or a single long number
        if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && !/^\d{8}$/.test(val) && val.length < 30) {
          return { value: val, confidence: 0.85 };
        }
      }
    }

    // Check lines for pattern codes
    const lines = rawText.split('\n');
    for (const line of lines) {
      if (/invoice|bill|receipt/i.test(line)) {
        const tokens = line.split(/\s+/);
        for (const token of tokens) {
          if (/[A-Z]+[-/]\d+/.test(token) || /\d+[-/][A-Z\d]+/.test(token)) {
            const cleanToken = token.replace(/[^A-Z0-9\-\/]/gi, '');
            if (cleanToken.length >= 3 && cleanToken.length < 20) {
              return { value: cleanToken, confidence: 0.80 };
            }
          }
        }
      }
    }

    return { value: '', confidence: 0.0 };
  }

  extractInvoiceDateWithConfidence(rawText) {
    const dateLabelRegex =
      /(?:invoice\s*date|date\s*of\s*issue|txn\s*date|transaction\s*date|billing\s*date|date|dated)[:\s-]*([^\n]+)/i;
    
    const labelMatch = rawText.match(dateLabelRegex);
    if (labelMatch && labelMatch[1]) {
      const candidate = labelMatch[1].trim();
      const parsedDate = this.parseAndNormalizeDate(candidate);
      if (parsedDate) {
        return { value: parsedDate, confidence: 0.90 };
      }
    }

    // Scan the entire text for date blocks
    const parsedDate = this.parseAndNormalizeDate(rawText);
    if (parsedDate) {
      return { value: parsedDate, confidence: 0.60 };
    }

    return { value: '', confidence: 0.0 };
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
      jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
      apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07',
      aug: '08', august: '08', sep: '09', september: '09', oct: '10', october: '10',
      nov: '11', november: '11', dec: '12', december: '12'
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
    
    // Validate bounds
    if (year < 2000 || year > new Date().getFullYear() + 1) return false;
    
    const date = new Date(year, month, day);
    const isVal = (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );

    if (!isVal) return false;
    
    // Ensure not in future (> 24 hours from now)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() > tomorrow.getTime()) return false;

    return true;
  }

  cleanLineNumbers(line) {
    if (!line) return '';
    let cleaned = line;
    // 1. Convert comma decimals (e.g., 149,51 -> 149.51)
    cleaned = cleaned.replace(/,(\d{2})\b/g, '.$1');
    
    // 2. Merge digits separated by a single space (e.g. 6 280.00 -> 6280.00)
    cleaned = cleaned.replace(/\b(\d+)\s+(\d{3}(?:\.\d{2})?)\b/g, '$1$2');
    
    // 3. Fix space after decimal point (e.g. 6645. 00 -> 6645.00)
    cleaned = cleaned.replace(/\.(\s+)(\d{2})\b/g, '.$2');
    
    return cleaned;
  }

  extractLastNumber(line) {
    const cleanedLine = this.cleanLineNumbers(line);
    const numberRegex = /(?:₹|Rs\.?|\$|€|£)?\s*(\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b|\b\d+(?:\.\d{2})?\b)(?!\s*%)/g;
    let match;
    let lastVal = null;
    while ((match = numberRegex.exec(cleanedLine)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(val)) {
        lastVal = val;
      }
    }
    return lastVal;
  }

  extractTaxAndSubtotalWithConfidence(rawText) {
    const gstKeywords = /(?:gst|cgst|sgst|igst|tax|vat|service\s*tax)/i;

    const lines = rawText.split('\n');
    let taxComponents = { cgst: 0, sgst: 0, igst: 0, gst: 0, tax: 0, subtotal: 0 };
    let hasTaxLabels = { cgst: false, sgst: false, igst: false, gst: false, tax: false };

    for (const line of lines) {
      // Look for subtotal
      if (/(?:subtotal|sub\s*total|taxable\s*value|net\s*amount)/i.test(line)) {
        const val = this.extractLastNumber(line);
        if (val !== null && val > 0) {
          taxComponents.subtotal = val;
        }
      }

      // Look for specific tax lines
      if (gstKeywords.test(line)) {
        // Exclude lines containing gstin, invoice number, phone, dates, or subtotal/taxable keywords to avoid extracting unrelated amounts
        if (/(?:gstin|gst\s*(?:no|number|reg|id)|pan|phone|mobile|tel|email|address|website|date|dated|time|invoice|bill|receipt|txn|transaction|challan|taxable)/i.test(line)) {
          continue;
        }

        let val = this.extractLastNumber(line);
        // Handle nil/zero tax words
        if (val === null && /(?:nil|zero|exempt|exempted)/i.test(line)) {
          val = 0;
        }

        if (val !== null && val >= 0) {
          if (/cgst/i.test(line)) {
            taxComponents.cgst = val;
            hasTaxLabels.cgst = true;
          } else if (/sgst/i.test(line)) {
            taxComponents.sgst = val;
            hasTaxLabels.sgst = true;
          } else if (/igst/i.test(line)) {
            taxComponents.igst = val;
            hasTaxLabels.igst = true;
          } else if (/gst/i.test(line)) {
            taxComponents.gst = val;
            hasTaxLabels.gst = true;
          } else if (/tax|vat/i.test(line)) {
            taxComponents.tax = val;
            hasTaxLabels.tax = true;
          }
        }
      }
    }

    let gstSum = 0;
    let confidence = 0.0;

    if (hasTaxLabels.cgst || hasTaxLabels.sgst) {
      gstSum = (taxComponents.cgst || 0) + (taxComponents.sgst || 0);
      confidence = 0.85;
    } else if (hasTaxLabels.igst) {
      gstSum = taxComponents.igst;
      confidence = 0.85;
    } else if (hasTaxLabels.gst) {
      gstSum = taxComponents.gst;
      confidence = 0.80;
    } else if (hasTaxLabels.tax) {
      gstSum = taxComponents.tax;
      confidence = 0.70;
    }

    return {
      gst: gstSum,
      subtotal: taxComponents.subtotal,
      cgst: taxComponents.cgst,
      sgst: taxComponents.sgst,
      igst: taxComponents.igst,
      confidence,
      // Provide numeric values to help identify the Grand Total
      amountCandidates: [taxComponents.subtotal, gstSum].filter(v => v > 0)
    };
  }

  extractAmountWithConfidence(rawText, existingTaxes = []) {
    const totalKeywords = /(?:total|grand\s*total|net\s*payable|amount\s*due|amount\s*paid|total\s*payable|total\s*amount|gross\s*amount|payable)/i;

    const lines = rawText.split('\n');
    let candidates = [];

    for (const line of lines) {
      if (totalKeywords.test(line)) {
        const val = this.extractLastNumber(line);
        if (val !== null && val > 0) {
          let score = 1;
          const lowerLine = line.toLowerCase();
          
          if (lowerLine.includes('grand total')) score += 5;
          else if (lowerLine.includes('net payable') || lowerLine.includes('total payable')) score += 4;
          else if (lowerLine.includes('total amount') || lowerLine.includes('amount paid') || lowerLine.includes('amount due')) score += 3;
          else if (/\btotal\b/i.test(line)) score += 2;
          
          // Penalties for subtotal or tax/discount/metadata keywords to prevent picking up wrong values
          if (/(?:subtotal|sub\s*total|taxable)/i.test(line)) {
            score -= 5;
          }
          if (/(?:cgst|sgst|igst|tax|gst|vat|discount)/i.test(line)) {
            score -= 3;
          }

          candidates.push({ val, score, line });
        }
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score || b.val - a.val);
      // Ensure total amount is larger than subtotal/tax values if present
      const maxTaxVal = existingTaxes.length > 0 ? Math.max(...existingTaxes) : 0;
      for (const cand of candidates) {
        if (cand.val > maxTaxVal) {
          return { value: cand.val, confidence: cand.score >= 4 ? 0.92 : 0.82 };
        }
      }
      return { value: candidates[0].val, confidence: 0.75 };
    }

    // Fallback: search for maximum numeric value in text
    let allNumbers = [];
    const matches = rawText.match(/(?:₹|Rs\.?|\$|€|£)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)(?!\s*%)/gi) || [];
    for (const m of matches) {
      const cleanNum = m.replace(/[^0-9.]/g, '');
      const val = parseFloat(cleanNum);
      if (!isNaN(val) && val > 0 && val < 500000) {
        allNumbers.push(val);
      }
    }

    if (allNumbers.length > 0) {
      const maxVal = Math.max(...allNumbers);
      return { value: maxVal, confidence: 0.65 };
    }

    return { value: 0, confidence: 0.0 };
  }

  classifyCategoryLocally(merchant, rawText) {
    const text = rawText.toLowerCase();
    const merch = merchant.toLowerCase();

    // Define classification rules
    const rules = {
      'Meals & Entertainment': {
        merchants: [/\bswiggy\b/i, /\bzomato\b/i, /\bstarbucks\b/i, /\bmcdonalds?\b/i, /\bkfc\b/i, /\bdominos\b/i, /\bpizza\s*hut\b/i, /\beats\b/i, /\bcafe\b/i, /\bcafé\b/i, /\brestaurant\b/i, /\bfood\b/i, /\bdining\b/i, /\bsubway\b/i, /\bburger\s*king\b/i],
        items: [/\broti\b/i, /\bpaneer\b/i, /\bchicken\b/i, /\brice\b/i, /\bcurry\b/i, /\bnan\b/i, /\bburger\s*s?\b/i, /\bpizzas?\b/i, /\bcoffee\b/i, /\btea\b/i, /\bbeverages?\b/i, /\bmeals?\b/i, /\bfood\b/i, /\bsandwich(?:es)?\b/i, /\bpepsi\b/i, /\bcoke\b/i, /\bfries\b/i, /\bsalad\s*s?\b/i, /\bdishes\b/i],
        keywords: [/\bwaiters?\b/i, /\btables?\b/i, /\bmenus?\b/i, /\blunch\b/i, /\bdinner\b/i, /\bbreakfast\b/i, /\bordered\b/i],
        negatives: [/\broom\b/i, /\bstay\b/i, /\bcheck-in\b/i, /\bcheck-out\b/i, /\bbooking\.com\b/i, /\bflight\b/i, /\bboarding\b/i, /\bpnr\b/i, /\bairline\b/i]
      },
      'Utilities': {
        merchants: [/\bhpcl\b/i, /\bbpcl\b/i, /\biocl\b/i, /\bshell\b/i, /petrol\s*pump/i, /fuel\s*station/i, /gas\s*station/i],
        items: [/petrol/i, /diesel/i, /\bfuel\b/i, /\blitres?\b/i, /\bltrs?\b/i, /speed\s*diesel/i],
        keywords: [/\bpump\b/i, /fuel\s*station/i, /petrol\s*station/i, /gas\s*station/i],
        negatives: [/\broom\b/i, /\bstay\b/i, /\bhotel\b/i, /\bflight\b/i, /\bboarding\b/i, /\bpnr\b/i]
      },
      'Accommodation': {
        merchants: [/\bhotels?\b/i, /\bstays?\b/i, /\bhostels?\b/i, /\bairbnb\b/i, /\blodges?\b/i, /\bresorts?\b/i, /\blodgings?\b/i, /booking\.com/i, /makemytrip/i, /goibibo/i],
        items: [/\broom(?:s)?\b/i, /\bstay(?:s)?\b/i, /\baccommodation(?:s)?\b/i, /room\s*charges/i, /stay\s*charges/i],
        keywords: [/\bcheck[-_ ]*in\b/i, /\bcheck[-_ ]*out\b/i, /\blodgings?\b/i, /room\s*service/i],
        negatives: [/\bpnr\b/i, /\bboarding\s*pass\b/i, /\bboarding\b/i, /flight/i]
      },
      'Travel': {
        merchants: [/\buber\b/i, /\bola\b/i, /\blyft\b/i, /\bgrab\b/i, /\bindigo\b/i, /air\s*india/i, /\birctc\b/i, /\brailways?\b/i, /\bairlines?\b/i, /\bmetro\b/i],
        items: [/flight/i, /ticket/i, /boarding\s*pass/i, /\btransit\b/i, /\bshuttle\b/i, /\bluggage\b/i, /\bbaggage\b/i, /\brides?\b/i],
        keywords: [/\bpnr\b/i, /\bmetro\b/i, /\btaxi\b/i, /\btrain\b/i, /\bbus\b/i, /\bcabs?\b/i, /\bfares?\b/i, /\btolls?\b/i, /\bboarding\b/i, /\barrival\b/i, /\bdeparture\b/i, /\bpassenger\b/i, /\bbooking\b/i, /\breservation\b/i],
        negatives: [/\broom(?:s)?\b/i, /\bstay(?:s)?\b/i, /\bcheck[-_ ]*in\b/i, /\bcheck[-_ ]*out\b/i]
      },
      'Internet & Communications': {
        merchants: [/\bairtel\b/i, /\bjio\b/i, /\bvodafone\b/i, /\bidea\b/i, /\bbsnl\b/i, /\bzoom\b/i, /\bslack\b/i, /\bskype\b/i],
        items: [/recharge/i, /broadband/i, /wi-fi/i, /wifi/i, /data\s*pack/i, /telecom/i],
        keywords: [/\bphone\b/i, /\bmobile\b/i, /internet/i, /communications/i, /bill\s*period/i, /subscriber/i, /account\s*no/i],
        negatives: [/\croti\b/i, /\bpaneer\b/i, /\bchicken\b/i, /\bpetrol\b/i, /\bdiesel\b/i, /\blitres?\b/i]
      },
      'Office Supplies': {
        merchants: [/\bdecathlon\b/i, /stationery/i, /office\s*depot/i, /staples/i],
        items: [/paper/i, /\bpens?\b/i, /stationery/i, /supplies/i, /envelope/i, /notebook/i, /stapler/i, /printer/i, /equipment/i, /\bink\b/i, /\btoner\b/i, /\bcartridge\b/i, /\bpencils?\b/i, /\bmarkers?\b/i, /\bfolder\b/i, /\bbinder\b/i, /\bcabinet\b/i, /\bdrawer\b/i, /\bfiling\b/i],
        keywords: [/\boffice\b/i, /office\s*supplies/i, /office\s*equipment/i],
        negatives: [/\bpnr\b/i, /boarding\s*pass/i, /flight/i, /airline/i]
      },
      'Software Licences': {
        merchants: [/\bgoogle\b/i, /\bmicrosoft\b/i, /\baws\b/i, /\bgithub\b/i, /\badobe\b/i, /\bsalesforce\b/i, /\bjira\b/i, /\bconfluence\b/i, /\bdatadog\b/i, /\bvercel\b/i],
        items: [/licence/i, /license/i, /software/i, /subscription/i, /saas/i, /cloud\s*hosting/i],
        keywords: [/billing\s*api/i, /hosting/i, /cloud/i, /subscription\s*fee/i],
        negatives: [/\brestaurant\b/i, /\bcafe\b/i, /\bcafé\b/i, /\bhotel\b/i, /\broom\b/i]
      }
    };

    // Calculate scores
    const scores = {};
    const details = {}; // For debug tracing

    for (const [category, rule] of Object.entries(rules)) {
      let score = 0;
      const matches = [];

      // 1. Merchant matches (+15 points)
      for (const pattern of rule.merchants) {
        if (pattern.test(merch)) {
          score += 15;
          matches.push(`merchant:${pattern.source}`);
        }
      }

      // 2. Item matches (+5 points)
      for (const pattern of rule.items) {
        if (pattern.test(text)) {
          score += 5;
          matches.push(`item:${pattern.source}`);
        }
      }

      // 3. Keyword matches (+3 points)
      for (const pattern of rule.keywords) {
        if (pattern.test(text)) {
          score += 3;
          matches.push(`keyword:${pattern.source}`);
        }
      }

      // 4. Negative signal matches (-10 points)
      for (const pattern of rule.negatives) {
        if (pattern.test(text)) {
          score -= 10;
          matches.push(`negative:${pattern.source}`);
        }
      }

      scores[category] = score;
      details[category] = { score, matches };
    }

    // Find the highest score
    let highestCategory = 'Others';
    let highestScore = -Infinity;

    for (const [category, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        highestCategory = category;
      }
    }

    // Confidence threshold validation (>= 10 points)
    const confidenceThreshold = 10;
    if (highestScore >= confidenceThreshold) {
      return { 
        value: highestCategory, 
        confidence: 0.90,
        score: highestScore,
        scores
      };
    }

    // Default when below threshold
    return { 
      value: 'Unknown / Needs Review', 
      confidence: 0.0,
      score: highestScore,
      scores
    };
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
    const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}\b/gi;
    const match = rawText.match(gstinRegex);
    return match ? match[0].toUpperCase() : '';
  }

  extractPAN(rawText) {
    const panRegex = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi;
    const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}\b/gi;

    // Find all GSTIN intervals
    const gstinIntervals = [];
    let gstinMatch;
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

  extractDiscountWithConfidence(rawText) {
    const discountKeywords = /(?:discount|disc|less|rebate|markdown)/i;
    const lines = rawText.split('\n');
    for (const line of lines) {
      if (discountKeywords.test(line)) {
        const val = this.extractLastNumber(line);
        if (val !== null && val > 0) {
          return { value: val, confidence: 0.85 };
        }
      }
    }
    return { value: 0, confidence: 0.0 };
  }

  /**
   * Mask sensitive fields from text content.
   */
  maskSensitiveFields(text) {
    if (!text) return '';
    let masked = text;

    const gstinRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Zz]{1}[A-Z\d]{1}\b/gi;
    masked = masked.replace(gstinRegex, '[MASKED_GSTIN]');

    const panRegex = /\b[A-Z]{5}\d{4}[A-Z]{1}\b/gi;
    masked = masked.replace(panRegex, '[MASKED_PAN]');

    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    masked = masked.replace(emailRegex, '[MASKED_EMAIL]');

    const upiRegex = /\b[a-zA-Z0-9.\-_]+@(apb|ybl|upi|okaxis|okhdfcbank|okicici|oksbi|paytm|barodampay|ibhdfc|payloop)\b/gi;
    masked = masked.replace(upiRegex, '[MASKED_UPI]');

    const phoneRegex = /(?:\+?91[\-\s]?)?\b[6-9]\d{9}\b|\b\d{3}[\-\s]?\d{3}[\-\s]?\d{4}\b/g;
    masked = masked.replace(phoneRegex, '[MASKED_PHONE]');

    const cardRegex = /\b(?:\d{4}[\s-]?){3}\d{4}\b/g;
    masked = masked.replace(cardRegex, '[MASKED_CARD]');

    const accountRegex = /\b(?:A\/C|A[cC][cC]?[oO]?[uU]?[nN]?[tT]?)\s*(?:[nN][oO]|[nN]?[uU]?[mM]?[bB]?[eE]?[rR]?)?[:\-\s]*\d{9,18}\b/gi;
    masked = masked.replace(accountRegex, (match) => {
      return match.replace(/\d+/g, '[MASKED_ACCOUNT]');
    });

    const ifscRegex = /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi;
    masked = masked.replace(ifscRegex, '[MASKED_IFSC]');

    const empIdRegex = /\bEMP(?:LOYEE)?[-_\s]?ID\s*[:\-]?\s*[A-Z0-9_-]+\b|\bEMP\d{4,6}\b/gi;
    masked = masked.replace(empIdRegex, '[MASKED_EMPLOYEE_ID]');

    return masked;
  }
}

export const localParserService = new LocalParserService();
