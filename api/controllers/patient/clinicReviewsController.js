const mongoose = require('mongoose');
const ClinicReview = require('../../models/ClinicReview');
const Clinic = require('../../models/Clinic');
const Appointment = require('../../models/Appointment');
const Patient = require('../../models/Patient');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { recomputeClinicRating } = require('../../services/clinicRatingService');
const { sendNotification } = require('../../services/notificationService');
const redisClient = require('../../config/redis');

// Helper to anonymize patient names
function anonymizeName(fullName) {
  if (!fullName) return 'Anonymous';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

// Submit a new review
exports.submitReview = asyncHandler(async (req, res) => {
  const { clinicId, appointmentId, overallRating, categoryRatings, title, comment, language, photos } = req.body;

  // 1. Get patient profile
  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  // 2. Validate appointment
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new ApiError(404, 'Appointment not found');

  if (appointment.patientId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to review this appointment');
  }

  // Handle clinicId check from snapshot or direct field
  const apptClinicId = appointment.clinicId ? appointment.clinicId.toString() : (appointment.clinicSnapshot?.clinicId ? appointment.clinicSnapshot.clinicId.toString() : '');
  if (apptClinicId !== clinicId) {
    throw new ApiError(400, 'Appointment clinic does not match review clinic');
  }

  if (appointment.status !== 'completed') {
    throw new ApiError(400, 'You can only review after your visit is complete');
  }

  // 3. Unique check
  const existing = await ClinicReview.findOne({ appointmentId });
  if (existing) {
    throw new ApiError(409, 'You already reviewed this visit');
  }

  // 4. Rating checks
  const ratingNum = parseInt(overallRating, 10);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new ApiError(400, 'Overall rating must be between 1 and 5');
  }

  if (photos && photos.length > 3) {
    throw new ApiError(400, 'You can upload a maximum of 3 photos');
  }

  if (title && title.length > 100) {
    throw new ApiError(400, 'Title cannot exceed 100 characters');
  }

  if (comment && comment.length > 1000) {
    throw new ApiError(400, 'Comment cannot exceed 1000 characters');
  }

  // 5. Create
  const review = await ClinicReview.create({
    clinicId,
    patientId: patient._id,
    appointmentId,
    overallRating: ratingNum,
    categoryRatings: categoryRatings || {},
    title: title || '',
    comment: comment || '',
    language: language || 'en',
    photos: photos || [],
    isVerifiedVisit: true,
    status: 'published'
  });

  // 6. Recompute Rating Cache
  await recomputeClinicRating(clinicId);

  // 7. Notify Clinic Admin
  const clinic = await Clinic.findById(clinicId);
  if (clinic && clinic.adminId) {
    try {
      await sendNotification(clinic.adminId, {
        type: 'new_clinic_review',
        titleKey: 'notifications.new_clinic_review_title',
        bodyKey: 'notifications.new_clinic_review_body',
        bodyParams: { rating: ratingNum, patientName: patient.name },
        portal: 'clinic_admin'
      });
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }

  res.status(201).json(new ApiResponse(201, review, 'Review submitted successfully'));
});

// Get patient's own review for a specific clinic
exports.getMyReview = asyncHandler(async (req, res) => {
  const { clinicId } = req.query;
  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const review = await ClinicReview.findOne({ patientId: patient._id, clinicId }).lean();
  res.status(200).json(new ApiResponse(200, review, 'My review fetched successfully'));
});

// Edit review within 48h
exports.editReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { overallRating, categoryRatings, title, comment, language, photos } = req.body;

  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const review = await ClinicReview.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.patientId.toString() !== patient._id.toString()) {
    throw new ApiError(403, 'You can only edit your own reviews');
  }

  const editLimitTime = new Date(review.createdAt.getTime() + 48 * 60 * 60 * 1000);
  if (new Date() > editLimitTime) {
    throw new ApiError(403, 'Edit window has closed');
  }

  const ratingNum = parseInt(overallRating, 10);
  if (overallRating !== undefined && (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5)) {
    throw new ApiError(400, 'Overall rating must be between 1 and 5');
  }

  if (photos && photos.length > 3) {
    throw new ApiError(400, 'You can upload a maximum of 3 photos');
  }

  if (title && title.length > 100) {
    throw new ApiError(400, 'Title cannot exceed 100 characters');
  }

  if (comment && comment.length > 1000) {
    throw new ApiError(400, 'Comment cannot exceed 1000 characters');
  }

  if (overallRating !== undefined) review.overallRating = ratingNum;
  if (categoryRatings !== undefined) review.categoryRatings = categoryRatings;
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (language !== undefined) review.language = language;
  if (photos !== undefined) review.photos = photos;

  await review.save();
  await recomputeClinicRating(review.clinicId);

  res.status(200).json(new ApiResponse(200, review, 'Review updated successfully'));
});

// Delete review within 7 days
exports.deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) throw new ApiError(404, 'Patient profile not found');

  const review = await ClinicReview.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.patientId.toString() !== patient._id.toString()) {
    throw new ApiError(403, 'You can only delete your own reviews');
  }

  const deleteLimitTime = new Date(review.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (new Date() > deleteLimitTime) {
    throw new ApiError(403, 'Deletion window has closed. You can only flag it now.');
  }

  const clinicId = review.clinicId;
  await ClinicReview.deleteOne({ _id: reviewId });
  await recomputeClinicRating(clinicId);

  res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});

// Vote helpful / not-helpful
exports.voteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { vote } = req.body; // 'helpful' or 'not-helpful'

  if (vote !== 'helpful' && vote !== 'not-helpful') {
    throw new ApiError(400, 'Invalid vote type');
  }

  const review = await ClinicReview.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  // Find patient
  const patient = await Patient.findOne({ userId: req.user._id });
  const patientIdStr = patient ? patient._id.toString() : '';

  if (review.patientId.toString() === patientIdStr) {
    throw new ApiError(400, 'Cannot vote on your own review');
  }

  if (review.votedBy.includes(req.user._id)) {
    throw new ApiError(400, 'You already voted on this review');
  }

  review.votedBy.push(req.user._id);
  if (vote === 'helpful') {
    review.helpfulVotes += 1;
  } else {
    review.notHelpfulVotes += 1;
  }

  await review.save();
  res.status(200).json(new ApiResponse(200, review, 'Vote registered successfully'));
});

// Report review
exports.flagReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { reason } = req.body;

  if (!reason) throw new ApiError(400, 'Flag reason is required');

  const review = await ClinicReview.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.flaggedBy.includes(req.user._id)) {
    throw new ApiError(400, 'You already reported this review');
  }

  review.flaggedBy.push(req.user._id);
  review.flagReasons.push(reason);

  // Auto-flag status change at 5 flags
  if (review.flaggedBy.length >= 5 && review.status !== 'flagged') {
    review.status = 'flagged';
    
    // Notify Clinic Admin
    const clinic = await Clinic.findById(review.clinicId);
    if (clinic && clinic.adminId) {
      try {
        await sendNotification(clinic.adminId, {
          type: 'review_flagged',
          titleKey: 'notifications.review_flagged_title',
          bodyKey: 'notifications.review_flagged_body',
          bodyParams: { count: review.flaggedBy.length },
          portal: 'clinic_admin'
        });
      } catch (err) {
        console.error('Failed to send notification:', err);
      }
    }
  }

  await review.save();
  
  if (review.status === 'flagged') {
    await recomputeClinicRating(review.clinicId);
  }

  res.status(200).json(new ApiResponse(200, review, 'Review reported successfully'));
});

// Public: Get clinic reviews summary helper
async function getSummaryData(clinicId) {
  const clinic = await Clinic.findById(clinicId);
  if (!clinic) throw new ApiError(404, 'Clinic not found');

  const distributionResult = await ClinicReview.aggregate([
    { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), status: 'published' } },
    { $group: { _id: '$overallRating', count: { $sum: 1 } } }
  ]);

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  distributionResult.forEach(d => {
    if (d._id >= 1 && d._id <= 5) {
      distribution[d._id] = d.count;
    }
  });

  const verifiedResult = await ClinicReview.aggregate([
    { $match: { clinicId: new mongoose.Types.ObjectId(clinicId), status: 'published' } },
    { $group: {
        _id: null,
        total: { $sum: 1 },
        verified: { $sum: { $cond: ['$isVerifiedVisit', 1, 0] } }
    }}
  ]);

  const totalCount = (verifiedResult[0] && verifiedResult[0].total) || 0;
  const verifiedCount = (verifiedResult[0] && verifiedResult[0].verified) || 0;
  const verifiedVisitsPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  const cr = clinic.clinicRating || {
    overall: 0, cleanliness: 0, waitTime: 0, frontDesk: 0, facility: 0, accessibility: 0, valueForMoney: 0, totalReviews: 0
  };

  return {
    overall: cr.overall || 0,
    totalReviews: totalCount,
    distribution,
    categories: {
      cleanliness: cr.cleanliness || 0,
      waitTime: cr.waitTime || 0,
      frontDesk: cr.frontDesk || 0,
      facility: cr.facility || 0,
      accessibility: cr.accessibility || 0,
      valueForMoney: cr.valueForMoney || 0
    },
    verifiedVisitsPercent
  };
}

// Public: get reviews list
exports.getPublicReviews = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const { sort = 'recent', rating, page = 1, limit = 10, lang } = req.query;

  const filter = { clinicId, status: 'published' };
  
  if (rating) {
    filter.overallRating = parseInt(rating, 10);
  }
  if (lang) {
    filter.language = lang;
  }

  let sortObj = { createdAt: -1 };
  if (sort === 'highest') {
    sortObj = { overallRating: -1, createdAt: -1 };
  } else if (sort === 'lowest') {
    sortObj = { overallRating: 1, createdAt: -1 };
  } else if (sort === 'helpful') {
    sortObj = { helpfulVotes: -1, createdAt: -1 };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [reviewsRaw, totalCount] = await Promise.all([
    ClinicReview.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'patientId',
        select: 'name userId profilePhoto',
        populate: {
          path: 'userId',
          select: 'photo name'
        }
      })
      .lean(),
    ClinicReview.countDocuments(filter)
  ]);

  // Anonymize patient details
  const reviews = reviewsRaw.map(r => {
    const p = r.patientId || {};
    const u = (p.userId && typeof p.userId === 'object') ? p.userId : {};
    return {
      ...r,
      patientName: anonymizeName(p.name || u.name),
      patientPhoto: p.profilePhoto || u.photo || null,
      patientId: undefined // hide direct DB ref
    };
  });

  const summary = await getSummaryData(clinicId);

  res.status(200).json(new ApiResponse(200, {
    reviews,
    summary,
    pagination: {
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount
    }
  }, 'Public reviews fetched successfully'));
});

// Public: get reviews summary only
exports.getPublicReviewsSummary = asyncHandler(async (req, res) => {
  const { clinicId } = req.params;
  const cacheKey = `clinic_review_summary_${clinicId}`;

  try {
    if (redisClient) {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.status(200).json(new ApiResponse(200, JSON.parse(cached), 'Clinic summary fetched (cached)'));
      }
    }
  } catch (err) { /* ignore cache error */ }

  const summary = await getSummaryData(clinicId);

  try {
    if (redisClient) {
      await redisClient.set(cacheKey, JSON.stringify(summary), { ex: 300 });
    }
  } catch (err) { /* ignore */ }

  res.status(200).json(new ApiResponse(200, summary, 'Clinic summary fetched successfully'));
});
