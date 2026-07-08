const mongoose = require('mongoose');
const ClinicReview = require('../models/ClinicReview');
const Clinic = require('../models/Clinic');
const redisClient = require('../config/redis');

async function recomputeClinicRating(clinicId) {
  const ObjectId = mongoose.Types.ObjectId;

  const result = await ClinicReview.aggregate([
    {
      $match: {
        clinicId: new ObjectId(clinicId),
        status: 'published'
      }
    },
    {
      $group: {
        _id: null,
        overall: { $avg: '$overallRating' },
        cleanliness: { $avg: '$categoryRatings.cleanliness' },
        waitTime: { $avg: '$categoryRatings.waitTime' },
        frontDesk: { $avg: '$categoryRatings.frontDesk' },
        facility: { $avg: '$categoryRatings.facility' },
        accessibility: { $avg: '$categoryRatings.accessibility' },
        valueForMoney: { $avg: '$categoryRatings.valueForMoney' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const ratings = (result && result[0]) ? result[0] : null;

  const formattedRatings = {
    overall: 0,
    cleanliness: 0,
    waitTime: 0,
    frontDesk: 0,
    facility: 0,
    accessibility: 0,
    valueForMoney: 0,
    totalReviews: 0
  };

  if (ratings) {
    formattedRatings.totalReviews = ratings.totalReviews || 0;
    const keys = ['overall', 'cleanliness', 'waitTime', 'frontDesk', 'facility', 'accessibility', 'valueForMoney'];
    keys.forEach(k => {
      if (typeof ratings[k] === 'number') {
        formattedRatings[k] = Math.round(ratings[k] * 10) / 10;
      }
    });
  }

  await Clinic.findByIdAndUpdate(clinicId, {
    $set: {
      clinicRating: {
        ...formattedRatings,
        lastComputedAt: new Date()
      }
    }
  });

  // Invalidate Redis summary and list caches
  try {
    if (redisClient) {
      await redisClient.del(`clinic_review_summary_${clinicId}`);
      await redisClient.del(`clinic_reviews_${clinicId}`);
      await redisClient.del(`clinic_profile_${clinicId}`);
    }
  } catch (err) {
    console.error('Error invalidating Redis review cache:', err);
  }
}

module.exports = {
  recomputeClinicRating
};
