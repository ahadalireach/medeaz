const ClinicDoctorRequest = require("../../models/ClinicDoctorRequest");
const Doctor = require("../../models/Doctor");
const Clinic = require("../../models/Clinic");
const Staff = require("../../models/Staff");
const User = require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.getIncomingRequests = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const requests = await ClinicDoctorRequest.find({ doctorId: doctor._id })
    .populate("clinicId", "name photo address city")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, requests, "Incoming requests fetched"));
});

exports.acceptRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const doctor = await Doctor.findOne({ userId: req.user._id }).populate("userId");
  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const request = await ClinicDoctorRequest.findOne({ _id: requestId, doctorId: doctor._id, status: 'pending' });
  if (!request) {
    throw new ApiError(404, "Pending request not found");
  }

  const clinicId = request.clinicId;

  // 2. Update status
  request.status = 'accepted';
  request.respondedAt = new Date();
  await request.save();

  // 3. Associate Doctor
  doctor.clinicId = clinicId;

  const clinic = await Clinic.findById(clinicId);
  if (clinic && clinic.workingHours && doctor.schedule) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const updatedSchedule = {};
    for (const day of days) {
      const dayHours = clinic.workingHours[day];
      const slots = doctor.schedule[day] || [];
      if (!dayHours || dayHours.closed) {
        updatedSchedule[day] = [];
      } else {
        const openTime = dayHours.open || "09:00";
        const closeTime = dayHours.close || "17:00";
        updatedSchedule[day] = slots.filter(slotTime => slotTime >= openTime && slotTime < closeTime);
      }
    }
    doctor.schedule = updatedSchedule;
    doctor.markModified('schedule');
  }

  await doctor.save();

  // 4. Add to clinic's doctors array
  await Clinic.findByIdAndUpdate(clinicId, { $addToSet: { doctors: doctor._id } });

  // 5. Auto-create Staff entry
  const user = doctor.userId;
  await Staff.findOneAndUpdate(
    { clinicId, linkedDoctorId: doctor._id },
    {
      $setOnInsert: {
        userId: user._id,
        role: "doctor",
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        photo: user.photo,
        autoAdded: true,
        licenseNumber: doctor.licenseNo || doctor.licenseNumber,
        specialization: doctor.specialization
      }
    },
    { upsert: true }
  );

  const { sendNotification } = require("../../services/notificationService");
  try {
    if (clinic && clinic.adminId) {
      await sendNotification(clinic.adminId, {
        type: "connection_accepted",
        titleKey: "requestAccepted.title",
        bodyKey: "requestAccepted.body",
        bodyParams: { doctorName: user.name },
        actionUrl: "/dashboard/clinic_admin/doctors",
        portal: "clinic_admin"
      });

      if (global.io) {
        global.io.to(clinic.adminId.toString()).emit('doctor_accepted_request', {
          doctorId: doctor._id,
          name: user.name
        });
      }
    }
  } catch (e) {
    console.error("Failed to notify clinic:", e.message);
  }

  // Invalidate cache
  const { invalidateDoctorsCache, invalidateAllDoctorScheduleCaches } = require("../../utils/cacheHelpers");
  await invalidateDoctorsCache(clinicId);
  await invalidateAllDoctorScheduleCaches(doctor.userId._id);

  res.status(200).json(new ApiResponse(200, request, "Request accepted"));
});

exports.declineRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const doctor = await Doctor.findOne({ userId: req.user._id }).populate("userId");

  const request = await ClinicDoctorRequest.findOne({ _id: requestId, doctorId: doctor._id, status: 'pending' });
  if (!request) {
    throw new ApiError(404, "Pending request not found");
  }

  request.status = 'declined';
  request.respondedAt = new Date();
  await request.save();

  // Notify clinic
  const clinic = await Clinic.findById(request.clinicId);
  if (clinic && clinic.adminId) {
    const { sendNotification } = require("../../services/notificationService");
    try {
      await sendNotification(clinic.adminId, {
        type: "connection_declined",
        titleKey: "requestDeclined.title",
        bodyKey: "requestDeclined.body",
        bodyParams: { doctorName: doctor.userId.name },
        actionUrl: "/dashboard/clinic_admin/doctors",
        portal: "clinic_admin"
      });
    } catch (e) {
      console.error("Failed to notify clinic:", e.message);
    }
  }

  res.status(200).json(new ApiResponse(200, request, "Request declined"));
});
