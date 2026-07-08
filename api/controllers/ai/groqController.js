const groqService = require('../../services/groqService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const Prescription = require('../../models/Prescription');
const MedicalRecord = require('../../models/MedicalRecord');
const Patient = require('../../models/Patient');

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
