const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User');

/**
 * @desc    Get doctor profile
 * @route   GET /api/doctor/profile
 * @access  Private (Doctor)
 */
exports.getProfile = asyncHandler(async (req, res) => {
    const doctorBase = await Doctor.getOrCreateProfile(req.user._id);
    const doctor = await Doctor.findById(doctorBase._id).populate('clinicId', 'name city photo phone email address workingHours').populate('userId', 'name phone photo email');
    
    // Add completed appointments stats
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
        Appointment.countDocuments({ doctorId: doctor._id, status: 'completed' }),
        Appointment.countDocuments({ 
            doctorId: doctor._id, 
            status: 'completed',
            dateTime: { $gte: startOfMonth }
        }),
        Appointment.countDocuments({ 
            doctorId: doctor._id, 
            status: 'completed',
            dateTime: { $gte: startOfWeek }
        })
    ]);

    const profileData = doctor.toObject ? doctor.toObject() : doctor;
    profileData.stats = { totalCompleted, monthlyCompleted, weeklyCompleted };

    res.status(200).json(new ApiResponse(200, profileData, "Profile fetched successfully"));
});

/**
 * @desc    Update doctor profile
 * @route   PUT /api/doctor/profile
 * @access  Private (Doctor)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
    const {
        bio,
        experience,
        education,
        languages,
        consultationFee,
        name,
        phone,
        photo,
        location,
        specialization,
        gender,
        city,
        licenseNo,
        clinicId,
    } = req.body;

    // Update User basic info and check onboarding status
    const user = await User.findById(req.user._id);
    if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (photo) user.photo = photo;

        const resolvedLicense = licenseNo && licenseNo.trim() !== "" ? licenseNo.trim() : `LIC-PENDING-${req.user._id}`;
        
        // If essential doctor info is present, mark onboarding complete
        if (name && specialization && resolvedLicense) {
            user.onboardingCompleted = true;
            user.isOnboardingComplete = true;
            user.onboardingStep = 99;
            user.profileCompleted = true;
        }
        await user.save();
    }

    // Update Doctor clinical info
    const updateData = {
        bio,
        experience,
        education,
        languages,
        consultationFee,
        specialization,
        gender,
        city,
        licenseNo: licenseNo && licenseNo.trim() !== "" ? licenseNo.trim() : `LIC-PENDING-${req.user._id}`,
        fullName: name,
    };

    if (clinicId !== undefined) {
        updateData.clinicId = clinicId;
    }

    if (location) {
        updateData.location = location;
    }

    let doctor = await Doctor.findOneAndUpdate(
        { userId: req.user._id },
        updateData,
        { new: true, runValidators: true }
    ).populate('clinicId', 'name city photo phone email address workingHours').populate('userId', 'name phone photo email');

    if (!doctor) {
        // Auto-create on update if missing
        doctor = await Doctor.create({
            userId: req.user._id,
            ...updateData
        });
        doctor = await Doctor.findOne({ userId: req.user._id }).populate('clinicId', 'name city photo phone email address workingHours').populate('userId', 'name phone photo email');
    }

    if (clinicId && doctor) {
        const Clinic = require('../../models/Clinic');
        const clinicObj = await Clinic.findById(clinicId);
        if (clinicObj && !clinicObj.doctors.includes(doctor._id)) {
            clinicObj.doctors.push(doctor._id);
            await clinicObj.save();
        }
    }

    try {
        const { invalidateAllDoctorScheduleCaches } = require('../../utils/cacheHelpers');
        await invalidateAllDoctorScheduleCaches(req.user._id);
    } catch (err) {
        console.error("Failed to invalidate schedule cache on profile update:", err);
    }

    res.status(200).json(new ApiResponse(200, doctor, "Profile updated successfully"));
});

/**
 * @desc    Update doctor availability status
 * @route   PATCH /api/doctor/availability
 * @access  Private (Doctor)
 */
exports.updateAvailability = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!['available', 'busy', 'on-leave'].includes(status)) {
        throw new ApiError(400, "Invalid status. Must be 'available', 'busy', or 'on-leave'.");
    }

    const doctor = await Doctor.findOneAndUpdate(
        { userId: req.user._id },
        {
            availabilityStatus: status,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: 'doctor'
        },
        { new: true }
    );

    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found.");
    }

    // Invalidate Redis caches
    try {
        const { invalidateDoctorsCache, invalidateClinicsCache } = require("../../utils/cacheHelpers");
        if (doctor.clinicId) {
            await invalidateDoctorsCache(doctor.clinicId);
        }
        await invalidateClinicsCache();
    } catch (err) {
        console.error("Failed to invalidate caches on doctor availability update:", err);
    }

    // Emit socket event globally
    const io = req.app.get("io");
    if (io) {
        io.emit('doctor_availability_changed', {
            doctorId: doctor._id,
            status,
            updatedBy: 'doctor'
        });
    }

    res.status(200).json(new ApiResponse(200, doctor, `Status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}.`));
});
