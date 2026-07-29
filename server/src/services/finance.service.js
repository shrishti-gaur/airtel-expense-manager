import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Employee } from '../models/Employee.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { oracleService } from '../integrations/oracle/oracle.service.js';

export class FinanceService {
  /**
   * Get all claims for audits (non-drafts)
   */
  async getAuditLogs(filters = {}) {
    console.log('[Finance Service] Retrieving system claims for audit with filters:', filters);
    
    const query = { status: { $ne: 'Draft' } };
    
    if (filters.status) {
      query.status = filters.status;
    }

    console.log('[Trace Log - Service] Querying audit claims from MongoDB with query:', query);
    const results = await ExpenseClaim.find(query).sort({ createdAt: -1 });
    console.log(`[Trace Log - Service] Found ${results.length} audit claims in MongoDB.`);
    return results;
  }

  /**
   * Bulk process payment claims and sync transaction lines to Oracle GL
   */
  async bulkProcessClaims(claimIds, action, comments = '', financeId = 'fin_789') {
    console.log(`[Finance Service] Bulk executing action ${action} on claims:`, claimIds);

    const financeEmp = await Employee.findOne({ employeeId: financeId });
    const financeName = financeEmp ? financeEmp.name : 'Finance Officer';

    // Map execution action to final schema state
    let targetStatus = 'Approved';
    let historyAction = 'FINANCE_APPROVED';
    let activityAction = 'CLAIM_APPROVED';

    if (action === 'PROCESS_PAYMENT') {
      targetStatus = 'Reimbursed';
      historyAction = 'REIMBURSED';
      activityAction = 'CLAIM_REIMBURSED';
    } else if (action === 'REJECT_PAYMENT') {
      targetStatus = 'Rejected';
      historyAction = 'REJECTED';
      activityAction = 'CLAIM_REJECTED';
    }

    const results = [];
    for (const claimId of claimIds) {
      const claim = await ExpenseClaim.findOne({ id: claimId });
      if (!claim) {
        console.warn(`[Finance Service] Claim not found: ${claimId}`);
        continue;
      }

      claim.status = targetStatus;
      claim.financeComments = comments || (action === 'PROCESS_PAYMENT' ? 'Payment settled.' : 'Claim rejected by Finance.');

      let syncReceipt = null;

      // Future-Ready design integration: Sync with ERP / Oracle GL
      if (action === 'PROCESS_PAYMENT') {
        const processedPayload = {
          id: claim.id,
          status: 'PROCESSED',
          amount: claim.amount
        };
        syncReceipt = await oracleService.syncExpenseClaim(processedPayload);
        claim.oracleRefId = syncReceipt.oracleRefId;
      }

      claim.history.push({
        action: historyAction,
        user: financeId,
        timestamp: new Date()
      });

      console.log(`[Trace Log - Service] Finance ${financeId} saving processed claim ${claimId} with status ${claim.status} to MongoDB Atlas...`);
      const updatedClaim = await claim.save();
      console.log(`[Trace Log - Service] Claim ${claimId} successfully updated. Document ID: ${updatedClaim._id}, Status: ${updatedClaim.status}`);

      // Log Activity
      await ActivityLog.create({
        userId: financeId,
        userName: financeName,
        action: activityAction,
        claimId,
        amount: updatedClaim.amount,
        details: `Claim processed and ${targetStatus.toLowerCase()} by ${financeName}.`
      });

      // Notify employee
      const notificationId = `NOTIF-EMP-${Date.now()}`;
      await Notification.create({
        id: notificationId,
        userId: updatedClaim.employeeId,
        title: action === 'PROCESS_PAYMENT' ? 'Expense Reimbursed' : 'Expense Rejected by Finance',
        description: action === 'PROCESS_PAYMENT'
          ? `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been reimbursed. Sync key: ${claim.oracleRefId}`
          : `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been rejected by Finance. Remarks: ${claim.financeComments}`,
        type: action === 'PROCESS_PAYMENT' ? 'success' : 'error',
        read: false
      });

      results.push({
        claimId,
        status: updatedClaim.status,
        erpSync: syncReceipt,
      });
    }

    return results;
  }
}

export const financeService = new FinanceService();
