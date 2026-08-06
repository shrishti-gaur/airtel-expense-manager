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
    } else if (action === 'RETURN_TO_MANAGER') {
      targetStatus = 'Submitted';
      historyAction = 'FINANCE_RETURNED';
      activityAction = 'CLAIM_RETURNED_TO_MANAGER';
    }

    const results = [];
    for (const claimId of claimIds) {
      const claim = await ExpenseClaim.findOne({ id: claimId });
      if (!claim) {
        console.warn(`[Finance Service] Claim not found: ${claimId}`);
        continue;
      }

      claim.status = targetStatus;
      claim.financeComments =
        comments ||
        (action === 'PROCESS_PAYMENT' 
          ? 'Payment settled.' 
          : action === 'RETURN_TO_MANAGER'
            ? 'Claim returned to manager by Finance.'
            : 'Claim rejected by Finance.');

      let syncReceipt = null;

      // Future-Ready design integration: Sync with ERP / Oracle GL
      if (action === 'PROCESS_PAYMENT') {
        const processedPayload = {
          id: claim.id,
          status: 'PROCESSED',
          amount: claim.amount,
        };
        syncReceipt = await oracleService.syncExpenseClaim(processedPayload);
        claim.oracleRefId = syncReceipt.oracleRefId;
      }

      claim.history.push({
        action: historyAction,
        user: financeId,
        timestamp: new Date(),
      });

      console.log(
        `[Trace Log - Service] Finance ${financeId} saving processed claim ${claimId} with status ${claim.status} to MongoDB Atlas...`
      );
      const updatedClaim = await claim.save();
      console.log(
        `[Trace Log - Service] Claim ${claimId} successfully updated. Document ID: ${updatedClaim._id}, Status: ${updatedClaim.status}`
      );

      // Log Activity
      await ActivityLog.create({
        userId: financeId,
        userName: financeName,
        action: activityAction,
        claimId,
        amount: updatedClaim.amount,
        details: action === 'RETURN_TO_MANAGER' 
          ? `Claim returned to manager by ${financeName}.`
          : `Claim processed and ${targetStatus.toLowerCase()} by ${financeName}.`,
      });

      // Role-Based Notifications
      if (action === 'RETURN_TO_MANAGER') {
        // 1. Notify Manager: "Finance returned a claim for review"
        await Notification.create({
          id: `NOTIF-MGR-${Date.now()}-${claimId}`,
          userId: 'mgr_456', // default manager
          title: 'Finance Returned Claim for Review',
          description: `Claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been returned by Finance for your review. Remarks: ${claim.financeComments}`,
          claimId,
          type: 'warning',
          read: false,
          timestamp: new Date(),
        });

        // 2. Notify Finance: "Claim returned to Manager"
        await Notification.create({
          id: `NOTIF-FIN-${Date.now()}-${claimId}`,
          userId: financeId,
          title: 'Claim Returned to Manager',
          description: `You have returned claim ${claimId} to the manager for review.`,
          claimId,
          type: 'warning',
          read: false,
          timestamp: new Date(),
        });
      } else {
        // Notify employee
        await Notification.create({
          id: `NOTIF-EMP-${Date.now()}-${claimId}`,
          userId: updatedClaim.employeeId,
          title: action === 'PROCESS_PAYMENT' ? 'Claim Synced to Oracle ERP' : 'Expense Rejected by Finance',
          description:
            action === 'PROCESS_PAYMENT'
              ? `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been reimbursed and synced to Oracle ERP. Ref: ${claim.oracleRefId}`
              : `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been rejected by Finance. Remarks: ${claim.financeComments}`,
          claimId,
          type: action === 'PROCESS_PAYMENT' ? 'success' : 'error',
          read: false,
          timestamp: new Date(),
        });

        if (action === 'PROCESS_PAYMENT') {
          // Notify Manager: "Claim synced to Oracle ERP"
          await Notification.create({
            id: `NOTIF-MGR-${Date.now()}-${claimId}`,
            userId: 'mgr_456',
            title: 'Claim Synced to Oracle ERP',
            description: `Claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} by ${updatedClaim.employeeName} has been synced to Oracle ERP. Ref: ${claim.oracleRefId}`,
            claimId,
            type: 'success',
            read: false,
            timestamp: new Date(),
          });

          // Notify Finance: "Claim synced to Oracle ERP"
          await Notification.create({
            id: `NOTIF-FIN-${Date.now()}-${claimId}`,
            userId: financeId,
            title: 'Claim Synced to Oracle ERP',
            description: `Claim ${claimId} has been successfully synced to Oracle ERP. Ref: ${claim.oracleRefId}`,
            claimId,
            type: 'success',
            read: false,
            timestamp: new Date(),
          });
        }
      }

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
