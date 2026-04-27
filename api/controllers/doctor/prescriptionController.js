const Prescription = require('../../models/Prescription');
const MedicalRecord = require('../../models/MedicalRecord');
const Appointment = require('../../models/Appointment');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @desc    Get all prescriptions for the logged-in doctor
 * @route   GET /api/doctor/prescriptions
 * @access  Private (Doctor only)
 */
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, patientId, search } = req.query;
  const doctorId = req.user._id;

  const filter = { doctorId };
  
  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;
  
  const query = Prescription.find(filter)
    .populate('patientId', 'name email')
    .populate('appointmentId', 'dateTime status')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const prescriptions = await query;
  const total = await Prescription.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(200, {
      prescriptions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Prescriptions fetched successfully')
  );
});

/**
 * @desc    Get a single prescription by ID
 * @route   GET /api/doctor/prescriptions/:id
 * @access  Private (Doctor only)
 */
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patientId', 'name email phone dob')
    .populate('doctorId', 'name email specialization')
    .populate('appointmentId');

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  // Verify doctor owns this prescription
  if (prescription.doctorId._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to view this prescription');
  }

  res.status(200).json(
    new ApiResponse(200, prescription, 'Prescription fetched successfully')
  );
});

/**
 * @desc    Create a new prescription
 * @route   POST /api/doctor/prescriptions
 * @access  Private (Doctor only)
 */
exports.createPrescription = asyncHandler(async (req, res) => {
  const {
    patientId,
    appointmentId,
    diagnosis,
    medicines,
    notes,
    rawTranscript,
    audioUrl,
    status,
    consultationFee,
    medicineCost,
    totalCost,
    followUpDate,
  } = req.body;

  const fee = Math.round(parseFloat(consultationFee) || 0);
  const medCost = Math.round(parseFloat(medicineCost) || 0);
  const total = Math.round(parseFloat(totalCost) || (fee + medCost));

  // Handle empty string appointmentId from frontend
  const validAppointmentId = appointmentId && appointmentId.trim() !== "" ? appointmentId : null;

  let resolvedClinicId = req.body.clinicId || null;
  if (!resolvedClinicId && validAppointmentId) {
    const linkedAppointment = await Appointment.findById(validAppointmentId).select('clinicId');
    resolvedClinicId = linkedAppointment?.clinicId || null;
  }
  if (!resolvedClinicId) {
    const Doctor = require('../../models/Doctor');
    const doctorProfile = await Doctor.findOne({ userId: req.user._id }).select('clinicId');
    resolvedClinicId = doctorProfile?.clinicId || null;
  }

  const prescription = await Prescription.create({
    doctorId: req.user._id,
    patientId,
    appointmentId: validAppointmentId,
    clinicId: resolvedClinicId,
    diagnosis,
    medicines,
    notes,
    rawTranscript,
    audioUrl,
    consultationFee: fee,
    medicineCost: medCost,
    totalCost: total,
    followUpDate: followUpDate || null,
    status: status || 'finalized',
    createdBy: req.user._id
  });


  const Patient = require('../../models/Patient');
  // Lookup by userId because the doctor portal sends User IDs
  const patientProfile = await Patient.findOne({ userId: patientId });

  // Create corresponding medical record
  const medicalRecord = await MedicalRecord.create({
    patientId: patientProfile ? patientProfile._id : patientId,
    doctorId: req.user._id,
    clinicId: resolvedClinicId,
    appointmentId: validAppointmentId,
    prescriptionId: prescription._id,
    visitDate: new Date(),
    chiefComplaint: req.body.chiefComplaint || diagnosis,
    diagnosis,
    notes
  });

  // Update appointment status if linked
  if (validAppointmentId) {
    await Appointment.findByIdAndUpdate(validAppointmentId, {
      status: 'completed',
      completedAt: new Date(),
      prescriptionId: prescription._id
    });
  }

  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate('patientId', 'name email')
    .populate('doctorId', 'name specialization')
    .populate('appointmentId');

  // Trigger real-time notification to patient
  try {
    const { sendNotification } = require('../../services/notificationService');
    // Important: Use patientId (User ID) for notification room
    await sendNotification(patientId, {
      type: 'new_prescription',
      titleKey: 'newPrescriptionReady',
      bodyKey: 'newPrescriptionReadyBody',
      bodyParams: { 
        doctorName: populatedPrescription.doctorId?.name || 'Your Doctor' 
      },
      actionUrl: `/dashboard/patient/records/${prescription._id}`,
      portal: 'patient'
    });
  } catch (err) {
    console.error('Failed to send prescription notification:', err);
  }

  res.status(201).json(
    new ApiResponse(201, populatedPrescription, 'Prescription created successfully')
  );
});

/**
 * @desc    Update an existing prescription
 * @route   PUT /api/doctor/prescriptions/:id
 * @access  Private (Doctor only)
 */
exports.updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  // Verify doctor owns this prescription
  if (prescription.doctorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to update this prescription');
  }

  const {
    diagnosis,
    medicines,
    notes,
    status
  } = req.body;

  if (diagnosis) prescription.diagnosis = diagnosis;
  if (medicines) prescription.medicines = medicines;
  if (notes !== undefined) prescription.notes = notes;
  if (status) prescription.status = status;
  
  prescription.lastModifiedBy = req.user._id;

  await prescription.save();

  const updatedPrescription = await Prescription.findById(prescription._id)
    .populate('patientId', 'name email')
    .populate('appointmentId');

  res.status(200).json(
    new ApiResponse(200, updatedPrescription, 'Prescription updated successfully')
  );
});

/**
 * @desc    Delete a prescription
 * @route   DELETE /api/doctor/prescriptions/:id
 * @access  Private (Doctor only)
 */
exports.deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    throw new ApiError(404, 'Prescription not found');
  }

  // Verify doctor owns this prescription
  if (prescription.doctorId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to delete this prescription');
  }

  await prescription.deleteOne();

  res.status(200).json(
    new ApiResponse(200, null, 'Prescription deleted successfully')
  );
});
