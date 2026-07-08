const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  clinicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Clinic",
    required: [true, "Clinic ID is required"],
  },
  role: {
    type: String,
    enum: [
      "doctor",
      "nurse",
      "lab-technician",
      "pharmacist",
      "receptionist",
      "office-manager",
      "cleaner",
      "security-guard",
    ],
    required: [true, "Role is required"],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
  },
  phone: {
    type: String,
  },
  photo: {
    type: String,
  },
  // Auto-added doctors
  linkedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: false,
  },
  autoAdded: {
    type: Boolean,
    default: false,
  },
  // Role-specific fields
  licenseNumber: {
    type: String,
  },
  specialization: {
    type: String,
  },
  department: {
    type: String,
  },
  labSection: {
    type: String,
  },
  deskNumber: {
    type: String,
  },
  officeLocation: {
    type: String,
  },
  shiftTime: {
    type: String,
  },
  badgeNumber: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Staff", staffSchema);

