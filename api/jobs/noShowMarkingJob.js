const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const PatientScore = require("../models/PatientScore");
const { getRedisClient } = require("../config/redis"); // Ensure redis import is correct if redis is used, let's adapt it to our environment

// Check if we use Redis from config/redis.js, or if I should just use `redis` client
// For now, I'll use standard DB updates to PatientScore, and if redis is available, delete it.
const redis = require("../config/redis")?.redisClient || null; // This depends on Medeaz structure

cron.schedule("*/15 * * * *", async () => {
  console.log("Running no-show marking job...");
  const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min grace period

  try {
    // 1. Mark appointments as no-show
    const result = await Appointment.updateMany(
      {
        dateTime: { $lte: cutoff },
        status: { $in: ["pending", "confirmed"] }
      },
      {
        $set: {
          status: "no-show",
          noShowMarkedAt: new Date(),
          noShowReason: "auto_timeout"
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`Marked ${result.modifiedCount} appointments as no-show`);

      // 2. Find affected patients
      const affectedPatients = await Appointment.find({
        dateTime: { $lte: cutoff },
        status: "no-show",
        noShowMarkedAt: { $gte: new Date(Date.now() - 20 * 60 * 1000) }
      }).distinct("patientId");

      // 3. Invalidate scores
      for (const patientId of affectedPatients) {
        await PatientScore.deleteOne({ patientId });
        
        try {
          if (redis) {
            await redis.del(`patient_health_score_${patientId}`);
          }
        } catch (redisErr) {
          console.error("Redis error in noShowMarkingJob:", redisErr);
        }
      }
      console.log(`Invalidated health scores for ${affectedPatients.length} patients`);
    }
  } catch (error) {
    console.error("Error in no-show marking job:", error);
  }
});
