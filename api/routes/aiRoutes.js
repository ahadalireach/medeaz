const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { uploadAudio } = require('../middleware/uploadMiddleware');

// Import controllers
const whisperController = require('../controllers/ai/whisperController');
const geminiController = require('../controllers/ai/geminiController');
const prescriptionAIController = require('../controllers/ai/prescriptionAIController');

// All routes require authentication
router.use(protect);

// ========== Whisper Routes (Doctor only) ==========
router.post(
  '/whisper/transcribe',
  authorize('doctor'),
  uploadAudio.single('audio'),
  whisperController.transcribeAudio
);

router.post(
  '/whisper/transcribe-buffer',
  authorize('doctor'),
  whisperController.transcribeAudioBuffer
);

// ========== Gemini Chat Routes ==========
router.post('/gemini/chat', geminiController.chat);
router.post('/gemini/health-advice', authorize('patient'), geminiController.getHealthAdvice);

// ========== Prescription AI Routes (Doctor only) ==========
router.post(
  '/prescription/parse',
  authorize('doctor'),
  prescriptionAIController.parsePrescriptionText
);

router.post(
  '/prescription/voice',
  authorize('doctor'),
  uploadAudio.single('audio'),
  prescriptionAIController.voicePrescription
);

router.post(
  '/prescription/parse-enhanced',
  authorize('doctor'),
  prescriptionAIController.parseEnhanced
);

module.exports = router;
