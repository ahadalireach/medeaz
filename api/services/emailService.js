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

exports.sendEmail = async (to, subject, templateName, data) => {
  try {
    const html = emailTemplates[templateName](data);
    const mailOptions = {
      from: `"Medeaz" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Email sent: ${templateName} to ${to} (MessageID: ${info.messageId})`,
    );
    return true;
  } catch (error) {
    console.error(
      `Email error: Failed to send ${templateName} to ${to}:`,
      error.message,
    );
    return false;
  }
};
