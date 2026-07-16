const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Clinic = require('../models/Clinic');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const buildUserResponse = (user) => {
  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : "patient";
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    photo: user.photo,
    avatar: user.photo,
    role: primaryRole,
    roles: user.roles,
    isVerified: user.isVerified,
    onboardingCompleted: Boolean(user.onboardingCompleted),
    isOnboardingComplete: Boolean(user.isOnboardingComplete || user.onboardingCompleted),
    onboardingStep: user.onboardingStep,
    profileCompleted: Boolean(user.profileCompleted),
    skippedStep: user.skippedStep,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

exports.markComplete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { step, skippedAt, allDone } = req.body;

  if (step === 'skipped') {
    user.skippedStep = skippedAt;
    user.onboardingStep = skippedAt;
    user.onboardingSkippedAt = new Date();
  } else if (allDone) {
    user.onboardingCompleted = true;
    user.isOnboardingComplete = true;
    user.onboardingStep = 99;
    user.skippedStep = null;
  } else if (step !== undefined) {
    user.skippedStep = step;
    user.onboardingStep = step;
  }

  await user.save();

  res.status(200).json(new ApiResponse(200, buildUserResponse(user), 'Onboarding marked complete'));
});

exports.markProfileComplete = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const role = user.roles && user.roles.length > 0 ? user.roles[0] : 'patient';
  
  if (role === 'doctor') {
    const { name, photo, specialization, licenseNo, experience, bio, clinicId } = req.body;
    const inputPhone = req.body.phone || req.body.contact;
    
    if (name) user.name = name;
    if (inputPhone) user.phone = inputPhone;
    if (photo) user.photo = photo;
    await user.save();

    const doctorData = {
      fullName: name || user.name,
      specialization: specialization || 'General Physician',
      licenseNo: licenseNo || `LIC-PENDING-${user._id}`,
      experience: experience !== undefined ? Number(experience) : 0,
      bio: bio || '',
    };
    if (clinicId) {
      doctorData.clinicId = clinicId;
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId: user._id },
      doctorData,
      { new: true, upsert: true }
    );

    if (clinicId && doctor) {
      const clinicObj = await Clinic.findById(clinicId);
      if (clinicObj && !clinicObj.doctors.includes(doctor._id)) {
        clinicObj.doctors.push(doctor._id);
        await clinicObj.save();
      }
    }
  } else if (role === 'patient') {
    const { name, dob, gender, bloodGroup, allergies, chronicConditions, profilePhoto } = req.body;
    const inputPhone = req.body.contact || req.body.phone;

    if (name) user.name = name;
    if (inputPhone) user.phone = inputPhone;
    if (profilePhoto) user.photo = profilePhoto;
    await user.save();

    const normalizedGender = gender ? gender.toLowerCase().trim() : undefined;

    await Patient.findOneAndUpdate(
      { userId: user._id },
      {
        name: name || user.name,
        email: user.email,
        dob,
        gender: normalizedGender,
        bloodGroup,
        allergies,
        contact: inputPhone || user.phone,
        profilePhoto: profilePhoto || user.photo,
        chronicConditions,
      },
      { new: true, upsert: true }
    );
  } else if (role === 'clinic_admin') {
    const { name, clinicType, registrationNumber, email, address, addressLine2, city, photo, workingHours } = req.body;
    const inputPhone = req.body.phone || req.body.contact;

    if (name) user.name = name;
    if (inputPhone) user.phone = inputPhone;
    if (photo) user.photo = photo;
    await user.save();

    await Clinic.findOneAndUpdate(
      { adminId: user._id },
      {
        name: name || `${user.name || 'My'} Clinic`,
        email: email || user.email,
        clinicType,
        registrationNumber,
        phone: inputPhone || user.phone || '0000000000',
        address: address || '',
        addressLine2,
        city,
        photo: photo || user.photo,
        workingHours,
      },
      { new: true, upsert: true }
    );
  }

  user.profileCompleted = true;
  await user.save();

  res.status(200).json(new ApiResponse(200, buildUserResponse(user), 'Profile marked complete'));
});
