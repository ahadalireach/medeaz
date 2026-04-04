const geminiService = require('../../services/geminiService');
const whisperService = require('../../services/whisperService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const fs = require('fs');

/**
 * @desc    Parse prescription from text using Gemini
 * @route   POST /api/ai/prescription/parse
 * @access  Private (Doctor only)
 */
exports.parsePrescriptionText = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length === 0) {
    throw new ApiError(400, 'Prescription text is required');
  }

  try {
    const parsed = await geminiService.parsePrescription(text);

    res.status(200).json(
      new ApiResponse(200, parsed, 'Prescription parsed successfully')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to parse prescription');
  }
});

/**
 * @desc    Voice prescription (audio → transcript → structured data)
 * @route   POST /api/ai/prescription/voice
 * @access  Private (Doctor only)
 */
exports.voicePrescription = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Audio file is required');
  }

  const { language = 'en' } = req.body;
  const audioFilePath = req.file.path;

  try {
    // Step 1: Transcribe audio using Whisper
    const transcription = await whisperService.transcribeAudio(audioFilePath, language);

    // Step 2: Parse transcription using Gemini
    const parsed = await geminiService.parsePrescription(transcription.text);

    // Clean up uploaded file
    fs.unlinkSync(audioFilePath);

    res.status(200).json(
      new ApiResponse(200, {
        rawTranscript: transcription.text,
        parsed,
        language: transcription.language
      }, 'Voice prescription processed successfully')
    );
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    throw new ApiError(500, error.message || 'Failed to process voice prescription');
  }
});

/**
 * @desc    Enhanced prescription parsing with validation
 * @route   POST /api/ai/prescription/parse-enhanced
 * @access  Private (Doctor only)
 */
exports.parseEnhanced = asyncHandler(async (req, res) => {
  const { text, patientContext } = req.body;

  if (!text || text.trim().length === 0) {
    throw new ApiError(400, 'Prescription text is required');
  }

  try {
    let parsed = await geminiService.parsePrescription(text);

    // Add validation and context
    if (patientContext) {
      // You can enhance the parsing with patient's medical history, allergies, etc.
      // For now, just attach the warnings
      parsed.warnings = [];

      if (patientContext.allergies && Array.isArray(patientContext.allergies)) {
        for (const medicine of parsed.medicines) {
          const hasAllergy = patientContext.allergies.some(allergy => 
            medicine.name.toLowerCase().includes(allergy.toLowerCase())
          );
          if (hasAllergy) {
            parsed.warnings.push(`Warning: Patient may be allergic to ${medicine.name}`);
          }
        }
      }
    }

    res.status(200).json(
      new ApiResponse(200, parsed, 'Prescription parsed with validation')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to parse prescription');
  }
});
