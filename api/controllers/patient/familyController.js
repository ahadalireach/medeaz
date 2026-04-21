const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const FamilyMember = require('../../models/FamilyMember');
const Prescription = require('../../models/Prescription');
const Patient = require('../../models/Patient');
const MedicalRecord = require('../../models/MedicalRecord');

/**
 * Get all family members
 * @route GET /api/patient/family
 * @access Private (Patient only)
 */
exports.getFamilyMembers = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Find patient by userId
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const familyMembers = await FamilyMember.find({ patientId: patient._id });

  res.status(200).json(
    new ApiResponse(200, familyMembers, 'Family members fetched successfully')
  );
});

/**
 * Add a family member
 * @route POST /api/patient/family
 * @access Private (Patient only)
 */
exports.addFamilyMember = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { name, relation, dob, bloodGroup, allergies, photo } = req.body;

  // Find patient by userId
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const familyMember = await FamilyMember.create({
    patientId: patient._id,
    name,
    relation,
    dob,
    bloodGroup,
    allergies,
    photo,
  });

  res.status(201).json(
    new ApiResponse(201, familyMember, 'Family member added successfully')
  );
});

/**
 * Edit a family member
 * @route PUT /api/patient/family/:memberId
 * @access Private (Patient only)
 */
exports.editFamilyMember = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { memberId } = req.params;
  const { name, relation, dob, bloodGroup, allergies, photo } = req.body;

  // Find patient by userId
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const familyMember = await FamilyMember.findOne({
    _id: memberId,
    patientId: patient._id,
  });

  if (!familyMember) {
    throw new ApiError(404, 'Family member not found');
  }

  familyMember.name = name || familyMember.name;
  familyMember.relation = relation || familyMember.relation;
  familyMember.dob = dob || familyMember.dob;
  familyMember.bloodGroup = bloodGroup || familyMember.bloodGroup;
  familyMember.allergies = allergies || familyMember.allergies;
  if (photo !== undefined) familyMember.photo = photo;

  await familyMember.save();

  res.status(200).json(
    new ApiResponse(200, familyMember, 'Family member updated successfully')
  );
});

/**
 * Delete a family member
 * @route DELETE /api/patient/family/:memberId
 * @access Private (Patient only)
 */
exports.deleteFamilyMember = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { memberId } = req.params;

  // Find patient by userId
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const familyMember = await FamilyMember.findOneAndDelete({
    _id: memberId,
    patientId: patient._id,
  });

  if (!familyMember) {
    throw new ApiError(404, 'Family member not found');
  }

  res.status(200).json(
    new ApiResponse(200, null, 'Family member deleted successfully')
  );
});

/**
 * Get family member's medical records
 * @route GET /api/patient/family/:memberId/records
 * @access Private (Patient only)
 */
exports.getFamilyRecords = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { memberId } = req.params;

  // Find patient by userId
  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  // Verify family member belongs to this patient
  const familyMember = await FamilyMember.findOne({
    _id: memberId,
    patientId: patient._id,
  });

  if (!familyMember) {
    throw new ApiError(404, 'Family member not found');
  }

  // Find prescriptions for this family member
  const records = await Prescription.find({ familyMemberId: memberId })
    .sort({ createdAt: -1 })
    .populate({
      path: 'doctorId',
      select: 'name email photo',
      populate: { path: 'doctorProfile', select: 'specialization fullName' }
    })
    .populate('clinicId', 'name address phone');

  res.status(200).json(
    new ApiResponse(200, records, 'Family member records fetched successfully')
  );
});

/**
 * Add a family member medical record (patient-uploaded)
 * @route POST /api/patient/family/:memberId/records
 * @access Private (Patient only)
 */
exports.addFamilyRecord = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { memberId } = req.params;
  const { title, recordType, date, notes, fileUrl } = req.body;

  const patient = await Patient.findOne({ userId });
  if (!patient) {
    throw new ApiError(404, 'Patient profile not found');
  }

  const familyMember = await FamilyMember.findOne({
    _id: memberId,
    patientId: patient._id,
  });

  if (!familyMember) {
    throw new ApiError(404, 'Family member not found');
  }

  const record = await MedicalRecord.create({
    patientId: patient._id,
    doctorId: userId,
    familyMemberId: familyMember._id,
    visitDate: date || new Date(),
    chiefComplaint: title || 'Family member uploaded record',
    diagnosis: recordType || 'Document',
    notes: notes || '',
    attachments: fileUrl
      ? [{
          fileName: title || 'Family Medical Record',
          fileUrl,
          fileType: 'document',
        }]
      : [],
  });

  res.status(201).json(
    new ApiResponse(201, record, 'Family member record added successfully')
  );
});
