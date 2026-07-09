const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const { googleAuth } = require("../controllers/auth/googleAuthController");
const {
  markComplete,
  markProfileComplete,
} = require("../controllers/onboardingController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/verify/:token", verifyEmail);
router.post("/login", loginUser);
router.post("/google", googleAuth);
router.post("/logout", protect, logoutUser);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.patch("/onboarding/complete", protect, markComplete);
router.patch("/onboarding/profile-complete", protect, markProfileComplete);

router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;
