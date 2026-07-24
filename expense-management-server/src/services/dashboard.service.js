/**
 * Dashboard Service Placeholder
 */
export class DashboardService {
  /**
   * Fetch statistical aggregates based on user role and date ranges
   * TODO: Implement database aggregations.
   */
  async getMetrics(userId, role, _options = {}) {
    console.log(`[Dashboard Service] Building metrics for user: ${userId} (${role})`);

    const defaultMetrics = {
      Employee: {
        totalSubmittedClaims: 5,
        totalSubmittedAmount: 3200,
        pendingAmount: 2500,
        approvedAmount: 700,
        recentActivity: [
          { type: 'CLAIM_SUBMITTED', title: 'Travel tickets', status: 'PENDING_APPROVAL', amount: 2500, date: new Date() },
          { type: 'CLAIM_APPROVED', title: 'Lunch meeting', status: 'APPROVED', amount: 450, date: new Date(Date.now() - 86400000) },
        ],
      },
      Manager: {
        totalPendingReviews: 1,
        totalTeamSubmittedAmount: 5200,
        totalApprovedThisMonth: 12000,
        recentRequests: [
          { id: 'EXP-99', userName: 'John Employee', amount: 2500, category: 'Travel', date: new Date() },
        ],
      },
      Finance: {
        totalDisbursedThisMonth: 145000,
        pendingPayoutAmount: 43200,
        unprocessedClaimsCount: 12,
        auditAlertsCount: 2,
        payoutsTimeline: [
          { month: 'May', amount: 98000 },
          { month: 'Jun', amount: 110000 },
          { month: 'Jul', amount: 145000 },
        ],
      },
    };

    return defaultMetrics[role] || defaultMetrics['Employee'];
  }
}

export const dashboardService = new DashboardService();
