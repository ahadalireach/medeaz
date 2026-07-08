const ClinicDoctorRequest = require("../../models/ClinicDoctorRequest");
const Doctor = require("../../models/Doctor");
const Clinic = require("../../models/Clinic");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.sendRequest = asyncHandler(async (req, res) => {
  const { doctorId, message } = req.body;
  const clinicId = req.user.clinicId;

  // 1. Check doctor exists
  const doctor = await Doctor.findById(doctorId).populate("userId", "name email");
  if (!doctor) {
    throw new ApiError(404, "Doctor not found");
  }

  // 2. Check doctor not already associated with THIS clinic
  if (doctor.clinicId && doctor.clinicId.toString() === clinicId.toString()) {
    throw new ApiError(409, "Doctor is already in your clinic.");
  }

  // 3. Check no pending request already exists
  const existingRequest = await ClinicDoctorRequest.findOne({ clinicId, doctorId, status: 'pending' });
  if (existingRequest) {
    throw new ApiError(409, "A pending request already exists for this doctor.");
  }

  // 5. Create request
  const request = await ClinicDoctorRequest.create({ clinicId, doctorId, message });

  // 6. Create notification for doctor
  const clinic = await Clinic.findById(clinicId);
  const { sendNotification } = require("../../services/notificationService");
  try {
    await sendNotification(doctor.userId._id, {
      type: "clinic_connection_request",
      titleKey: "connectionRequest.title",
      bodyKey: "connectionRequest.body",
      bodyParams: { clinicName: clinic.name },
      actionUrl: "/dashboard/doctor/connection-requests",
      portal: "doctor"
    });
  } catch (e) {
    console.error("Failed to send notification to doctor:", e.message);
  }

  // 7. Socket emit to doctor
  if (global.io) {
    global.io.to(doctor.userId._id.toString()).emit('clinic_connection_request', {
      requestId: request._id,
      clinicName: clinic.name,
      clinicLogo: clinic.photo || null,
      message
    });
  }

  res.status(201).json(new ApiResponse(201, request, "Connection request sent"));
});

exports.getSentRequests = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const requests = await ClinicDoctorRequest.find({ clinicId })
    .populate({
      path: "doctorId",
      select: "userId specialization",
      populate: { path: "userId", select: "name email photo" }
    })
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, requests, "Requests fetched"));
});

exports.cancelRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const clinicId = req.user.clinicId;

  const request = await ClinicDoctorRequest.findOne({ _id: requestId, clinicId, status: 'pending' });
  if (!request) {
    throw new ApiError(404, "Pending request not found");
  }

  request.status = 'cancelled';
  request.respondedAt = new Date();
  await request.save();

  res.status(200).json(new ApiResponse(200, request, "Request cancelled"));
});
