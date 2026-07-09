const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const Clinic = require('../../models/Clinic');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { createNotification } = require('../../utils/notification');
const { updateRevenue } = require('../../utils/revenue');

const resolvePrescriptionTotalCost = (payload = {}) => {
  const consultationFee = Number(payload.consultationFee || 0);
  const medicineCost = Number(payload.medicineCost || 0);
  const explicitTotal = Number(payload.totalCost || 0);
  return explicitTotal > 0 ? explicitTotal : consultationFee + medicineCost;
};

/**
 * @desc    Get all prescriptions for the logged-in doctor
 * @route   GET /api/doctor/prescriptions
 * @access  Private (Doctor only)
 */
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const doctorId = req.user._id;
  const { patientId, status } = req.query;

  const query = { doctorId };
  if (patientId) query.patientId = patientId;
  if (status) query.status = status;

  const prescriptions = await Prescription.find(query)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name fullName email phone')
    .populate('clinicId', 'name address phone')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, prescriptions, 'Prescriptions fetched successfully'));
});

/**
 * @desc    Get prescription by ID
 * @route   GET /api/doctor/prescriptions/:id
 * @access  Private (Doctor only)
 */
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOne({
    _id: req.params.id,
    doctorId: req.user._id
  })
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name fullName email phone')
    .populate('clinicId', 'name address phone');

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  res.status(200).json(new ApiResponse(200, prescription, 'Prescription fetched successfully'));
});

/**
 * @desc    Create a new prescription
 * @route   POST /api/doctor/prescriptions
 * @access  Private (Doctor only)
 */
exports.createPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, diagnosis, medicines, notes, consultationFee, medicineCost, totalCost, followUpDate } = req.body;
  const doctorId = req.user._id;

  if (!patientId || !diagnosis) {
    throw new ApiError(400, 'Patient ID and diagnosis are required');
  }

  // Get doctor's clinic info
  const doctor = await Doctor.findOne({ userId: doctorId });
  const patientUser = await User.findById(patientId).select('name');
  const consultationFeeValue = Number(consultationFee || doctor?.consultationFee || 0);
  const medicineCostValue = Number(medicineCost || 0);
  const resolvedTotalCost = Number(totalCost || 0) > 0 ? Number(totalCost) : consultationFeeValue + medicineCostValue;

  const prescription = await Prescription.create({
    doctorId,
    patientId,
    appointmentId,
    clinicId: doctor?.clinicId || null,
    diagnosis,
    medicines: medicines || [],
    notes: notes || '',
    consultationFee: consultationFeeValue,
    medicineCost: medicineCostValue,
    totalCost: resolvedTotalCost,
    followUpDate,
    createdBy: doctorId,
    status: 'finalized'
  });

  // Debug logging to help trace doctor/prescription ownership issues
  try {
    console.debug('Prescription created:', {
      createdPrescriptionId: prescription._id.toString(),
      doctorIdProvided: doctorId?.toString(),
      prescriptionDoctorId: prescription.doctorId?.toString(),
      createdBy: prescription.createdBy?.toString()
    });
  } catch (e) {
    console.warn('Failed to log prescription debug info', e?.message || e);
  }

  // Update revenue using the billed prescription total.
  if (resolvedTotalCost > 0) {
    await updateRevenue(doctorId, resolvedTotalCost, doctor?.clinicId, patientId, { 
        source: 'prescription', 
        sourceId: prescription._id,
      consultationFee: consultationFeeValue,
      medicineCost: medicineCostValue,
        prescriptionId: prescription._id,
        appointmentId: appointmentId || null
    });
  }

  // If there's an appointment, mark it as completed
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'completed',
      completedAt: new Date(),
      prescriptionId: prescription._id,
    });
  }

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
        let patientProfile = await Patient.findOne({ userId: patientId });
        if (!patientProfile) {
          patientProfile = await Patient.findById(patientId);
        }

        const doctorProfile = await Doctor.findOne({ userId: doctorId });

        if (patientProfile && doctorProfile) {
          const FollowUp = require('../../models/FollowUp');
          await FollowUp.create({
            patientId: patientProfile._id,
            doctorId: doctorProfile._id,
            appointmentId: appointmentId || null,
            dueDate,
            notes: followUpNotes || '',
            status: 'pending',
          });

          // Create notification for patient about follow-up
          const { createNotification: createNotificationUtil } = require('../../utils/notification');
          const ioObj = req.app.get('io');
          const formattedDate = dueDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric"
          });
          const doctorFullName = doctorProfile.fullName || req.user?.name || 'your doctor';

          await createNotificationUtil(ioObj, {
            recipient: patientId,
            title: 'New Follow-Up Scheduled',
            message: `Dr. ${doctorFullName} scheduled a follow-up for ${formattedDate}.`,
            type: 'follow_up_assigned',
            link: '/patient/follow-ups',
            portal: 'patient'
          });

          if (ioObj) {
            ioObj.to(patientId.toString()).emit('follow_up_assigned', {
              type: 'follow_up_assigned',
              message: `Dr. ${doctorFullName} scheduled a follow-up for ${formattedDate}.`,
              dueDate
            });
          }

          prescription.followUpDate = dueDate;
          await prescription.save();
        }
      }
    }
  }

  // If followUpDate was provided directly, make sure a FollowUp document is also created
  if (!req.body.followUp && followUpDate) {
    const dueDateObj = new Date(followUpDate);
    if (!isNaN(dueDateObj.getTime())) {
      const Patient = require('../../models/Patient');
      let patientProfile = await Patient.findOne({ userId: patientId });
      if (!patientProfile) {
        patientProfile = await Patient.findById(patientId);
      }
      const doctorProfile = await Doctor.findOne({ userId: doctorId });
      if (patientProfile && doctorProfile) {
        const FollowUp = require('../../models/FollowUp');
        const existingFollowUp = await FollowUp.findOne({
          patientId: patientProfile._id,
          doctorId: doctorProfile._id,
          dueDate: dueDateObj
        });
        if (!existingFollowUp) {
          await FollowUp.create({
            patientId: patientProfile._id,
            doctorId: doctorProfile._id,
            appointmentId: appointmentId || null,
            dueDate: dueDateObj,
            notes: notes || 'Follow-up from prescription',
            status: 'pending'
          });
        }
      }
    }
  }

  const io = req.app.get('io');
  const clinic = doctor?.clinicId ? await Clinic.findById(doctor.clinicId).select('adminId') : null;
  const doctorFullName = doctor?.fullName || req.user?.name || 'your doctor';
  const patientFullName = patientUser?.name || 'the patient';

  await createNotification(io, {
    recipient: patientId,
    title: 'New Prescription Available',
    message: `Dr. ${doctorFullName} created a prescription for you`,
    type: 'success',
    link: '/dashboard/patient/records',
    portal: 'patient',
  });

  await createNotification(io, {
    recipient: doctorId,
    title: 'Prescription Created',
    message: `You created a prescription for patient "${patientFullName}"`,
    type: 'success',
    link: '/dashboard/doctor/prescriptions',
    portal: 'doctor',
    skipSocket: true,
  });

  if (clinic?.adminId) {
    await createNotification(io, {
      recipient: clinic.adminId,
      title: 'Prescription Created',
      message: `Dr. ${doctorFullName} created a prescription for patient "${patientFullName}"`,
      type: 'success',
      link: '/dashboard/clinic_admin/appointments',
      portal: 'clinic_admin',
    });
  }

  // Invalidate Redis caches for doctor's schedule and appointments
  try {
    const { invalidateAllDoctorScheduleCaches, invalidateAppointmentsCache } = require('../../utils/cacheHelpers');
    await invalidateAllDoctorScheduleCaches(doctorId);
    await invalidateAppointmentsCache(doctor?.clinicId || null, doctorId, patientId);
    if (io) io.to(doctorId.toString()).emit('schedule_updated');
  } catch (err) {
    console.error('Failed to invalidate caches after prescription creation:', err.message);
  }

  res.status(201).json(new ApiResponse(201, prescription, 'Prescription created successfully'));
});

/**
 * @desc    Update a prescription
 * @route   PUT /api/doctor/prescriptions/:id
 * @access  Private (Doctor only)
 */
exports.updatePrescription = asyncHandler(async (req, res) => {
  const { diagnosis, medicines, notes, consultationFee, medicineCost, totalCost, followUpDate, status } = req.body;
  
  const prescription = await Prescription.findOneAndUpdate(
    { _id: req.params.id, doctorId: req.user._id },
    { diagnosis, medicines, notes, consultationFee, medicineCost, totalCost, followUpDate, status, lastModifiedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  if (followUpDate) {
    const dueDate = new Date(followUpDate);
    if (!isNaN(dueDate.getTime())) {
      const Patient = require('../../models/Patient');
      let patientProfile = await Patient.findOne({ userId: prescription.patientId });
      if (!patientProfile) {
        patientProfile = await Patient.findById(prescription.patientId);
      }
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (patientProfile && doctorProfile) {
        const FollowUp = require('../../models/FollowUp');
        const existingFollowUp = await FollowUp.findOne({
          patientId: patientProfile._id,
          doctorId: doctorProfile._id,
          dueDate
        });
        if (!existingFollowUp) {
          await FollowUp.create({
            patientId: patientProfile._id,
            doctorId: doctorProfile._id,
            appointmentId: prescription.appointmentId || null,
            dueDate,
            notes: notes || 'Scheduled via Prescription Update',
            status: 'pending'
          });
        }
      }
    }
  }

  res.status(200).json(new ApiResponse(200, prescription, 'Prescription updated successfully'));
});

/**
 * @desc    Delete a prescription
 * @route   DELETE /api/doctor/prescriptions/:id
 * @access  Private (Doctor only)
 */
exports.deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findOneAndDelete({
    _id: req.params.id,
    doctorId: req.user._id
  });

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  res.status(200).json(new ApiResponse(200, null, 'Prescription deleted successfully'));
});
