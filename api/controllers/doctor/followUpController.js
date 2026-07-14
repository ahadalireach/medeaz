const FollowUp = require("../../models/FollowUp");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const User = require("../../models/User");
const { createNotification } = require("../../utils/notification");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { invalidatePatientHealthScoreCache } = require("../../utils/cacheHelpers");

exports.createFollowUp = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  
  let patientProfile = await Patient.findOne({ userId: patientId });
  if (!patientProfile) {
    patientProfile = await Patient.findById(patientId);
  }
  if (!patientProfile) {
    throw new ApiError(404, "Patient profile not found");
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user._id });
  if (!doctorProfile) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const { dueDate, notes, appointmentId } = req.body;

  if (!dueDate) {
    throw new ApiError(400, "Due date is required");
  }

  const dueDateObj = new Date(dueDate);
  if (isNaN(dueDateObj.getTime())) {
    throw new ApiError(400, "Invalid due date format");
  }

  if (dueDateObj <= new Date()) {
    throw new ApiError(400, "Follow-up date must be in the future.");
  }

  const followUp = await FollowUp.create({
    patientId: patientProfile._id,
    doctorId: doctorProfile._id,
    appointmentId: appointmentId || null,
    dueDate: dueDateObj,
    notes: notes || "",
    status: "pending"
  });

  await invalidatePatientHealthScoreCache(patientProfile.userId);

  const io = req.app.get("io");
  const formattedDate = dueDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  await createNotification(io, {
    recipient: patientProfile.userId,
    title: "New Follow-Up Scheduled",
    message: `Dr. ${req.user.name} scheduled a follow-up for ${formattedDate}.`,
    type: "follow_up_assigned",
    link: "/patient/follow-ups",
    portal: "patient"
  });

  if (io) {
    io?.to(patientProfile.userId.toString())?.emit("follow_up_assigned", {
      type: "follow_up_assigned",
      message: `Dr. ${req.user.name} scheduled a follow-up for ${formattedDate}.`,
      dueDate: dueDateObj
    });
  }

  res.status(201).json(new ApiResponse(201, followUp, "Follow-up created successfully"));
});
