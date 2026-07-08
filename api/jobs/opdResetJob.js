const cron = require("node-cron");
const OPDToken = require("../models/OPDToken");

// Reset OPD tokens daily at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily midnight OPD Queue cleanup & reset job...");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const result = await OPDToken.updateMany(
      {
        status: "waiting",
        createdAt: { $lt: startOfToday },
      },
      {
        $set: { status: "expired" },
      }
    );
    console.log(`Expired ${result.modifiedCount || result.nModified || 0} unserved tokens from yesterday.`);
  } catch (error) {
    console.error("Error executing OPD Queue reset job:", error);
  }
});
