const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Clinic = require('../../models/Clinic');
const User = require('../../models/User');
const { invalidateAllDoctorScheduleCaches, invalidatePatientHealthScoreCache } = require('../../utils/cacheHelpers');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { createNotification } = require('../../utils/notification');
const { sendEmail } = require('../../services/emailService');
/**
 * @route GET /api/patient/appointments?view=upcoming|past|all
 * @access Private (Patient only)
 */
exports.getAppointments = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { view = 'all' } = req.query;

  const now = new Date();

  // Auto-cancel past pending/reserved appointments
  await Appointment.updateMany(
    {
      patientId: userId,
      dateTime: { $lt: now },
      status: { $in: ['pending', 'reserved'] }
    },
    { $set: { status: 'cancelled' } }
  );

  let match = { patientId: userId };

  if (view === 'upcoming') {
    match.dateTime = { $gte: now };
    match.status = { $nin: ['cancelled', 'completed'] };
  } else if (view === 'past') {
    match.dateTime = { $lt: now };
  }

  const appointments = await Appointment.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "appointmentId",
        as: "review"
      }
    },
    {
      $lookup: {
        from: "clinicreviews",
        localField: "_id",
        foreignField: "appointmentId",
        as: "clinicReview"
      }
    },
    {
      $addFields: {
        reviewId: { $arrayElemAt: ["$review._id", 0] },
        reviewEditCount: { $ifNull: [{ $arrayElemAt: ["$review.editCount", 0] }, 0] },
        clinicReviewId: { $arrayElemAt: ["$clinicReview._id", 0] },
        clinicReviewScore: { $arrayElemAt: ["$clinicReview.overallRating", 0] }
      }
    },
    { $project: { review: 0, clinicReview: 0 } },
    { $sort: { dateTime: -1 } }
  ]);

  // Manually populate since aggregate doesn't support model populate easily
  const populated = await Appointment.populate(appointments, [
    {
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization' }
    },
    { path: 'clinicId', select: 'name address phone' },
    { path: 'prescriptionId' }
  ]);

  const doctorUserIds = [...new Set(
    populated
      .map((a) => a?.doctorId?._id?.toString() || a?.doctorId?.toString())
      .filter(Boolean)
  )];

  const doctorProfiles = await Doctor.find({ userId: { $in: doctorUserIds } }).select('userId location.city');
  const doctorCityByUserId = new Map(
    doctorProfiles.map((d) => [d.userId?.toString(), d.location?.city || ''])
  );

  const withClinicCity = populated.map((a) => {
    const doctorUserId = a?.doctorId?._id?.toString() || a?.doctorId?.toString();
    const clinicAddress = a?.clinicId?.address || '';
    const addressParts = typeof clinicAddress === 'string'
      ? clinicAddress.split(',').map((p) => p.trim()).filter(Boolean)
      : [];
    const cityFromAddress = addressParts.length > 1 ? addressParts[addressParts.length - 1] : '';

    return {
      ...a,
      clinicCity: doctorCityByUserId.get(doctorUserId) || cityFromAddress || null,
    };
  });

  res.status(200).json(new ApiResponse(200, withClinicCity, 'Appointments fetched successfully'));
});

/**
 * @route POST /api/patient/appointments
 * @access Private (Patient only)
 */
exports.bookAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { doctorId, clinicId, appointmentDate, appointmentTime, reason } = req.body;

  let patient = await Patient.findOne({ userId });
  if (!patient) {
    const user = await User.findById(userId);
    if (user && user.roles.includes('patient')) {
      patient = await Patient.create({
        userId: user._id,
        name: user.name,
      });
    } else {
      throw new ApiError(404, 'Patient profile not found');
    }
  }

  let doctor = await Doctor.findById(doctorId);
  let doctorUserId;

  if (doctor) {
    doctorUserId = doctor.userId;
  } else {
    doctor = await Doctor.findOne({ userId: doctorId });
    if (!doctor) throw new ApiError(404, 'Doctor not found');
    doctorUserId = doctorId;
  }

  function parseDateTime(dateStr, timeStr) {
    if (!timeStr || !dateStr) return new Date(NaN);

    // Check if time is in 12h format (e.g. "09:00 AM")
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let [_, hours, minutes, ampm] = match;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;

      const date = new Date(dateStr);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    return new Date(`${dateStr} ${timeStr}`);
  }

  const dateTime = parseDateTime(appointmentDate, appointmentTime);
  if (isNaN(dateTime.getTime())) {
    throw new ApiError(400, "Invalid appointment date or time format");
  }

  const reqDuration = req.body.duration === 30 ? 30 : 15;
  const startOfDay = new Date(dateTime);
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(dateTime);
  endOfDay.setHours(23,59,59,999);
  const tenMinsAgo = new Date(Date.now() - 10 * 60000);

  if (dateTime < new Date()) {
    throw new ApiError(400, "Cannot book appointments in the past.");
  }

  const todaysPatientAppointments = await Appointment.find({
    patientId: patient.userId,
    dateTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['cancelled'] }
  });

  const appointmentsWithDoctor = todaysPatientAppointments.filter(app => app.doctorId.toString() === doctorUserId.toString());
  if (appointmentsWithDoctor.length >= 2) {
    throw new ApiError(400, "You have reached the maximum limit of 2 appointments for this doctor today.");
  }

  if (clinicId) {
    const appointmentsAtClinic = todaysPatientAppointments.filter(app => app.clinicId && app.clinicId.toString() === clinicId.toString());
    if (appointmentsAtClinic.length >= 2) {
      throw new ApiError(400, "You have reached the maximum limit of 2 appointments for this clinic today.");
    }
  }

  const dayAppointments = await Appointment.find({
    doctorId: doctorUserId,
    dateTime: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { status: { $nin: ['cancelled', 'reserved'] } },
      { status: 'reserved', createdAt: { $gte: tenMinsAgo } }
    ]
  });

  const proposedStart = dateTime.getTime();
  const proposedEnd = proposedStart + reqDuration * 60000;

  const existingAppointment = dayAppointments.find(app => {
    const appStart = new Date(app.dateTime).getTime();
    const appEnd = appStart + (app.duration || 15) * 60000;
    return proposedStart < appEnd && proposedEnd > appStart;
  });

  if (existingAppointment && existingAppointment.patientId.toString() !== patient.userId.toString()) {
    throw new ApiError(409, 'This slot is no longer available. Please choose another.');
  }

  let appointment = await Appointment.findOne({
    patientId: patient.userId,
    doctorId: doctorUserId,
    dateTime: dateTime,
    status: 'reserved'
  });

  let clinicSnapshot = null;
  const targetClinicId = clinicId || doctor.clinicId || null;
  if (targetClinicId) {
    const Clinic = require('../../models/Clinic');
    const clinicData = await Clinic.findById(targetClinicId).select('name address phone');
    if (clinicData) {
      clinicSnapshot = {
        clinicId: clinicData._id,
        clinicName: clinicData.name,
        clinicCity: clinicData.address?.city,
        clinicPhone: clinicData.phone
      };
    }
  }

  if (appointment) {
    appointment.status = 'pending';
    appointment.clinicId = targetClinicId;
    appointment.clinicSnapshot = clinicSnapshot;
    appointment.reason = reason || "Not Mentioned";
    await appointment.save();
  } else {
    appointment = await Appointment.create({
      patientId: patient.userId,
      doctorId: doctorUserId,
      clinicId: targetClinicId,
      clinicSnapshot,
      dateTime,
      reason: reason || "Not Mentioned",
      status: 'pending',
      type: 'consultation',
      duration: reqDuration
    });
  }

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name address phone');

  // Emails
  try {
    const formattedDate = new Date(dateTime).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
    const doctorUser = await User.findById(doctorUserId);

    sendEmail(req.user.email, `Appointment Confirmed — ${formattedDate}`, 'appointmentConfirmed', {
      patientName: req.user.name,
      doctorName: doctor.fullName || doctorUser?.name || "Doctor",
      dateTime: formattedDate,
      location: (populatedAppointment.clinicId?.name || "Private Clinic") + ", " + (populatedAppointment.clinicId?.address || ""),
      type: appointment.type
    });

    if (doctorUser) {
      sendEmail(doctorUser.email, `Appointment Booked — ${req.user.name}`, 'doctorAppointmentNotice', {
        doctorName: doctorUser.name,
        patientName: req.user.name,
        dateTime: formattedDate,
        reason: appointment.reason
      });
    }
  } catch (e) { }

  // Notify Doctor
  const io = req.app.get("io");
  await createNotification(io, {
    recipient: doctorUserId,
    title: "New Appointment Request",
    message: `${req.user.name} has booked a consultation for ${appointmentDate} at ${appointmentTime}.`,
    type: "info",
    link: "/dashboard/doctor/appointments",
    portal: "doctor"
  });

  await invalidateAllDoctorScheduleCaches(doctorUserId);
  await invalidatePatientHealthScoreCache(userId);
  const effectiveClinicId = clinicId || doctor.clinicId;
  if (effectiveClinicId) {
    const clinic = await Clinic.findById(effectiveClinicId);
    if (clinic && clinic.adminId) {
      const apptDate = new Date(dateTime);
      const formattedDate = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      await createNotification(io, {
        recipient: clinic.adminId,
        title: "New Booking at Clinic",
        message: `A new appointment with Dr. ${doctor.fullName || 'Member'} has been scheduled by ${req.user.name} on ${formattedDate} at ${appointmentTime}.`,
        type: "info",
        link: "/dashboard/clinic_admin/appointments",
        portal: "clinic_admin"
      });
    }
  }

  io.to(doctorUserId.toString()).emit('schedule_updated');

  res.status(201).json(new ApiResponse(201, populatedAppointment, 'Appointment booked successfully'));
});

/**
 * @route PUT /api/patient/appointments/:id/cancel
 * @access Private (Patient only)
 */
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const appointment = await Appointment.findOne({ _id: id, patientId: userId }).populate('doctorId', 'name email');
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (appointment.status !== 'pending') {
    throw new ApiError(400, 'Only pending appointments can be cancelled');
  }

  appointment.status = 'cancelled';
  await appointment.save();

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name address phone');

  // Email: Appointment Cancelled by Patient
  try {
    if (appointment.doctorId && appointment.doctorId.email) {
      sendEmail(appointment.doctorId.email, "Appointment Cancelled by Patient", 'appointmentCancelledByPatient', {
        doctorName: appointment.doctorId.name,
        patientName: req.user.name,
        dateTime: new Date(appointment.dateTime).toLocaleString()
      });
    }
  } catch (e) { }

  const io = req.app.get("io");
  await createNotification(io, {
    recipient: appointment.doctorId._id,
    title: "Appointment Cancelled",
    message: `${req.user.name} has cancelled their appointment for ${new Date(appointment.dateTime).toLocaleDateString()}.`,
    type: "warning",
    link: "/dashboard/doctor/appointments",
    portal: "doctor"
  });

  if (appointment.clinicId) {
    const clinic = await Clinic.findById(appointment.clinicId);
    if (clinic && clinic.adminId) {
      await createNotification(io, {
        recipient: clinic.adminId,
        title: "Appointment Cancelled",
        message: `An appointment for ${req.user.name} at your clinic has been cancelled.`,
        type: "warning",
        link: "/dashboard/clinic_admin/appointments",
        portal: "clinic_admin"
      });
    }
  }

  await invalidateAllDoctorScheduleCaches(appointment.doctorId._id);
  await invalidatePatientHealthScoreCache(userId);
  io.to(appointment.doctorId._id.toString()).emit('schedule_updated');

  res.status(200).json(new ApiResponse(200, populatedAppointment, 'Appointment cancelled successfully'));
});

/**
 * @desc    Rate an appointment
 * @route   PUT /api/patient/appointments/:id/rate
 */
exports.rateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { score, comment } = req.body;

  if (!score || score < 1 || score > 5) {
    throw new ApiError(400, "Score must be between 1 and 5");
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.status !== "completed") {
    throw new ApiError(400, "You can only rate completed appointments");
  }

  appointment.patientFeedback = {
    score,
    comment,
    ratedAt: new Date()
  };

  await appointment.save();

  res.status(200).json(new ApiResponse(200, appointment, "Rating submitted successfully"));
});

/**
 * Get all clinics for booking flow
 * @route GET /api/patient/clinics
 * @access Private (Patient only)
 */
exports.getClinics = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const searchStr = (search || '').toString().trim();

  const { getCache, setCache } = require("../../utils/cacheHelpers");
  const cacheKey = `patient:clinics:${searchStr}`;

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, 'Clinics fetched successfully'));
  }

  let query = {};
  if (searchStr !== '') {
    const sanitizedSearch = searchStr.replace(/[^\w\s]/gi, '').trim();
    if (sanitizedSearch) {
      query = {
        $text: { $search: sanitizedSearch }
      };
    }
  }

  const clinics = await Clinic.find(query)
    .populate({
      path: 'doctors',
      select: 'userId specialization fullName schedule consultationFee availabilityStatus',
      populate: {
        path: 'userId',
        select: 'name email photo'
      }
    })
    .lean();

  await setCache(cacheKey, clinics, 300);

  res.status(200).json(new ApiResponse(200, clinics, 'Clinics fetched successfully'));
});

/**
 * Get all doctors across all clinics for discovery
 * @route GET /api/patient/doctors
 * @access Private (Patient only)
 */
exports.getDoctors = asyncHandler(async (req, res) => {
  const { availableOnly } = req.query;
  const { getCache, setCache } = require("../../utils/cacheHelpers");
  const cacheKey = `patient:doctors:${availableOnly === 'true'}`;

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, 'Doctors fetched successfully'));
  }

  const filter = {};
  if (availableOnly === 'true') {
    filter.availabilityStatus = { $in: ['available', null, undefined] };
  }

  const doctors = await Doctor.find(filter)
    .populate({
      path: 'userId',
      select: 'name email photo'
    })
    .populate('clinicId', 'name address')
    .lean();

  const allDoctors = await Promise.all(doctors.map(async (doc) => {
    const appointmentCount = await Appointment.countDocuments({
      doctorId: doc.userId?._id,
      status: 'completed'
    });

    const ratings = await Appointment.find({
      doctorId: doc.userId?._id,
      status: 'completed',
      'patientFeedback.score': { $exists: true }
    }).select('patientFeedback.score');

    let avgRating = 4.8;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr.patientFeedback.score, 0);
      avgRating = (sum / ratings.length).toFixed(1);
    }

    return {
      _id: doc._id,
      userId: doc.userId?._id,
      name: doc.fullName || doc.userId?.name || "Doctor",
      email: doc.userId?.email,
      photo: doc.userId?.photo,
      specialization: doc.specialization,
      availabilityStatus: doc.availabilityStatus || 'available',
      clinicId: doc.clinicId ? {
        _id: doc.clinicId._id,
        name: doc.clinicId.name,
        address: doc.clinicId.address
      } : {
        _id: null,
        name: "Private Practice",
        address: doc.location?.address || doc.location?.city || "Pakistan"
      },
      location: doc.location,
      appointmentsCount: appointmentCount,
      rating: parseFloat(avgRating)
    };
  }));

  await setCache(cacheKey, allDoctors, 300);

  res.status(200).json(new ApiResponse(200, allDoctors, 'Doctors fetched successfully'));
});

/**
 * @route GET /api/patient/appointments/available-slots
 * @access Private (Patient only)
 */
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;

  if (!doctorId || !date) {
    throw new ApiError(400, 'Doctor ID and date are required');
  }

  let doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    doctor = await Doctor.findOne({ userId: doctorId });
  }

  if (doctor && doctor.availabilityStatus && doctor.availabilityStatus !== 'available') {
    return res.status(200).json(new ApiResponse(200, {
      available: false,
      reason: doctor.availabilityStatus,
      message: doctor.availabilityStatus === 'busy'
        ? "Doctor is currently busy. Check back later."
        : "Doctor is on leave. Try another doctor."
    }, 'Doctor is not available for booking'));
  }

  let doctorUserId = doctor ? doctor.userId : doctorId;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const tenMinsAgo = new Date(Date.now() - 10 * 60000);

  const bookedAppointments = await Appointment.find({
    doctorId: doctorUserId,
    dateTime: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { status: { $nin: ['cancelled', 'reserved'] } },
      { status: 'reserved', createdAt: { $gte: tenMinsAgo } }
    ]
  }).select('dateTime status patientId duration');

  const bookedSlotStrings = [];
  bookedAppointments.forEach(app => {
    const appStart = new Date(app.dateTime).getTime();
    const duration = app.duration || 15;
    const numSlots = Math.ceil(duration / 15);
    for (let i = 0; i < numSlots; i++) {
      const d = new Date(appStart + i * 15 * 60000);
      bookedSlotStrings.push(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
    }
  });

  res.status(200).json(new ApiResponse(200, { bookedSlots: bookedSlotStrings, available: true }, 'Available slots fetched'));
});

/**
 * @route POST /api/patient/appointments/reserve-slot
 * @access Private (Patient only)
 */
exports.reserveSlot = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { doctorId, appointmentDate, appointmentTime } = req.body;

  let patient = await Patient.findOne({ userId });
  if (!patient) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    patient = await Patient.create({ userId: user._id, name: user.name });
  }

  let doctor = await Doctor.findById(doctorId);
  let doctorUserId = doctor ? doctor.userId : doctorId;

  function parseDateTime(dateStr, timeStr) {
    if (!timeStr || !dateStr) return new Date(NaN);

    // Check if time is in 12h format (e.g. "09:00 AM")
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let [_, hours, minutes, ampm] = match;
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;

      const date = new Date(dateStr);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    return new Date(`${dateStr} ${timeStr}`);
  }

  const dateTime = parseDateTime(appointmentDate, appointmentTime);
  if (isNaN(dateTime.getTime())) {
    throw new ApiError(400, "Invalid appointment date or time format");
  }
  const reqDuration = req.body.duration === 30 ? 30 : 15;
  const startOfDay = new Date(dateTime);
  startOfDay.setHours(0,0,0,0);
  const endOfDay = new Date(dateTime);
  endOfDay.setHours(23,59,59,999);
  const tenMinsAgo = new Date(Date.now() - 10 * 60000);

  const dayAppointments = await Appointment.find({
    doctorId: doctorUserId,
    dateTime: { $gte: startOfDay, $lte: endOfDay },
    $or: [
      { status: { $nin: ['cancelled', 'reserved'] } },
      { status: 'reserved', createdAt: { $gte: tenMinsAgo } }
    ]
  });

  const proposedStart = dateTime.getTime();
  const proposedEnd = proposedStart + reqDuration * 60000;

  const existingAppointment = dayAppointments.find(app => {
    const appStart = new Date(app.dateTime).getTime();
    const appEnd = appStart + (app.duration || 15) * 60000;
    return proposedStart < appEnd && proposedEnd > appStart;
  });

  if (existingAppointment && existingAppointment.patientId.toString() !== patient.userId.toString()) {
    throw new ApiError(409, 'This slot is currently reserved or booked by someone else.');
  }

  if (existingAppointment) {
    existingAppointment.createdAt = new Date();
    await existingAppointment.save();
    return res.status(200).json(new ApiResponse(200, existingAppointment, 'Reservation extended for another 10 minutes'));
  }

  let clinicSnapshot = null;
  const targetClinicId = doctor?.clinicId || null;
  if (targetClinicId) {
    const Clinic = require('../../models/Clinic');
    const clinicData = await Clinic.findById(targetClinicId).select('name address phone');
    if (clinicData) {
      clinicSnapshot = {
        clinicId: clinicData._id,
        clinicName: clinicData.name,
        clinicCity: clinicData.address?.city,
        clinicPhone: clinicData.phone
      };
    }
  }

  const reservation = await Appointment.create({
    patientId: patient.userId,
    doctorId: doctorUserId,
    clinicId: targetClinicId,
    clinicSnapshot,
    dateTime,
    reason: "Not Mentioned",
    status: 'reserved',
    type: 'consultation',
    duration: reqDuration
  });

  res.status(201).json(new ApiResponse(201, reservation, 'Slot reserved successfully for 10 minutes'));
});

exports.deleteAppointment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const appointment = await Appointment.findOne({ _id: id, patientId: userId });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  await Appointment.findByIdAndDelete(id);
  await invalidatePatientHealthScoreCache(userId);

  res.status(200).json(new ApiResponse(200, null, 'Appointment deleted successfully'));
});
