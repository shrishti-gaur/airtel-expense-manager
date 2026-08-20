import { localParserService } from './localParser.service.js';

// Define the Test Case Ground Truths
const testCases = [
  {
    name: 'Food & Meals (KFC Restaurant)',
    text: `
      Welcome to KFC Restaurant Bill
      Table 4, Waiter: Raj
      Date: 2025-06-12
      Invoice No: KFC-98485
      ----------------------------------------
      Subtotal:       500.00
      Discount:        50.00
      CGST @ 9%:       45.00
      SGST @ 9%:       45.00
      ----------------------------------------
      Grand Total:    540.00
    `,
    expected: {
      merchantName: 'KFC',
      invoiceNumber: 'KFC-98485',
      invoiceDate: '2025-06-12',
      amount: 540,
      gst: 90,
      discount: 50,
      category: 'Meals & Entertainment',
    },
  },
  {
    name: 'Travel & Flights (IndiGo Flight)',
    text: `
      IndiGo Flight Booking Confirmation
      Passenger: Shrishti Gaur
      PNR / Booking Reference: AD934F
      Date of Booking: 2025-03-12
      ----------------------------------------
      Fare Charges:  5000.00
      Taxes/GST:     1280.00
      ----------------------------------------
      Total Amount:  6280.00
    `,
    expected: {
      merchantName: 'IndiGo',
      pnr: 'AD934F',
      amount: 6280,
      gst: 1280,
      category: 'Travel',
    },
  },
  {
    name: 'Hotel & Lodging Stay (Taj Hotel)',
    text: `
      Taj Hotel Stay Receipt
      Check-In: 2025-04-10
      Check-Out: 2025-04-12
      ----------------------------------------
      Room Charges:  3000.00
      GST @ 12%:      360.00
      ----------------------------------------
      Grand Total:   3360.00
    `,
    expected: {
      merchantName: 'Taj Hotel',
      checkInDate: '2025-04-10',
      checkOutDate: '2025-04-12',
      amount: 3360,
      gst: 360,
      category: 'Accommodation',
    },
  },
  {
    name: 'Fuel Refuel (HPCL Fuel pump)',
    text: `
      HPCL Fuel Station Pump #5
      Product: Speed Diesel
      Volume (Litres): 35.5 ltr
      Rate (price/ltr): 104.20
      Date: 2025-05-15
      ----------------------------------------
      Total Payable: 3699.10
    `,
    expected: {
      litres: 35.5,
      rate: 104.2,
      amount: 3699.1,
      category: 'Utilities',
    },
  },
  {
    name: 'Telecom Bill (Airtel Broadband)',
    text: `
      Airtel Broadband Bill
      Subscriber Account No: 9876543210
      Bill Period: 01/01/25 to 31/01/25
      ----------------------------------------
      Charges:        900.00
      GST:            162.00
      ----------------------------------------
      Total Payable: 1062.00
    `,
    expected: {
      merchantName: 'Airtel',
      accountNumber: '9876543210',
      billingPeriod: '01/01/25 to 31/01/25',
      amount: 1062,
      gst: 162,
      category: 'Internet & Communications',
    },
  },
  {
    name: 'Office Supplies (Decathlon Paper)',
    text: `
      Decathlon Sports Invoice
      Office equipment and stationery items
      Paper pack A4: 400.00
      Printer ink cartridges: 800.00
      Date: 2025-02-18
      Invoice No: DEC-325
      ----------------------------------------
      Grand Total: 1200.00
    `,
    expected: {
      merchantName: 'Decathlon',
      invoiceNumber: 'DEC-325',
      amount: 1200,
      category: 'Office Supplies',
    },
  },
  {
    name: 'Zero-Tax Invoice (Airtel Broadband NIL Tax)',
    text: `
      Airtel Broadband Bill
      Subscriber Account No: 9876543210
      Bill Period: 01/01/25 to 31/01/25
      ----------------------------------------
      Charges:        1000.00
      GST @ 0%:       NIL
      ----------------------------------------
      Total Payable: 1000.00
    `,
    expected: {
      merchantName: 'Airtel',
      accountNumber: '9876543210',
      billingPeriod: '01/01/25 to 31/01/25',
      amount: 1000,
      gst: 0,
      category: 'Internet & Communications',
    },
    expectedConfidences: {
      gst: 0.8,
    },
  },
  {
    name: 'Inconsistent Tax (CGST != SGST)',
    text: `
      Welcome to KFC Restaurant Bill
      ----------------------------------------
      Subtotal:       500.00
      CGST @ 9%:       45.00
      SGST @ 9%:       10.00
      ----------------------------------------
      Grand Total:    555.00
    `,
    expected: {
      merchantName: 'KFC',
      amount: 555,
      gst: 55,
      category: 'Meals & Entertainment',
    },
    expectedConfidences: {
      amount: 0,
      gst: 0,
    },
  },
  {
    name: 'Exclude Unrelated Amounts (Invoice No / GSTIN)',
    text: `
      TAX INVOICE
      Invoice No: 12345
      GSTIN: 27AAAAA0000A1Z5
      ----------------------------------------
      Subtotal:       500.00
      ----------------------------------------
      Grand Total:    500.00
    `,
    expected: {
      invoiceNumber: '12345',
      amount: 500,
      gst: 0,
    },
    expectedConfidences: {
      gst: 0,
    },
  },
  {
    name: 'Avoid Weak Keyword Match (Training Course)',
    text: `
      Training Course Invoice
      Provided by: TechCorp
      Fee: 5000.00
      ----------------------------------------
      Total Amount: 5000.00
    `,
    expected: {
      amount: 5000,
      category: 'Unknown / Needs Review',
    },
  },
  {
    name: 'Avoid Weak Keyword Match (Cabinet Expense)',
    text: `
      Office Cabinet Purchase Bill
      Filing Drawer and pending expenses: 4000.00
      ----------------------------------------
      Total Amount: 4000.00
    `,
    expected: {
      amount: 4000,
      category: 'Office Supplies',
    },
  },
  {
    name: 'Travel Invoice with Arrival/Departure dates (Flight Booking)',
    text: `
      Flight Reservation Confirmation
      Passenger: Juan Dela Cruz
      Departure: 2025-09-01
      Arrival: 2025-09-02
      PNR: PNR123
      ----------------------------------------
      Total Cost: 4500.00
    `,
    expected: {
      amount: 4500,
      category: 'Travel',
    },
  },
  {
    name: 'Office Supplies Item Check (Toner & Binder)',
    text: `
      Invoice for Supplies
      Filing materials, printer toner and ring binders: 1200.00
      ----------------------------------------
      Total: 1200.00
    `,
    expected: {
      amount: 1200,
      category: 'Office Supplies',
    },
  },
  {
    name: 'Travel Item Check (Shuttle & Luggage)',
    text: `
      Airport Shuttle Bill
      Shuttle ride fee and luggage handling: 350.00
      ----------------------------------------
      Total: 350.00
    `,
    expected: {
      amount: 350,
      category: 'Travel',
    },
  },
];

function runTestSuite() {
  console.log('==================================================');
  console.log('STARTING RULE-BASED EXTRACTION TEST SUITE');
  console.log('==================================================');

  let passedTests = 0;
  let totalTests = testCases.length;

  testCases.forEach((tc, idx) => {
    console.log(`\nTest #${idx + 1}: ${tc.name}`);
    console.log('--------------------------------------------------');

    const result = localParserService.parse(tc.text);
    const val = result.values;
    const conf = result.confidences;

    const categoryInfo = localParserService.classifyCategoryLocally(
      tc.expected.merchantName || val.merchantName || '',
      tc.text
    );

    console.log('[Evidence Category Audit Log]');
    console.log(`- Expected Category: "${tc.expected.category || 'N/A'}"`);
    console.log(
      `- Selected Category: "${val.category}" (Score: ${categoryInfo.score}, Confidence: ${categoryInfo.confidence})`
    );
    console.log('- Category Scores:', JSON.stringify(categoryInfo.scores));
    console.log(
      `- Extracted: Amount: ${val.amount} (Expected: ${tc.expected.amount || 'N/A'}), GST: ${val.gst} (Expected: ${tc.expected.gst !== undefined ? tc.expected.gst : 'N/A'})`
    );

    let testFailed = false;
    const failures = [];

    // Verify key fields
    Object.keys(tc.expected).forEach((field) => {
      const expectedVal = tc.expected[field];
      const actualVal = val[field];

      if (typeof expectedVal === 'number') {
        const diff = Math.abs(expectedVal - actualVal);
        if (diff > 0.1) {
          testFailed = true;
          failures.push(`${field}: expected ${expectedVal}, got ${actualVal}`);
        }
      } else {
        if (expectedVal !== actualVal) {
          testFailed = true;
          failures.push(`${field}: expected "${expectedVal}", got "${actualVal}"`);
        }
      }
    });

    // Verify confidences if specified
    if (tc.expectedConfidences) {
      Object.keys(tc.expectedConfidences).forEach((field) => {
        const expectedConf = tc.expectedConfidences[field];
        const actualConf = conf[field];
        if (actualConf !== expectedConf) {
          testFailed = true;
          failures.push(`confidence for ${field}: expected ${expectedConf}, got ${actualConf}`);
        }
      });
    }

    if (testFailed) {
      console.log('❌ FAILED');
      failures.forEach((f) => console.log(`   - ${f}`));
    } else {
      console.log('✅ PASSED');
      console.log('   Parsed Data:', JSON.stringify(val, null, 2));
      passedTests++;
    }
  });

  console.log('\n==================================================');
  console.log(`TEST SUITE COMPLETE: ${passedTests}/${totalTests} PASSED`);
  console.log('==================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite();
