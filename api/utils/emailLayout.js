const wrapEmail = (content) => {
  const year = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || "#";

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medeaz</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1c1917;
            background-color: #f4f3ee;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f4f3ee;
            padding: 48px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 24px 60px -30px rgba(15, 76, 92, 0.18);
            border: 1px solid rgba(15, 76, 92, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #0f4c5c 0%, #0a3a47 100%);
            padding: 36px 44px;
            text-align: left;
        }
        .logo {
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.5px;
            text-decoration: none;
        }
        .content { padding: 40px 44px 28px 44px; }
        .badge {
            display: inline-block;
            padding: 6px 14px;
            background-color: #e3eff2;
            color: #0f4c5c;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 20px;
        }
        .badge-warn {
            background-color: #fdf4e7;
            color: #8a5a1a;
        }
        .badge-danger {
            background-color: #fde7e7;
            color: #9b2c2c;
        }
        .title {
            font-size: 26px;
            font-weight: 700;
            color: #1c1917;
            margin: 0 0 16px 0;
            letter-spacing: -0.5px;
            line-height: 1.25;
        }
        .text {
            font-size: 15px;
            color: #44403c;
            margin: 0 0 20px 0;
            line-height: 1.65;
        }
        .text-muted {
            font-size: 13px;
            color: #78716c;
            margin: 0;
        }
        .button-container { margin: 28px 0 20px 0; }
        .button {
            display: inline-block;
            padding: 12px 28px;
            background-color: #0f4c5c;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 999px;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 0.2px;
        }
        .detail-box {
            background-color: #e3eff2;
            padding: 20px 24px;
            border-radius: 16px;
            margin: 20px 0 24px 0;
            border: 1px solid rgba(15, 76, 92, 0.08);
        }
        .detail-row {
            margin-bottom: 12px;
            font-size: 14px;
        }
        .detail-row:last-child { margin-bottom: 0; }
        .detail-label {
            display: inline-block;
            font-weight: 600;
            color: #0f4c5c;
            min-width: 110px;
        }
        .detail-value { color: #1c1917; }
        .code-box {
            background: #fdf4e7;
            border: 1px dashed rgba(15, 76, 92, 0.3);
            padding: 16px 20px;
            border-radius: 12px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 700;
            color: #0f4c5c;
            letter-spacing: 2px;
            text-align: center;
            margin: 20px 0 24px 0;
        }
        .note {
            border-left: 3px solid #0f4c5c;
            padding: 2px 0 2px 16px;
            margin: 24px 0;
            font-size: 13px;
            color: #44403c;
            line-height: 1.6;
        }
        .footer {
            padding: 28px 44px 32px 44px;
            text-align: center;
            background-color: #fdf4e7;
            border-top: 1px solid rgba(15, 76, 92, 0.06);
        }
        .footer-text {
            font-size: 12px;
            color: #78716c;
            margin: 0 0 8px 0;
            line-height: 1.6;
        }
        .footer-link {
            color: #0f4c5c;
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <a href="${frontendUrl}" class="logo">Medeaz</a>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p class="footer-text">
                    Need help? <a href="mailto:support@medeaz.com" class="footer-link">Contact support</a>
                </p>
                <p class="footer-text">
                    &copy; ${year} Medeaz. Digital healthcare for modern clinics.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;
};

module.exports = { wrapEmail };
