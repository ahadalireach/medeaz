const mongoose = require("mongoose");

const opdTokenSchema = new mongoose.Schema(
  {
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientPhone: {
      type: String,
    },
    patientEmail: {
      type: String,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["waiting", "called", "completed", "skipped", "expired"],
      default: "waiting",
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
opdTokenSchema.index({ clinicId: 1, createdAt: -1 });
opdTokenSchema.index({ clinicId: 1, doctorId: 1, status: 1 });
opdTokenSchema.index({ clinicId: 1, tokenNumber: 1, createdAt: -1 });

module.exports = mongoose.model("OPDToken", opdTokenSchema);
