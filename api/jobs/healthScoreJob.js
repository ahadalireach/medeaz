const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const PatientScore = require("../models/PatientScore");
const { computeHealthScore } = require("../services/healthScoreService");
const { invalidatePatientHealthScoreCache } = require("../utils/cacheHelpers");

/**
 * No-Show Auto-Flagging Job
 * Runs every 10 minutes to find appointments still 'pending' or 'confirmed'
 * 2 hours after their scheduled dateTime, and marks them as 'no-show'.
 */
cron.schedule("*/10 * * * *", async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    // Find appointments that are past due by 2+ hours and still in 'pending' or 'confirmed' status
    const overdueAppointments = await Appointment.find({
      status: { $in: ["pending", "confirmed"] },
      dateTime: { $lt: twoHoursAgo },
    });

    if (overdueAppointments.length > 0) {
      console.log(`[Cron] Found ${overdueAppointments.length} appointments to mark as no-show.`);
      
      for (const appt of overdueAppointments) {
        appt.status = "no-show";
        await appt.save();
        
        // Invalidate health score cache for this patient
        await invalidatePatientHealthScoreCache(appt.patientId);
      }
      
      console.log(`[Cron] Successfully marked ${overdueAppointments.length} appointments as no-show and invalidated their caches.`);
    }
  } catch (err) {
    console.error("[Cron Error] No-show auto-flagging job failed:", err.message);
  }
});

/**
 * Daily Health Engagement Score Pre-computation Job
 * Runs at 3 AM daily to pre-compute and store scores in the MongoDB PatientScore collection.
 */
cron.schedule("0 3 * * *", async () => {
  try {
    console.log("[Cron] Starting daily health engagement score pre-computation...");
    
    // Find all users who are patients
    const patients = await User.find({ roles: "patient" }).select("_id");
    console.log(`[Cron] Found ${patients.length} patients to pre-compute scores for.`);

    let successCount = 0;
    for (const patient of patients) {
      try {
        const result = await computeHealthScore(patient._id);
        
        // Upsert into PatientScore collection
        await PatientScore.findOneAndUpdate(
          { patientId: patient._id },
          {
            score: result.score,
            breakdown: result.breakdown,
            computedAt: new Date(),
          },
          { upsert: true, new: true }
        );
        
        // Also pre-emptively cache in Redis
        const cacheKey = `patient_health_score_${patient._id}`;
        const { setCache } = require("../utils/cacheHelpers");
        await setCache(cacheKey, result, 21600); // 6 hours TTL

        successCount++;
      } catch (err) {
        console.error(`[Cron Error] Failed to compute score for patient ${patient._id}:`, err.message);
      }
    }

    console.log(`[Cron] Finished daily pre-computation. Successfully processed ${successCount}/${patients.length} patients.`);
  } catch (err) {
    console.error("[Cron Error] Daily health score pre-computation job failed:", err.message);
  }
});

console.log("[Cron] Health Engagement Score jobs registered.");
