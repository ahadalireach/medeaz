const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: [true, "Please provide phone number"],
    },
    // Other fields (dob, bloodGroup, allergies) will be asked on dashboard
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Patient", patientSchema);
