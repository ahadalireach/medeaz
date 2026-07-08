const cron = require("node-cron");
const FollowUp = require("../models/FollowUp");
const { createNotification } = require("../utils/notification");
const { getIO } = require("../config/socket");

// 1. Hourly cron for 24h reminder
cron.schedule("0 * * * *", async () => {
  try {
    const now = Date.now();
    const windowStart = new Date(now + 23 * 3600 * 1000);
    const windowEnd   = new Date(now + 25 * 3600 * 1000);

    const due = await FollowUp.find({
      status: "pending",
      dueDate: { $gte: windowStart, $lte: windowEnd },
      reminderSent24h: false
    }).populate([
      {
        path: "patientId",
        select: "userId"
      },
      {
        path: "doctorId",
        select: "fullName"
      }
    ]);

    const io = getIO();

    for (const f of due) {
      if (!f.patientId?.userId) continue;

      const doctorName = f.doctorId?.fullName || "Doctor";
      const messageText = `Reminder: Your follow-up with Dr. ${doctorName} is tomorrow.`;

      // Save to database & emit Socket.IO notification (bell feed)
      await createNotification(io, {
        recipient: f.patientId.userId,
        title: "Follow-Up Reminder",
        message: messageText,
        type: "follow_up_reminder",
        link: "/patient/follow-ups",
        portal: "patient"
      });

      // Emit specific Socket.IO event 'follow_up_reminder' (toast listener)
      if (io) {
        io.to(f.patientId.userId.toString()).emit("follow_up_reminder", {
          type: "follow_up_reminder",
          message: messageText
        });
      }

      // Prevent duplicate reminder
      f.reminderSent24h = true;
      await f.save();
    }
  } catch (error) {
    console.error("[Cron Error] Follow-up reminder job failed:", error.message);
  }
});

// 2. Daily cron to mark overdue
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const result = await FollowUp.updateMany(
      {
        status: "pending",
        dueDate: { $lt: now }
      },
      {
        $set: { status: "overdue" }
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`[Cron] Marked ${result.modifiedCount} pending follow-ups as overdue.`);
    }
  } catch (error) {
    console.error("[Cron Error] Daily overdue check failed:", error.message);
  }
});

console.log("[Cron] Follow-up reminder jobs initialized.");
