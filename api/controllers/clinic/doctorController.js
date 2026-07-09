const Clinic = require("../../models/Clinic");
const Doctor = require("../../models/Doctor");
const User = require("../../models/User");
const Appointment = require("../../models/Appointment");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.getDoctors = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const cacheKey = `clinic:doctors:${userClinic._id.toString()}:${page}:${limit}`;
  const { getCache, setCache } = require("../../utils/cacheHelpers");

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, "Doctors fetched successfully"));
  }

  const populatedClinic = await Clinic.findOne({ _id: userClinic._id }).populate({
    path: "doctors",
    populate: {
      path: "userId",
      select: "name email photo phone",
    },
  });

  const total = populatedClinic.doctors.length;
  const start = (page - 1) * limit;
  const doctors = populatedClinic.doctors.slice(start, start + limit);

  const responseData = {
    doctors,
    pagination: {
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      limit,
    },
  };

  await setCache(cacheKey, responseData, 300);

  res.status(200).json(new ApiResponse(200, responseData, "Doctors fetched successfully"));
});

exports.addDoctor = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  const { email, specialization, photo } = req.body;

  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(404, "No doctor account found with this email");
  }

  if (!user.roles.includes("doctor")) {
    throw new ApiError(400, "User is not registered as a doctor");
  }

  const doctor = await Doctor.findOne({ userId: user._id });

  if (!doctor) {
    throw new ApiError(404, "Doctor profile not found");
  }

  const clinic = userClinic;

  if (clinic.doctors.includes(doctor._id)) {
    throw new ApiError(400, "Doctor already added to this clinic");
  }

  const clinicsCount = await Clinic.countDocuments({ doctors: doctor._id });
  if (clinicsCount >= 100) {
    throw new ApiError(400, "Doctor has reached the limit of 100 associated clinics");
  }

  if (specialization && specialization !== doctor.specialization) {
    doctor.specialization = specialization;
  }

  doctor.clinicId = clinic._id;
  await doctor.save();

  // Invalidate schedule cache for the doctor
  const { invalidateAllDoctorScheduleCaches } = require("../../utils/cacheHelpers");
  await invalidateAllDoctorScheduleCaches(doctor.userId);

  clinic.doctors.push(doctor._id);
  await clinic.save();

  if (photo) {
    user.photo = photo;
    await user.save();
  }

  // Auto-add doctor to clinic staff
  const Staff = require("../../models/Staff");
  let staff = await Staff.findOne({ linkedDoctorId: doctor._id, clinicId: clinic._id });
  if (!staff) {
    await Staff.create({
      userId: user._id,
      clinicId: clinic._id,
      role: "doctor",
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      photo: user.photo,
      linkedDoctorId: doctor._id,
      autoAdded: true,
      licenseNumber: doctor.licenseNo,
      specialization: doctor.specialization,
    });
  }

  const { sendEmail } = require("../../services/emailService");
  try {
    sendEmail(user.email, "You've Been Added to " + clinic.name, 'doctorAddedToClinic', {
      doctorName: user.name,
      clinicName: clinic.name
    });
  } catch (e) { }

  // Send real-time notification to doctor
  const { sendNotification } = require("../../services/notificationService");
  try {
    await sendNotification(user._id, {
      type: "system",
      titleKey: "doctorAddedToClinic.title",
      bodyKey: "doctorAddedToClinic.body",
      bodyParams: { clinicName: clinic.name },
      actionUrl: "/dashboard/doctor/schedule",
      portal: "doctor"
    });
  } catch (e) {
    console.error("Failed to send notification to doctor:", e.message);
  }

  const { invalidateDoctorsCache } = require("../../utils/cacheHelpers");
  await invalidateDoctorsCache(clinic._id);

  res.status(200).json(new ApiResponse(200, { doctor }, "Doctor added to clinic"));
});

exports.searchDoctorByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  const emailStr = String(email || '').replace(/[^\w\s@.-]/gi, '').trim();
  
  if (emailStr.length < 2) {
    return res.status(200).json(new ApiResponse(200, [], "Invalid search query"));
  }

  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  // Search for users with email matching the query
  const users = await User.find({
    email: { $regex: emailStr, $options: "i" },
    roles: "doctor"
  }).select("name email photo").limit(10).lean();

  // Get corresponding doctor profiles
  const doctorResults = [];
  for (const user of users) {
    const doctor = await Doctor.findOne({ userId: user._id }).select("specialization userId clinicId").lean();
    if (doctor) {
      const clinicsCount = await Clinic.countDocuments({ doctors: doctor._id });
      const isAlreadyInThisClinic = userClinic.doctors.map(d => d.toString()).includes(doctor._id.toString());
      
      const ClinicDoctorRequest = require("../../models/ClinicDoctorRequest");
      const request = await ClinicDoctorRequest.findOne({
        clinicId: userClinic._id, 
        doctorId: doctor._id
      }).sort({ createdAt: -1 });

      let connectionStatus = 'none';
      if (isAlreadyInThisClinic || (doctor.clinicId && doctor.clinicId.toString() === userClinic._id.toString())) {
        connectionStatus = 'already_in_clinic';
      } else if (!request) {
        connectionStatus = 'none';
      } else {
        connectionStatus = request.status;
      }

      let currentClinicName = null;
      if (doctor.clinicId) {
        const currentClinic = await Clinic.findById(doctor.clinicId).select("name city").lean();
        if (currentClinic) {
          currentClinicName = currentClinic.city ? `${currentClinic.name} ${currentClinic.city}` : currentClinic.name;
        }
      }

      doctorResults.push({
        _id: doctor._id,
        userId: doctor.userId._id,
        email: user.email,
        fullName: user.name,
        name: user.name,
        specialization: doctor.specialization || "General",
        photo: user.photo,
        clinicsCount,
        alreadyAdded: isAlreadyInThisClinic,
        isLimitReached: clinicsCount >= 100,
        connectionStatus,
        currentClinicName,
        requestRespondedAt: request?.respondedAt
      });
    }
  }

  res.status(200).json(
    new ApiResponse(200, doctorResults, "Doctors found")
  );
});

exports.removeDoctor = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  const { id } = req.params;

  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const clinic = userClinic;

  clinic.doctors = clinic.doctors.filter(
    (doctorId) => doctorId.toString() !== id
  );
  await clinic.save();

  const doctor = await Doctor.findById(id);
  if (doctor) {
    doctor.clinicId = null;
    await doctor.save();
  }

  // Auto-remove doctor from clinic staff
  const Staff = require("../../models/Staff");
  await Staff.deleteMany({ linkedDoctorId: id, clinicId: clinic._id });

  const { invalidateDoctorsCache, invalidateAllDoctorScheduleCaches } = require("../../utils/cacheHelpers");
  await invalidateDoctorsCache(clinic._id);
  if (doctor) {
    await invalidateAllDoctorScheduleCaches(doctor.userId);
  }

  res.status(200).json(new ApiResponse(200, null, "Doctor removed"));
});

exports.getDoctorStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userClinic = await Clinic.findOne({ adminId: req.user._id });

  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  // Try finding by Doctor ID first, then by User ID
  let doctor = await Doctor.findById(id);
  if (!doctor) {
    doctor = await Doctor.findOne({ userId: id });
  }

  if (!doctor) {
    throw new ApiError(404, `Doctor not found with ID: ${id}`);
  }

  // Verify access control: doctor must belong to this clinic
  if (!userClinic.doctors.map(d => d.toString()).includes(doctor._id.toString())) {
    throw new ApiError(403, "You do not have permission to view stats for this doctor");
  }

  const mongoose = require("mongoose");
  const doctorUserIdObj = new mongoose.Types.ObjectId(doctor.userId);
  const clinicIdObj = new mongoose.Types.ObjectId(userClinic._id);

  const period = req.query.period || "month";
  let dateFilter = {};
  if (period === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    dateFilter = { dateTime: { $gte: start, $lte: end } };
  } else if (period === "week") {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    dateFilter = { dateTime: { $gte: start } };
  } else if (period === "month") {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    dateFilter = { dateTime: { $gte: start } };
  } else {
    // "all" or "all-time"
    dateFilter = {};
  }

  // Count total appointments
  const RevenueEntry = require("../../models/RevenueEntry");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const revenueFilter = {
    doctorUserId: doctorUserIdObj,
    clinicId: clinicIdObj
  };
  if (dateFilter.dateTime) {
    revenueFilter.occurredAt = {};
    if (dateFilter.dateTime.$gte) revenueFilter.occurredAt.$gte = dateFilter.dateTime.$gte;
    if (dateFilter.dateTime.$lte) revenueFilter.occurredAt.$lte = dateFilter.dateTime.$lte;
  }

  const matchFilter = {
    doctorId: doctorUserIdObj,
    clinicId: clinicIdObj,
    deletedByClinic: { $ne: true }
  };
  if (dateFilter.dateTime) {
    matchFilter.dateTime = dateFilter.dateTime;
  }

  const [
    totalAppointments,
    statusCounts,
    revenueEntries,
    patientAppointments,
    ratedAppointments,
    dailyRevenues,
    recentAppointments,
    doctorUser
  ] = await Promise.all([
    Appointment.countDocuments(matchFilter),
    Appointment.aggregate([
      {
        $match: matchFilter
      },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),
    RevenueEntry.find(revenueFilter),
    Appointment.find(matchFilter).select("patientId"),
    Appointment.find({
      ...matchFilter,
      "patientFeedback.score": { $exists: true, $ne: null }
    }).select("patientFeedback.score"),
    RevenueEntry.aggregate([
      {
        $match: {
          doctorUserId: doctorUserIdObj,
          clinicId: clinicIdObj,
          occurredAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
          amount: { $sum: "$doctorShare" }
        }
      }
    ]),
    Appointment.find({
      doctorId: doctorUserIdObj,
      clinicId: clinicIdObj,
      deletedByClinic: { $ne: true }
    })
      .sort({ dateTime: -1 })
      .limit(5)
      .populate("patientId", "name photo"),
    User.findById(doctor.userId).select("name photo")
  ]);

  const appointmentsByStatus = { completed: 0, pending: 0, cancelled: 0, noShow: 0 };
  statusCounts.forEach(item => {
    const s = String(item._id || '').trim().toLowerCase();
    if (s === "completed") {
      appointmentsByStatus.completed += item.count;
    } else if (s === "cancelled") {
      appointmentsByStatus.cancelled += item.count;
    } else if (s === "no-show") {
      appointmentsByStatus.noShow += item.count;
    } else {
      appointmentsByStatus.pending += item.count;
    }
  });

  let totalRevenue = revenueEntries.reduce((sum, entry) => sum + (entry.doctorShare || 0), 0);

  // Fallback for older entries if totalRevenue is 0 but there are completed appointments
  if (totalRevenue === 0 && appointmentsByStatus.completed > 0) {
    totalRevenue = appointmentsByStatus.completed * (doctor.consultationFee || 0) * 0.80;
  }

  const avgPerVisit = appointmentsByStatus.completed > 0 ? Math.round(totalRevenue / appointmentsByStatus.completed) : 0;

  // Calculate unique & returning patients
  const patientCounts = {};
  patientAppointments.forEach(app => {
    if (app.patientId) {
      const pId = app.patientId.toString();
      patientCounts[pId] = (patientCounts[pId] || 0) + 1;
    }
  });

  const uniquePatients = Object.keys(patientCounts).length;
  const returningPatients = Object.values(patientCounts).filter(count => count > 1).length;

  // Calculate ratings and reviews
  const reviewCount = ratedAppointments.length;
  let avgRating = null;
  if (reviewCount > 0) {
    const sum = ratedAppointments.reduce((total, app) => total + (app.patientFeedback.score || 0), 0);
    avgRating = Number((sum / reviewCount).toFixed(1));
  }

  // Mini revenue chart (last 7 days)
  const last7days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last7days.push({ date: dateStr, amount: 0 });
  }

  dailyRevenues.forEach(entry => {
    const day = last7days.find(d => d.date === entry._id);
    if (day) {
      day.amount = entry.amount;
    }
  });

  const recentPatients = recentAppointments.map(app => ({
    _id: app.patientId?._id,
    name: app.patientId?.name || "Patient",
    avatar: app.patientId?.photo || "",
    lastVisit: app.dateTime,
    lastStatus: app.status
  }));

  res.status(200).json(
    new ApiResponse(200, {
      doctor: {
        name: doctor.fullName || doctorUser?.name || "Doctor",
        avatar: doctorUser?.photo || "",
        specialization: doctor.specialization || "General Practitioner",
        status: doctor.clinicId ? "Active" : "Inactive"
      },
      stats: {
        totalAppointments,
        revenue: {
          total: totalRevenue,
          avgPerVisit
        },
        uniquePatients,
        returningPatients,
        avgRating,
        reviewCount,
        appointmentsByStatus,
        revenueByDay: last7days,
        recentPatients
      }
    }, "Doctor stats fetched successfully")
  );
});

exports.overrideAvailability = asyncHandler(async (req, res) => {
  throw new ApiError(403, "Clinic admin is not authorized to change doctor availability status. This status must be managed directly by the doctor.");
});
