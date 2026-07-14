const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    bloodGroup: {
      type: String,
    },
    allergies: [String],
    chronicConditions: [String],
    contact: {
      type: String,
    },
    profilePhoto: {
      type: String,
    },
    address: {
      type: String,
      default: null,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose 9 removed callback-style middleware — hooks must be sync/async
// with no `next` argument (see User.js / Message.js).
patientSchema.pre("save", function () {
  if (this.gender) {
    this.gender = this.gender.toLowerCase().trim();
  }
});

module.exports = mongoose.model("Patient", patientSchema);
