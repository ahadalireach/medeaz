const getEmailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1E293B;
            margin: 0;
            padding: 0;
            background-color: #F8FAFC;
        }
        .wrapper {
            width: 100%;
            background-color: #F8FAFC;
            padding: 60px 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
            border: 1px solid #E2E8F0;
        }
        .header {
            background: linear-gradient(135deg, #00B495 0%, #008770 100%);
            padding: 60px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .header::after {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 10% 20%, rgba(255,255,255,0.1) 0%, transparent 40%);
        }
        .logo {
            font-size: 36px;
            font-weight: 800;
            color: white;
            letter-spacing: -1.5px;
            text-decoration: none;
            display: inline-block;
            position: relative;
            z-index: 10;
        }
        .content {
            padding: 60px 50px;
        }
        .title {
            font-size: 32px;
            font-weight: 800;
            color: #0F172A;
            margin: 0 0 24px 0;
            letter-spacing: -1px;
            line-height: 1.2;
        }
        .text {
            font-size: 18px;
            color: #475569;
            margin-bottom: 40px;
            line-height: 1.8;
        }
        .button-container {
            text-align: left;
            margin-bottom: 48px;
        }
        .button {
            display: inline-block;
            padding: 20px 48px;
            background-color: #00B495;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 20px;
            font-weight: 700;
            font-size: 18px;
            box-shadow: 0 15px 30px rgba(0, 180, 149, 0.3);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .divider {
            height: 2px;
            background: linear-gradient(to right, transparent, #F1F5F9, transparent);
            margin: 0 50px;
        }
        .footer {
            padding: 40px 50px;
            text-align: center;
            background-color: #FDFDFF;
        }
        .footer-text {
            font-size: 14px;
            color: #94A3B8;
            margin: 0;
            line-height: 1.6;
        }
        .footer-link {
            color: #00B495;
            text-decoration: none;
            font-weight: 700;
        }
        .badge {
            display: inline-block;
            padding: 8px 16px;
            background-color: #E6F8F4;
            color: #00B495;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 24px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <a href="${process.env.FRONTEND_URL}" class="logo">Medeaz</a>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="divider"></div>
            <div class="footer">
                <p class="footer-text">
                    This is an automated message from the Medeaz Security System.
                </p>
                <p class="footer-text" style="margin-top: 16px;">
                    Need assistance? <a href="mailto:support@medeaz.com" class="footer-link">Talk to an expert</a>
                </p>
                <div style="margin-top: 32px;">
                    <p class="footer-text">
                        © ${new Date().getFullYear()} Medeaz Inc. Digital Healthcare Excellence.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

const getVerificationEmail = (name, token) => {
  const url = `${process.env.FRONTEND_URL}/verify/${token}`;
  return getEmailTemplate(`
    <div class="badge">Security Verification</div>
    <h1 class="title">Confirm your identity</h1>
    <p class="text">Welcome to the inner circle of digital healthcare. To activate your Medeaz account and begin your journey, please verify your email address below.</p>
    <div class="button-container">
        <a href="${url}" class="button">Verify My Email</a>
    </div>
    <div style="padding: 24px; background-color: #F8FAFC; border-radius: 16px; margin-bottom: 32px;">
        <p class="text" style="font-size: 15px; color: #64748B; margin-bottom: 0; line-height: 1.6;">
            <strong>Pro Tip:</strong> Verified accounts gain immediate access to our premium telemedicine features and clinic management dashboard.
        </p>
    </div>
    <p class="text" style="font-size: 13px; color: #94A3B8; margin-bottom: 0;">If you didn't create an account, you can safely ignore this secure transmission.</p>
  `);
};

const getForgotPasswordEmail = (token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  return getEmailTemplate(`
    <div class="badge">Account Security</div>
    <h1 class="title">Secure Password Reset</h1>
    <p class="text">We received a request to recalibrate your account access. This update will apply to all your associated Medeaz roles (Patient, Doctor, Clinic) to ensure seamless synchronization.</p>
    <div class="button-container">
        <a href="${url}" class="button">Reset My Password</a>
    </div>
    <div style="border-left: 4px solid #00B495; padding-left: 20px; margin-bottom: 40px;">
        <p class="text" style="font-size: 14px; color: #64748B; margin-bottom: 0;">
            This security link is valid for **60 minutes**. If you did not initiate this request, your account remains secure and no action is required.
        </p>
    </div>
  `);
};

module.exports = {
  getVerificationEmail,
  getForgotPasswordEmail,
};
