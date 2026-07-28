import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Employee } from '../models/Employee.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';

export class ExpenseService {
  /**
   * Submit or save a new expense record
   */
  async createClaim(userId, claimData) {
    console.log(`[Expense Service] Creating claim for user ${userId}:`, claimData);
    
    // Fetch employee name for verification and completeness
    const employee = await Employee.findOne({ employeeId: userId });
    const empName = employee ? employee.name : 'Unknown Employee';
    const empDept = employee ? employee.department : (claimData.department || 'Engineering');
    const empCostCenter = employee ? employee.costCenter : (claimData.costCenter || 'CC-ENG-402');

    const claimId = claimData.id || `EXP-${Date.now()}`;
    const status = claimData.status || 'Draft';

    const newClaim = new ExpenseClaim({
      id: claimId,
      employeeId: userId,
      employeeName: empName,
      title: claimData.title || claimData.description?.split('.')[0] || 'Expense Claim',
      status,
      amount: Number(claimData.amount),
      invoiceDate: claimData.invoiceDate ? new Date(claimData.invoiceDate) : (claimData.date ? new Date(claimData.date) : new Date()),
      submissionDate: status === 'Submitted' ? new Date() : (claimData.submissionDate ? new Date(claimData.submissionDate) : null),
      merchant: claimData.merchant || '',
      invoiceNumber: claimData.invoiceNumber || '',
      currency: claimData.currency || 'INR',
      tax: claimData.tax ? Number(claimData.tax) : 0,
      category: claimData.category || '',
      department: empDept,
      costCenter: empCostCenter,
      projectCode: claimData.projectCode || '',
      expenseType: claimData.expenseType || 'Reimbursable',
      description: claimData.description || '',
      receiptUrl: claimData.receiptUrl || '',
      fileName: claimData.fileName || '',
      fileType: claimData.fileType || '',
      fileSize: claimData.fileSize ? Number(claimData.fileSize) : null,
      ocrOverallScore: claimData.ocrOverallScore ? Number(claimData.ocrOverallScore) : null,
      ocrTimestamp: claimData.ocrTimestamp ? new Date(claimData.ocrTimestamp) : null,
      ocrConfidence: claimData.ocrConfidence || null,
      employeeNotes: claimData.employeeNotes || '',
      managerComments: claimData.managerComments || '',
      financeComments: claimData.financeComments || '',
      history: [
        {
          action: status === 'Submitted' ? 'SUBMITTED' : 'DRAFT_CREATED',
          user: userId,
          timestamp: new Date()
        }
      ]
    });

    const savedClaim = await newClaim.save();

    // Create Activity Log
    await ActivityLog.create({
      userId,
      userName: empName,
      action: status === 'Submitted' ? 'CLAIM_SUBMITTED' : 'DRAFT_SAVED',
      claimId,
      amount: savedClaim.amount,
      details: savedClaim.title
    });

    // Create Notification if submitted
    if (status === 'Submitted') {
      const managerNotificationId = `NOTIF-MGR-${Date.now()}`;
      await Notification.create({
        id: managerNotificationId,
        userId: 'mgr_456', // default manager
        title: 'New Claim Submitted',
        description: `New claim ${claimId} for ₹${savedClaim.amount.toLocaleString('en-IN')} from ${empName} requires your review.`,
        type: 'info',
        read: false
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

    // Update allowable fields
    claim.title = claimData.title || claimData.description?.split('.')[0] || claim.title;
    claim.amount = claimData.amount !== undefined ? Number(claimData.amount) : claim.amount;
    claim.invoiceDate = claimData.invoiceDate ? new Date(claimData.invoiceDate) : claim.invoiceDate;
    claim.merchant = claimData.merchant !== undefined ? claimData.merchant : claim.merchant;
    claim.invoiceNumber = claimData.invoiceNumber !== undefined ? claimData.invoiceNumber : claim.invoiceNumber;
    claim.currency = claimData.currency || claim.currency;
    claim.tax = claimData.tax !== undefined ? Number(claimData.tax) : claim.tax;
    claim.category = claimData.category || claim.category;
    claim.projectCode = claimData.projectCode !== undefined ? claimData.projectCode : claim.projectCode;
    claim.expenseType = claimData.expenseType || claim.expenseType;
    claim.description = claimData.description || claim.description;
    claim.employeeNotes = claimData.employeeNotes !== undefined ? claimData.employeeNotes : claim.employeeNotes;
    
    if (claimData.receiptUrl) claim.receiptUrl = claimData.receiptUrl;
    if (claimData.fileName) claim.fileName = claimData.fileName;
    if (claimData.fileType) claim.fileType = claimData.fileType;
    if (claimData.fileSize) claim.fileSize = Number(claimData.fileSize);
    
    // OCR fields updates if any
    if (claimData.ocrOverallScore !== undefined) claim.ocrOverallScore = Number(claimData.ocrOverallScore);
    if (claimData.ocrTimestamp) claim.ocrTimestamp = new Date(claimData.ocrTimestamp);
    if (claimData.ocrConfidence) claim.ocrConfidence = claimData.ocrConfidence;

    // Transition state
    claim.status = nextStatus;
    if (nextStatus === 'Submitted' && originalStatus !== 'Submitted') {
      claim.submissionDate = new Date();
      claim.history.push({
        action: 'SUBMITTED',
        user: userId,
        timestamp: new Date()
      });
    } else {
      claim.history.push({
        action: nextStatus === 'Draft' ? 'DRAFT_UPDATED' : 'CLAIM_UPDATED',
        user: userId,
        timestamp: new Date()
      });
    }

    const updatedClaim = await claim.save();

    // Log Activity
    await ActivityLog.create({
      userId,
      userName: claim.employeeName,
      action: nextStatus === 'Submitted' && originalStatus !== 'Submitted' ? 'CLAIM_SUBMITTED' : 'DRAFT_UPDATED',
      claimId,
      amount: updatedClaim.amount,
      details: updatedClaim.title
    });

    // Notify Manager if submitted
    if (nextStatus === 'Submitted' && originalStatus !== 'Submitted') {
      const managerNotificationId = `NOTIF-MGR-${Date.now()}`;
      await Notification.create({
        id: managerNotificationId,
        userId: 'mgr_456',
        title: 'New Claim Submitted',
        description: `New claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} from ${claim.employeeName} requires your review.`,
        type: 'info',
        read: false
      });
    }

    return updatedClaim;
  }

  /**
   * Get all expense records belonging to a user
   */
  async getClaimsByUser(userId) {
    console.log(`[Expense Service] Fetching claims for user ${userId}`);
    return await ExpenseClaim.find({ employeeId: userId }).sort({ createdAt: -1 });
  }

  /**
   * Get a single claim record by custom claim id
   */
  async getClaimById(claimId) {
    console.log(`[Expense Service] Fetching single claim: ${claimId}`);
    const claim = await ExpenseClaim.findOne({ id: claimId });
    if (!claim) {
      throw new Error(`Claim not found with ID: ${claimId}`);
    }
    return claim;
  }
}

export const expenseService = new ExpenseService();
