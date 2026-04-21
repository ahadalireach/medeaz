const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Clinic = require('../../models/Clinic');
const User = require('../../models/User');

/**
 * Get patient dashboard statistics
 * @route GET /api/patient/dashboard
 * @access Private (Patient only)
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find patient by userId - with a fallback creation if missing for some reason
  let patient = await Patient.findOne({ userId });
  if (!patient) {
    // If user exists and is a patient, recreate profile
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

  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - 6);

  const endOfLastWeek = new Date(startOfThisWeek);
  endOfLastWeek.setMilliseconds(endOfLastWeek.getMilliseconds() - 1);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const countAppointmentsInRange = async (start, end) => {
    return Appointment.countDocuments({
      patientId: userId,
      $or: [
        { dateTime: { $gte: start, $lte: end } },
        {
          status: 'completed',
          completedAt: { $gte: start, $lte: end },
        },
      ],
    });
  };

  // Appointments this week (rolling 7 days)
  const appointmentsThisWeek = await countAppointmentsInRange(startOfThisWeek, now);

  // Appointments previous rolling 7 days
  const appointmentsLastWeek = await countAppointmentsInRange(startOfLastWeek, endOfLastWeek);

  // Appointments this month
  const appointmentsThisMonth = await Appointment.countDocuments({
    patientId: userId,
    dateTime: { $gte: startOfThisMonth, $lte: now },
  });

  // Appointments last month
  const appointmentsLastMonth = await Appointment.countDocuments({
    patientId: userId,
    dateTime: { $gte: startOfLastMonth, $lte: endOfLastMonth },
  });

  // Total prescriptions
  const totalPrescriptions = await Prescription.countDocuments({
    patientId: userId,
  });

  // Doctors visited (unique)
  const prescriptions = await Prescription.find({ patientId: userId })
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name');

  const doctorsMap = new Map();
  prescriptions.forEach((prescription) => {
    if (prescription.doctorId && prescription.doctorId.doctorProfile) {
      const doc = prescription.doctorId;
      const profile = doc.doctorProfile;
      if (!doctorsMap.has(profile._id.toString())) {
        doctorsMap.set(profile._id.toString(), {
          _id: profile._id,
          name: profile.fullName || doc.name,
          specialization: profile.specialization || 'General Physician',
          clinicName: prescription.clinicId?.name || 'Private Registry',
          photo: doc.photo || profile.photo,
        });
      }
    }
  });

  const doctorsVisited = Array.from(doctorsMap.values());

  // Recent prescriptions (last 3)
  const recentPrescriptions = await Prescription.find({ patientId: userId })
    .sort({ createdAt: -1 })
    .limit(3)
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name address');

  // Calculate Total Spent from all completed appointments
  const allCompletedAppointments = await Appointment.find({
    patientId: userId,
    status: 'completed'
  });

  let totalSpentCalculated = 0;
  for (const app of allCompletedAppointments) {
    const doc = await Doctor.findOne({ userId: app.doctorId });
    totalSpentCalculated += doc?.consultationFee || 0;
  }

  // Upcoming appointments (next 3) - Only pending or confirmed
  const upcomingAppointments = await Appointment.find({
    patientId: userId,
    dateTime: { $gte: now },
    status: { $in: ['pending', 'confirmed'] },
  })
    .sort({ dateTime: 1 })
    .limit(3)
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name address');

  // Upcoming Follow-ups (next 3)
  const upcomingFollowUps = await Prescription.find({
    patientId: userId,
    followUpDate: { $gte: now }
  })
    .sort({ followUpDate: 1 })
    .limit(3)
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name address');

  // Spending Trend (Last 6 months - Newest First)
  const spendingTrend = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextM = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthKey = d.toLocaleString('default', { month: 'short' });

    const monthAppointments = await Appointment.find({
      patientId: userId,
      status: 'completed',
      dateTime: { $gte: d, $lt: nextM }
    });

    let monthlySpent = 0;
    for (const app of monthAppointments) {
      const doc = await Doctor.findOne({ userId: app.doctorId });
      monthlySpent += doc?.consultationFee || 0;
    }

    spendingTrend.push({
      label: monthKey,
      spent: monthlySpent
    });
  }

  res.status(200).json(
    new ApiResponse(200, {
      appointmentsThisWeek,
      appointmentsLastWeek,
      appointmentsThisMonth,
      appointmentsLastMonth,
      totalSpent: totalSpentCalculated,
      totalPrescriptions,
      doctorsVisited,
      recentPrescriptions,
      upcomingAppointments,
      upcomingFollowUps,
      spendingTrend
    }, 'Dashboard data fetched successfully')
  );
});
