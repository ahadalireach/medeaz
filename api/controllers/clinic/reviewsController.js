const mongoose = require('mongoose');
const ClinicReview = require('../../models/ClinicReview');
const Clinic = require('../../models/Clinic');
const Patient = require('../../models/Patient');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const { recomputeClinicRating } = require('../../services/clinicRatingService');
const { sendNotification } = require('../../services/notificationService');

// Helper to anonymize patient names
function anonymizeName(fullName) {
  if (!fullName) return 'Anonymous';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

// Get all reviews for admin
exports.getClinicReviews = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  if (!clinicId) throw new ApiError(404, 'Clinic not associated with this user');

  const { status, sort = 'recent', page = 1, limit = 20 } = req.query;

  const filter = { clinicId: new mongoose.Types.ObjectId(clinicId) };

  if (status === 'pending') {
    filter.status = 'published';
    filter.$or = [
      { clinicResponse: { $exists: false } },
      { 'clinicResponse.text': null },
      { 'clinicResponse.text': '' }
    ];
  } else if (status === 'active' || status === 'published') {
    filter.status = 'published';
  } else if (status === 'flagged') {
    filter.status = 'flagged';
  } else if (status === 'hidden' || status === 'removed') {
    filter.status = 'removed';
  } else if (status === 'all' || !status) {
    // Return all statuses (published, flagged, removed)
  } else {
    filter.status = status;
  }

  let sortObj = { createdAt: -1 };
  if (sort === 'rating') {
    sortObj = { overallRating: -1, createdAt: -1 };
  } else if (sort === 'highest') {
    sortObj = { overallRating: -1, createdAt: -1 };
  } else if (sort === 'lowest') {
    sortObj = { overallRating: 1, createdAt: -1 };
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
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
          select: 'photo email name'
        }
      })
      .populate({
        path: 'appointmentId',
        select: 'dateTime doctorId',
        populate: {
          path: 'doctorId',
          select: 'name'
        }
      })
      .lean(),
    ClinicReview.countDocuments(filter)
  ]);

  // Map reviews to match patient-side structure (anonymized patient details)
  const reviews = reviewsRaw.map(r => {
    const p = r.patientId || {};
    const u = p.userId || {};
    return {
      ...r,
      patientName: anonymizeName(p.name || u.name),
      patientPhoto: p.profilePhoto || u.photo || null,
      patientCity: '',
      patientId: undefined // hide direct DB ref
    };
  });

  res.status(200).json(new ApiResponse(200, {
    reviews,
    pagination: {
      page: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      totalCount
    }
  }, 'Clinic reviews fetched successfully'));
});

// Respond to review
exports.respondToReview = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { reviewId } = req.params;
  const { text } = req.body;

  if (!clinicId) throw new ApiError(404, 'Clinic not associated with this user');
  if (!text || text.length > 500) throw new ApiError(400, 'Response text is required and cannot exceed 500 characters');

  const review = await ClinicReview.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.clinicId.toString() !== clinicId.toString()) {
    throw new ApiError(403, 'You do not have permission to respond to this review');
  }

  if (review.status === 'removed') {
    throw new ApiError(400, 'Cannot respond to a removed review');
  }

  const isNewResponse = !review.clinicResponse?.text;
  const originalRespondedAt = review.clinicResponse?.respondedAt;

  review.clinicResponse = {
    text,
    respondedAt: new Date(),
    respondedBy: req.user._id
  };

  // If patient edited before this response or it's new, set response
  await review.save();

  // Notify Patient
  const patient = await Patient.findById(review.patientId);
  const clinic = await Clinic.findById(clinicId);
  if (patient && clinic) {
    try {
      await sendNotification(patient.userId, {
        type: 'clinic_review_response',
        titleKey: 'notifications.clinic_review_response_title',
        bodyKey: 'notifications.clinic_review_response_body',
        bodyParams: { clinicName: clinic.name },
        portal: 'patient'
      });
    } catch (err) {
      console.error('Failed to notify patient:', err);
    }
  }

  res.status(200).json(new ApiResponse(200, review, 'Response posted successfully'));
});

// Update review status (remove, dismiss flags, restore)
exports.updateReviewStatus = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  const { reviewId } = req.params;
  const { status, dismissFlags } = req.body;

  if (!clinicId) throw new ApiError(404, 'Clinic not associated with this user');

  const review = await ClinicReview.findById(reviewId);
  if (!review) throw new ApiError(404, 'Review not found');

  if (review.clinicId.toString() !== clinicId.toString()) {
    throw new ApiError(403, 'You do not have permission to update this review');
  }

  const prevStatus = review.status;

  if (dismissFlags) {
    review.flaggedBy = [];
    review.flagReasons = [];
    review.status = 'published';
  } else if (status) {
    if (status !== 'published' && status !== 'removed') {
      throw new ApiError(400, 'Invalid status value');
    }
    review.status = status;
  }

  await review.save();

  // Recompute Rating Cache
  if (prevStatus !== review.status) {
    await recomputeClinicRating(clinicId);
    
    // Notify patient if removed
    if (review.status === 'removed') {
      const patient = await Patient.findById(review.patientId);
      const clinic = await Clinic.findById(clinicId);
      if (patient && clinic) {
        try {
          await sendNotification(patient.userId, {
            type: 'review_removed',
            titleKey: 'notifications.review_removed_title',
            bodyKey: 'notifications.review_removed_body',
            bodyParams: { clinicName: clinic.name },
            portal: 'patient'
          });
        } catch (err) {
          console.error('Failed to notify patient:', err);
        }
      }
    }
  }

  res.status(200).json(new ApiResponse(200, review, 'Review status updated successfully'));
});

// Get review analytics
exports.getReviewAnalytics = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  if (!clinicId) throw new ApiError(404, 'Clinic not associated with this user');

  const cId = new mongoose.Types.ObjectId(clinicId);

  // 1. Rating Trend (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const trendResult = await ClinicReview.aggregate([
    {
      $match: {
        clinicId: cId,
        status: 'published',
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        avg: { $avg: '$overallRating' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const ratingTrend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    const matched = trendResult.find(t => t._id.year === year && t._id.month === month);
    ratingTrend.push({
      month: label,
      avg: matched ? Math.round(matched.avg * 10) / 10 : 0,
      count: matched ? matched.count : 0
    });
  }

  // 2. Category Averages & Response rate
  const clinic = await Clinic.findById(clinicId);
  const cr = clinic?.clinicRating || {};
  const categoryAverages = {
    cleanliness: cr.cleanliness || 0,
    waitTime: cr.waitTime || 0,
    frontDesk: cr.frontDesk || 0,
    facility: cr.facility || 0,
    accessibility: cr.accessibility || 0,
    valueForMoney: cr.valueForMoney || 0
  };

  // Response rate & average response time
  const allReviews = await ClinicReview.find({ clinicId: cId, status: { $ne: 'removed' } }).lean();
  const totalReviewsCount = allReviews.length;
  const answeredReviews = allReviews.filter(r => r.clinicResponse && r.clinicResponse.text);
  const responseRate = totalReviewsCount > 0 ? Math.round((answeredReviews.length / totalReviewsCount) * 100) : 0;

  // Overall rating from all non-removed reviews
  const ratedReviews = allReviews.filter(r => r.overallRating);
  const overallRating = ratedReviews.length > 0
    ? Math.round((ratedReviews.reduce((acc, r) => acc + r.overallRating, 0) / ratedReviews.length) * 10) / 10
    : 0;

  // Verified visits
  const verifiedCount = allReviews.filter(r => r.isVerifiedVisit).length;
  const verifiedVisitsPercent = totalReviewsCount > 0 ? Math.round((verifiedCount / totalReviewsCount) * 100) : 0;

  let totalResponseTimeMs = 0;
  answeredReviews.forEach(r => {
    const created = new Date(r.createdAt);
    const responded = new Date(r.clinicResponse.respondedAt);
    totalResponseTimeMs += Math.max(0, responded - created);
  });
  const avgResponseTime = answeredReviews.length > 0 ? (totalResponseTimeMs / answeredReviews.length / (1000 * 60 * 60)) : 0;

  // 3. Keyword extraction (simple word frequency)
  const stopWordsEn = ['the', 'a', 'and', 'or', 'in', 'of', 'to', 'for', 'with', 'is', 'was', 'on', 'at', 'by', 'an', 'this', 'that', 'it', 'you', 'your', 'my', 'we', 'our', 'us', 'they', 'them', 'their', 'very', 'good', 'bad', 'great', 'excellent'];
  const stopWordsUr = ['اور', 'کا', 'کی', 'کے', 'کو', 'نے', 'سے', 'میں', 'ہے', 'ہیں', 'تھا', 'تھی', 'تھے', 'کہ', 'پر', 'تو', 'بھی', 'ہی', 'یہ', 'وہ', 'اس', 'ان', 'کر', 'کیا', 'گی', 'گے', 'گا', 'بہت', 'اچھا', 'برا', 'ٹھیک', 'تھینک'];

  const allStopWords = new Set([...stopWordsEn, ...stopWordsUr]);

  const posComments = allReviews.filter(r => r.overallRating >= 4 && r.comment).map(r => r.comment.toLowerCase());
  const negComments = allReviews.filter(r => r.overallRating <= 2 && r.comment).map(r => r.comment.toLowerCase());

  function getKeywords(commentsList) {
    const freq = {};
    commentsList.forEach(c => {
      // Split on punctuation and whitespace
      const words = c.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ').split(/\s+/);
      words.forEach(w => {
        const trimmed = w.trim();
        if (trimmed.length > 2 && !allStopWords.has(trimmed)) {
          freq[trimmed] = (freq[trimmed] || 0) + 1;
        }
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  const topPositiveKeywords = getKeywords(posComments);
  const topNegativeKeywords = getKeywords(negComments);

  // Recent flagged
  const recentFlagged = await ClinicReview.countDocuments({ clinicId: cId, status: 'flagged' });

  res.status(200).json(new ApiResponse(200, {
    ratingTrend,
    categoryAverages,
    totalReviews: totalReviewsCount,
    overallRating,
    responseRate,
    flaggedReviews: recentFlagged,
    verifiedVisitsPercent,
    avgResponseTime: Math.round(avgResponseTime * 10) / 10,
    topPositiveKeywords,
    topNegativeKeywords
  }, 'Clinic review analytics fetched successfully'));
});

// Export CSV
exports.exportReviewsCsv = asyncHandler(async (req, res) => {
  const clinicId = req.user.clinicId;
  if (!clinicId) throw new ApiError(404, 'Clinic not associated with this user');

  const reviews = await ClinicReview.find({ clinicId: new mongoose.Types.ObjectId(clinicId) })
    .populate('patientId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const headers = [
    'Date',
    'Patient Name',
    'Overall Rating',
    'Cleanliness',
    'Wait Time',
    'Staff',
    'Facilities',
    'Comment',
    'Verified Visit',
    'Clinic Response'
  ];

  const rows = reviews.map(r => {
    const createdDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
    const name = r.patientId?.name || 'Anonymous';
    
    // Clean string values from CSV break characters (quotes, commas, newlines)
    const cleanStr = (str) => {
      if (!str) return '';
      return `"${str.toString().replace(/"/g, '""').replace(/\n/g, ' ')}"`;
    };

    return [
      createdDate,
      cleanStr(name),
      r.overallRating || 0,
      r.categoryRatings?.cleanliness || '',
      r.categoryRatings?.waitTime || '',
      r.categoryRatings?.frontDesk || '',
      r.categoryRatings?.facility || '',
      cleanStr(r.comment),
      r.isVerifiedVisit ? 'Yes' : 'No',
      cleanStr(r.clinicResponse?.text)
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=clinic_reviews_${clinicId}.csv`);
  res.status(200).send(csvContent);
});
