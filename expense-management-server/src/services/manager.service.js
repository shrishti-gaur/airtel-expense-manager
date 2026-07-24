/**
 * Manager Service Placeholder
 */
export class ManagerService {
  /**
   * Fetch expense claims requiring approval from this manager's cost center
   * TODO: Add database lookup filtering by costCenter and PENDING_APPROVAL status.
   */
  async getClaimsPendingApproval(managerId) {
    console.log(`[Manager Service] Fetching pending claims for manager: ${managerId}`);
    return [
      {
        id: 'EXP-99',
        userId: 'emp_123',
        userName: 'John Employee',
        amount: 2500,
        category: 'Travel',
        description: 'Client visit travel tickets',
        date: new Date(),
        status: 'PENDING_APPROVAL',
      },
    ];
  }

  /**
   * Approve or reject a claim
   * TODO: Update status in database.
   */
  async reviewClaim(claimId, managerId, status, remarks) {
    console.log(`[Manager Service] Reviewing claim ${claimId} by manager ${managerId}. Outcome: ${status}`);
    return {
      id: claimId,
      status,
      remarks,
      reviewedBy: managerId,
      reviewedAt: new Date(),
    };
  }
}

export const managerService = new ManagerService();
