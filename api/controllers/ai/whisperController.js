const geminiService = require('../../services/geminiService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const fs = require('fs');

/**
 * @desc    Transcribe audio to text using Gemini API
 * @route   POST /api/ai/transcribe
 * @access  Private (Doctor only)
 */
exports.transcribeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Audio file is required');
  }

  const { language = 'en' } = req.body;
  const audioFilePath = req.file.path;

  try {
    const audioBuffer = fs.readFileSync(audioFilePath);
    const mimeType = req.file.mimetype || 'audio/mpeg';

    const result = await geminiService.transcribeAudio(audioBuffer, mimeType, language);

    // Clean up uploaded file
    fs.unlinkSync(audioFilePath);

    res.status(200).json(
      new ApiResponse(200, result, 'Audio transcribed successfully by Gemini')
    );
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    throw new ApiError(500, error.message || 'Gemini failed to transcribe audio');
  }
});

/**
 * @desc    Transcribe audio from buffer/base64 using Gemini
 * @route   POST /api/ai/transcribe-buffer
 * @access  Private (Doctor only)
 */
exports.transcribeAudioBuffer = asyncHandler(async (req, res) => {
  const { audioData, filename, language = 'en', mimeType } = req.body;

  if (!audioData) {
    throw new ApiError(400, 'Audio data is required');
  }

  try {
    // Convert base64 to buffer if needed
    const audioBuffer = Buffer.isBuffer(audioData) 
      ? audioData 
      : Buffer.from(audioData, 'base64');

    const result = await geminiService.transcribeAudio(
      audioBuffer, 
      mimeType || 'audio/mpeg', 
      language
    );

    res.status(200).json(
      new ApiResponse(200, result, 'Audio transcribed successfully by Gemini')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Gemini failed to transcribe audio from buffer');
  }
});
