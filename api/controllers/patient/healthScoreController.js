const { computeHealthScore } = require("../../services/healthScoreService");
const { getCache, setCache } = require("../../utils/cacheHelpers");
const Appointment = require("../../models/Appointment");
const Clinic = require("../../models/Clinic");
const Staff = require("../../models/Staff");
const User = require("../../models/User");

/**
 * GET /api/patient/:id/health-score
 * Retrieves the Health Engagement Score for a specific patient.
 * Performs authorization checks and implements Redis caching with a 6-hour TTL.
 */
exports.getHealthScore = async (req, res) => {
  try {
    const patientId = req.params.id;
    const currentUserId = req.user._id.toString();
    const currentUserRoles = req.user.roles || [req.user.role];

    // ==========================================
    // 1. Role-Based Authorization Checks
    // ==========================================
    const isPatientSelf = currentUserId === patientId;
    const isDoc = currentUserRoles.includes("doctor");
    const isAdmin = currentUserRoles.includes("clinic_admin");

    if (!isPatientSelf && !isDoc && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this patient's health engagement score.",
      });
    }

    // Doctor authorization: verify appointment history with this patient
    if (isDoc && !isPatientSelf) {
      const hasAppointment = await Appointment.exists({
        doctorId: req.user._id,
        patientId: patientId,
      });
      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: "Authorization failed: You must have an appointment history with this patient to view their score.",
        });
      }
    }

    // Clinic admin authorization: verify patient has an appointment at a clinic they manage
    if (isAdmin && !isPatientSelf) {
      let clinicId = null;

      // Check if they directly own a clinic
      const ownedClinic = await Clinic.findOne({ adminId: req.user._id });
      if (ownedClinic) {
        clinicId = ownedClinic._id;
      } else {
        // Check if they are a registered staff member under a clinic
        const staffProfile = await Staff.findOne({ userId: req.user._id });
        if (staffProfile) {
          clinicId = staffProfile.clinicId;
        }
      }

      if (!clinicId) {
        return res.status(403).json({
          success: false,
          message: "Authorization failed: Clinic profile not found for this administrator.",
        });
      }

      const hasClinicAppointment = await Appointment.exists({
        clinicId: clinicId,
        patientId: patientId,
      });

      if (!hasClinicAppointment) {
        return res.status(403).json({
          success: false,
          message: "Authorization failed: This patient has no appointment records at your clinic.",
        });
      }
    }

    // Verify patient actually exists in the User collection
    const patientExists = await User.findById(patientId);
    if (!patientExists) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }

    // ==========================================
    // 2. Cache Orchestration (Redis, 6h TTL)
    // ==========================================
    const cacheKey = `patient_health_score_${patientId}`;
    
    // Attempt cache hit
    const cachedScore = await getCache(cacheKey);
    if (cachedScore) {
      return res.status(200).json({
        success: true,
        source: "cache",
        data: cachedScore,
      });
    }

    // Cache miss: compute fresh score
    const computedResult = await computeHealthScore(patientId);
    computedResult.computedAt = new Date().toISOString();

    // Store in Redis with a 6-hour TTL (21600 seconds)
    await setCache(cacheKey, computedResult, 21600);

    return res.status(200).json({
      success: true,
      source: "compute",
      data: computedResult,
    });
  } catch (error) {
    console.error("Error in getHealthScore controller:", error);
    return res.status(500).json({
      success: false,
      message: "An internal server error occurred while retrieving the health engagement score.",
      error: error.message,
    });
  }
};
