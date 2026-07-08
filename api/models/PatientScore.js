const mongoose = require("mongoose");

const patientScoreSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
    breakdown: {
      appointmentFrequency: {
        earned: { type: Number, required: true },
        max: { type: Number, default: 30 },
        label: { type: String }
      },
      followUpCompletion: {
        earned: { type: Number, required: true },
        max: { type: Number, default: 25 },
        label: { type: String }
      },
      noShowRate: {
        earned: { type: Number, required: true },
        max: { type: Number, default: 25 },
        label: { type: String }
      },
      visitRecency: {
        earned: { type: Number, required: true },
        max: { type: Number, default: 20 },
        label: { type: String }
      }
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PatientScore", patientScoreSchema);
