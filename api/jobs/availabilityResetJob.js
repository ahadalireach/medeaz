const cron = require("node-cron");
const Doctor = require("../models/Doctor");
const { getIO } = require("../config/socket");

// Reset doctor status daily at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily midnight Doctor availability reset job...");

  try {
    // Find all doctors who are currently busy
    const busyDoctors = await Doctor.find({ availabilityStatus: "busy" });

    if (busyDoctors.length > 0) {
      await Doctor.updateMany(
        { availabilityStatus: "busy" },
        {
          $set: {
            availabilityStatus: "available",
            statusUpdatedAt: new Date(),
            statusUpdatedBy: "doctor",
          },
        }
      );

      console.log(`Reset status for ${busyDoctors.length} busy doctor(s) to 'available'.`);

      // Emit socket events for each updated doctor
      const io = getIO();
      if (io) {
        busyDoctors.forEach((doc) => {
          io.emit("doctor_availability_changed", {
            doctorId: doc._id,
            status: "available",
            updatedBy: "doctor",
          });
        });
      }
    }
  } catch (error) {
    console.error("Error executing Doctor availability reset job:", error);
  }
});
