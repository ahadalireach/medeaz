const User = require("../../models/User");
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Clinic = require("../../models/Clinic");
const { generateAccessToken, generateRefreshToken } = require("../../utils/jwt");
const { storeRefreshToken } = require("../../services/redisService");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleAuth(req, res) {
  try {
    const { idToken, role } = req.body;
    // role: required on signup, optional on login (ignored if user exists)
    
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required." });
    }

    // === STEP 1: Verify Google token ===
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ error: "Invalid Google token." });
    }

    const {
      sub: googleId,       // unique Google user ID
      email,
      name,
      picture,             // Google profile photo URL
      email_verified,
    } = payload;

    if (!email_verified) {
      return res.status(400).json({
        error: "Google account email is not verified.",
      });
    }

    const normalizedEmail = email ? email.toLowerCase().trim() : "";

    // === STEP 2: Check existing user ===
    // Priority: find by googleId first, then email fallback
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }],
    });

    let isNewUser = false;
    let mappedRole = role;
    if (mappedRole === "clinic") mappedRole = "clinic_admin";

    if (user) {
      // === EXISTING USER — LOGIN (with automatic account linking) ===
      // Google has already verified this email, so it is safe to attach the
      // Google identity to a pre-existing account (e.g. one originally created
      // with an email/password) and sign the user in. From this point on the
      // email is a Google account — the password-login path already directs
      // such users to "Continue with Google".
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (user.authProvider !== "google") {
        // Set both fields: the model's pre-save hook syncs provider <-> authProvider
        // and would otherwise revert authProvider back to the old provider value.
        user.authProvider = "google";
        user.provider = "google";
      }

      // Refresh avatar if Google has one and user has none
      if (picture && !user.avatar) {
        user.avatar = picture;
      }

      // Update name only if user never set a custom name
      if (!user.name && name) {
        user.name = name;
      }

      await user.save();

    } else {
      // === NEW USER — SIGNUP FLOW ===
      
      if (!mappedRole) {
        return res.status(400).json({
          error: "role is required for new Google accounts.",
          code: "ROLE_REQUIRED",
        });
      }

      if (!["doctor", "patient", "clinic_admin"].includes(mappedRole)) {
        return res.status(400).json({ error: "Invalid role." });
      }

      // Generate avatar initials from name
      const initials = generateInitials(name || normalizedEmail);

      user = await User.create({
        googleId,
        email: normalizedEmail,
        emailProvider: "google",
        emailVerified: true,
        provider: "google",
        authProvider: "google",    // ← explicitly set so password validator skips (checks authProvider === 'local')
        name: name || normalizedEmail.split("@")[0],
        avatar: picture || null,
        avatarInitials: initials,
        role: mappedRole,
        roles: [mappedRole],
        isVerified: true,
        isOnboardingComplete: false,
        onboardingStep: 0,
      });

      // Create role-specific profile document
      await createRoleProfile(user._id, mappedRole, user.name, user.email, picture || null);
      
      isNewUser = true;
    }

    // === STEP 3: Generate JWT tokens ===
    // Ensure roles array is always populated from singular role if missing
    if (!user.roles || user.roles.length === 0) {
      user.roles = user.role ? [user.role] : ["patient"];
    }
    if (!user.role && user.roles.length > 0) {
      user.role = user.roles[0];
    }

    const accessToken = generateAccessToken(user._id, user.roles);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token in Redis
    await storeRefreshToken(user._id, refreshToken);

    // === STEP 4: Return response ===
    res.status(isNewUser ? 201 : 200).json({
      accessToken,
      refreshToken,
      isNewUser,
      user: {
        _id:                  user._id,
        name:                 user.name,
        email:                user.email,
        role:                 user.role  || user.roles[0],
        roles:                user.roles,               // ← required by dashboard layouts
        photo:                user.photo  || user.avatar || null,
        avatar:               user.avatar || user.photo || null,
        avatarInitials:       user.avatarInitials,
        provider:             user.authProvider || "google",
        authProvider:         user.authProvider || "google",
        emailProvider:        user.emailProvider || user.authProvider || "google",
        isVerified:           user.isVerified,
        onboardingCompleted:  Boolean(user.onboardingCompleted || user.isOnboardingComplete),
        isOnboardingComplete: Boolean(user.isOnboardingComplete || user.onboardingCompleted),
        onboardingStep:       user.onboardingStep || 0,
        profileCompleted:     Boolean(user.profileCompleted),
      },
    });

  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ error: "Authentication failed. Please try again." });
  }
}

// Helper: generate initials from full name
function generateInitials(name) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "U";
}

// Helper: create doctor/patient/clinic profile document after Google signup
async function createRoleProfile(userId, role, name, email, avatar) {
  switch (role) {
    case "doctor":
      await Doctor.create({
        userId,
        fullName: name || "Doctor",
        specialization: "General Physician",
        licenseNo: `LIC-PENDING-${userId}`,
        bio: "Please update your professional bio.",
        experience: 1,
        consultationFee: 500,
        education: [],
        schedule: {
          monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
        }
      });
      break;
    case "patient":
      await Patient.create({
        userId,
        name: name || "Patient",
        email: email,
        dob: null,
        bloodGroup: "",
        allergies: [],
        profilePhoto: avatar || null,
      });
      break;
    case "clinic_admin":
    case "clinic":
      await Clinic.create({ 
        adminId: userId,
        name: name || "My Clinic",
        address: "Placeholder Address",
        phone: "000-000-0000",
        email: email,
        photo: avatar || null,
      });
      break;
  }
}

module.exports = {
  googleAuth,
};
