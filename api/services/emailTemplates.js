const brandTeal = "#00b495";

const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
  .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; }
  .header { background-color: ${brandTeal}; padding: 30px; text-align: center; }
  .header img { width: 150px; }
  .content { padding: 40px; line-height: 1.6; }
  .footer { padding: 30px; text-align: center; background-color: #f9f9f9; color: #999; font-size: 12px; }
  .button { display: inline-block; padding: 12px 24px; background-color: ${brandTeal}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
  .detail-box { background-color: #f4fdfb; padding: 20px; border-radius: 8px; border: 1px solid #e0f2f1; margin: 20px 0; }
  .detail-row { margin-bottom: 8px; display: flex; }
  .detail-label { font-weight: bold; color: #555; width: 120px; }
  .detail-value { color: #333; }
`;

exports.appointmentConfirmed = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>Your appointment has been successfully booked with <strong>Dr. ${data.doctorName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Date/Time:</span> <span class="detail-value">${data.dateTime}</span></div>
        <div class="detail-row"><span class="detail-label">Location:</span> <span class="detail-value">${data.location}</span></div>
        <div class="detail-row"><span class="detail-label">Type:</span> <span class="detail-value">${data.type}</span></div>
      </div>
      <p>Please arrive 15 minutes early for your check-in.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/patient/appointments" class="button">View Appointment Details</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.doctorAppointmentNotice = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">New Appointment</h1>
    </div>
    <div class="content">
      <p>Hello, Dr. ${data.doctorName}</p>
      <p>A new appointment has been scheduled with <strong>${data.patientName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Date/Time:</span> <span class="detail-value">${data.dateTime}</span></div>
        <div class="detail-row"><span class="detail-label">Reason:</span> <span class="detail-value">${data.reason}</span></div>
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard/doctor/appointments" class="button">Manage Appointments</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.appointmentAccepted = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Appointment Confirmed</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>Great news! Your appointment with <strong>Dr. ${data.doctorName}</strong> has been confirmed.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Date/Time:</span> <span class="detail-value">${data.dateTime}</span></div>
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard/patient/appointments" class="button">View Dashboard</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.appointmentRejected = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header" style="background-color: #f44336;">
      <h1 style="color: white; margin: 0;">Appointment Cancelled</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>Unfortunately, your appointment with <strong>Dr. ${data.doctorName}</strong> on <strong>${data.dateTime}</strong> has been cancelled.</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ""}
      <p>Please try booking another slot or contact the clinic for assistance.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/patient/book-appointment" class="button">Book New Appointment</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.appointmentCancelledByPatient = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header" style="background-color: #f44336;">
      <h1 style="color: white; margin: 0;">Appointment Cancelled</h1>
    </div>
    <div class="content">
      <p>Hello, Dr. ${data.doctorName}</p>
      <p>The appointment scheduled with <strong>${data.patientName}</strong> on <strong>${data.dateTime}</strong> has been cancelled by the patient.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/doctor/appointments" class="button">Check Your Schedule</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.visitSummary = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Visit Summary</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>Your visit with <strong>Dr. ${data.doctorName}</strong> is complete. Your prescription and visit summary are now available in your portal.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/patient/records" class="button">View Medical Records</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.newPatientWelcome = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Welcome to Medeaz</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>You have been added to the patient registry of <strong>Dr. ${data.doctorName}</strong> at <strong>Medeaz</strong>.</p>
      <p>You can now manage your appointments, view prescriptions, and track your health records online.</p>
      <a href="${process.env.FRONTEND_URL}/login" class="button">Access Your Portal</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.newPrescription = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">New Prescription</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p><strong>Dr. ${data.doctorName}</strong> has created a new prescription for you.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/patient/records" class="button">View Prescription</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.followUpReminder = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Follow-Up Reminder</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>This is a reminder for your upcoming follow-up with <strong>Dr. ${data.doctorName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Date:</span> <span class="detail-value">${data.date}</span></div>
      </div>
      <a href="${process.env.FRONTEND_URL}/dashboard/patient/book-appointment" class="button">Book Appointment</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.appointmentReminder = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Reminder: Appointment Tomorrow</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.patientName}</p>
      <p>This is a reminder for your appointment tomorrow with <strong>Dr. ${data.doctorName}</strong>.</p>
      <div class="detail-box">
        <div class="detail-row"><span class="detail-label">Date/Time:</span> <span class="detail-value">${data.dateTime}</span></div>
      </div>
      <p>We look forward to seeing you.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.newStaffAccount = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Your Staff Account</h1>
    </div>
    <div class="content">
      <p>Hello, ${data.name}</p>
      <p>A new staff account has been created for you at <strong>${data.clinicName}</strong> on Medeaz.</p>
      <p>Your temporary password is: <strong>${data.password}</strong></p>
      <p>Please log in and change your password immediately.</p>
      <a href="${process.env.FRONTEND_URL}/login" class="button">Login Now</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;

exports.doctorAddedToClinic = (data) => `
  <style>${emailStyles}</style>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Added to Clinic</h1>
    </div>
    <div class="content">
      <p>Hello, Dr. ${data.doctorName}</p>
      <p>You have been successfully added to <strong>${data.clinicName}</strong>.</p>
      <p>You can now manage appointments and patients for this clinic.</p>
      <a href="${process.env.FRONTEND_URL}/dashboard/doctor" class="button">Go to Portal</a>
    </div>
    <div class="footer">
      <p>&copy; 2026 Medeaz. All rights reserved.</p>
    </div>
  </div>
`;
