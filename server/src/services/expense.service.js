/**
 * Expense Service Placeholder
 */
export class ExpenseService {
  /**
   * Submit a new expense record
   * TODO: Add Mongoose schemas and integrate with database/Oracle ERP sync.
   */
  async createClaim(userId, claimData) {
    console.log(`[Expense Service] Creating claim for user ${userId}:`, claimData);
    
    return {
      id: `EXP-${Date.now()}`,
      userId,
      ...claimData,
      status: 'PENDING_APPROVAL',
      history: [
        {
          action: 'SUBMITTED',
          user: userId,
          timestamp: new Date(),
        },
      ],
      createdAt: new Date(),
    };
  }

  /**
   * Get all expense records belonging to a user
   */
  async getClaimsByUser(userId) {
    console.log(`[Expense Service] Fetching claims for user ${userId}`);
    // Return mock database list
    return [
      {
        id: 'EXP-1',
        userId,
        amount: 2500,
        category: 'Travel',
        description: 'Client visit travel tickets',
        date: new Date(),
        status: 'PENDING_APPROVAL',
      },
      {
        id: 'EXP-2',
        userId,
        amount: 450,
        category: 'Meals',
        description: 'Working lunch with partner',
        date: new Date(Date.now() - 86400000),
        status: 'APPROVED',
      },
    ];
  }
}

export const expenseService = new ExpenseService();
