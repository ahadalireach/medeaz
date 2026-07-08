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
      unique: true,
      sparse: true,
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
    experience: {
      type: Number,
      default: 0,
    },
    education: [{
      degree: String,
      institution: String,
      year: Number,
    }],
    location: {
      address: String,
      city: String,
    },
    gender: {
      type: String,
    },
    city: {
      type: String,
    },
    languages: [String],
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
    },
    patients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    }],
    consultationFee: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    revenue: {
      total: {
        type: Number,
        default: 0,
      },
      monthly: {
        type: Map,
        of: Number,
        default: new Map(),
      },
      daily: {
        type: Map,
        of: Number,
        default: new Map(),
      },
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'busy', 'on-leave'],
      default: 'available'
    },
    statusUpdatedAt: Date,
    statusUpdatedBy: { 
      type: String, 
      enum: ['doctor', 'clinic'] 
    }
  },
  {
    timestamps: true,
  }
);

doctorSchema.statics.getOrCreateProfile = async function(userId) {
  let doctor = await this.findOne({ userId }).populate('userId', 'name email phone photo').populate('clinicId');
  if (!doctor) {
    const User = mongoose.model("User");
    const user = await User.findById(userId);
    const name = user ? user.name : "Doctor";
    const licenseNo = `LIC-PENDING-${userId}`;
    
    doctor = await this.create({
      userId,
      fullName: name,
      specialization: "General Physician",
      licenseNo: licenseNo,
      bio: "Please update your professional bio.",
      experience: 1,
      consultationFee: 500,
      education: [],
      schedule: {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
      }
    });
    
    doctor = await this.findOne({ userId }).populate('userId', 'name email phone photo').populate('clinicId');
  }
  return doctor;
};

module.exports = mongoose.model("Doctor", doctorSchema);
