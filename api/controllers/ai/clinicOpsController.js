const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const Clinic = require('../../models/Clinic');
const Appointment = require('../../models/Appointment');
const Staff = require('../../models/Staff');
const { getClinicOpsSession, storeClinicOpsSession } = require('../../services/redisService');
const groqService = require('../../services/groqService');

exports.queryOps = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, "Message is required");

  // Only clinic_admin
  const clinic = await Clinic.findOne({ adminId: req.user._id })
    .populate({ path: 'doctors', select: 'fullName specialization' });
  if (!clinic) throw new ApiError(404, "Clinic not found for this admin");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  const appointmentsData = await Appointment.find({
    clinicId: clinic._id,
    dateTime: { $gte: thirtyDaysAgo, $lt: thirtyDaysAhead }
  }).populate('doctorId', 'name').populate('patientId', 'name');

  const mappedAppointments = appointmentsData.map(a => ({
    date: a.dateTime.toISOString().split('T')[0],
    time: a.dateTime.toISOString().split('T')[1].substring(0, 5),
    status: a.status,
    patientName: a.patientId?.name || 'Unknown',
    doctorName: a.doctorId?.name || 'Unknown'
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const staffCount = await Staff.countDocuments({ clinicId: clinic._id });
  
  const todayDateString = today.toISOString().split('T')[0];
  const todayRevenue = clinic.revenue?.daily?.get(todayDateString) || 0;
  const totalRevenue = clinic.revenue?.total || 0;

  const context = {
    adminName: req.user.name,
    clinicName: clinic.name,
    currentDate: new Date().toISOString().split('T')[0],
    financials: {
      todayRevenue,
      totalRevenue
    },
    appointments: mappedAppointments,
    staff: {
      doctorsList: clinic.doctors.map(d => ({ name: d.fullName, specialty: d.specialization })),
      totalStaff: staffCount
    }
  };

  let history = [];
  const storedSession = await getClinicOpsSession(req.user._id);
  if (storedSession) {
    try {
      history = JSON.parse(storedSession);
    } catch(e) {}
  }

  const systemPrompt = `You are ClinicOps AI. You are a real-time healthcare operations intelligence system. You are talking directly to Clinic Admin ${req.user.name}. You analyze clinic performance, financials, scheduling, and staff performance. You do NOT provide medical advice.

Live Clinic Data:
${JSON.stringify(context, null, 2)}

Instructions:
- Be a helpful, conversational AI assistant for the clinic administrator.
- If the user asks a specific question (e.g., "how many appointments today?" or "hi" or "What is my name?"), answer naturally and directly in a concise conversational tone. Do not hallucinate questions or answer yourself.
- ONLY IF the user explicitly asks for a "full report", "overview", or "status", use the following strict markdown structure:
### Live Overview
### Issues Detected
### Financial Summary
### Doctor Performance
### Scheduling Risks
### Recommended Actions`;

  const response = await groqService.clinicOpsChat(systemPrompt, message, history);

  // Store new history
  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: response });
  // Keep last 10 messages
  if (history.length > 10) history = history.slice(-10);
  await storeClinicOpsSession(req.user._id, JSON.stringify(history));

  res.status(200).json(new ApiResponse(200, { reply: response }, "Ops AI response generated"));
});
