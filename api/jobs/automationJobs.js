const cron = require('node-cron');
const Appointment = require('../models/Appointment');

/**
 * Reservation Cleanup Job
 * Runs every minute to delete 'reserved' appointments that haven't been finalized within 5 minutes.
 */
cron.schedule('* * * * *', async () => {
    try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        const result = await Appointment.deleteMany({
            status: 'reserved',
            createdAt: { $lt: fiveMinsAgo }
        });

        if (result.deletedCount > 0) {
            console.log(`[Cron] Deleted ${result.deletedCount} expired reserved appointments.`);
        }
    } catch (err) {
        console.error('[Cron Error] Reservation cleanup failed:', err.message);
    }
});

/**
 * Overdue Appointment Auto-Cancellation Job
 * Runs every minute to mark past appointments that are not completed/cancelled/no-show as 'cancelled'.
 */
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        const result = await Appointment.updateMany(
            {
                status: { $in: ['pending', 'confirmed', 'reserved'] },
                dateTime: { $lt: now }
            },
            {
                $set: { status: 'cancelled' }
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[Cron] Marked ${result.modifiedCount} overdue appointments as cancelled.`);
        }
    } catch (err) {
        console.error('[Cron Error] Past appointments cancellation failed:', err.message);
    }
});

require('./followUpReminderJob');
require('./healthScoreJob');

console.log('[Cron] Automation jobs initialized.');
