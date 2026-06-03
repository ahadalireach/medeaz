const groqService = require('../../services/groqService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const Prescription = require('../../models/Prescription');
const MedicalRecord = require('../../models/MedicalRecord');
const Patient = require('../../models/Patient');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const Clinic = require('../../models/Clinic');

const EMERGENCY_KEYWORDS = ['chest pain', "can't breathe", 'unconscious', 'stroke', 'heart attack', 'سینے میں درد', 'سانس نہیں'];

/**
 * @desc    Chat with Groq AI
 * @route   POST /api/ai/groq/chat
 * @access  Private (Patient-Only)
 */
exports.chat = asyncHandler(async (req, res) => {
  const { message, conversationHistory, language } = req.body;
  const userId = req.user._id;

  if (!message || message.trim().length === 0) {
    throw new ApiError(400, 'Message is required');
  }

  // Emergency Safety Guardrail
  const isEmergency = EMERGENCY_KEYWORDS.some(k => message.toLowerCase().includes(k.toLowerCase()));
  if (isEmergency) {
    return res.status(200).json(
      new ApiResponse(200, {
        reply: '🚨 **This sounds like a medical emergency.** Please call emergency services (1122 in Pakistan) immediately or go to the nearest emergency room. Do not wait.',
        isEmergency: true,
      }, 'Emergency response triggered')
    );
  }

  // Fetch Patient Context
  let patientContext = '';
  try {
    const patientProfile = await Patient.findOne({ userId });
    
    // 1. Get Prescriptions (by User ID)
    const prescriptions = await Prescription.find({ patientId: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // 2. Get Medical Records (by Patient Profile ID)
    let records = [];
    if (patientProfile) {
      records = await MedicalRecord.find({ patientId: patientProfile._id })
        .sort({ visitDate: -1 })
        .limit(5);
    }

    // Build context string
    if (prescriptions.length > 0 || records.length > 0) {
      patientContext = "PATIENT HISTORY:\n";
      
      if (prescriptions.length > 0) {
        patientContext += "\nRECENT PRESCRIPTIONS:\n";
        prescriptions.forEach(p => {
          patientContext += `- ${new Date(p.createdAt).toLocaleDateString()}: Diagnosis: ${p.diagnosis}. Medicines: ${p.medicines.map(m => m.name).join(', ')}.\n`;
        });
      }

      if (records.length > 0) {
        patientContext += "\nRECENT MEDICAL RECORDS:\n";
        records.forEach(r => {
          patientContext += `- ${new Date(r.visitDate).toLocaleDateString()}: Complaint: ${r.chiefComplaint}. Diagnosis: ${r.diagnosis}.\n`;
        });
      }
    }
  } catch (ctxError) {
    console.error('Failed to fetch patient context for AI:', ctxError);
    // Continue without context if fetching fails
  }

  try {
    const reply = await groqService.chat(message, conversationHistory || [], patientContext, language);
    res.status(200).json(
      new ApiResponse(200, { reply, isEmergency: false }, 'Groq AI response generated successfully')
    );
  } catch (error) {
    console.error('Groq AI Chat Error:', error);
    throw new ApiError(500, error.message || 'Failed to process AI request with Groq');
  }
});

/**
 * @desc    Get health advice from Groq
 * @route   POST /api/ai/groq/health-advice
 * @access  Private (Patient)
 */
exports.getHealthAdvice = asyncHandler(async (req, res) => {
  const { query, language } = req.body;
  const userId = req.user._id;

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, 'Query is required');
  }

  // Fetch Patient Context
  let patientContext = '';
  try {
    const patientProfile = await Patient.findOne({ userId });
    const prescriptions = await Prescription.find({ patientId: userId }).sort({ createdAt: -1 }).limit(3);
    let records = [];
    if (patientProfile) {
      records = await MedicalRecord.find({ patientId: patientProfile._id }).sort({ visitDate: -1 }).limit(3);
    }

    if (prescriptions.length > 0 || records.length > 0) {
      patientContext = "PATIENT HISTORY:\n";
      prescriptions.forEach(p => {
        patientContext += `- Prescription (${new Date(p.createdAt).toLocaleDateString()}): ${p.diagnosis}. Medicines: ${p.medicines.map(m => m.name).join(', ')}.\n`;
      });
      records.forEach(r => {
        patientContext += `- Record (${new Date(r.visitDate).toLocaleDateString()}): ${r.chiefComplaint}. ${r.diagnosis}.\n`;
      });
    }
  } catch (ctxError) {
    console.error('Failed to fetch context for health advice:', ctxError);
  }

  try {
    const advice = await groqService.getHealthAdvice(query, patientContext, language);

    res.status(200).json(
      new ApiResponse(200, { advice }, 'Health advice generated successfully with Groq')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to get health advice with Groq');
  }
});

/**
 * @desc    Doctor clinical AI chat
 * @route   POST /api/ai/doctor/chat
 * @access  Private (Doctor only)
 */
exports.doctorChat = asyncHandler(async (req, res) => {
  const { message, conversationHistory, language } = req.body;
  const userId = req.user._id;

  if (!message || message.trim().length === 0) {
    throw new ApiError(400, 'Message is required');
  }

  // Emergency guardrail
  const isEmergency = EMERGENCY_KEYWORDS.some(k => message.toLowerCase().includes(k.toLowerCase()));
  if (isEmergency) {
    return res.status(200).json(
      new ApiResponse(200, {
        reply: '🚨 **This sounds like a medical emergency.** Please call emergency services (1122 in Pakistan) immediately.',
        isEmergency: true,
      }, 'Emergency response triggered')
    );
  }

  // Build doctor context
  let doctorContext = '';
  try {
    const doctorProfile = await Doctor.findOne({ userId });

    if (doctorProfile) {
      doctorContext += `DOCTOR PROFILE:\n- Name: ${doctorProfile.fullName || 'N/A'}\n- Specialization: ${doctorProfile.specialization || 'N/A'}\n- License: ${doctorProfile.licenseNo || 'N/A'}\n`;
    }

    const recentAppointments = await Appointment.find({ doctorId: userId })
      .sort({ dateTime: -1 })
      .limit(5)
      .populate('patientId', 'name');

    if (recentAppointments.length > 0) {
      doctorContext += '\nRECENT APPOINTMENTS:\n';
      recentAppointments.forEach(a => {
        doctorContext += `- ${new Date(a.dateTime).toLocaleDateString()}: ${a.patientId?.name || 'Patient'} — ${a.status}\n`;
      });
    }

    const recentPrescriptions = await Prescription.find({ doctorId: userId })
      .sort({ createdAt: -1 })
      .limit(5);

    if (recentPrescriptions.length > 0) {
      doctorContext += '\nRECENT PRESCRIPTIONS ISSUED:\n';
      recentPrescriptions.forEach(p => {
        const meds = (p.medicines || []).map(m => m.name).join(', ') || 'N/A';
        doctorContext += `- ${new Date(p.createdAt).toLocaleDateString()}: Diagnosis: ${p.diagnosis}. Medicines: ${meds}.\n`;
      });
    }
  } catch (ctxError) {
    console.error('Failed to fetch doctor context for AI:', ctxError);
  }

  try {
    const reply = await groqService.doctorChat(message, conversationHistory || [], doctorContext, language);
    res.status(200).json(
      new ApiResponse(200, { reply, isEmergency: false }, 'Doctor AI response generated')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to process doctor AI request');
  }
});

/**
 * @desc    Clinic admin operational AI chat
 * @route   POST /api/ai/clinic/chat
 * @access  Private (clinic_admin only)
 */
exports.clinicChat = asyncHandler(async (req, res) => {
  const { message, conversationHistory, language } = req.body;
  const userId = req.user._id;

  if (!message || message.trim().length === 0) {
    throw new ApiError(400, 'Message is required');
  }

  // Build clinic context
  let clinicContext = '';
  try {
    const clinic = await Clinic.findOne({ adminId: userId }).populate('doctors', 'fullName specialization');

    if (clinic) {
      clinicContext += `CLINIC PROFILE:\n- Name: ${clinic.name || 'N/A'}\n- Address: ${clinic.address || 'N/A'}\n- Phone: ${clinic.phone || 'N/A'}\n- Doctors on staff: ${clinic.doctors?.length || 0}\n`;

      if (clinic.doctors?.length > 0) {
        clinicContext += '\nDOCTORS:\n';
        clinic.doctors.forEach(d => {
          clinicContext += `- ${d.fullName || 'N/A'} (${d.specialization || 'N/A'})\n`;
        });
      }

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const doctorIds = (clinic.doctors || []).map(d => d.userId || d._id);

      const todayCount = await Appointment.countDocuments({
        doctorId: { $in: doctorIds },
        dateTime: { $gte: todayStart, $lte: todayEnd },
      });

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthCount = await Appointment.countDocuments({
        doctorId: { $in: doctorIds },
        dateTime: { $gte: monthStart },
      });

      clinicContext += `\nOPERATIONS:\n- Appointments today: ${todayCount}\n- Appointments this month: ${monthCount}\n- Revenue (total): PKR ${clinic.revenue?.total?.toLocaleString() || 0}\n`;
    }
  } catch (ctxError) {
    console.error('Failed to fetch clinic context for AI:', ctxError);
  }

  try {
    const reply = await groqService.clinicChat(message, conversationHistory || [], clinicContext, language);
    res.status(200).json(
      new ApiResponse(200, { reply, isEmergency: false }, 'Clinic AI response generated')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to process clinic AI request');
  }
});
