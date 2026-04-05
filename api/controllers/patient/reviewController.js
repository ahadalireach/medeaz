const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const Review = require('../../models/Review');
const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const Patient = require('../../models/Patient');

/**
 * @desc    Submit a review for a completed appointment
 * @route   POST /api/patient/reviews
 * @access  Private (Patient)
 */
exports.submitReview = asyncHandler(async (req, res) => {
    const { doctorId, appointmentId, rating, comment } = req.body;

    // 1. Get Patient profile ID from userId
    const patientProfile = await Patient.findOne({ userId: req.user._id });
    if (!patientProfile) {
        throw new ApiError(404, "Patient profile not found");
    }

    // 2. Check if appointment exists and is completed
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
        throw new ApiError(404, "Appointment not found");
    }

    if (appointment.status !== "completed") {
        throw new ApiError(400, "You can only review completed appointments");
    }

    // 3. Check if already reviewed
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this appointment");
    }

    // 4. Create review
    const review = await Review.create({
        doctorId,
        patientId: patientProfile._id,
        appointmentId,
        rating,
        comment,
    });

    // Update the Appointment document so UI knows it has been rated
    appointment.patientFeedback = {
        score: rating,
        comment: comment,
        ratedAt: new Date()
    };
    await appointment.save();

    // 5. Update Doctor's average rating and total reviews
    const reviews = await Review.find({ doctorId });
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Doctor.findOneAndUpdate(
        { userId: doctorId },
        {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: totalReviews,
        }
    );

    res.status(201).json(new ApiResponse(201, review, "Review submitted successfully"));
});

/**
 * @desc    Get reviews for a doctor (Public)
 * @route   GET /api/public/doctors/:id/reviews
 * @access  Public
 */
exports.getPublicDoctorReviews = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reviews = await Review.find({ doctorId: id })
        .populate({
            path: 'patientId',
            select: 'name profilePhoto'
        })
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});

/**
 * @desc    Get doctor's own reviews
 * @route   GET /api/doctor/reviews
 * @access  Private (Doctor)
 */
exports.getDoctorOwnReviews = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ doctorId: req.user._id })
        .populate({
            path: 'patientId',
            select: 'name profilePhoto'
        })
        .sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, reviews, "Reviews fetched successfully"));
});
/**
 * @desc    Update an existing review
 * @route   PUT /api/patient/reviews/:id
 * @access  Private (Patient)
 */
exports.updateReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Verify ownership
    const patientProfile = await Patient.findOne({ userId: req.user._id });
    if (!patientProfile || review.patientId.toString() !== patientProfile._id.toString()) {
        throw new ApiError(403, "You do not have permission to update this review");
    }

    if ((review.editCount || 0) >= 1) {
        throw new ApiError(400, "Review can only be edited once");
    }

    // Update review
    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.editCount += 1;
    await review.save();

    // Update appointment document
    const appointment = await Appointment.findById(review.appointmentId);
    if (appointment) {
        appointment.patientFeedback = {
            score: review.rating,
            comment: review.comment,
            ratedAt: new Date()
        };
        await appointment.save();
    }

    // Update Doctor's average rating
    const reviews = await Review.find({ doctorId: review.doctorId });
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await Doctor.findOneAndUpdate(
        { userId: review.doctorId },
        {
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: totalReviews,
        }
    );

    res.status(200).json(new ApiResponse(200, review, "Review updated successfully"));
});

module.exports = exports;
