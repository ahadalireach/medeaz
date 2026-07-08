const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    phone: {
      type: String,
      default: null,
    },
    photo: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: [
        function () {
          return this.authProvider === "local";
        },
        "Please add a password",
      ],
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    roles: {
      type: [String],
      enum: ["doctor", "clinic_admin", "patient"],
      default: ["patient"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    skippedStep: {
      type: Number,
      default: null,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    avatar: {
      type: String,
      default: null,
    },
    avatarInitials: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    onboardingStep: {
      type: Number,
      default: 0,
    },
    onboardingSkippedAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["doctor", "clinic_admin", "patient"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual("doctorProfile", {
  ref: "Doctor",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

// Single async pre-save hook: syncs field aliases, then hashes password if changed
userSchema.pre("save", async function () {
  // --- Sync roles <-> role ---
  if (this.roles && this.roles.length > 0) {
    this.role = this.roles[0];
  } else if (this.role && (!this.roles || this.roles.length === 0)) {
    this.roles = [this.role];
  }

  // --- Sync provider <-> authProvider ---
  if (this.provider) {
    this.authProvider = this.provider;
  } else if (this.authProvider) {
    this.provider = this.authProvider;
  }

  // --- Sync isOnboardingComplete <-> onboardingCompleted ---
  if (this.isOnboardingComplete !== undefined) {
    this.onboardingCompleted = this.isOnboardingComplete;
  } else if (this.onboardingCompleted !== undefined) {
    this.isOnboardingComplete = this.onboardingCompleted;
  }

  // --- Sync avatar <-> photo ---
  if (this.avatar) {
    this.photo = this.avatar;
  } else if (this.photo) {
    this.avatar = this.photo;
  }

  // --- Hash password if modified ---
  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add text index for search
userSchema.index({ name: 'text', email: 'text', phone: 'text' });

const User = mongoose.model("User", userSchema);
module.exports = User;
