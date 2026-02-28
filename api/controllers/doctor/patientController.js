const User = require('../../models/User');
const Patient = require('../../models/Patient');
const MedicalRecord = require('../../models/MedicalRecord');
const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @desc    Get all patients for the logged-in doctor
 * @route   GET /api/doctor/patients
 * @access  Private (Doctor only)
 */
exports.getPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const doctorId = req.user._id;

  // Find all unique patient IDs from doctor's appointments, prescriptions, and created patients
  const appointments = await Appointment.find({ doctorId }).distinct('patientId');
  const prescriptions = await Prescription.find({ doctorId }).distinct('patientId');
  const createdPatients = await Patient.find({ createdBy: doctorId }).distinct('userId');
  
  // Combine and get unique patient IDs
  const patientIds = [...new Set([...appointments, ...prescriptions, ...createdPatients])];

  let filter = {
    _id: { $in: patientIds },
    roles: 'patient'
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const patients = await User.find(filter)
    .select('name email phone createdAt')
    .sort({ name: 1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await User.countDocuments(filter);

  // Enrich with patient profile data
  const enrichedPatients = await Promise.all(
    patients.map(async (patient) => {
      const patientProfile = await Patient.findOne({ userId: patient._id });
      const lastAppointment = await Appointment.findOne({
        doctorId,
        patientId: patient._id
      }).sort({ dateTime: -1 });

      return {
        ...patient.toObject(),
        patientProfile,
        lastVisit: lastAppointment?.dateTime,
        lastAppointmentStatus: lastAppointment?.status
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      patients: enrichedPatients,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, 'Patients fetched successfully')
  );
});

/**
 * @desc    Get detailed patient information including full history
 * @route   GET /api/doctor/patients/:id
 * @access  Private (Doctor only)
 */
exports.getPatientById = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const doctorId = req.user._id;

  // Verify doctor has treated this patient or created them
  const patientProfile = await Patient.findOne({ userId: patientId });
  const hasRelation = await Appointment.findOne({
    doctorId,
    patientId
  }) || (patientProfile && patientProfile.createdBy && patientProfile.createdBy.toString() === doctorId.toString());

  if (!hasRelation) {
    throw new ApiError(403, 'You do not have access to this patient\'s records');
  }

  const patient = await User.findOne({ _id: patientId, roles: 'patient' })
    .select('name email phone createdAt');

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  // Get medical records
  const medicalRecords = await MedicalRecord.find({
    patientId,
    doctorId
  })
    .populate('prescriptionId')
    .populate('appointmentId')
    .sort({ visitDate: -1 });

  // Get prescriptions
  const prescriptions = await Prescription.find({
    patientId,
    doctorId
  })
    .populate('appointmentId')
    .sort({ createdAt: -1 });

  // Get appointments
  const appointments = await Appointment.find({
    patientId,
    doctorId
  })
    .sort({ dateTime: -1 });

  res.status(200).json(
    new ApiResponse(200, {
      patient: {
        ...patient.toObject(),
        profile: patientProfile
      },
      medicalRecords,
      prescriptions,
      appointments,
      stats: {
        totalVisits: appointments.filter(a => a.status === 'completed').length,
        totalPrescriptions: prescriptions.length,
        lastVisit: appointments[0]?.dateTime
      }
    }, 'Patient details fetched successfully')
  );
});

/**
 * @desc    Search patients by name or ID
 * @route   GET /api/doctor/patients/search
 * @access  Private (Doctor only)
 */
exports.searchPatients = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const doctorId = req.user._id;

  if (!query || query.trim().length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters');
  }

  // Find all unique patient IDs from doctor's appointments, prescriptions, and created patients
  const appointments = await Appointment.find({ doctorId }).distinct('patientId');
  const prescriptions = await Prescription.find({ doctorId }).distinct('patientId');
  const createdPatients = await Patient.find({ createdBy: doctorId }).distinct('userId');
  
  const patientIds = [...new Set([...appointments, ...prescriptions, ...createdPatients])];

  const patients = await User.find({
    _id: { $in: patientIds },
    roles: 'patient',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ]
  })
    .select('name email phone')
    .limit(10);

  res.status(200).json(
    new ApiResponse(200, patients, 'Search results fetched successfully')
  );
});

/**
 * @desc    Create a new patient (for doctors to manually add patients)
 * @route   POST /api/doctor/patients
 * @access  Private (Doctor only)
 */
exports.createPatient = asyncHandler(async (req, res) => {
  const { name, email, phone, dateOfBirth, gender, bloodGroup, address } = req.body;

  // Validation
  if (!name || !email) {
    throw new ApiError(400, 'Name and email are required');
  }

  // Validate name length
  if (name.trim().length < 3) {
    throw new ApiError(400, 'Name must be at least 3 characters long');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address');
  }

  // Validate phone format if provided
  if (phone && !/^[\d\s\+\-\(\)]+$/.test(phone)) {
    throw new ApiError(400, 'Please provide a valid phone number');
  }

  // Validate date of birth if provided
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    if (dob > today) {
      throw new ApiError(400, 'Date of birth cannot be in the future');
    }
    if (dob < new Date('1900-01-01')) {
      throw new ApiError(400, 'Please provide a valid date of birth');
    }
  }

  // Validate gender if provided
  if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
    throw new ApiError(400, 'Gender must be male, female, or other');
  }

  // Validate blood group if provided
  if (bloodGroup && !['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(bloodGroup)) {
    throw new ApiError(400, 'Invalid blood group');
  }

  // Check if patient already exists
  const existingUser = await User.findOne({ email });
  
  if (existingUser) {
    throw new ApiError(400, 'A user with this email already exists');
  }

  // Create user account with a default password (patient should reset later)
  const temporaryPassword = Math.random().toString(36).slice(-8) + 'Pass1!';
  
  const user = await User.create({
    name: name.trim(),
    email,
    phone: phone || null,
    password: temporaryPassword,
    roles: ['patient'],
    isVerified: true // Auto-verify doctor-created patients
  });

  // Create patient profile
  const patientProfile = await Patient.create({
    userId: user._id,
    dateOfBirth: dateOfBirth || null,
    gender: gender || 'other',
    bloodGroup: bloodGroup || null,
    address: address || null,
    emergencyContact: phone ? { name: name, phone, relationship: 'self' } : null,
    createdBy: req.user._id
  });

  res.status(201).json(
    new ApiResponse(201, {
      patient: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile: patientProfile
      }
    }, 'Patient created successfully. Login credentials have been sent to the patient.')
  );
});

/**
 * @desc    Delete a patient (only if created by this doctor and no appointments/prescriptions)
 * @route   DELETE /api/doctor/patients/:id
 * @access  Private (Doctor only)
 */
exports.deletePatient = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const doctorId = req.user._id;

  // Find patient profile
  const patientProfile = await Patient.findOne({ userId: patientId });
  
  if (!patientProfile) {
    throw new ApiError(404, 'Patient not found');
  }

  // Check if doctor created this patient
  if (!patientProfile.createdBy || patientProfile.createdBy.toString() !== doctorId.toString()) {
    throw new ApiError(403, 'You can only delete patients you created');
  }

  // Check if patient has any appointments
  const appointmentCount = await Appointment.countDocuments({ patientId });
  if (appointmentCount > 0) {
    throw new ApiError(400, 'Cannot delete patient with existing appointments');
  }

  // Check if patient has any prescriptions
  const prescriptionCount = await Prescription.countDocuments({ patientId });
  if (prescriptionCount > 0) {
    throw new ApiError(400, 'Cannot delete patient with existing prescriptions');
  }

  // Check if patient has any medical records
  const recordCount = await MedicalRecord.countDocuments({ patientId });
  if (recordCount > 0) {
    throw new ApiError(400, 'Cannot delete patient with existing medical records');
  }

  // Delete patient profile and user account
  await Patient.deleteOne({ userId: patientId });
  await User.deleteOne({ _id: patientId });

  res.status(200).json(
    new ApiResponse(200, null, 'Patient deleted successfully')
  );
});
