const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Import controllers
const geminiController = require('../controllers/ai/geminiController');
const groqController = require('../controllers/ai/groqController');
const parsePrescriptionController = require('../controllers/ai/parsePrescription');
const clinicOpsController = require('../controllers/ai/clinicOpsController');
const doctorCopilotController = require('../controllers/ai/doctorCopilotController');
const patientAssistantController = require('../controllers/ai/patientAssistantController');

// All routes require authentication
router.use(protect);

// ========== Gemini Chat Routes ==========
router.post('/gemini/chat', authorize('patient'), geminiController.chat);
router.post('/gemini/health-advice', authorize('patient'), geminiController.getHealthAdvice);

// ========== Groq Chat Routes ==========
router.post('/groq/chat', authorize('patient'), groqController.chat);
router.post('/groq/health-advice', authorize('patient'), groqController.getHealthAdvice);

// ========== Prescription AI Routes (Doctor only) ==========
router.post('/prescriptions/parse', authorize('doctor'), parsePrescriptionController.parseTranscript);
router.post('/prescription/parse', authorize('doctor'), parsePrescriptionController.parseTranscript);
router.post('/gemini/parse-prescription', authorize('doctor'), parsePrescriptionController.parseTranscript);
router.post('/chat/transcribe', authorize('doctor'), (req, res) => {
  res.status(410).json({ success: false, message: 'This endpoint has been removed. Use /api/ai/prescriptions/parse.' });
});

// ========== Clinic Ops AI Routes (Clinic Admin only) ==========
router.post('/clinic-ops/query', authorize('clinic_admin'), clinicOpsController.queryOps);

// ========== Doctor Copilot Routes (Doctor only) ==========
router.post('/doctor-copilot/query', authorize('doctor'), doctorCopilotController.queryCopilot);

// ========== Patient Assistant Routes (Patient only) ==========
router.post('/patient-assistant/query', authorize('patient'), patientAssistantController.queryAssistant);

module.exports = router;
