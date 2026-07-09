const FollowUp = require("../../models/FollowUp");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { invalidatePatientHealthScoreCache } = require("../../utils/cacheHelpers");

exports.getFollowUps = asyncHandler(async (req, res) => {
  const patientProfile = await Patient.findOne({ userId: req.user._id });
  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  // Daily Overdue / On-the-fly correction
  const now = new Date();
  await FollowUp.updateMany(
    {
      patientId: patientProfile._id,
      status: "pending",
      dueDate: { $lt: now }
    },
    { $set: { status: "overdue" } }
  );

  const filter = { patientId: patientProfile._id };
  const { status } = req.query; // 'upcoming' | 'past' | 'all'

  if (status === "upcoming") {
    filter.status = "pending";
  } else if (status === "past") {
    filter.status = { $in: ["completed", "overdue"] };
  }

  const followUps = await FollowUp.find(filter)
    .populate({
      path: "doctorId",
      select: "fullName specialization userId",
      populate: {
        path: "userId",
        select: "name photo"
      }
    })
    .populate({
      path: "appointmentId",
      select: "dateTime reason notes type prescriptionId clinicId",
      populate: {
        path: "clinicId",
        select: "name"
      }
    })
    .sort({ dueDate: status === "past" ? -1 : 1 }); // Past descending, upcoming ascending

  res.status(200).json(new ApiResponse(200, followUps, "Follow-ups fetched successfully"));
});

exports.completeFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const followUp = await FollowUp.findById(id);
  if (!followUp) {
    throw new ApiError(404, "Follow-up not found");
  }

  const patientProfile = await Patient.findOne({ userId: req.user._id });
  if (!patientProfile || followUp.patientId.toString() !== patientProfile._id.toString()) {
    throw new ApiError(403, "You do not have permission to modify this follow-up");
  }

  if (followUp.status === "completed") {
    throw new ApiError(409, "Already marked complete.");
  }

  followUp.status = "completed";
  followUp.completedAt = new Date();
  await followUp.save();

  await invalidatePatientHealthScoreCache(req.user._id);

  res.status(200).json(new ApiResponse(200, followUp, "Follow-up marked as completed"));
});
