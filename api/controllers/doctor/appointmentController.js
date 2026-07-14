const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const Clinic = require('../../models/Clinic');
const Prescription = require('../../models/Prescription');
const { updateRevenue } = require('../../utils/revenue');
const { createNotification } = require('../../utils/notification');
const { invalidateAllDoctorScheduleCaches, invalidatePatientHealthScoreCache, invalidateAppointmentsCache } = require('../../utils/cacheHelpers');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

const resolvePrescriptionTotalCost = (payload = {}) => {
  const consultationFee = Number(payload.consultationFee || 0);
  const medicineCost = Number(payload.medicineCost || 0);
  const explicitTotal = Number(payload.totalCost || 0);
  return explicitTotal > 0 ? explicitTotal : consultationFee + medicineCost;
};

const createPrescriptionForCompletedAppointment = async ({ appointment, doctorId, prescriptionData = {}, req }) => {
  if (!appointment || appointment.prescriptionId) {
    return null;
  }

  const payload = prescriptionData.prescription || prescriptionData.prescriptionData || prescriptionData;
  if (!payload || !payload.diagnosis) {
    return null;
  }

  const doctor = await Doctor.findOne({ userId: doctorId });
  const patientUser = await User.findById(appointment.patientId).select('name');
  const doctorFullName = doctor?.fullName || req.user?.name || 'your doctor';
  const patientFullName = patientUser?.name || 'the patient';
  let baseFee = doctor?.consultationFee || 0;
  if (appointment.duration === 30) {
    baseFee = baseFee * 2;
  }
  const consultationFee = Number(payload.consultationFee || baseFee);
  const medicineCost = Number(payload.medicineCost || 0);
  const resolvedTotalCost = Number(payload.totalCost || 0) > 0 ? Number(payload.totalCost) : consultationFee + medicineCost;

  const prescription = await Prescription.create({
    doctorId,
    patientId: appointment.patientId,
    appointmentId: appointment._id,
    clinicId: doctor?.clinicId || appointment.clinicId || null,
    diagnosis: payload.diagnosis,
    medicines: payload.medicines || [],
    notes: payload.notes || '',
    consultationFee,
    medicineCost,
    totalCost: resolvedTotalCost,
    followUpDate: payload.followUpDate || null,
    createdBy: doctorId,
    status: 'finalized',
    rawTranscript: payload.rawTranscript || '',
    audioUrl: payload.audioUrl || '',
  });

  // Debug logging to help trace prescription creation path from appointments
  try {
    console.debug('Auto-created prescription from appointment:', {
      appointmentId: appointment._id?.toString(),
      prescriptionId: prescription._id?.toString(),
      doctorIdProvided: doctorId?.toString(),
      prescriptionDoctorId: prescription.doctorId?.toString()
    });
  } catch (e) {
    console.warn('Failed to log auto-created prescription debug info', e?.message || e);
  }

  appointment.prescriptionId = prescription._id;
  await appointment.save();

  if (payload.followUpDate) {
    const dueDate = new Date(payload.followUpDate);
    if (!isNaN(dueDate.getTime())) {
      const Patient = require('../../models/Patient');
      let patientProfile = await Patient.findOne({ userId: appointment.patientId });
      if (!patientProfile) {
        patientProfile = await Patient.findById(appointment.patientId);
      }
      if (patientProfile && doctor) {
        const FollowUp = require('../../models/FollowUp');
        const existingFollowUp = await FollowUp.findOne({
          patientId: patientProfile._id,
          doctorId: doctor._id,
          dueDate
        });
        if (!existingFollowUp) {
          await FollowUp.create({
            patientId: patientProfile._id,
            doctorId: doctor._id,
            appointmentId: appointment._id,
            dueDate,
            notes: payload.notes || 'Follow-up from completed appointment prescription',
            status: 'pending'
          });
        }
      }
    }
  }

  if (resolvedTotalCost > 0) {
    await updateRevenue(doctorId, resolvedTotalCost, doctor?.clinicId || appointment.clinicId, appointment.patientId, {
      source: 'appointment_completed',
      appointmentId: appointment._id,
      prescriptionId: prescription._id,
      consultationFee,
      medicineCost,
      occurredAt: appointment.completedAt || new Date(),
    });
  }

  const io = req.app.get('io');
  const clinic = (doctor?.clinicId || appointment.clinicId)
    ? await Clinic.findById(doctor?.clinicId || appointment.clinicId).select('adminId')
    : null;

  await createNotification(io, {
    recipient: appointment.patientId,
    title: 'New Prescription Available',
    message: `Dr. ${doctorFullName} created a prescription for you`,
    type: 'success',
    link: '/dashboard/patient/records',
    portal: 'patient'
  });

  await createNotification(io, {
    recipient: doctorId,
    title: 'Prescription Created',
    message: `You created a prescription for patient "${patientFullName}"`,
    type: 'success',
    link: '/dashboard/doctor/prescriptions',
    portal: 'doctor',
    skipSocket: true
  });

  if (resolvedTotalCost > 0) {
    const doctorShare = resolvedTotalCost * 0.80;
    const clinicShare = resolvedTotalCost * 0.20;

    await createNotification(io, {
      recipient: doctorId,
      title: 'Revenue Earned',
      message: `Appointment with ${patientFullName} completed. You earned PKR ${doctorShare.toFixed(2)} (80% share).`,
      type: 'success',
      link: '/dashboard/doctor/appointments',
      portal: 'doctor',
      skipSocket: true
    });

    if (clinic?.adminId) {
      await createNotification(io, {
        recipient: clinic.adminId,
        title: 'Clinic Revenue Earned',
        message: `Appointment between Dr. ${doctorFullName} and ${patientFullName} completed. Clinic earned PKR ${clinicShare.toFixed(2)} (20% share).`,
        type: 'success',
        link: '/dashboard/clinic_admin/appointments',
        portal: 'clinic_admin'
      });
    }
  }

  if (clinic?.adminId) {
    await createNotification(io, {
      recipient: clinic.adminId,
      title: 'Prescription Created',
      message: `Dr. ${doctorFullName} created a prescription for patient "${patientFullName}"`,
      type: 'success',
      link: '/dashboard/clinic_admin/appointments',
      portal: 'clinic_admin'
    });
  }

  return prescription;
};

/**
 * @desc    Create a new appointment
 * @route   POST /api/doctor/appointments
 * @access  Private (Doctor only)
 */
exports.createAppointment = asyncHandler(async (req, res) => {
  const { patientId, dateTime, duration, type, reason, notes } = req.body;
  const doctorId = req.user._id;

  // Validate required fields
  if (!patientId || !dateTime) {
    throw new ApiError(400, 'Patient and date/time are required');
  }

  // Get doctor's clinic
  const doctor = await Doctor.getOrCreateProfile(doctorId);
  if (!doctor) {
    throw new ApiError(404, 'Doctor profile not found');
  }

  // Verify patient exists
  const patient = await User.findById(patientId);
  if (!patient || !patient.roles.includes('patient')) {
    throw new ApiError(404, 'Patient not found');
  }

  // Check for scheduling conflicts
  const appointmentDate = new Date(dateTime);
  const appointmentEndTime = new Date(appointmentDate.getTime() + (duration || 15) * 60000);

  const conflictingAppointment = await Appointment.findOne({
    doctorId,
    status: { $in: ['pending', 'confirmed', 'in-progress'] },
    $or: [
      {
        dateTime: {
          $gte: appointmentDate,
          $lt: appointmentEndTime
        }
      },
      {
        $and: [
          { dateTime: { $lte: appointmentDate } },
          {
            $expr: {
              $gte: [
                { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
                appointmentDate
              ]
            }
          }
        ]
      }
    ]
  });

  if (conflictingAppointment) {
    throw new ApiError(409, 'Time slot is already booked');
  }

  let clinicSnapshot = null;
  if (doctor.clinicId) {
    const clinic = await Clinic.findById(doctor.clinicId).select('name address phone');
    if (clinic) {
      clinicSnapshot = {
        clinicId: clinic._id,
        clinicName: clinic.name,
        clinicCity: clinic.address?.city,
        clinicPhone: clinic.phone
      };
    }
  }

  // Create appointment
  const appointment = await Appointment.create({
    doctorId,
    patientId,
    clinicId: doctor.clinicId || null,
    clinicSnapshot,
    dateTime: appointmentDate,
    duration: duration || 15,
    type: type || 'consultation',
    reason: reason || 'General consultation',
    notes,
    status: 'confirmed',
  });

  // Automatically create a FollowUp record and notify patient if it is a follow-up appointment
  if (type === 'follow-up') {
    const Patient = require('../../models/Patient');
    let patientProfile = await Patient.findOne({ userId: patientId });
    if (!patientProfile) {
      patientProfile = await Patient.findById(patientId);
    }
    if (patientProfile) {
      const FollowUp = require('../../models/FollowUp');
      await FollowUp.create({
        patientId: patientProfile._id,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        dueDate: appointmentDate,
        notes: notes || 'Scheduled via Doctor Calendar Quick Action',
        status: 'pending'
      });

      // Send real-time notification to patient
      const { createNotification } = require('../../utils/notification');
      const io = req.app.get('io');
      const formattedDate = appointmentDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric"
      });
      const doctorFullName = doctor.fullName || req.user?.name || 'your doctor';

      await createNotification(io, {
        recipient: patientId,
        title: 'New Follow-Up Scheduled',
        message: `Dr. ${doctorFullName} scheduled a follow-up for ${formattedDate}.`,
        type: 'follow_up_assigned',
        link: '/patient/follow-ups',
        portal: 'patient'
      });

      if (io) {
        io?.to(patientId.toString())?.emit('follow_up_assigned', {
          type: 'follow_up_assigned',
          message: `Dr. ${doctorFullName} scheduled a follow-up for ${formattedDate}.`,
          dueDate: appointmentDate
        });
      }
    }
  }

  await invalidateAllDoctorScheduleCaches(doctorId);
  await invalidatePatientHealthScoreCache(patientId);
  await invalidateAppointmentsCache(doctor.clinicId || null, doctorId, patientId);
  const io = req.app.get('io');
  if (io) io?.to(doctorId.toString())?.emit('schedule_updated');

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('patientId', 'name email phone photo')
    .populate('clinicId', 'name address');

  res.status(201).json(
    new ApiResponse(201, populatedAppointment, 'Appointment created successfully')
  );
});

/**
 * @desc    Get all appointments for the logged-in doctor
 * @route   GET /api/doctor/appointments
 * @access  Private (Doctor only)
 */
exports.getAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, date, upcoming } = req.query;
  const doctorId = req.user._id;

  const now = new Date();
  // Auto-cancel past pending/reserved appointments
  await Appointment.updateMany(
    {
      doctorId,
      dateTime: { $lt: now },
      status: { $in: ['pending', 'reserved'] }
    },
    { $set: { status: 'cancelled' } }
  );

  const filter = { doctorId };

  if (status) filter.status = status;

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.dateTime = { $gte: startOfDay, $lte: endOfDay };
  } else if (upcoming === 'true') {
    filter.dateTime = { $gte: new Date() };
    filter.status = { $in: ['pending', 'confirmed'] };
  }

  const appointments = await Appointment.find(filter)
    .populate('patientId', 'name email phone photo')
    .populate('clinicId', 'name address')
    .sort({ dateTime: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await Appointment.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(200, {
      appointments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Appointments fetched successfully')
  );
});

/**
 * @desc    Get today's appointment queue
 * @route   GET /api/doctor/appointments/today
 * @access  Private (Doctor only)
 */
exports.getTodayQueue = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // Match appointments scheduled for today OR completed today
  const appointments = await Appointment.find({
    doctorId,
    $or: [
      { dateTime: { $gte: today, $lte: endOfDay } },
      { completedAt: { $gte: today, $lte: endOfDay } }
    ]
  })
    .populate('patientId', 'name email phone photo')
    .populate('clinicId', 'name')
    .sort({ dateTime: -1 });

  // Get current month revenue from Doctor profile
  const doctor = await Doctor.findOne({ userId: doctorId });
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthRevenue = doctor?.revenue?.monthly?.get(currentMonthKey) || 0;

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    inProgress: appointments.filter(a => a.status === 'in-progress').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    thisMonthRevenue: thisMonthRevenue
  };

  res.status(200).json(
    new ApiResponse(200, { appointments, stats }, 'Today\'s queue fetched successfully')
  );
});

/**
 * @desc    Get a single appointment by ID
 * @route   GET /api/doctor/appointments/:id
 * @access  Private (Doctor only)
 */
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patientId', 'name email phone photo')
    .populate('doctorId', 'name email photo')
    .populate('clinicId', 'name address phone');

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Verify doctor owns this appointment
  if (appointment.doctorId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to view this appointment');
  }

  // Get doctor profile for specialization
  const doctorProfile = await Doctor.findOne({ userId: appointment.doctorId._id });

  // Get patient profile for blood group and contact
  const Patient = require('../../models/Patient');
  const patientProfile = await Patient.findOne({ userId: appointment.patientId._id });

  // Get prescription if any
  const Prescription = require('../../models/Prescription');
  const prescription = await Prescription.findOne({ appointmentId: appointment._id });

  const baseFee = doctorProfile?.consultationFee || 0;
  const result = {
    ...appointment.toObject(),
    totalFee: prescription ? (prescription.totalCost || prescription.consultationFee || 0) : baseFee,
    clinicRevenue: prescription ? ((prescription.totalCost || prescription.consultationFee || 0) * 0.2) : baseFee * 0.2,
    patient: {
      name: appointment.patientId?.name,
      email: appointment.patientId?.email,
      photo: appointment.patientId?.photo,
      contact: patientProfile?.contact || appointment.patientId?.phone,
      bloodGroup: patientProfile?.bloodGroup,
    },
    doctor: {
      name: appointment.doctorId?.name,
      photo: appointment.doctorId?.photo,
      specialization: doctorProfile?.specialization,
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

  res.status(200).json(
    new ApiResponse(200, result, 'Appointment fetched successfully')
  );
});

/**
 * @desc    Update appointment status (accept/reject/complete)
 * @route   PUT /api/doctor/appointments/:id
 * @access  Private (Doctor only)
 */
exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  // Verify doctor owns this appointment
  if (appointment.doctorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to update this appointment');
  }

  const { status, notes, cancellationReason } = req.body;

  if (status) {
    appointment.status = status;

    if (status === 'cancelled') {
      appointment.cancelledBy = 'doctor';        // string enum — used in performance scoring
      appointment.cancelledByUserId = req.user._id;
      appointment.cancelledAt = new Date();
      if (cancellationReason) {
        appointment.cancellationReason = cancellationReason;
      }
    }

    if (status === 'completed') {
      appointment.completedAt = new Date();
    }
  }

  if (notes !== undefined) {
    appointment.notes = notes;
  }

  await appointment.save();

  await invalidateAllDoctorScheduleCaches(req.user._id);
  await invalidatePatientHealthScoreCache(appointment.patientId);
  const io = req.app.get('io');
  if (io) io?.to(req.user._id.toString())?.emit('schedule_updated');

  if (appointment.status === 'completed') {
    await createPrescriptionForCompletedAppointment({
      appointment,
      doctorId: req.user._id,
      prescriptionData: req.body,
      req,
    });
  }

  const updatedAppointment = await Appointment.findById(appointment._id)
    .populate('patientId', 'name email phone')
    .populate('clinicId', 'name');

  // Send notification to patient when doctor updates status (approved/confirmed/cancelled/completed)
  try {
    const io = req.app.get('io');
    const patientId = updatedAppointment.patientId?._id || updatedAppointment.patientId;
    const doctorUser = await User.findById(req.user._id);
    let doctorName = doctorUser?.name || 'Doctor';
    const doctorObj = await Doctor.findOne({ userId: req.user._id });
    if (doctorObj && doctorObj.fullName) {
      doctorName = doctorObj.fullName;
    }
    if (!doctorName.toLowerCase().startsWith('dr')) {
      doctorName = 'dr ' + doctorName;
    }
    const apptDate = new Date(updatedAppointment.dateTime);
    const formattedDate = apptDate.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });

    let title = 'Appointment Update';
    let message = `${doctorName} updated your appointment status to ${updatedAppointment.status}.`;
    if (['confirmed', 'accepted'].includes(updatedAppointment.status)) {
      title = 'Appointment Confirmed';
      message = `Your appointment with ${doctorName} is confirmed for ${formattedDate}.`;
    } else if (updatedAppointment.status === 'cancelled') {
      title = 'Appointment Cancelled';
      message = `Your appointment with ${doctorName} on ${formattedDate} has been cancelled.`;
    } else if (updatedAppointment.status === 'completed') {
      title = 'Appointment Completed';
      message = `Your appointment with ${doctorName} on ${formattedDate} is marked completed.`;
    }

    if (patientId) {
      await createNotification(io, {
        recipient: patientId,
        title,
        message,
        type: 'info',
        link: '/dashboard/patient/appointments',
        portal: 'patient'
      });
    }
  } catch (e) {
    console.error('Failed to send appointment update notification to patient', e);
  }
  res.status(200).json(
    new ApiResponse(200, updatedAppointment, 'Appointment updated successfully')
  );
});


/**
 * @desc    Start an appointment (mark as in-progress)
 * @route   PUT /api/doctor/appointments/:id/start
 * @access  Private (Doctor only)
 */
exports.startAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (appointment.doctorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to start this appointment');
  }

  if (appointment.status !== 'pending' && appointment.status !== 'confirmed') {
    throw new ApiError(400, 'Appointment cannot be started from current status');
  }

  appointment.status = 'in-progress';
  appointment.actualStartTime = new Date();  // enables on-time rate computation
  await appointment.save();
  await invalidatePatientHealthScoreCache(appointment.patientId);

  // Invalidate clinic performance cache when appointment status changes
  try {
    const { redisClient } = require('../../services/redisService');
    if (redisClient && appointment.clinicId) {
      await redisClient.del(`clinic_performance_${appointment.clinicId}_week`);
      await redisClient.del(`clinic_performance_${appointment.clinicId}_month`);
      await redisClient.del(`clinic_performance_${appointment.clinicId}_quarter`);
      await redisClient.del(`clinic_performance_${appointment.clinicId}_all`);
    }
  } catch(e) { /* non-critical */ }

  const updatedAppointment = await Appointment.findById(appointment._id)
    .populate('patientId', 'name email phone')
    .populate('clinicId', 'name');

  res.status(200).json(
    new ApiResponse(200, updatedAppointment, 'Appointment started successfully')
  );
});

/**
 * @desc    Complete an appointment
 * @route   PUT /api/doctor/appointments/:id/complete
 * @access  Private (Doctor only)
 */
exports.completeAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  if (appointment.doctorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to complete this appointment');
  }

  appointment.status = 'completed';
  appointment.completedAt = new Date();

  if (req.body.notes) {
    appointment.notes = req.body.notes;
  }

  await appointment.save();

  // Create manual follow-up if requested
  if (req.body.followUp) {
    const { value, unit, notes: followUpNotes } = req.body.followUp;
    if (value && unit) {
      const dueDate = new Date();
      const numVal = parseInt(value, 10);
      if (!isNaN(numVal)) {
        if (unit === 'days') {
          dueDate.setDate(dueDate.getDate() + numVal);
        } else if (unit === 'weeks') {
          dueDate.setDate(dueDate.getDate() + numVal * 7);
        } else if (unit === 'months') {
          dueDate.setMonth(dueDate.getMonth() + numVal);
        }

        const Patient = require('../../models/Patient');
        const patientProfile = await Patient.findOne({ userId: appointment.patientId });
        const doctorProfile = await Doctor.findOne({ userId: req.user._id });

        if (patientProfile && doctorProfile) {
          const FollowUp = require('../../models/FollowUp');
          await FollowUp.create({
            patientId: patientProfile._id,
            doctorId: doctorProfile._id,
            appointmentId: appointment._id,
            dueDate,
            notes: followUpNotes || '',
            status: 'pending',
          });
        }
      }
    }
  }

  await invalidatePatientHealthScoreCache(appointment.patientId);

  const prescription = await createPrescriptionForCompletedAppointment({
    appointment,
    doctorId: req.user._id,
    prescriptionData: req.body,
    req,
  });

  if (!prescription && !appointment.prescriptionId) {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    let baseFee = doctor?.consultationFee || 0;
    if (appointment.duration === 30) {
      baseFee = baseFee * 2;
    }
    if (baseFee > 0) {
      const { updateRevenue } = require('../../utils/revenue');
      await updateRevenue(req.user._id, baseFee, doctor?.clinicId || appointment.clinicId, appointment.patientId, {
        source: 'appointment_completed',
        appointmentId: appointment._id,
        consultationFee: baseFee,
        medicineCost: 0,
        occurredAt: appointment.completedAt || new Date(),
      });
    }
  }

  const updatedAppointment = await Appointment.findById(appointment._id)
    .populate('patientId', 'name email phone')
    .populate('clinicId', 'name');

  res.status(200).json(
    new ApiResponse(200, updatedAppointment, 'Appointment completed successfully')
  );
});

/**
 * @desc    Delete an appointment
 * @route   DELETE /api/doctor/appointments/:id
 * @access  Private (Doctor only)
 */
exports.deleteAppointment = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { id } = req.params;

  const appointment = await Appointment.findOne({ _id: id, doctorId });
  if (!appointment) {
    throw new ApiError(404, 'Appointment not found');
  }

  await appointment.deleteOne();

  await invalidateAllDoctorScheduleCaches(doctorId);
  await invalidatePatientHealthScoreCache(appointment.patientId);
  const io = req.app.get('io');
  if (io) io?.to(doctorId.toString())?.emit('schedule_updated');

  res.status(200).json(
    new ApiResponse(200, null, 'Appointment deleted successfully')
  );
});
