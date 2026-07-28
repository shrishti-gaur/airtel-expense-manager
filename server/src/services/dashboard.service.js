import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { ActivityLog } from '../models/ActivityLog.js';

export class DashboardService {
  /**
   * Fetch statistical aggregates based on user role and date ranges
   */
  async getMetrics(userId, role, _options = {}) {
    console.log(`[Dashboard Service] Building metrics for user: ${userId} (${role})`);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    if (role === 'Employee') {
      // 1. Employee Dashboard Stats
      const stats = await ExpenseClaim.aggregate([
        { $match: { employeeId: userId } },
        {
          $group: {
            _id: null,
            totalSubmittedClaims: {
              $sum: { $cond: [{ $ne: ['$status', 'Draft'] }, 1, 0] }
            },
            totalSubmittedAmount: {
              $sum: { $cond: [{ $ne: ['$status', 'Draft'] }, '$amount', 0] }
            },
            pendingAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, '$amount', 0] }
            },
            approvedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, '$amount', 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalSubmittedClaims: 0,
        totalSubmittedAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0
      };

      // Fetch recent activity logs
      const rawLogs = await ActivityLog.find({ userId })
        .sort({ timestamp: -1 })
        .limit(5);

      const recentActivity = rawLogs.map(log => ({
        type: log.action,
        title: log.details || 'Expense Action',
        status: log.action.replace('CLAIM_', ''),
        amount: log.amount || 0,
        date: log.timestamp
      }));

      return {
        ...result,
        recentActivity
      };
    }

    if (role === 'Manager') {
      // 2. Manager Dashboard Stats
      const stats = await ExpenseClaim.aggregate([
        { $match: { department: { $in: ['Engineering', 'Sales'] } } },
        {
          $group: {
            _id: null,
            totalPendingReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, 1, 0] }
            },
            totalTeamSubmittedAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Submitted'] }, '$amount', 0] }
            },
            totalApprovedThisMonth: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $in: ['$status', ['Approved', 'Reimbursed']] },
                      { $gte: ['$updatedAt', startOfMonth] }
                    ]
                  },
                  '$amount',
                  0
                ]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalPendingReviews: 0,
        totalTeamSubmittedAmount: 0,
        totalApprovedThisMonth: 0
      };

      // Fetch pending requests for dashboard display
      const pendingClaims = await ExpenseClaim.find({
        department: { $in: ['Engineering', 'Sales'] },
        status: 'Submitted'
      })
        .sort({ createdAt: -1 })
        .limit(5);

      const recentRequests = pendingClaims.map(claim => ({
        id: claim.id,
        userName: claim.employeeName,
        amount: claim.amount,
        category: claim.category,
        date: claim.submissionDate || claim.createdAt
      }));

      return {
        ...result,
        recentRequests
      };
    }

    if (role === 'Finance') {
      // 3. Finance Dashboard Stats
      const stats = await ExpenseClaim.aggregate([
        {
          $group: {
            _id: null,
            totalDisbursedThisMonth: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'Reimbursed'] },
                      { $gte: ['$updatedAt', startOfMonth] }
                    ]
                  },
                  '$amount',
                  0
                ]
              }
            },
            pendingPayoutAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, '$amount', 0] }
            },
            unprocessedClaimsCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
            },
            auditAlertsCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$ocrOverallScore', 80] },
                      { $in: ['$status', ['Submitted', 'Approved']] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalDisbursedThisMonth: 0,
        pendingPayoutAmount: 0,
        unprocessedClaimsCount: 0,
        auditAlertsCount: 0
      };

      // Build payout timeline (last 3 months)
      const currentYear = new Date().getFullYear();
      const timelineAgg = await ExpenseClaim.aggregate([
        {
          $match: {
            status: 'Reimbursed',
            updatedAt: { $gte: new Date(`${currentYear}-01-01`) }
          }
        },
        {
          $group: {
            _id: { $month: '$updatedAt' },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const payoutsTimeline = timelineAgg.map(item => ({
        month: monthNames[item._id - 1],
        amount: item.amount
      }));

      // If timeline is empty, fill with default months matching system defaults
      if (payoutsTimeline.length === 0) {
        payoutsTimeline.push(
          { month: 'May', amount: 0 },
          { month: 'Jun', amount: 0 },
          { month: 'Jul', amount: result.totalDisbursedThisMonth }
        );
      }

      return {
        ...result,
        payoutsTimeline
      };
    }

    return {};
  }

  /**
   * Fetch all activity logs (recent logs filtered by permission)
   */
  async getActivityLogs(userId, role) {
    console.log(`[Dashboard Service] Fetching activity logs for ${userId} (${role})`);
    if (role === 'Employee') {
      return await ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(100);
    }
    // Managers and Finance can view all activity logs
    return await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
  }
}

export const dashboardService = new DashboardService();
