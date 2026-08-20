import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { expenseService } from './services/expense.service.js';
import { ExpenseClaim } from './models/ExpenseClaim.js';

dotenv.config();

const runTest = async () => {
  console.log('[Test Backend] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Test Backend] Connected.');

  const testUserId = 'emp_123';
  const testClaimData = {
    expenseCategory: 'Conveyance',
    expenseType: 'Auto Charges',
    submissionMethod: 'RECEIPT_BASED',
    date: '2026-08-19',
    invoiceNumber: 'TEST-INV-123',
    receiptAmount: 150.50,
    reimbursementAmount: 150.50,
    currency: 'INR',
    merchant: 'Mock Taxi Driver',
    tax: 0,
    status: 'Submitted'
  };

  let claimId = null;

  try {
    console.log('[Test Backend] Creating claim...');
    const claim = await expenseService.createClaim(testUserId, testClaimData);
    claimId = claim.id;
    console.log(`[Test Backend] Claim created successfully. ID: ${claimId}`);

    console.log('[Test Backend] Fetching claim...');
    const fetched = await expenseService.getClaimById(claimId);
    const json = fetched.toJSON();

    console.log('[Test Backend] Fetched document payload:', json);

    // Verify fields
    console.log('[Test Backend] Running assertions...');
    
    // Category & Type checks
    if (json.expenseCategory !== 'Conveyance' || json.category !== 'Conveyance') {
      throw new Error(`Category mismatch: expenseCategory=${json.expenseCategory}, category=${json.category}`);
    }
    if (json.expenseType !== 'Auto Charges' || json.subcategory !== 'Auto Charges') {
      throw new Error(`Type mismatch: expenseType=${json.expenseType}, subcategory=${json.subcategory}`);
    }

    // Conveyance submission method check
    if (json.submissionMethod !== 'RECEIPT_BASED' || json.conveyanceMethod !== 'Receipt Based') {
      throw new Error(`Method mismatch: submissionMethod=${json.submissionMethod}, conveyanceMethod=${json.conveyanceMethod}`);
    }

    // Date check
    if (!json.date || !json.invoiceDate) {
      throw new Error(`Date fields missing: date=${json.date}, invoiceDate=${json.invoiceDate}`);
    }

    // Amount check
    if (json.reimbursementAmount !== 150.50 || json.amount !== 150.50 || json.receiptAmount !== 150.50) {
      throw new Error(`Amount mismatch: reimbursementAmount=${json.reimbursementAmount}, amount=${json.amount}, receiptAmount=${json.receiptAmount}`);
    }

    // Invoice check
    if (json.invoiceNumber !== 'TEST-INV-123') {
      throw new Error(`Invoice number mismatch: expected 'TEST-INV-123', got '${json.invoiceNumber}'`);
    }



    console.log('[Test Backend] ASSERTIONS PASSED SUCCESSFULLY! ✅');

  } catch (error) {
    console.error('[Test Backend] Assertion failed! ❌', error);
  } finally {
    if (claimId) {
      console.log('[Test Backend] Cleaning up test claim...');
      await ExpenseClaim.deleteOne({ id: claimId });
      console.log('[Test Backend] Cleanup done.');
    }
    console.log('[Test Backend] Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('[Test Backend] Finished.');
  }
};

runTest();
