const Clinic = require("../../models/Clinic");
const User = require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");
const ApiResponse = require("../../utils/ApiResponse");

exports.getSettings = asyncHandler(async (req, res) => {
  const clinic = await Clinic.findOne({ adminId: req.user._id });

  if (!clinic) {
    throw new ApiError(404, "Clinic not found");
  }

  const Appointment = require('../../models/Appointment');
  
  // Start of Month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Start of Week (Monday)
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const [totalCompleted, monthlyCompleted, weeklyCompleted] = await Promise.all([
      Appointment.countDocuments({ clinicId: clinic._id, status: 'completed' }),
      Appointment.countDocuments({ 
          clinicId: clinic._id, 
          status: 'completed',
          dateTime: { $gte: startOfMonth }
      }),
      Appointment.countDocuments({ 
          clinicId: clinic._id, 
          status: 'completed',
          dateTime: { $gte: startOfWeek }
      })
  ]);

  const clinicData = clinic.toObject ? clinic.toObject() : clinic;
  clinicData.stats = { totalCompleted, monthlyCompleted, weeklyCompleted };

  res.status(200).json(new ApiResponse(200, clinicData));
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const { name, address, phone, workingHours, photo } = req.body;

  const clinic = await Clinic.findOne({ adminId: req.user._id });

  if (!clinic) {
    throw new ApiError(404, "Clinic not found for this user");
  }

  if (name) clinic.name = name;
  if (address) clinic.address = address;
  if (phone) clinic.phone = phone;
  if (workingHours) clinic.workingHours = workingHours;
  if (photo !== undefined) clinic.photo = photo;

  await clinic.save();

  // Sync to User collection and mark onboarding completed if fields are set
  const user = await User.findById(req.user._id);
  if (user) {
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (photo !== undefined) user.photo = photo;

    if (clinic.name && clinic.address && clinic.phone) {
      user.onboardingCompleted = true;
      user.isOnboardingComplete = true;
      user.onboardingStep = 99;
      user.profileCompleted = true;
    }
    await user.save();
  }
  
  // Invalidate schedule cache for all associated doctors
  try {
    const Doctor = require("../../models/Doctor");
    const { invalidateAllDoctorScheduleCaches } = require("../../utils/cacheHelpers");
    const associatedDoctors = await Doctor.find({ _id: { $in: clinic.doctors } });
    for (const doc of associatedDoctors) {
      if (doc.userId) {
        await invalidateAllDoctorScheduleCaches(doc.userId);
      }
    }
  } catch (err) {
    console.error("Failed to invalidate doctor schedule caches:", err);
  }

  try {
    const { deleteClinicContext } = require("../../services/redisService");
    await deleteClinicContext(clinic._id);
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }

  res.status(200).json(new ApiResponse(200, clinic, "Settings saved successfully"));
});
