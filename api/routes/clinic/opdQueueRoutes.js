const express = require("express");
const router = express.Router();
const { protect } = require("../../middleware/authMiddleware");
const {
  issueToken,
  listTodayQueue,
  callToken,
  completeToken,
  skipToken,
  getPublicDisplayData,
} = require("../../controllers/clinic/opdQueueController");

// PUBLIC route (waiting room TV screen kiosk)
router.get("/display/:clinicId", getPublicDisplayData);

// PROTECTED routes (clinic admins, receptionists, and practicing doctors)
router.post("/", protect, issueToken);
router.get("/", protect, listTodayQueue);
router.put("/:tokenId/call", protect, callToken);
router.put("/:tokenId/complete", protect, completeToken);
router.put("/:tokenId/skip", protect, skipToken);

module.exports = router;
