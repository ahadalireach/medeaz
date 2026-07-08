const mongoose = require('mongoose');

const clinicReviewSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    categoryRatings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      waitTime: { type: Number, min: 1, max: 5 },
      frontDesk: { type: Number, min: 1, max: 5 },
      facility: { type: Number, min: 1, max: 5 },
      accessibility: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 }
    },
    title: {
      type: String,
      maxlength: 100,
      trim: true
    },
    comment: {
      type: String,
      maxlength: 1000,
      trim: true
    },
    language: {
      type: String,
      enum: ['en', 'ur'],
      default: 'en'
    },
    photos: {
      type: [String],
      validate: [
        function (val) {
          return val.length <= 3;
        },
        'Max 3 photos allowed'
      ]
    },
    isVerifiedVisit: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['published', 'pending', 'flagged', 'removed'],
      default: 'published'
    },
    clinicResponse: {
      text: { type: String, maxlength: 500, trim: true },
      respondedAt: { type: Date },
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    helpfulVotes: {
      type: Number,
      default: 0
    },
    notHelpfulVotes: {
      type: Number,
      default: 0
    },
    votedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    flaggedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    flagReasons: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
clinicReviewSchema.index({ clinicId: 1, status: 1, createdAt: -1 });
clinicReviewSchema.index({ clinicId: 1, overallRating: 1 });
clinicReviewSchema.index({ patientId: 1, clinicId: 1 });
clinicReviewSchema.index({ clinicId: 1, 'categoryRatings.waitTime': 1 });

module.exports = mongoose.model('ClinicReview', clinicReviewSchema);
