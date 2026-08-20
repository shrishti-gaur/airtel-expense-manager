import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Employee } from '../models/Employee.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import crypto from 'crypto';
import path from 'path';

function normalizeDbReceiptUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') && !url.includes('/uploads/')) {
    return url;
  }
  let filename = '';
  if (url.includes('/uploads/')) {
    filename = url.split('/uploads/').pop();
  } else if (url.includes('\\uploads\\')) {
    filename = url.split('\\uploads\\').pop();
  } else {
    filename = path.basename(url);
  }
  filename = filename.split('?')[0];
  return `/uploads/${filename}`;
}

export class ExpenseService {
  /**
   * Submit or save a new expense record
   */
  async createClaim(userId, claimData) {
    console.log(`[Expense Service] Creating claim for user ${userId}:`, claimData);

    // 0. Duplicate checks before claim creation
    const receiptHash = claimData.receiptHash;
    let invoiceFingerprint = claimData.invoiceFingerprint;

    // Dynamically calculate invoiceFingerprint if not provided but values exist
    if (!invoiceFingerprint) {
      const normMerchant = String(claimData.merchant || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
      const normInvoiceNo = String(claimData.invoiceNumber || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

      let normDate = '';
      const invoiceDateVal = claimData.invoiceDate || claimData.date;
      if (invoiceDateVal) {
        try {
          const d = new Date(invoiceDateVal);
          if (!isNaN(d.getTime())) {
            normDate = d.toISOString().split('T')[0];
          } else {
            normDate = String(invoiceDateVal)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .trim();
          }
        } catch (e) {
          normDate = String(invoiceDateVal)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
        }
      }

      const normAmount =
        claimData.amount !== undefined && claimData.amount !== null
          ? Number(claimData.amount).toFixed(2)
          : '0.00';

      if (normMerchant && normDate && claimData.amount !== undefined && claimData.amount !== null) {
        const rawString = `${normMerchant}|${normInvoiceNo}|${normDate}|${normAmount}`;
        invoiceFingerprint = crypto.createHash('sha256').update(rawString).digest('hex');
      }
    }

    console.log('[Duplicate Check] Checking claim creation duplicates...');
    console.log(`[Duplicate Check] Generated receiptHash: ${receiptHash || 'null'}`);
    console.log(`[Duplicate Check] Generated invoiceFingerprint: ${invoiceFingerprint || 'null'}`);

    if (receiptHash) {
      console.log(`[Duplicate Check] Running MongoDB query: { receiptHash: "${receiptHash}" }`);
      const existingHash = await ExpenseClaim.findOne({ receiptHash });
      if (existingHash) {
        console.log('[Duplicate Check] Duplicate found: YES');
        console.log('[Duplicate Check] Duplicate Type: Exact File Match');
        console.log(`[Duplicate Check] Existing Claim ID: ${existingHash.id}`);
        const err = new Error('Duplicate Receipt Detected');
        err.code = 'DUPLICATE_RECEIPT';
        err.status = 409;
        err.duplicateType = 'Exact File Match';
        err.existingClaim = {
          id: existingHash.id,
          submissionDate: existingHash.submissionDate || existingHash.createdAt,
          employeeName: existingHash.employeeName || 'Unknown Employee',
        };
        throw err;
      } else {
        console.log('[Duplicate Check] Duplicate found: NO');
      }
    }

    if (invoiceFingerprint) {
      console.log(
        `[Duplicate Check] Running MongoDB query: { invoiceFingerprint: "${invoiceFingerprint}" }`
      );
      const existingFingerprint = await ExpenseClaim.findOne({ invoiceFingerprint });
      if (existingFingerprint) {
        console.log('[Duplicate Check] Duplicate found: YES');
        console.log('[Duplicate Check] Duplicate Type: Invoice Match');
        console.log(`[Duplicate Check] Existing Claim ID: ${existingFingerprint.id}`);
        const err = new Error('Duplicate Receipt Detected');
        err.code = 'DUPLICATE_RECEIPT';
        err.status = 409;
        err.duplicateType = 'Invoice Match';
        err.existingClaim = {
          id: existingFingerprint.id,
          submissionDate: existingFingerprint.submissionDate || existingFingerprint.createdAt,
          employeeName: existingFingerprint.employeeName || 'Unknown Employee',
        };
        throw err;
      } else {
        console.log('[Duplicate Check] Duplicate found: NO');
      }
    }

    // Fetch employee name for verification and completeness
    const employee = await Employee.findOne({ employeeId: userId });
    const empName = employee ? employee.name : 'Unknown Employee';
    const empDept = employee ? employee.department : claimData.department || 'Engineering';
    const empCostCenter = employee ? employee.costCenter : claimData.costCenter || 'CC-ENG-402';

    const claimId = claimData.id || `EXP-${Date.now()}`;
    const status = claimData.status || 'Draft';

    const newClaim = new ExpenseClaim({
      id: claimId,
      employeeId: userId,
      employeeName: empName,
      title: claimData.title || (claimData.expenseCategory || claimData.category ? `${claimData.expenseCategory || claimData.category} Claim` : 'Expense Claim'),
      status,
      
      // Category / Type mappings
      category: claimData.expenseCategory || claimData.category || '',
      expenseCategory: claimData.expenseCategory || claimData.category || '',
      subcategory: claimData.expenseType || claimData.subcategory || '',
      expenseType: claimData.expenseType || claimData.subcategory || '',
      
      // Conveyance mappings
      submissionMethod: claimData.submissionMethod || (claimData.conveyanceMethod === 'Per Kilometer' ? 'PER_KM' : (claimData.conveyanceMethod === 'Receipt Based' ? 'RECEIPT_BASED' : null)),
      conveyanceMethod: claimData.submissionMethod === 'PER_KM' ? 'Per Kilometer' : (claimData.submissionMethod === 'RECEIPT_BASED' ? 'Receipt Based' : (claimData.conveyanceMethod || '')),
      tripDistance:
        claimData.tripDistance !== undefined &&
        claimData.tripDistance !== null &&
        claimData.tripDistance !== ''
          ? Number(claimData.tripDistance)
          : null,
      distanceRate:
        claimData.distanceRate !== undefined &&
        claimData.distanceRate !== null &&
        claimData.distanceRate !== ''
          ? Number(claimData.distanceRate)
          : null,
      unitOfMeasure: claimData.unitOfMeasure || 'KM',
      
      // Amount mappings
      reimbursementAmount: Number(claimData.reimbursementAmount !== undefined ? claimData.reimbursementAmount : claimData.amount),
      amount: Number(claimData.reimbursementAmount !== undefined ? claimData.reimbursementAmount : claimData.amount),
      receiptAmount: claimData.receiptAmount !== undefined ? Number(claimData.receiptAmount) : (claimData.submissionMethod === 'PER_KM' ? 0 : Number(claimData.reimbursementAmount !== undefined ? claimData.reimbursementAmount : claimData.amount)),
      
      // Date mappings
      date: claimData.date ? new Date(claimData.date) : (claimData.invoiceDate ? new Date(claimData.invoiceDate) : (claimData.startDate ? new Date(claimData.startDate) : new Date())),
      startDate: claimData.startDate ? new Date(claimData.startDate) : (claimData.submissionMethod === 'PER_KM' || claimData.conveyanceMethod === 'Per Kilometer' ? new Date(claimData.date || claimData.invoiceDate || new Date()) : null),
      invoiceDate: claimData.date ? new Date(claimData.date) : (claimData.invoiceDate ? new Date(claimData.invoiceDate) : (claimData.startDate ? new Date(claimData.startDate) : new Date())),

      submissionDate:
        status === 'Submitted'
          ? new Date()
          : claimData.submissionDate
            ? new Date(claimData.submissionDate)
            : null,
      merchant: claimData.merchant || '',
      invoiceNumber: claimData.invoiceNumber || '',
      currency: claimData.currency || 'INR',
      tax: claimData.tax ? Number(claimData.tax) : 0,
      department: empDept,
      costCenter: empCostCenter,
      projectCode: claimData.projectCode || '',
      expenseTypeLegacy: claimData.expenseTypeLegacy || 'Reimbursable',
      receiptUrl: normalizeDbReceiptUrl(claimData.receiptUrl),
      fileName: claimData.fileName || '',
      fileType: claimData.fileType || '',
      fileSize: claimData.fileSize ? Number(claimData.fileSize) : null,
      ocrOverallScore:
        claimData.ocrOverallScore !== undefined && claimData.ocrOverallScore !== null
          ? Number(claimData.ocrOverallScore)
          : null,
      ocrTimestamp: claimData.ocrTimestamp ? new Date(claimData.ocrTimestamp) : null,
      ocrConfidence: claimData.ocrConfidence || null,
      receiptHash: receiptHash || '',
      invoiceFingerprint: invoiceFingerprint || '',
      employeeNotes: claimData.employeeNotes || '',
      managerComments: claimData.managerComments || '',
      financeComments: claimData.financeComments || '',
      history: [
        {
          action: status === 'Submitted' ? 'SUBMITTED' : 'DRAFT_CREATED',
          user: userId,
          timestamp: new Date(),
        },
      ],
    });

    console.log(
      `[Trace Log - Service] Attempting to save new claim ${claimId} to MongoDB Atlas...`
    );
    const savedClaim = await newClaim.save();
    console.log(
      `[Trace Log - Service] Claim ${claimId} successfully saved. Document ID: ${savedClaim._id}, Status: ${savedClaim.status}`
    );

    // Create Activity Log
    await ActivityLog.create({
      userId,
      userName: empName,
      action: status === 'Submitted' ? 'CLAIM_SUBMITTED' : 'DRAFT_SAVED',
      claimId,
      amount: savedClaim.amount,
      details: savedClaim.title,
    });

    // Create Notification if submitted
    if (status === 'Submitted') {
      const managerNotificationId = `NOTIF-MGR-${Date.now()}`;
      await Notification.create({
        id: managerNotificationId,
        userId: 'mgr_456', // default manager
        title: 'New Claim Submitted',
        description: `New claim ${claimId} for ₹${savedClaim.amount.toLocaleString('en-IN')} from ${empName} requires your review.`,
        claimId,
        type: 'info',
        read: false,
      });

      const empNotificationId = `NOTIF-EMP-${Date.now()}`;
      await Notification.create({
        id: empNotificationId,
        userId,
        title: 'Claim Submitted Successfully',
        description: `Your claim ${claimId} for ₹${savedClaim.amount.toLocaleString('en-IN')} has been submitted.`,
        claimId,
        type: 'success',
        read: false,
      });
    }

    return savedClaim;
  }

  /**
   * Update an existing claim (draft edit or submit)
   */
  async updateClaim(claimId, userId, claimData) {
    console.log(`[Expense Service] Updating claim ${claimId} for user ${userId}`);

    const claim = await ExpenseClaim.findOne({ id: claimId });
    if (!claim) {
      throw new Error(`Expense claim with ID ${claimId} not found`);
    }

    // Determine status change
    const originalStatus = claim.status;
    const nextStatus = claimData.status || originalStatus;
    
    // Sync category / type
    const newCategory = claimData.expenseCategory || claimData.category || claim.expenseCategory || claim.category;
    claim.category = newCategory;
    claim.expenseCategory = newCategory;
    
    const newSubcat = claimData.expenseType || claimData.subcategory || claim.expenseType || claim.subcategory;
    claim.subcategory = newSubcat;
    claim.expenseType = newSubcat;
    
    // Sync conveyance methods
    const newMethod = claimData.submissionMethod || (claimData.conveyanceMethod === 'Per Kilometer' ? 'PER_KM' : (claimData.conveyanceMethod === 'Receipt Based' ? 'RECEIPT_BASED' : null)) || claim.submissionMethod;
    claim.submissionMethod = newMethod;
    claim.conveyanceMethod = newMethod === 'PER_KM' ? 'Per Kilometer' : (newMethod === 'RECEIPT_BASED' ? 'Receipt Based' : (claimData.conveyanceMethod || claim.conveyanceMethod || ''));

    claim.tripDistance =
      claimData.tripDistance !== undefined ? (claimData.tripDistance !== '' && claimData.tripDistance !== null ? Number(claimData.tripDistance) : null) : claim.tripDistance;
    claim.distanceRate =
      claimData.distanceRate !== undefined ? (claimData.distanceRate !== '' && claimData.distanceRate !== null ? Number(claimData.distanceRate) : null) : claim.distanceRate;
    claim.unitOfMeasure =
      claimData.unitOfMeasure !== undefined ? claimData.unitOfMeasure : claim.unitOfMeasure;

    // Sync dates
    if (claimData.date) claim.date = new Date(claimData.date);
    if (claimData.startDate) claim.startDate = new Date(claimData.startDate);
    if (claimData.invoiceDate) claim.invoiceDate = new Date(claimData.invoiceDate);
    
    // Fallback sync dates
    if (claimData.date || claimData.invoiceDate || claimData.startDate) {
      const activeDate = claim.date || claim.invoiceDate || claim.startDate;
      claim.date = activeDate;
      claim.invoiceDate = activeDate;
      if (claim.submissionMethod === 'PER_KM' && !claim.startDate) {
        claim.startDate = activeDate;
      }
    }

    // Sync amounts
    const newReimbAmount = claimData.reimbursementAmount !== undefined ? Number(claimData.reimbursementAmount) : (claimData.amount !== undefined ? Number(claimData.amount) : null);
    if (newReimbAmount !== null) {
      claim.reimbursementAmount = newReimbAmount;
      claim.amount = newReimbAmount;
    }
    
    if (claimData.receiptAmount !== undefined) {
      claim.receiptAmount = Number(claimData.receiptAmount);
    } else if (newReimbAmount !== null) {
      claim.receiptAmount = claim.submissionMethod === 'PER_KM' ? 0 : newReimbAmount;
    }

    claim.title = claimData.title || (newCategory ? `${newCategory} Claim` : claim.title);
    claim.merchant = claimData.merchant !== undefined ? claimData.merchant : claim.merchant;
    claim.invoiceNumber =
      claimData.invoiceNumber !== undefined ? claimData.invoiceNumber : claim.invoiceNumber;
    claim.currency = claimData.currency || claim.currency;
    claim.tax = claimData.tax !== undefined ? Number(claimData.tax) : claim.tax;
    claim.projectCode =
      claimData.projectCode !== undefined ? claimData.projectCode : claim.projectCode;
    claim.expenseTypeLegacy = claimData.expenseTypeLegacy || claim.expenseTypeLegacy;
    claim.employeeNotes =
      claimData.employeeNotes !== undefined ? claimData.employeeNotes : claim.employeeNotes;

    if (claimData.receiptUrl) claim.receiptUrl = normalizeDbReceiptUrl(claimData.receiptUrl);
    if (claimData.fileName) claim.fileName = claimData.fileName;
    if (claimData.fileType) claim.fileType = claimData.fileType;
    if (claimData.fileSize) claim.fileSize = Number(claimData.fileSize);
    // 0. Duplicate checks before claim update
    const receiptHash = claimData.receiptHash || claim.receiptHash;
    let invoiceFingerprint = claimData.invoiceFingerprint || claim.invoiceFingerprint;

    // Dynamically calculate invoiceFingerprint if not provided but values exist
    if (!claimData.invoiceFingerprint) {
      const merchantVal = claimData.merchant !== undefined ? claimData.merchant : claim.merchant;
      const invoiceNoVal =
        claimData.invoiceNumber !== undefined ? claimData.invoiceNumber : claim.invoiceNumber;
      const invoiceDateVal = claimData.invoiceDate || claim.invoiceDate;
      const amountVal = claimData.amount !== undefined ? claimData.amount : claim.amount;

      const normMerchant = String(merchantVal || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
      const normInvoiceNo = String(invoiceNoVal || '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();

      let normDate = '';
      if (invoiceDateVal) {
        try {
          const d = new Date(invoiceDateVal);
          if (!isNaN(d.getTime())) {
            normDate = d.toISOString().split('T')[0];
          } else {
            normDate = String(invoiceDateVal)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .trim();
          }
        } catch (e) {
          normDate = String(invoiceDateVal)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
        }
      }

      const normAmount =
        amountVal !== undefined && amountVal !== null ? Number(amountVal).toFixed(2) : '0.00';

      if (normMerchant && normDate && amountVal !== undefined && amountVal !== null) {
        const rawString = `${normMerchant}|${normInvoiceNo}|${normDate}|${normAmount}`;
        invoiceFingerprint = crypto.createHash('sha256').update(rawString).digest('hex');
      }
    }

    console.log(`[Duplicate Check] Checking claim update duplicates for claim ${claimId}...`);
    console.log(`[Duplicate Check] receiptHash to check: ${receiptHash || 'null'}`);
    console.log(`[Duplicate Check] invoiceFingerprint to check: ${invoiceFingerprint || 'null'}`);

    if (receiptHash) {
      console.log(
        `[Duplicate Check] Running MongoDB query: { receiptHash: "${receiptHash}", id: { $ne: "${claimId}" } }`
      );
      const existingHash = await ExpenseClaim.findOne({ receiptHash, id: { $ne: claimId } });
      if (existingHash) {
        console.log('[Duplicate Check] Duplicate found: YES');
        console.log('[Duplicate Check] Duplicate Type: Exact File Match');
        console.log(`[Duplicate Check] Existing Claim ID: ${existingHash.id}`);
        const err = new Error('Duplicate Receipt Detected');
        err.code = 'DUPLICATE_RECEIPT';
        err.status = 409;
        err.duplicateType = 'Exact File Match';
        err.existingClaim = {
          id: existingHash.id,
          submissionDate: existingHash.submissionDate || existingHash.createdAt,
          employeeName: existingHash.employeeName || 'Unknown Employee',
        };
        throw err;
      } else {
        console.log('[Duplicate Check] Duplicate found: NO');
      }
    }

    if (invoiceFingerprint) {
      console.log(
        `[Duplicate Check] Running MongoDB query: { invoiceFingerprint: "${invoiceFingerprint}", id: { $ne: "${claimId}" } }`
      );
      const existingFingerprint = await ExpenseClaim.findOne({
        invoiceFingerprint,
        id: { $ne: claimId },
      });
      if (existingFingerprint) {
        console.log('[Duplicate Check] Duplicate found: YES');
        console.log('[Duplicate Check] Duplicate Type: Invoice Match');
        console.log(`[Duplicate Check] Existing Claim ID: ${existingFingerprint.id}`);
        const err = new Error('Duplicate Receipt Detected');
        err.code = 'DUPLICATE_RECEIPT';
        err.status = 409;
        err.duplicateType = 'Invoice Match';
        err.existingClaim = {
          id: existingFingerprint.id,
          submissionDate: existingFingerprint.submissionDate || existingFingerprint.createdAt,
          employeeName: existingFingerprint.employeeName || 'Unknown Employee',
        };
        throw err;
      } else {
        console.log('[Duplicate Check] Duplicate found: NO');
      }
    }

    claim.receiptHash = receiptHash;
    claim.invoiceFingerprint = invoiceFingerprint;

    // OCR fields updates if any
    if (claimData.ocrOverallScore !== undefined)
      claim.ocrOverallScore = Number(claimData.ocrOverallScore);
    if (claimData.ocrTimestamp) claim.ocrTimestamp = new Date(claimData.ocrTimestamp);
    if (claimData.ocrConfidence) claim.ocrConfidence = claimData.ocrConfidence;

    // Transition state
    claim.status = nextStatus;
    if (nextStatus === 'Submitted' && originalStatus !== 'Submitted') {
      claim.submissionDate = new Date();
      claim.history.push({
        action: 'SUBMITTED',
        user: userId,
        timestamp: new Date(),
      });
    } else {
      claim.history.push({
        action: nextStatus === 'Draft' ? 'DRAFT_UPDATED' : 'CLAIM_UPDATED',
        user: userId,
        timestamp: new Date(),
      });
    }

    console.log(`[Trace Log - Service] Attempting to update claim ${claimId} in MongoDB Atlas...`);
    const updatedClaim = await claim.save();
    console.log(
      `[Trace Log - Service] Claim ${claimId} successfully updated. Document ID: ${updatedClaim._id}, Status: ${updatedClaim.status}`
    );

    // Log Activity
    await ActivityLog.create({
      userId,
      userName: claim.employeeName,
      action:
        nextStatus === 'Submitted' && originalStatus !== 'Submitted'
          ? 'CLAIM_SUBMITTED'
          : 'DRAFT_UPDATED',
      claimId,
      amount: updatedClaim.amount,
      details: updatedClaim.title,
    });

    // Notify Manager if submitted
    if (nextStatus === 'Submitted' && originalStatus !== 'Submitted') {
      const managerNotificationId = `NOTIF-MGR-${Date.now()}`;
      await Notification.create({
        id: managerNotificationId,
        userId: 'mgr_456',
        title: 'New Claim Submitted',
        description: `New claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} from ${claim.employeeName} requires your review.`,
        claimId,
        type: 'info',
        read: false,
      });

      const empNotificationId = `NOTIF-EMP-${Date.now()}`;
      await Notification.create({
        id: empNotificationId,
        userId,
        title: 'Claim Submitted Successfully',
        description: `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been submitted.`,
        claimId,
        type: 'success',
        read: false,
      });
    }

    return updatedClaim;
  }

  /**
   * Get all expense records belonging to a user
   */
  async getClaimsByUser(userId) {
    console.log(`[Trace Log - Service] Fetching claims from MongoDB for user ${userId}...`);
    const results = await ExpenseClaim.find({ employeeId: userId }).sort({ createdAt: -1 });
    console.log(
      `[Trace Log - Service] Found ${results.length} claims in MongoDB for user ${userId}`
    );
    return results;
  }

  /**
   * Get a single claim record by custom claim id
   */
  async getClaimById(claimId) {
    console.log(`[Trace Log - Service] Fetching single claim ${claimId} from MongoDB...`);
    const claim = await ExpenseClaim.findOne({ id: claimId });
    if (!claim) {
      console.error(`[Trace Log - Service] Claim ${claimId} not found in MongoDB`);
      throw new Error(`Claim not found with ID: ${claimId}`);
    }
    console.log(
      `[Trace Log - Service] Found claim ${claimId} in MongoDB. Document ID: ${claim._id}, Status: ${claim.status}`
    );
    return claim;
  }
}

export const expenseService = new ExpenseService();
