const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const Clinic = require("../models/Clinic");
const searchRateLimit = require("../middleware/searchRateLimit");

const analyticsController = require("../controllers/clinic/analyticsController");
const doctorController = require("../controllers/clinic/doctorController");
const appointmentController = require("../controllers/clinic/appointmentController");
const settingsController = require("../controllers/clinic/settingsController");
const staffController = require("../controllers/clinic/staffController");
const patientController = require("../controllers/clinic/patientController");
const connectionRequestController = require("../controllers/clinic/connectionRequestController");
const performanceController = require("../controllers/clinic/performanceController");

const attachClinicId = async (req, res, next) => {
  try {
    let clinic = await Clinic.findOne({ 
      $or: [
        { adminId: req.user._id },
        { email: req.user.email }
      ]
    });
    if (!clinic) {
      clinic = await Clinic.create({
        adminId: req.user._id,
        name: `${req.user.name || "My"} Clinic`,
        email: req.user.email,
        address: "Please update clinic address",
        phone: req.user.phone || "0000000000",
        doctors: [],
        staff: [],
      });
    } else if (clinic.adminId?.toString() !== req.user._id.toString()) {
      clinic.adminId = req.user._id;
      await clinic.save();
    }
    req.user.clinicId = clinic._id;
    next();
  } catch (error) {
    next(error);
  }
};

router.use(protect);
router.use(authorize("clinic_admin"));
router.use(attachClinicId);

router.get("/analytics/overview", analyticsController.getOverview);
router.get("/analytics/patient-flow", analyticsController.getPatientFlow);
router.get("/analytics/revenue", analyticsController.getRevenue);

// Performance routes
router.get("/performance/export", performanceController.exportCSV);
router.get("/performance/:doctorId", performanceController.getDoctorDetail);
router.get("/performance", performanceController.getLeaderboard);

// Revenue history routes (supporting both formats for robustness)
router.get("/analytics/revenue/history", analyticsController.getRevenueHistory);
router.get("/analytics/revenue-history", analyticsController.getRevenueHistory);
router.delete("/analytics/revenue/history/:id", analyticsController.deleteRevenueHistoryRecord);
router.delete("/analytics/revenue-history/:id", analyticsController.deleteRevenueHistoryRecord);
router.delete("/analytics/revenue/history", analyticsController.clearRevenueHistory);
router.delete("/analytics/revenue-history", analyticsController.clearRevenueHistory);

router.get("/doctors", searchRateLimit, doctorController.getDoctors);
router.get("/doctors/search", searchRateLimit, doctorController.searchDoctorByEmail);
router.post("/doctors", doctorController.addDoctor); // Legacy route, keeping for backward compatibility if needed
router.delete("/doctors/:id", doctorController.removeDoctor);
router.get("/doctors/:id/stats", doctorController.getDoctorStats);

// Connection Requests
router.post("/connection-requests", connectionRequestController.sendRequest);
router.get("/connection-requests", connectionRequestController.getSentRequests);
router.delete("/connection-requests/:requestId", connectionRequestController.cancelRequest);
router.patch("/doctors/:id/availability", doctorController.overrideAvailability);

router.get("/appointments", appointmentController.getAppointments);
router.post("/appointments", appointmentController.createAppointment);
router.get("/appointments/:id", appointmentController.getAppointmentById);
router.delete("/appointments/:id", appointmentController.deleteAppointment);
router.get("/prescriptions", appointmentController.getPrescriptions);
router.delete("/prescriptions/:id", appointmentController.deletePrescription);

router.get("/settings", settingsController.getSettings);
router.put("/settings", settingsController.updateSettings);

router.get("/staff", staffController.getStaff);
router.post("/staff", staffController.createStaff);
router.put("/staff/:id", staffController.updateStaff);
router.delete("/staff/:id", staffController.deleteStaff);

router.get("/patients", searchRateLimit, patientController.getPatients);
router.post("/patients", patientController.createPatient);
router.get("/patients/search", searchRateLimit, patientController.searchPatients);
router.get("/patients/:id", patientController.getPatientProfile);
router.delete("/patients/records/:id", patientController.deleteRecord);

// ========== Clinic Reviews Management Routes ==========
const adminReviewsController = require("../controllers/clinic/reviewsController");
router.get("/reviews/export", adminReviewsController.exportReviewsCsv);
router.get("/reviews/analytics", adminReviewsController.getReviewAnalytics);
router.get("/reviews", adminReviewsController.getClinicReviews);
router.put("/reviews/:reviewId/respond", adminReviewsController.respondToReview);
router.put("/reviews/:reviewId/status", adminReviewsController.updateReviewStatus);

module.exports = router;
