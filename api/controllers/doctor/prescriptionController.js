const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { updateRevenue } = require('../../utils/revenue');

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
  }).populate('patientId', 'name email phone');

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

  const prescription = await Prescription.create({
    doctorId,
    patientId,
    appointmentId,
    clinicId: doctor?.clinicId || null,
    diagnosis,
    medicines: medicines || [],
    notes: notes || '',
    consultationFee: consultationFee || 0,
    medicineCost: medicineCost || 0,
    totalCost: totalCost || 0,
    followUpDate,
    createdBy: doctorId,
    status: 'finalized'
  });

  // Update revenue if totalCost is provided
  if (totalCost > 0) {
    await updateRevenue(doctorId, totalCost, doctor?.clinicId, patientId, { 
        source: 'prescription', 
        sourceId: prescription._id 
    });
  }

  // If there's an appointment, mark it as completed
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });
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
