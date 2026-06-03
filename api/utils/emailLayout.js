const wrapEmail = (content) => {
  const year = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || "https://medeaz.vercel.app";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Medeaz</title>
  <style>
    body, table, td, a {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      color: #111827;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      padding: 48px 16px;
      background-color: #f3f4f6;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    .top-bar {
      height: 4px;
      background: #0f4c5c;
    }
    .header {
      padding: 32px 40px 0;
    }
    .logo {
      font-size: 18px;
      font-weight: 700;
      color: #0f4c5c;
      letter-spacing: -0.3px;
      text-decoration: none;
    }
    .content {
      padding: 32px 40px 36px;
    }
    .label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #6b7280;
      margin: 0 0 16px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.3px;
      line-height: 1.3;
      margin: 0 0 14px;
    }
    .text {
      font-size: 15px;
      color: #374151;
      line-height: 1.7;
      margin: 0 0 28px;
    }
    .btn {
      display: inline-block;
      background-color: #0f4c5c;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 13px 28px;
      border-radius: 8px;
      letter-spacing: 0.1px;
    }
    .notice {
      margin: 28px 0 0;
      padding: 16px 18px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer {
      padding: 20px 40px 28px;
      border-top: 1px solid #f3f4f6;
      text-align: center;
    }
    .footer-text {
      font-size: 12px;
      color: #9ca3af;
      margin: 0 0 4px;
      line-height: 1.6;
    }
    .footer-link {
      color: #6b7280;
      text-decoration: none;
    }
    @media (max-width: 600px) {
      .header  { padding: 24px 24px 0; }
      .content { padding: 24px 24px 28px; }
      .footer  { padding: 16px 24px 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="top-bar"></div>

      <div class="header">
        <a href="${frontendUrl}" class="logo">Medeaz</a>
      </div>

      <div class="content">
        ${content}
      </div>

      <div class="footer">
        <p class="footer-text">
          &copy; ${year} Medeaz &nbsp;&middot;&nbsp;
          <a href="mailto:support@medeaz.com" class="footer-link">support@medeaz.com</a>
          &nbsp;&middot;&nbsp;
          <a href="${frontendUrl}/privacy-policy" class="footer-link">Privacy</a>
        </p>
        <p class="footer-text">Digital healthcare for modern clinics.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

module.exports = { wrapEmail };
