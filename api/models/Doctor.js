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
    // Other fields (schedule, bio, clinicId) will be asked on dashboard
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorSchema);
