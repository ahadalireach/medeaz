const Appointment = require("../../models/Appointment");
const Clinic = require("../../models/Clinic");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");
const { invalidatePatientHealthScoreCache } = require("../../utils/cacheHelpers");

exports.getAppointments = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }
  const clinicId = userClinic._id;
  const { doctorId, status, from, to, type, search, patientId } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const { getCache, setCache } = require("../../utils/cacheHelpers");
  const cacheKey = `clinic:appointments:${clinicId.toString()}:${doctorId || 'all'}:${status || 'all'}:${from || ''}:${to || ''}:${type || 'all'}:${search || ''}:${patientId || ''}:${page}:${limit}`;

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Appointments fetched successfully"));
  }

  const now = new Date();
  // Auto-cancel past pending/reserved appointments
  await Appointment.updateMany(
    {
      clinicId: clinicId,
      dateTime: { $lt: now },
      status: { $in: ['pending', 'reserved'] },
      deletedByClinic: { $ne: true }
    },
    { $set: { status: 'cancelled' } }
  );

  const filter = {
    clinicId: clinicId,
    deletedByClinic: { $ne: true }
  };

  if (doctorId && doctorId !== "" && doctorId !== "all" && doctorId !== "All Doctors") {
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      throw new ApiError(400, "Invalid doctor ID");
    }
    filter.doctorId = new mongoose.Types.ObjectId(doctorId);
  }

  if (patientId) {
    filter.patientId = patientId;
  } else if (search && search.trim()) {
    const User = require("../../models/User");
    const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingUsers = await User.find({
      roles: 'patient',
      $or: [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { email: { $regex: sanitizedSearch, $options: 'i' } },
        { phone: { $regex: sanitizedSearch, $options: 'i' } }
      ]
    }).select('_id');
    const userIds = matchingUsers.map(u => u._id);
    filter.patientId = { $in: userIds };
  }

  if (status) {
    const statusList = typeof status === "string" ? status.split(",") : Array.isArray(status) ? status : [status];
    const cleaned = statusList.map(s => s.trim().toLowerCase()).filter(Boolean);
    if (cleaned.length > 0 && !cleaned.includes("all")) {
      filter.status = { $in: cleaned };
    }
  }

  // Robust date range check that handles timezone differences and empty/null/undefined params
  if ((from && from !== 'undefined' && from !== 'null' && from.trim() !== '') || 
      (to && to !== 'undefined' && to !== 'null' && to.trim() !== '')) {
    filter.dateTime = {};
    if (from && from !== 'undefined' && from !== 'null' && from.trim() !== '') {
      const parts = from.split('-');
      if (parts.length === 3) {
        filter.dateTime.$gte = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0, 0));
      } else {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          filter.dateTime.$gte = fromDate;
        }
      }
    }
    if (to && to !== 'undefined' && to !== 'null' && to.trim() !== '') {
      const parts = to.split('-');
      if (parts.length === 3) {
        filter.dateTime.$lte = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999));
      } else {
        const toDate = new Date(to + 'T23:59:59.999Z');
        if (!isNaN(toDate.getTime())) {
          filter.dateTime.$lte = toDate;
        }
      }
    }
  }

  if (type && type !== "" && type !== "all" && type !== "All") {
    filter.type = type.toLowerCase();
  }

  const total = await Appointment.countDocuments(filter);
  const pages = Math.max(Math.ceil(total / limit), 1);
  const activePage = page > pages ? pages : page;

  const appointments = await Appointment.find(filter)
    .populate("patientId", "name email phone photo")
    .populate({
      path: "doctorId",
      select: "name email photo",
      populate: { path: "doctorProfile", select: "specialization fullName" }
    })
    .populate("clinicId", "name address")
    .sort({ dateTime: -1 })
    .skip((activePage - 1) * limit)
    .limit(limit);

  const responseData = {
    appointments,
    pagination: {
      total,
      page: activePage,
      pages,
      limit,
    },
  };

  await setCache(cacheKey, responseData, 60);

  res.status(200).json(new ApiResponse(200, responseData, "Appointments fetched successfully"));
});

exports.getAppointmentById = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const { id } = req.params;

  const appointment = await Appointment.findOne({ _id: id, clinicId: userClinic._id, deletedByClinic: { $ne: true } })
    .populate("patientId", "name email phone photo")
    .populate({
      path: "doctorId",
      select: "name email photo",
      populate: { path: "doctorProfile", select: "specialization fullName" }
    })
    .populate("clinicId", "name address");

  if (!appointment) {
    throw new ApiError(404, "Appointment not found for this clinic");
  }

  // Get prescription, patient profile, etc.
  const Prescription = require("../../models/Prescription");
  const PatientProfile = require("../../models/Patient");

  const prescription = await Prescription.findOne({ appointmentId: appointment._id });
  const patientProfile = await PatientProfile.findOne({ userId: appointment.patientId._id });

  // Fetch doctor profile for consultation fee fallback
  const Doctor = require("../../models/Doctor");
  const doctorObj = await Doctor.findOne({ userId: appointment.doctorId._id });
  const baseFee = doctorObj?.consultationFee || 0;

  // Calculate revenue fields for the frontend
  let totalFee = 0;
  let clinicRevenue = 0;

  if (prescription) {
    totalFee = prescription.totalCost || prescription.consultationFee || 0;
    clinicRevenue = totalFee * 0.2;
  } else {
    totalFee = baseFee;
    clinicRevenue = totalFee * 0.2;
  }

  const result = {
    ...appointment.toObject(),
    totalFee,
    clinicRevenue,
    doctor: {
      name: appointment.doctorId?.name,
      fullName: appointment.doctorId?.doctorProfile?.fullName || appointment.doctorId?.name,
      specialization: appointment.doctorId?.doctorProfile?.specialization,
      photo: appointment.doctorId?.photo
    },
    patient: {
      name: appointment.patientId?.name,
      email: appointment.patientId?.email,
      photo: appointment.patientId?.photo,
      contact: patientProfile?.contact || appointment.patientId?.phone,
      bloodGroup: patientProfile?.bloodGroup,
      dob: patientProfile?.dob
    },
    prescription: prescription ? {
      _id: prescription._id,
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines,
      consultationFee: prescription.consultationFee,
      medicineCost: prescription.medicineCost,
      totalCost: prescription.totalCost,
      notes: prescription.notes,
      followUpDate: prescription.followUpDate
    } : {
      consultationFee: baseFee,
      medicineCost: 0,
      totalCost: baseFee
    }
  };

  res.status(200).json(new ApiResponse(200, result, "Appointment fetched successfully"));
});

exports.getPrescriptions = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) throw new ApiError(404, "Clinic not found");

  const { doctorId, from, to } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const query = { clinicId: userClinic._id };

  if (doctorId) query.doctorId = doctorId;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const Prescription = require("../../models/Prescription");
  const prescriptions = await Prescription.find(query)
    .populate("patientId", "name email")
    .populate("doctorId", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Prescription.countDocuments(query);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        prescriptions,
        pagination: {
          total,
          page,
          pages: Math.max(Math.ceil(total / limit), 1),
          limit,
        },
      },
      "Prescriptions fetched successfully"
    )
  );
});

exports.deleteAppointment = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) throw new ApiError(404, "Clinic not found");

  const { id } = req.params;
  const appointment = await Appointment.findOne({ _id: id, clinicId: userClinic._id });
  if (!appointment) {
    throw new ApiError(404, "Appointment not found or not belonging to this clinic");
  }

  appointment.deletedByClinic = true;
  await appointment.save();
  await invalidatePatientHealthScoreCache(appointment.patientId);

  try {
    const { deleteClinicContext } = require("../../services/redisService");
    await deleteClinicContext(userClinic._id);
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }

  res.status(200).json(new ApiResponse(200, null, "Appointment deleted successfully"));
});

exports.deletePrescription = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) throw new ApiError(404, "Clinic not found");

  const { id } = req.params;
  const Prescription = require("../../models/Prescription");
  const prescription = await Prescription.findOne({ _id: id, clinicId: userClinic._id });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found or not belonging to this clinic");
  }

  await Prescription.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, null, "Prescription deleted successfully"));
});

exports.createAppointment = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) {
    throw new ApiError(404, "Clinic not found");
  }
  const clinicId = userClinic._id;
  const clinicName = userClinic.name || "Clinic";

  const { doctorId, patientId, dateTime, type, notes } = req.body;

  if (!doctorId || !patientId || !dateTime || !type) {
    throw new ApiError(400, "Missing required fields");
  }

  // 1. Verify doctor belongs to clinic
  const Doctor = require("../../models/Doctor");
  const doctor = await Doctor.findOne({ userId: doctorId });
  if (!doctor || String(doctor.clinicId) !== String(clinicId)) {
    throw new ApiError(403, "Doctor not in your clinic.");
  }

  // 2. Verify patient exists
  const User = require("../../models/User");
  const patientUser = await User.findOne({ _id: patientId, roles: 'patient' });
  if (!patientUser) {
    throw new ApiError(404, "Patient not found.");
  }

  // 3. Verify date is not in the past
  const dateObj = new Date(dateTime);
  if (isNaN(dateObj.getTime())) {
    throw new ApiError(400, "Invalid dateTime format");
  }

  if (dateObj < new Date()) {
    throw new ApiError(400, "Appointment must be scheduled in the future.");
  }

  // 4. Check slot not already booked (race condition guard)
  const conflict = await Appointment.findOne({
    doctorId,
    dateTime: dateObj,
    status: { $ne: 'cancelled' }
  });

  if (conflict) {
    throw new ApiError(409, "Slot no longer available.");
  }

  // Map type frontend options: 'in-person' -> 'consultation'
  let mappedType = type.toLowerCase();
  if (mappedType === 'in-person') {
    mappedType = 'consultation';
  }

  // 5. Create appointment
  const clinicSnapshot = {
    clinicId: userClinic._id,
    clinicName: userClinic.name,
    clinicCity: userClinic.address?.city,
    clinicPhone: userClinic.phone
  };

  const appointment = await Appointment.create({
    doctorId,
    patientId,
    clinicId,
    clinicSnapshot,
    dateTime: dateObj,
    type: mappedType,
    notes: notes || '',
    status: 'pending',
    reason: notes || 'Scheduled by clinic admin',
    duration: 15
  });

  // 6. Send notifications
  const io = req.app.get("io");
  const { createNotification } = require("../../utils/notification");
  
  const formattedDate = dateObj.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  let doctorName = doctor.fullName || "Doctor";
  if (!doctorName.toLowerCase().startsWith('dr')) {
    doctorName = 'dr ' + doctorName;
  }

  // Notify doctor
  await createNotification(io, {
    recipient: doctorId,
    title: "New Appointment Request",
    message: `New appointment scheduled by ${clinicName} for ${patientUser.name} on ${formattedDate}.`,
    type: "appointment_created_by_clinic",
    link: "/dashboard/doctor/appointments",
    portal: "doctor"
  });

  // Notify patient
  await createNotification(io, {
    recipient: patientId,
    title: "Appointment Confirmed",
    message: `Your appointment with ${doctorName} is confirmed for ${formattedDate}.`,
    type: "appointment_confirmed",
    link: "/dashboard/patient/appointments",
    portal: "patient"
  });

  // 7. Invalidate caches
  try {
    const { invalidateAllDoctorScheduleCaches } = require('../../utils/cacheHelpers');
    await invalidateAllDoctorScheduleCaches(doctorId);
    await invalidatePatientHealthScoreCache(patientId);
    const { deleteClinicContext } = require("../../services/redisService");
    await deleteClinicContext(clinicId);
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }

  // Populate before return
  const populated = await Appointment.findById(appointment._id)
    .populate("patientId", "name email phone photo")
    .populate({
      path: "doctorId",
      select: "name email photo",
      populate: { path: "doctorProfile", select: "specialization fullName" }
    })
    .populate("clinicId", "name address");

  res.status(201).json(new ApiResponse(201, populated, "Appointment created successfully"));
});
