const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const Doctor = require('../../models/Doctor');
const { getDoctorCopilotSession, storeDoctorCopilotSession } = require('../../services/redisService');
const groqService = require('../../services/groqService');

exports.queryCopilot = asyncHandler(async (req, res) => {
  const { message, patientId, action } = req.body;
  if (!message) throw new ApiError(400, "Message is required");

  // Verify doctor
  if (!req.user.roles.includes('doctor')) {
    throw new ApiError(403, "Only doctors can access the copilot");
  }
  const doctorId = req.user._id;
  const doctorName = req.user.name;

  // Always fetch Global Mode (Workload, alerts)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysAppointments = await Appointment.find({
    doctorId,
    dateTime: { $gte: today, $lt: tomorrow }
  }).populate('patientId', 'name');

  // Missed follow-ups could be appointments in the past with 'no-show' or 'pending'
  const missedAppointments = await Appointment.find({
    doctorId,
    dateTime: { $lt: today },
    status: { $in: ['no-show', 'pending'] }
  }).populate('patientId', 'name').sort({ dateTime: -1 }).limit(10);

  let context = {
    doctorName,
    mode: patientId ? "Patient Focus Mode" : "Global Mode",
    currentDate: new Date().toISOString().split('T')[0],
    todaysWorkload: {
      total: todaysAppointments.length,
      appointments: todaysAppointments.map(a => ({
        time: a.dateTime.toISOString().split('T')[1].substring(0, 5),
        patient: a.patientId?.name || 'Unknown',
        status: a.status,
        reason: a.reason
      }))
    },
    missedFollowUps: missedAppointments.map(a => ({
      date: a.dateTime.toISOString().split('T')[0],
      patient: a.patientId?.name || 'Unknown',
      status: a.status
    }))
  };

  if (patientId) {
    // Patient Focus Mode Additions
    const patient = await User.findById(patientId);
    if (!patient) throw new ApiError(404, "Patient not found");

    const pastAppointments = await Appointment.find({ doctorId, patientId }).sort({ dateTime: -1 }).limit(5);
    const pastPrescriptions = await Prescription.find({ doctorId, patientId }).sort({ createdAt: -1 }).limit(5);

    context.patientInfo = {
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
    };
    context.medicalHistory = pastPrescriptions.map(p => ({
      date: p.createdAt.toISOString().split('T')[0],
      diagnosis: p.diagnosis,
      medicines: p.medicines,
      notes: p.notes,
      followUpDate: p.followUpDate ? p.followUpDate.toISOString().split('T')[0] : null
    }));
    context.recentAppointments = pastAppointments.map(a => ({
      date: a.dateTime.toISOString().split('T')[0],
      status: a.status,
      reason: a.reason,
      notes: a.notes
    }));
  }

  const systemPrompt = `You are MedEaz Doctor Copilot. You are talking directly to Dr. ${doctorName}. You assist doctors in organizing patient data, summarizing medical history, and structuring prescriptions. You never diagnose diseases or replace clinical judgment.

Live Clinical Context:
${JSON.stringify(context, null, 2)}

Instructions:
1. All outputs must be clinically structured, concise, and action-oriented.
2. If the user asks to summarize a patient or asks for a patient overview, use Markdown to structure:
   - Patient Overview
   - Last Visit Summary
   - Current Medications
   - Risks Based on History (non-diagnostic wording)
   - Suggested Questions Doctor Should Ask
3. If the user dictates a prescription ("Draft Prescription"), output a structured JSON or Markdown prescription including diagnosis, medicines, dosage, instructions, and follow-up.
4. For general queries ("Today's Load"), ONLY list appointments from the \`todaysWorkload\` array. Do NOT include \`missedFollowUps\` in today's load. If \`todaysWorkload.total\` is 0, state explicitly that there are no appointments today.
5. If responding conversationally (e.g. greetings, "What is my name?", etc.), answer briefly, naturally, and correctly based on the context. If the user speaks Urdu, respond in Roman Urdu or Urdu script. Do not hallucinate questions or answer yourself.`;

  let history = [];
  const storedSession = await getDoctorCopilotSession(doctorId);
  if (storedSession) {
    try {
      history = JSON.parse(storedSession);
    } catch(e) {}
  }

  const response = await groqService.doctorCopilotChat(systemPrompt, message, history);

  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: response });
  if (history.length > 10) history = history.slice(-10);
  await storeDoctorCopilotSession(doctorId, JSON.stringify(history));

  res.status(200).json(new ApiResponse(200, { reply: response }, "Copilot response generated"));
});
