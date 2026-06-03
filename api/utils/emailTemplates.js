const { wrapEmail } = require("./emailLayout");

/* ── Email Verification ─────────────────────────────────────────── */
const getVerificationEmail = (email, token) => {
  const url = `${process.env.FRONTEND_URL}/verify/${token}`;

  return wrapEmail(`
    <p class="label">Account Verification</p>
    <h1 class="title">Confirm your email address</h1>
    <p class="text">
      Thanks for signing up for Medeaz. Please verify your email address
      to activate your account and get started.
    </p>
    <a href="${url}" class="btn">Verify Email Address</a>
    <div class="notice">
      This link expires in <strong>24 hours</strong>. If you didn't create a
      Medeaz account, you can safely ignore this email.
    </div>
  `);
};

/* ── Forgot Password ─────────────────────────────────────────────── */
const getForgotPasswordEmail = (token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  return wrapEmail(`
    <p class="label">Password Reset</p>
    <h1 class="title">Reset your password</h1>
    <p class="text">
      We received a request to reset your Medeaz password. Click the button
      below to choose a new one.
    </p>
    <a href="${url}" class="btn">Reset Password</a>
    <div class="notice">
      This link expires in <strong>60 minutes</strong>. If you didn't request
      a password reset, your account is safe — no action is needed.
    </div>
  `);
};

module.exports = {
  getVerificationEmail,
  getForgotPasswordEmail,
};
