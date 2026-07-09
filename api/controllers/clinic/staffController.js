const Staff = require("../../models/Staff");
const User = require("../../models/User");
const Clinic = require("../../models/Clinic");
const bcrypt = require("bcryptjs");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.getStaff = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const staff = await Staff.find({ clinicId }).populate("userId", "name email");

  res.status(200).json(new ApiResponse(200, staff));
});

exports.createStaff = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { name, email, phone, role, photo } = req.body;

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  if (!name || !email || !role) {
    throw new ApiError(400, "Name, email, and role are required");
  }

  if (phone && !/^03\d{9}$/.test(phone)) {
    throw new ApiError(400, "Invalid Pakistani phone number format (should be 03xxxxxxxxx)");
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  // If user doesn't exist, create a staff login account
  if (!user) {
    const defaultPassword = "staff123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      roles: ["clinic_admin"],
      photo,
    });
  }

  const staff = await Staff.create({
    userId: user._id,
    clinicId,
    role,
    name,
    email: email.toLowerCase(),
    phone,
    photo,
    licenseNumber: req.body.licenseNumber,
    specialization: req.body.specialization,
    department: req.body.department,
    labSection: req.body.labSection,
    deskNumber: req.body.deskNumber,
    officeLocation: req.body.officeLocation,
    shiftTime: req.body.shiftTime,
    badgeNumber: req.body.badgeNumber,
  });

  const { sendEmail } = require("../../services/emailService");
  const clinic = await Clinic.findById(clinicId);
  try {
    sendEmail(
      email.toLowerCase(),
      "Your Medeaz Staff Account",
      "newStaffAccount",
      {
        name,
        clinicName: clinic?.name || "the clinic",
        password: "staff123", // default or generic staff password info
      },
    );
  } catch (e) {}

  try {
    const { deleteClinicContext } = require("../../services/redisService");
    await deleteClinicContext(clinicId);
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }

  res.status(201).json(new ApiResponse(201, staff, "Staff account created"));
});

exports.updateStaff = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { id } = req.params;
  const { name, email, phone, role, photo } = req.body;

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const staff = await Staff.findOne({ _id: id, clinicId });

  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  if (name) staff.name = name;
  if (email) staff.email = email.toLowerCase();
  if (phone) {
    if (!/^03\d{9}$/.test(phone)) {
      throw new ApiError(400, "Invalid Pakistani phone number format (should be 03xxxxxxxxx)");
    }
    staff.phone = phone;
  }
  if (role) staff.role = role;
  if (photo) staff.photo = photo;

  // Update role-specific fields
  if (req.body.licenseNumber !== undefined) staff.licenseNumber = req.body.licenseNumber;
  if (req.body.specialization !== undefined) staff.specialization = req.body.specialization;
  if (req.body.department !== undefined) staff.department = req.body.department;
  if (req.body.labSection !== undefined) staff.labSection = req.body.labSection;
  if (req.body.deskNumber !== undefined) staff.deskNumber = req.body.deskNumber;
  if (req.body.officeLocation !== undefined) staff.officeLocation = req.body.officeLocation;
  if (req.body.shiftTime !== undefined) staff.shiftTime = req.body.shiftTime;
  if (req.body.badgeNumber !== undefined) staff.badgeNumber = req.body.badgeNumber;

  await staff.save();

  // Update corresponding user record
  if (staff.userId) {
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) userUpdate.email = email.toLowerCase();
    if (photo) userUpdate.photo = photo;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(staff.userId, userUpdate);
    }
  }

  try {
    const { deleteClinicContext } = require("../../services/redisService");
    await deleteClinicContext(clinicId);
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }

  res.status(200).json(new ApiResponse(200, staff, "Staff updated"));
});

exports.deleteStaff = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { id } = req.params;

  if (!clinicId) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  const staff = await Staff.findOne({ _id: id, clinicId });

  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }

  if (staff.userId) {
    const user = await User.findById(staff.userId);
    // Do not delete user if they are a doctor
    if (user && !user.roles.includes("doctor")) {
      await User.findByIdAndDelete(staff.userId);
    }
  }
  await Staff.findByIdAndDelete(id);

  try {
    const { deleteClinicContext } = require("../../services/redisService");
    await deleteClinicContext(clinicId);
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }

  res.status(200).json(new ApiResponse(200, null, "Staff account removed"));
});
