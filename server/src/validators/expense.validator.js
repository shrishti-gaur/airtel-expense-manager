import { body } from 'express-validator';
import { validateRequest } from '../middleware/validator.middleware.js';
import { isValidCategory, isValidSubcategory } from '../config/expenseCategories.js';

export const createExpenseValidator = [
  body('status').optional(),
  
  // Validate expenseCategory (or fallback to legacy category if provided)
  body('expenseCategory').custom((value, { req }) => {
    if (req.body.status === 'Draft') return true;
    const cat = value || req.body.category;
    if (!cat || !cat.trim()) {
      throw new Error('Expense category is required');
    }
    if (!isValidCategory(cat)) {
      throw new Error(`Invalid expense category: ${cat}`);
    }
    return true;
  }),

  // Validate expenseType (or subcategory)
  body('expenseType').custom((value, { req }) => {
    if (req.body.status === 'Draft') return true;
    const cat = req.body.expenseCategory || req.body.category;
    
    let subcat = value;
    if (!subcat || subcat === 'Reimbursable' || subcat === 'Direct Pay') {
      subcat = req.body.subcategory;
    }
    
    if (cat && isValidCategory(cat)) {
      const method = req.body.submissionMethod || (req.body.conveyanceMethod === 'Per Kilometer' ? 'PER_KM' : (req.body.conveyanceMethod === 'Receipt Based' ? 'RECEIPT_BASED' : null));
      if (cat === 'Conveyance' && method === 'PER_KM') {
        return true; // Not required for PER_KM
      }
      
      if (!subcat || !subcat.trim()) {
        throw new Error('Expense type is required');
      }
      if (!isValidSubcategory(cat, subcat)) {
        throw new Error(`Invalid expense type ${subcat} for category ${cat}`);
      }
    }
    return true;
  }),

  // Validate submissionMethod (and specific fields for Conveyance PER_KM)
  body('submissionMethod').custom((value, { req }) => {
    if (req.body.status === 'Draft') return true;
    const cat = req.body.expenseCategory || req.body.category;
    if (cat === 'Conveyance') {
      const method = value || (req.body.conveyanceMethod === 'Per Kilometer' ? 'PER_KM' : (req.body.conveyanceMethod === 'Receipt Based' ? 'RECEIPT_BASED' : null));
      if (!method || !['PER_KM', 'RECEIPT_BASED'].includes(method)) {
        throw new Error('Submission method must be PER_KM or RECEIPT_BASED for Conveyance');
      }
      
      if (method === 'PER_KM') {
        const dist = Number(req.body.tripDistance);
        if (req.body.tripDistance === undefined || req.body.tripDistance === null || isNaN(dist) || dist <= 0) {
          throw new Error('Trip distance must be greater than zero');
        }
        const rate = Number(req.body.distanceRate);
        if (req.body.distanceRate === undefined || req.body.distanceRate === null || isNaN(rate) || rate <= 0) {
          throw new Error('Distance rate must be greater than zero');
        }
      }
    }
    return true;
  }),

  // Validate Date / Start Date
  body('date').custom((value, { req }) => {
    if (req.body.status === 'Draft') return true;
    const method = req.body.submissionMethod || (req.body.conveyanceMethod === 'Per Kilometer' ? 'PER_KM' : (req.body.conveyanceMethod === 'Receipt Based' ? 'RECEIPT_BASED' : null));
    const targetDate = value || req.body.invoiceDate || req.body.date || (method === 'PER_KM' ? req.body.startDate : null);
    if (!targetDate || isNaN(Date.parse(targetDate))) {
      throw new Error('A valid receipt/invoice date is required');
    }
    return true;
  }),

  // Validate amounts
  body('reimbursementAmount').custom((value, { req }) => {
    if (req.body.status === 'Draft') return true;
    const amt = Number(value !== undefined ? value : req.body.amount);
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Reimbursement amount must be a numeric value greater than zero');
    }
    return true;
  }),

  body('receiptAmount').custom((value, { req }) => {
    if (req.body.status === 'Draft') return true;
    const method = req.body.submissionMethod || (req.body.conveyanceMethod === 'Per Kilometer' ? 'PER_KM' : (req.body.conveyanceMethod === 'Receipt Based' ? 'RECEIPT_BASED' : null));
    if (method === 'PER_KM') return true; // Not required for PER_KM
    
    const amt = Number(value !== undefined ? value : (req.body.amount || req.body.reimbursementAmount));
    if (isNaN(amt) || amt <= 0) {
      throw new Error('Receipt amount must be a numeric value greater than zero');
    }
    return true;
  }),

  validateRequest,
];
