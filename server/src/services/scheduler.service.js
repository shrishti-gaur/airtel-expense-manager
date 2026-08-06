import { ExpenseClaim } from '../models/ExpenseClaim.js';
import { Notification } from '../models/Notification.js';

/**
 * Heuristically check if a claim has been in 'Submitted' status for over 7 days,
 * and if so, send a warning reminder notification to the default manager (mgr_456).
 */
export const runPendingClaimsCheck = async () => {
  console.log('[Scheduler] Auditing claims pending manager review for 7+ days...');
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find claims that are 'Submitted' and submitted/updated more than 7 days ago
    const pendingClaims = await ExpenseClaim.find({
      status: 'Submitted',
      submissionDate: { $lte: sevenDaysAgo }
    });

    console.log(`[Scheduler] Found ${pendingClaims.length} pending claims needing reminder.`);

    for (const claim of pendingClaims) {
      // Find if we already sent a reminder notification for this claim and manager
      const existingReminder = await Notification.findOne({
        userId: 'mgr_456',
        claimId: claim.id,
        title: 'Action Required: Pending Expense Review'
      });

      if (!existingReminder) {
        console.log(`[Scheduler] Generating 7-day warning reminder for claim ${claim.id} to manager`);
        const notificationId = `NOTIF-REMINDER-${claim.id}-${Date.now()}`;
        await Notification.create({
          id: notificationId,
          userId: 'mgr_456', // default manager
          title: 'Action Required: Pending Expense Review',
          description: `Claim ${claim.id} from ${claim.employeeName} has been awaiting your approval for over 7 days.`,
          claimId: claim.id,
          type: 'warning',
          read: false,
          timestamp: new Date(),
        });
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error checking pending claims:', err);
  }
};

export const schedulerService = {
  start() {
    console.log('[Scheduler Service] Starting background scheduler tasks...');
    // Run once immediately on startup
    runPendingClaimsCheck();

    // Check periodically every hour (3600000 ms)
    setInterval(runPendingClaimsCheck, 3600000);
  }
};
