const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const User = require('../../models/User');
const Patient = require('../../models/Patient');
const Appointment = require('../../models/Appointment');
const Prescription = require('../../models/Prescription');
const FamilyMember = require('../../models/FamilyMember');
const { getPatientAssistantSession, storePatientAssistantSession } = require('../../services/redisService');
const groqService = require('../../services/groqService');

exports.queryAssistant = asyncHandler(async (req, res) => {
  const { message, language } = req.body;
  if (!message) throw new ApiError(400, "Message is required");

  // Verify patient
  if (!req.user.roles.includes('patient')) {
    throw new ApiError(403, "Only patients can access the assistant");
  }
  const userId = req.user._id;

  // Get patient profile
  const patientProfile = await Patient.findOne({ userId });
  
  // Fetch Appointments
  const today = new Date();
  const appointments = await Appointment.find({ patientId: userId })
    .populate('doctorId', 'name')
    .sort({ dateTime: 1 });

  const pastAppointments = appointments.filter(a => a.dateTime < today);
  const upcomingAppointments = appointments.filter(a => a.dateTime >= today);
  const missedAppointments = pastAppointments.filter(a => ['no-show', 'pending'].includes(a.status));

  // Fetch Prescriptions
  const prescriptions = await Prescription.find({ patientId: userId })
    .populate('doctorId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

  // Extract active medications (simplistic approach: just list all medicines from recent prescriptions)
  const allMedicines = prescriptions.flatMap(p => 
    p.medicines.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
      prescribedBy: p.doctorId?.name || 'Doctor',
      date: p.createdAt.toISOString().split('T')[0]
    }))
  );

  // Extract follow-ups
  const upcomingFollowUps = prescriptions
    .filter(p => p.followUpDate && new Date(p.followUpDate) >= today)
    .map(p => ({
      date: p.followUpDate.toISOString().split('T')[0],
      doctor: p.doctorId?.name || 'Doctor'
    }));

  const missedFollowUps = prescriptions
    .filter(p => p.followUpDate && new Date(p.followUpDate) < today)
    .map(p => ({
      date: p.followUpDate.toISOString().split('T')[0],
      doctor: p.doctorId?.name || 'Doctor'
    }));

  // Fetch Family Health (if requested or as general context)
  let familyMembers = [];
  if (patientProfile) {
    familyMembers = await FamilyMember.find({ patientId: patientProfile._id });
  }

  const context = {
    currentDate: new Date().toISOString().split('T')[0],
    patientInfo: {
      name: req.user.name,
      bloodGroup: patientProfile?.bloodGroup || 'Unknown',
      allergies: patientProfile?.allergies || []
    },
    timeline: {
      pastVisits: pastAppointments.map(a => ({
        date: a.dateTime.toISOString().split('T')[0],
        doctor: a.doctorId?.name,
        status: a.status
      })).slice(-5),
      recentDiagnoses: prescriptions.map(p => p.diagnosis).slice(0, 5)
    },
    appointments: {
      upcoming: upcomingAppointments.map(a => ({
        date: a.dateTime.toISOString().split('T')[0],
        time: a.dateTime.toISOString().split('T')[1].substring(0, 5),
        doctor: a.doctorId?.name,
        status: a.status
      })),
      missed: missedAppointments.map(a => ({
        date: a.dateTime.toISOString().split('T')[0],
        doctor: a.doctorId?.name
      }))
    },
    medicines: allMedicines,
    followUps: {
      upcoming: upcomingFollowUps,
      missed: missedFollowUps
    },
    familyHealth: familyMembers.map(f => ({
      name: f.name,
      relation: f.relation,
      allergies: f.allergies
    }))
  };

  const systemPrompt = `You are MedEaz Patient Health Assistant. You are talking directly to ${req.user.name}. You explain medical records, prescriptions, appointments, and follow-ups in simple, easy-to-understand language. You do not diagnose or prescribe treatment.

Live Patient Health Data:
${JSON.stringify(context, null, 2)}

Instructions:
1. Always communicate in a highly empathetic, helpful, and non-medical-jargon tone.
2. The user has requested to communicate in ${language}. You MUST reply strictly in ${language}. If ${language} is Urdu, you may use Urdu script or Roman Urdu, but prioritize Urdu script if the prompt seems to be in Urdu script.
3. Proactively warn the user about missed appointments or upcoming appointments if they ask about their schedule. (e.g., "You have an appointment in 3 days").
4. If they ask about medicines, list their recent medicines with dosages clearly.
5. If they ask about family, use the familyHealth array to provide a summary.
6. NEVER say things like "I am an AI, I cannot provide medical advice". Instead, say "According to your records..." or "Please consult Dr. X for a medical diagnosis."
7. If responding conversationally (e.g. greetings, "What is my name?", etc.), answer briefly, naturally, and correctly based on the context. Do not hallucinate questions or answer yourself.`;

  let history = [];
  const storedSession = await getPatientAssistantSession(userId);
  if (storedSession) {
    try {
      history = JSON.parse(storedSession);
    } catch(e) {}
  }

  const response = await groqService.patientAssistantChat(systemPrompt, message, history);

  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: response });
  if (history.length > 10) history = history.slice(-10);
  await storePatientAssistantSession(userId, JSON.stringify(history));

  res.status(200).json(new ApiResponse(200, { reply: response }, "Patient Assistant response generated"));
});
