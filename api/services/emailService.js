const nodemailer = require("nodemailer");
const emailTemplates = require("./emailTemplates");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendEmail = async (...args) => {
  let to, subject, html, templateName, data;

  if (args.length === 1 && args[0] && typeof args[0] === "object") {
    ({ to, subject, html, templateName, data } = args[0]);
  } else {
    [to, subject, templateName, data] = args;
  }

  const label = templateName || "custom";

  try {
    let body = html;
    if (!body && templateName) {
      const render = emailTemplates[templateName];
      if (typeof render !== "function") {
        throw new Error(`Unknown email template: "${templateName}"`);
      }
      body = render(data);
    }

    if (!body) {
      throw new Error("sendEmail requires either `html` or a valid `templateName`");
    }

    const mailOptions = {
      from: `"Medeaz" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent: ${label} to ${to} (MessageID: ${info.messageId})`,
    );
    return true;
  } catch (error) {
    console.error(
      `Email error: Failed to send ${label} to ${to}:`,
      error.message,
    );
    return false;
  }
};
