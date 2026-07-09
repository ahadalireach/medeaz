const User = require('../../models/User');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const MedicalRecord = require('../../models/MedicalRecord');
const Prescription = require('../../models/Prescription');
const Appointment = require('../../models/Appointment');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @desc    Get all patients for the clinic with dynamic visit counts
 * @route   GET /api/clinic/patients
 * @access  Private (Clinic Admin only)
 */
exports.getPatients = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { page = 1, limit = 10, search, doctorId } = req.query;

  const cacheKey = `clinic:patients:${clinicId.toString()}:${page}:${limit}:${search || ''}:${doctorId || ''}`;
  const { getCache, setCache } = require('../../utils/cacheHelpers');

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, 'Patients fetched successfully'));
  }

  // Find all unique patient IDs from clinic's appointments (optionally filtered by doctorId) and created patients
  const appointmentFilter = { clinicId, deletedByClinic: { $ne: true } };
  if (doctorId) {
    const docProfile = await Doctor.findById(doctorId);
    const resolvedDoctorUserId = docProfile ? docProfile.userId : doctorId;
    appointmentFilter.doctorId = resolvedDoctorUserId;
  }
  const appointments = await Appointment.find(appointmentFilter).distinct('patientId');
  const createdPatients = doctorId ? [] : await Patient.find({ createdBy: req.user._id }).distinct('userId');
  
  const patientIds = [...new Set([...appointments, ...createdPatients.map(id => id.toString())])];

  let filter = {
    _id: { $in: patientIds },
    roles: 'patient'
  };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const patients = await User.find(filter)
    .select('name email phone createdAt photo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));

  const total = await User.countDocuments(filter);

  const enrichedPatients = await Promise.all(
    patients.map(async (patient) => {
      const patientProfile = await Patient.findOne({ userId: patient._id });
      
      // Dynamic visit count: strictly completed appointments in this clinic
      const totalVisits = await Appointment.countDocuments({ 
         clinicId, 
         patientId: patient._id, 
         status: 'completed',
         deletedByClinic: { $ne: true }
      });

      return {
        ...patient.toObject(),
        patientProfile,
        totalVisits
      };
    })
  );

  const responseData = {
    patients: enrichedPatients,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.max(Math.ceil(total / parseInt(limit)), 1)
    }
  };

  await setCache(cacheKey, responseData, 300);

  res.status(200).json(new ApiResponse(200, responseData, 'Patients fetched successfully'));
});

/**
 * @desc    Get detailed patient profile for clinic admin
 * @route   GET /api/clinic/patients/:id
 * @access  Private (Clinic Admin only)
 */
exports.getPatientProfile = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const clinicId = req.user.clinicId;

  const patient = await User.findOne({ _id: patientId, roles: 'patient' })
    .select('name email phone createdAt');

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  const patientProfile = await Patient.findOne({ userId: patientId });

  // Get clinic-specific appointments and prescriptions
  const appointments = await Appointment.find({ clinicId, patientId, deletedByClinic: { $ne: true } })
    .populate('doctorId', 'name')
    .sort({ dateTime: -1 });

  const prescriptions = await Prescription.find({ clinicId, patientId })
    .populate('doctorId', 'name')
    .sort({ createdAt: -1 });

  // Get medical records
  const medicalRecords = await MedicalRecord.find({ patientId })
    .populate('doctorId', 'name')
    .sort({ visitDate: -1 });

  res.status(200).json(new ApiResponse(200, {
    patient: {
      ...patient.toObject(),
      profile: patientProfile
    },
    appointments,
    prescriptions,
    medicalRecords,
    stats: {
      totalVisits: appointments.filter(a => a.status === 'completed').length,
      totalPrescriptions: prescriptions.length
    }
  }, 'Patient profile fetched successfully'));
});

/**
 * @desc    Search patients within clinic records
 * @route   GET /api/clinic/patients/search
 * @access  Private (Clinic Admin only)
 */
exports.searchPatients = asyncHandler(async (req, res) => {
  // Input sanitization: basic replacement to remove problematic regex characters if falling back, or just text search
  const rawQuery = String(req.query.q || req.query.query || '').replace(/[^\w\s@.-]/gi, '').trim();
  const clinicId = req.user.clinicId;

  if (rawQuery.length < 2) {
    return res.status(200).json(new ApiResponse(200, { patients: [], pagination: { total: 0, page: 1, pages: 1, limit: 12 } }, 'Search results fetched successfully'));
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

  const cacheKey = `clinic:patients:search:${clinicId.toString()}:${rawQuery}:${page}:${limit}`;
  const { getCache, setCache } = require('../../utils/cacheHelpers');

  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(new ApiResponse(200, cachedData, 'Search results fetched successfully'));
  }

  const query = {
    roles: 'patient',
    $text: { $search: rawQuery }
  };

  const total = await User.countDocuments(query);
  const patients = await User.find(query)
    .select('name email phone photo')
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enrichedPatients = await Promise.all(
    patients.map(async (patient) => {
        const totalVisits = await Appointment.countDocuments({ 
            clinicId, 
            patientId: patient._id, 
            status: 'completed',
            deletedByClinic: { $ne: true }
        });
        const profile = await Patient.findOne({ userId: patient._id }).lean();
        return { 
          ...patient, 
          totalVisits,
          patientProfile: profile,
          gender: profile?.gender,
          profilePhoto: profile?.profilePhoto
        };
    })
  );

  const responseData = {
    patients: enrichedPatients,
    pagination: {
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      limit
    }
  };

  await setCache(cacheKey, responseData, 60);

  res.status(200).json(new ApiResponse(200, responseData, 'Search results fetched successfully'));
});

/**
 * @desc    Create a new patient record in the clinic
 * @route   POST /api/clinic/patients
 * @access  Private (Clinic Admin only)
 */
exports.createPatient = asyncHandler(async (req, res) => {
  const { name, email, phone, gender, dob, address } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  // Create base user
  const user = await User.create({
    name,
    email,
    phone,
    password: Math.random().toString(36).slice(-8) + 'P!',
    roles: ['patient'],
    isVerified: true
  });

  // Create patient profile
  const profile = await Patient.create({
    userId: user._id,
    name,
    email,
    gender: gender || 'other',
    dob,
    address,
    contact: phone,
    createdBy: req.user._id
  });

  const { invalidatePatientsCache } = require('../../utils/cacheHelpers');
  await invalidatePatientsCache(req.user.clinicId);

  res.status(201).json(new ApiResponse(201, { user, profile }, 'Patient created successfully'));
});

/**
 * @desc    Delete a medical record
 * @route   DELETE /api/clinic/patients/records/:id
 * @access  Private (Clinic Admin only)
 */
exports.deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndDelete(req.params.id);
  if (!record) {
    throw new ApiError(404, 'Record not found');
  }
  res.status(200).json(new ApiResponse(200, null, 'Record deleted successfully'));
});
