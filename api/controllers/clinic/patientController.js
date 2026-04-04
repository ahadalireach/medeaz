const Patient = require("../../models/Patient");
const User = require("../../models/User");
const Appointment = require("../../models/Appointment");
const Clinic = require("../../models/Clinic");
const Doctor = require("../../models/Doctor");
const ConnectionRequest = require("../../models/ConnectionRequest");
const Prescription = require("../../models/Prescription");
const Notification = require("../../models/Notification");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.getPatients = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

  const userClinic = await Clinic.findOne({ adminId: req.user._id });

  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  // Get User IDs for the doctors in this clinic
  const doctorProfiles = await Doctor.find({ _id: { $in: userClinic.doctors || [] } });
  const doctorUserIds = doctorProfiles.map(doc => doc.userId);
  const doctorProfileIds = doctorProfiles.map(doc => doc._id);

  // Find all distinct patient IDs from appointments directly linked to this clinic
  const patientUserIds = await Appointment.distinct("patientId", {
    clinicId: userClinic._id,
  });

  const approvedPatientIds = await ConnectionRequest.find({
    fromId: req.user._id,
    fromRole: "clinic",
    status: "approved"
  }).distinct("toPatientId");

  const combinedPatientIds = [...new Set([...patientUserIds, ...approvedPatientIds])];

  const patients = await Patient.find({
    userId: { $in: combinedPatientIds },
  })
    .populate("userId", "name email phone photo")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Patient.countDocuments({
    userId: { $in: combinedPatientIds },
  });

  const results = await Promise.all(
    patients.map(async (patient) => {
      const totalVisits = await Appointment.countDocuments({
        patientId: patient.userId?._id || patient.userId,
        clinicId: userClinic._id,
        status: { $ne: "cancelled" },
      });

      return {
        _id: patient._id,
        name: patient.name || patient.userId?.name || "N/A",
        email: patient.email || patient.userId?.email || "N/A",
        phone: patient.contact || patient.userId?.phone,
        photo: patient.userId?.photo,
        dateOfBirth: patient.dob,
        bloodGroup: patient.bloodGroup,
        gender: patient.gender,
        totalVisits,
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      patients: results,
      pagination: {
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        limit,
      },
    })
  );
});

exports.searchPatients = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  const { q } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 100);

  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  // Get User IDs for the doctors in this clinic
  const doctorProfiles = await Doctor.find({ _id: { $in: userClinic.doctors || [] } });
  const doctorUserIds = doctorProfiles.map(doc => doc.userId);
  const doctorProfileIds = doctorProfiles.map(doc => doc._id);

  // If no query, return all patients using the same logic as getPatients
  if (!q) {
    return exports.getPatients(req, res);
  }

  // Search for patients by userId, name, or email directly in Patient profile
  const users = await User.find({
    $or: [
      { email: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
    ],
    roles: "patient",
  }).select("_id");

  const userIds = users.map((u) => u._id);

  const searchFilter = {
    $or: [
      { userId: { $in: userIds } },
      { email: { $regex: q, $options: "i" } },
      { name: { $regex: q, $options: "i" } },
      { contact: { $regex: q, $options: "i" } },
    ],
  };

  const patients = await Patient.find(searchFilter)
    .populate("userId", "name email phone photo")
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Patient.countDocuments(searchFilter);

  const results = await Promise.all(
    patients.map(async (patient) => {
      // Get visit count for this clinic's doctors (using User IDs)
      const totalVisits = await Appointment.countDocuments({
        patientId: patient.userId?._id || patient.userId,
        clinicId: userClinic._id,
        status: { $ne: "cancelled" },
      });

      return {
        _id: patient._id,
        name: patient.name || patient.userId?.name || "N/A",
        email: patient.email || patient.userId?.email || "N/A",
        phone: patient.contact || patient.userId?.phone,
        photo: patient.userId?.photo,
        dateOfBirth: patient.dob,
        bloodGroup: patient.bloodGroup,
        gender: patient.gender,
        totalVisits,
      };
    })
  );

  res.status(200).json(
    new ApiResponse(200, {
      patients: results,
      pagination: {
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        limit,
      },
    })
  );
});

exports.getPatientProfile = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  const { id } = req.params;

  if (!userClinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const patient = await Patient.findById(id).populate("userId", "name email phone photo");

  if (!patient) {
    // If not found by Patient _id, try by User _id
    const patientByUser = await Patient.findOne({ userId: id }).populate("userId", "name email phone photo");
    if (patientByUser) {
      return res.status(200).json(new ApiResponse(200, await buildProfile(patientByUser, userClinic)));
    }
    throw new ApiError(404, "Patient not found");
  }

  async function buildProfile(patient, userClinic) {
    const doctorProfiles = await Doctor.find({ _id: { $in: userClinic.doctors || [] } });
    const doctorUserIds = doctorProfiles.map(doc => doc.userId);
    const doctorIds = doctorProfiles.map(doc => doc._id);

    const hasRelation = await Appointment.findOne({
      patientId: patient.userId?._id || patient.userId,
      doctorId: { $in: doctorUserIds },
    }) || await ConnectionRequest.findOne({
      fromId: req.user._id,
      toPatientId: patient.userId?._id || patient.userId,
      status: "approved"
    });

    if (!hasRelation) {
      throw new ApiError(403, "You do not have access to this patient's profile");
    }

    // Fetch visits specifically for this clinic's doctors
    const visitHistory = await Appointment.find({
      patientId: patient.userId?._id || patient.userId,
      doctorId: { $in: doctorUserIds },
    })
      .populate({
        path: "doctorId",
        select: "name",
        populate: {
          path: "doctorProfile",
          select: "specialization",
        },
      })
      .populate("clinicId", "name")
      .sort({ dateTime: -1 })
      .limit(50);

    // Fetch prescriptions for this patient from any doctor in this clinic
    const prescriptions = await Prescription.find({
      patientId: patient.userId?._id || patient.userId,
      clinicId: userClinic._id
    }).populate('doctorId', 'name').sort({ createdAt: -1 });

    // Fetch medical records (if clinic has access)
    const MedicalRecord = require('../../models/MedicalRecord');
    const medicalRecords = await MedicalRecord.find({
      patientId: patient._id
    }).sort({ visitDate: -1 });

    return {
      _id: patient._id,
      userId: patient.userId?._id || patient.userId,
      name: patient.userId?.name || patient.name || "N/A",
      email: patient.userId?.email || patient.email || "N/A",
      dob: patient.dob,
      bloodGroup: patient.bloodGroup || "N/A",
      gender: patient.gender || "N/A",
      phone: patient.contact || patient.userId?.phone || "N/A",
      address: patient.address || "N/A",
      photo: patient.userId?.photo || patient.profilePhoto,
      visitHistory: visitHistory.map(v => ({
        ...v.toObject(),
        appointmentDate: v.dateTime,
        appointmentTime: new Date(v.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })),
      prescriptions,
      medicalRecords
    };
  }

  res.status(200).json(new ApiResponse(200, await buildProfile(patient, userClinic)));
});

exports.deleteRecord = asyncHandler(async (req, res) => {
  const userClinic = await Clinic.findOne({ adminId: req.user._id });
  if (!userClinic) throw new ApiError(404, "Clinic not found");

  const { id } = req.params;
  const MedicalRecord = require('../../models/MedicalRecord');
  const record = await MedicalRecord.findOne({ _id: id, clinicId: userClinic._id });

  if (!record) {
    throw new ApiError(404, "Record not found or not belonging to this clinic");
  }

  await MedicalRecord.findByIdAndDelete(id);

  res.status(200).json(new ApiResponse(200, null, "Record deleted successfully"));
});

exports.createPatient = asyncHandler(async (req, res) => {
  const { name, email, phone, dateOfBirth, gender, bloodGroup, address, allergies, photo } = req.body;
  const clinicId = req.user.clinicId;

  if (!name || !email || !phone || !dateOfBirth || !gender || !bloodGroup || !address) {
    throw new ApiError(400, "All details are strictly required");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    if (existingUser.roles.includes("patient")) {
      const existingRequest = await ConnectionRequest.findOne({
        fromId: req.user._id,
        toPatientId: existingUser._id,
        status: "pending"
      });

      if (existingRequest) {
        throw new ApiError(400, "A connection request is already pending for this patient");
      }

      const clinic = await Clinic.findById(clinicId);

      await ConnectionRequest.create({
        fromId: req.user._id,
        fromRole: "clinic",
        fromName: clinic.name,
        toPatientId: existingUser._id,
        clinicId: clinicId
      });

      await Notification.create({
        recipient: existingUser._id,
        sender: req.user._id,
        title: "Clinic Connection Request",
        message: `${clinic.name} wants to add you to their patient list.`,
        type: "info",
        portal: "patient",
        link: "/dashboard/patient/settings"
      });

      return res.status(200).json(
        new ApiResponse(200, { isRequestSent: true }, `Patient already exists. A connection request has been sent.`)
      );
    }
    throw new ApiError(400, "Email already exists and is not a patient");
  }

  const temporaryPassword = Math.random().toString(36).slice(-8) + "Pass1!";
  const user = await User.create({
    name: name.trim(),
    email,
    phone,
    password: temporaryPassword,
    roles: ["patient"],
    isVerified: true,
    photo
  });

  const patientProfile = await Patient.create({
    userId: user._id,
    name: name.trim(),
    email,
    dob: dateOfBirth, // Fixed: use dob to match Patient model
    gender: gender.toLowerCase(),
    bloodGroup,
    address,
    allergies: typeof allergies === "string" ? allergies.split(",").map(a => a.trim()) : allergies,
    contact: phone,
    createdBy: req.user._id
  });

  res.status(201).json(
    new ApiResponse(201, { patient: patientProfile }, "Patient created successfully")
  );
});
