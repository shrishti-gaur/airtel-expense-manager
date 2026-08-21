import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Employee } from '../models/Employee.js';
import { Notification } from '../models/Notification.js';
import { ActivityLog } from '../models/ActivityLog.js';

export class ManagerService {
  /**
   * Fetch expense claims requiring approval from this manager's cost center/department
   */
  async getClaimsPendingApproval(managerId) {
    console.log(`[Manager Service] Fetching pending claims for manager: ${managerId}`);

    // Find the manager's profile
    const manager = await Employee.findOne({ employeeId: managerId });
    if (!manager) {
      return [];
    }

    // Dynamic category-based filtering
    const query = {
      category: { $in: manager.allowedCategories || [] }
    };

    console.log('[Trace Log - Service] Querying pending claims from MongoDB with query:', query);
    const results = await ExpenseClaim.find(query).sort({ createdAt: -1 });
    console.log(`[Trace Log - Service] Found ${results.length} pending claims in MongoDB.`);
    return results;
  }

  /**
   * Approve or return a claim
   */
  async reviewClaim(claimId, managerId, status, remarks) {
    console.log(
      `[Manager Service] Reviewing claim ${claimId} by manager ${managerId}. Outcome: ${status}`
    );

    const claim = await ExpenseClaim.findOne({ id: claimId });
    if (!claim) {
      throw new Error(`Expense claim with ID ${claimId} not found`);
    }

    // SECURITY CHECK: Validate manager permissions on the specific claim's category
    const manager = await Employee.findOne({ employeeId: managerId });
    if (!manager || !manager.allowedCategories.includes(claim.category)) {
      throw new Error('Access denied. Manager does not have permission to review claims under this category.');
    }

    // Manager can approve (status -> Approved) or return (status -> Returned)
    if (!['Approved', 'Returned'].includes(status)) {
      throw new Error(`Invalid status transition by manager: ${status}`);
    }

    claim.status = status;
    claim.managerComments = remarks || '';

    claim.history.push({
      action: status === 'Approved' ? 'APPROVED' : 'RETURNED',
      user: managerId,
      timestamp: new Date(),
    });

    console.log(
      `[Trace Log - Service] Manager ${managerId} saving reviewed claim ${claimId} with status ${status} to MongoDB Atlas...`
    );
    const updatedClaim = await claim.save();
    console.log(
      `[Trace Log - Service] Claim ${claimId} successfully updated. Document ID: ${updatedClaim._id}, Status: ${updatedClaim.status}`
    );

    // Log Activity
    const managerEmp = await Employee.findOne({ employeeId: managerId });
    const managerName = managerEmp ? managerEmp.name : 'Manager';
    await ActivityLog.create({
      userId: managerId,
      userName: managerName,
      action: status === 'Approved' ? 'CLAIM_APPROVED' : 'CLAIM_RETURNED',
      claimId,
      amount: updatedClaim.amount,
      details: `Claim reviewed and ${status.toLowerCase()} by ${managerName}.`,
    });

    // Notify the Employee
    const notificationId = `NOTIF-EMP-${Date.now()}`;
    await Notification.create({
      id: notificationId,
      userId: updatedClaim.employeeId,
      title:
        status === 'Approved' ? 'Expense Approved by Manager' : 'Expense Returned for Correction',
      description:
        status === 'Approved'
          ? `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been approved by ${managerName} and forwarded to Finance.`
          : `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been returned by ${managerName} for correction. Reason: ${remarks}`,
      claimId,
      type: status === 'Approved' ? 'success' : 'warning',
      read: false,
    });

    // Notify Finance if approved
    if (status === 'Approved') {
      const financeNotificationId = `NOTIF-FIN-${Date.now()}`;
      await Notification.create({
        id: financeNotificationId,
        userId: 'fin_789', // default finance
        title: 'New Approved Claim for Audit',
        description: `Claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been approved by ${managerName} and is awaiting your audit.`,
        claimId,
        type: 'info',
        read: false,
      });
    }

    return updatedClaim;
  }

  /**
   * Search claims filed by a specific employee restricted to the manager's allowed categories
   */
  async searchEmployeeClaims(managerId, employeeId) {
    console.log(`[Manager Service] Searching employee ${employeeId} claims for manager: ${managerId}`);

    const manager = await Employee.findOne({ employeeId: managerId });
    if (!manager) {
      throw new Error('Manager profile not found');
    }

    const query = {
      employeeId: { $regex: new RegExp(`^${employeeId.trim()}$`, 'i') },
      category: { $in: manager.allowedCategories || [] }
    };

    console.log('[Trace Log - Service] Searching employee claims with query:', query);
    return await ExpenseClaim.find(query).sort({ createdAt: -1 });
  }
}

export const managerService = new ManagerService();
