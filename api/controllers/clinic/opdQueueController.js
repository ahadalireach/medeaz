const OPDToken = require("../../models/OPDToken");
const Clinic = require("../../models/Clinic");
const Doctor = require("../../models/Doctor");
const User = require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { createNotification } = require("../../utils/notification");

// Helper to get clinicId for user
const getClinicIdForUser = async (user) => {
  let clinicId = user.clinicId;
  if (!clinicId) {
    const userClinic = await Clinic.findOne({ adminId: user._id });
    if (userClinic) {
      clinicId = userClinic._id;
    }
  }
  if (!clinicId && user.roles.includes("doctor")) {
    const doctorObj = await Doctor.findOne({ userId: user._id });
    if (doctorObj) {
      clinicId = doctorObj.clinicId;
    }
  }
  return clinicId;
};

// @desc    Issue new token
// @route   POST /api/clinic/opd-queue
// @access  Private (Clinic Admin / Staff / Doctor)
// exports.issueToken = asyncHandler(async (req, res) => {
exports.issueToken = asyncHandler(async (req, res) => {
  const { doctorId, patientName, patientPhone, patientEmail } = req.body;

  if (!doctorId || !patientName || patientName.trim().length < 2) {
    throw new ApiError(400, "Doctor ID and valid Patient Name (min 2 characters) are required");
  }

  const clinicId = await getClinicIdForUser(req.user);
  if (!clinicId) {
    throw new ApiError(404, "Clinic association not found for user");
  }

  // Verify doctor belongs to this clinic
  const doctorObj = await Doctor.findOne({ userId: doctorId });
  if (!doctorObj || String(doctorObj.clinicId) !== String(clinicId)) {
    throw new ApiError(400, "Selected doctor does not practice at this clinic");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const trimmedPhone = patientPhone?.trim();
  const trimmedEmail = patientEmail?.trim();

  // Validate duplicate phone or email in active queue today
  if (trimmedPhone || trimmedEmail) {
    const duplicateQuery = {
      clinicId,
      status: { $in: ["waiting", "called"] },
      createdAt: { $gte: startOfToday },
      $or: []
    };

    if (trimmedPhone) duplicateQuery.$or.push({ patientPhone: trimmedPhone });
    if (trimmedEmail) duplicateQuery.$or.push({ patientEmail: trimmedEmail });

    if (duplicateQuery.$or.length > 0) {
      const existingToken = await OPDToken.findOne(duplicateQuery);
      if (existingToken) {
        throw new ApiError(400, "A token with this phone number or email is already in the queue today.");
      }
    }
  }

  // Check if patient exists as a registered patient user
  let registeredPatient = null;
  if (trimmedEmail) {
    registeredPatient = await User.findOne({ email: trimmedEmail, roles: "patient" });
  }
  if (!registeredPatient && trimmedPhone) {
    registeredPatient = await User.findOne({ phone: trimmedPhone, roles: "patient" });
  }

  const finalName = registeredPatient ? registeredPatient.name : patientName.trim();
  const patientId = registeredPatient ? registeredPatient._id : undefined;

  let tokenNumber;
  let token;
  let success = false;
  let retries = 0;

  while (!success && retries < 5) {
    const count = await OPDToken.countDocuments({
      clinicId,
      createdAt: { $gte: startOfToday }
    });
    tokenNumber = count + 1;

    try {
      token = await OPDToken.create({
        clinicId,
        doctorId,
        tokenNumber,
        patientName: finalName,
        patientPhone: trimmedPhone || "",
        patientEmail: trimmedEmail || "",
        patientId,
        status: "waiting",
      });
      success = true;
    } catch (err) {
      if (err.code === 11000) {
        retries++;
      } else {
        throw err;
      }
    }
  }

  if (!success) {
    throw new ApiError(500, "Could not generate a unique token number. Please try again.");
  }

  const populated = await OPDToken.findById(token._id).populate({
    path: "doctorId",
    select: "name photo",
    populate: { path: "doctorProfile", select: "fullName" }
  });

  const io = req.app.get("io");
  if (io) {
    io.to(`opd_${clinicId}`).emit("opd_token_issued", {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      patientName: token.patientName,
      doctorId: token.doctorId,
      clinicId
    });
  }

  res.status(201).json(new ApiResponse(201, populated, "OPD Token issued successfully"));
});

// @desc    List today's queue
// @route   GET /api/clinic/opd-queue
// @access  Private (Clinic Admin / Staff / Doctor)
exports.listTodayQueue = asyncHandler(async (req, res) => {
  const clinicId = await getClinicIdForUser(req.user);
  if (!clinicId) {
    throw new ApiError(404, "Clinic association not found");
  }

  const { doctorId, status } = req.query;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const filter = {
    clinicId,
    createdAt: { $gte: startOfToday }
  };

  if (doctorId && doctorId !== "all" && doctorId !== "All") {
    filter.doctorId = doctorId;
  }

  if (status && status !== "all" && status !== "All") {
    filter.status = status;
  }

  const tokens = await OPDToken.find(filter)
    .populate({
      path: "doctorId",
      select: "name photo",
      populate: { path: "doctorProfile", select: "fullName" }
    })
    .sort({ tokenNumber: 1 });

  // Calculate statistics for today
  const allTodayTokens = await OPDToken.find({
    clinicId,
    createdAt: { $gte: startOfToday }
  });

  const total = allTodayTokens.length;
  const waiting = allTodayTokens.filter(t => t.status === "waiting").length;
  const done = allTodayTokens.filter(t => t.status === "completed").length;

  res.status(200).json(
    new ApiResponse(200, {
      tokens,
      stats: { total, waiting, done }
    }, "Queue fetched successfully")
  );
});

// @desc    Call token
// @route   PUT /api/clinic/opd-queue/:tokenId/call
// @access  Private (Clinic Admin / Staff / Doctor)
exports.callToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  // Optimistic locking / atomic update
  const token = await OPDToken.findOneAndUpdate(
    { _id: tokenId, status: { $in: ["waiting", "skipped"] } },
    { status: "called", calledAt: new Date() },
    { new: true }
  ).populate({
    path: "doctorId",
    select: "name photo",
    populate: { path: "doctorProfile", select: "fullName" }
  });

  if (!token) {
    // Check if already called
    const existing = await OPDToken.findById(tokenId);
    if (existing && existing.status === "called") {
      throw new ApiError(409, "Token already called.");
    }
    throw new ApiError(404, "Token not found or not in callage state.");
  }

  const doctorName = token.doctorId?.doctorProfile?.fullName || token.doctorId?.name || "Doctor";
  
  // Fetch clinic details for the notification message
  const clinic = await Clinic.findById(token.clinicId);
  const clinicName = clinic ? clinic.name : "the clinic";

  // Emit socket event to clinic room
  const io = req.app.get("io");
  if (io) {
    io.to(`opd_${token.clinicId}`).emit("opd_token_called", {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      patientName: token.patientName,
      doctorId: token.doctorId._id || token.doctorId,
      doctorName,
      clinicId: token.clinicId
    });
  }

  // Real-time alert to registered patient with high contrast and clinic name details
  if (token.patientId && io) {
    await createNotification(io, {
      recipient: token.patientId,
      title: "Your OPD Token has been Called",
      message: `Token #${token.tokenNumber} has been called for Dr. ${doctorName} at ${clinicName}. Please proceed to the consultation room.`,
      type: "opd_token_called",
      portal: "patient"
    });
  }

  res.status(200).json(new ApiResponse(200, token, "Token called successfully"));
});

// @desc    Complete token
// @route   PUT /api/clinic/opd-queue/:tokenId/complete
// @access  Private (Clinic Admin / Staff / Doctor)
exports.completeToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  const token = await OPDToken.findOneAndUpdate(
    { _id: tokenId, status: "called" },
    { status: "completed", completedAt: new Date() },
    { new: true }
  );

  if (!token) {
    throw new ApiError(404, "Active called token not found.");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Fetch the next waiting token for this doctor
  const nextTokenObj = await OPDToken.findOne({
    clinicId: token.clinicId,
    doctorId: token.doctorId,
    status: "waiting",
    createdAt: { $gte: startOfToday }
  }).sort({ tokenNumber: 1 });

  const io = req.app.get("io");
  if (io) {
    io.to(`opd_${token.clinicId}`).emit("opd_token_completed", {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      doctorId: token.doctorId,
      nextToken: nextTokenObj ? {
        tokenId: nextTokenObj._id,
        tokenNumber: nextTokenObj.tokenNumber,
        patientName: nextTokenObj.patientName
      } : null
    });
  }

  res.status(200).json(new ApiResponse(200, { token, nextToken: nextTokenObj }, "Token completed successfully"));
});

// @desc    Skip token
// @route   PUT /api/clinic/opd-queue/:tokenId/skip
// @access  Private (Clinic Admin / Staff / Doctor)
exports.skipToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.params;

  // Move skipped token to the bottom of the queue list by updating its createdAt timestamp
  const token = await OPDToken.findOneAndUpdate(
    { _id: tokenId, status: "called" },
    { status: "skipped", createdAt: new Date() },
    { new: true }
  );

  if (!token) {
    throw new ApiError(404, "Active called token not found to skip.");
  }

  const io = req.app.get("io");
  if (io) {
    io.to(`opd_${token.clinicId}`).emit("opd_token_skipped", {
      tokenId: token._id,
      tokenNumber: token.tokenNumber,
      doctorId: token.doctorId
    });
  }

  res.status(200).json(new ApiResponse(200, token, "Token skipped successfully"));
});

exports.getPublicDisplayData = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(clinicId)) {
    throw new ApiError(400, "Invalid Clinic ID format");
  }

  const clinic = await Clinic.findById(clinicId).select("name photo address");
  if (!clinic) {
    throw new ApiError(404, "Clinic not found");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // Fetch called tokens today (split view across active doctors in the clinic)
  const calledTokens = await OPDToken.find({
    clinicId,
    status: "called",
    createdAt: { $gte: startOfToday }
  })
    .populate({
      path: "doctorId",
      select: "name photo",
      populate: { path: "doctorProfile", select: "fullName" }
    })
    .sort({ calledAt: -1 });

  // Fetch up next tokens (limit to 3 for privacy and layout constraints)
  const upNextTokens = await OPDToken.find({
    clinicId,
    status: "waiting",
    createdAt: { $gte: startOfToday }
  })
    .populate({
      path: "doctorId",
      select: "name",
      populate: { path: "doctorProfile", select: "fullName" }
    })
    .sort({ tokenNumber: 1 })
    .limit(3);

  // Format upNext lists to conceal privacy (First name + Initial of last name, or truncated)
  const upNext = upNextTokens.map(t => {
    const parts = t.patientName.split(" ");
    const firstName = parts[0] || "Patient";
    const doctorName = t.doctorId?.doctorProfile?.fullName || t.doctorId?.name || "Doctor";
    return {
      tokenNumber: t.tokenNumber,
      patientName: firstName,
      doctorName
    };
  });

  const formattedCalled = calledTokens.map(t => {
    const doctorName = t.doctorId?.doctorProfile?.fullName || t.doctorId?.name || "Doctor";
    return {
      tokenId: t._id,
      tokenNumber: t.tokenNumber,
      patientName: t.patientName,
      doctorName
    };
  });

  res.status(200).json(
    new ApiResponse(200, {
      clinicName: clinic.name,
      clinicLogo: clinic.photo,
      calledTokens: formattedCalled,
      upNext
    }, "Display data loaded successfully")
  );
});
