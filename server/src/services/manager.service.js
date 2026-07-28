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
    
    // Managers review claims with status 'Submitted'
    const query = { status: 'Submitted' };
    
    // Restrict manager to Engineering and Sales department claims (matching mock data filters)
    if (manager) {
      query.department = { $in: ['Engineering', 'Sales'] };
    }

    console.log(`[Trace Log - Service] Querying pending claims from MongoDB with query:`, query);
    const results = await ExpenseClaim.find(query).sort({ createdAt: -1 });
    console.log(`[Trace Log - Service] Found ${results.length} pending claims in MongoDB.`);
    return results;
  }

  /**
   * Approve or return a claim
   */
  async reviewClaim(claimId, managerId, status, remarks) {
    console.log(`[Manager Service] Reviewing claim ${claimId} by manager ${managerId}. Outcome: ${status}`);

    const claim = await ExpenseClaim.findOne({ id: claimId });
    if (!claim) {
      throw new Error(`Expense claim with ID ${claimId} not found`);
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
      timestamp: new Date()
    });

    console.log(`[Trace Log - Service] Manager ${managerId} saving reviewed claim ${claimId} with status ${status} to MongoDB Atlas...`);
    const updatedClaim = await claim.save();
    console.log(`[Trace Log - Service] Claim ${claimId} successfully updated. Document ID: ${updatedClaim._id}, Status: ${updatedClaim.status}`);

    // Log Activity
    const managerEmp = await Employee.findOne({ employeeId: managerId });
    const managerName = managerEmp ? managerEmp.name : 'Manager';
    await ActivityLog.create({
      userId: managerId,
      userName: managerName,
      action: status === 'Approved' ? 'CLAIM_APPROVED' : 'CLAIM_RETURNED',
      claimId,
      amount: updatedClaim.amount,
      details: `Claim reviewed and ${status.toLowerCase()} by ${managerName}.`
    });

    // Notify the Employee
    const notificationId = `NOTIF-EMP-${Date.now()}`;
    await Notification.create({
      id: notificationId,
      userId: updatedClaim.employeeId,
      title: status === 'Approved' ? 'Expense Approved by Manager' : 'Expense Returned for Correction',
      description: status === 'Approved'
        ? `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been approved by ${managerName} and forwarded to Finance.`
        : `Your claim ${claimId} for ₹${updatedClaim.amount.toLocaleString('en-IN')} has been returned by ${managerName} for correction. Reason: ${remarks}`,
      type: status === 'Approved' ? 'success' : 'warning',
      read: false
    });

    return updatedClaim;
  }
}

export const managerService = new ManagerService();
