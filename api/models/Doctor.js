const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Please provide full name"],
    },
    specialization: {
      type: String,
      required: [true, "Please provide specialization"],
    },
    licenseNo: {
      type: String,
      required: [true, "Please provide license number"],
      unique: true,
    },
    schedule: {
      monday: [String],
      tuesday: [String],
      wednesday: [String],
      thursday: [String],
      friday: [String],
      saturday: [String],
      sunday: [String],
    },
    bio: {
      type: String,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
    },
    patients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    }],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorSchema);
