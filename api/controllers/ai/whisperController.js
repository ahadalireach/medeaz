const whisperService = require('../../services/whisperService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const fs = require('fs');

/**
 * @desc    Transcribe audio to text using Gemini API (dedicated transcription key)
 * @route   POST /api/ai/whisper/transcribe
 * @access  Private (Doctor only)
 */
exports.transcribeAudio = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Audio file is required');
  }

  const { language = 'en' } = req.body;
  const audioFilePath = req.file.path;

  try {
    const result = await whisperService.transcribeAudio(audioFilePath, language);

    // Clean up uploaded file
    fs.unlinkSync(audioFilePath);

    res.status(200).json(
      new ApiResponse(200, result, 'Audio transcribed successfully')
    );
  } catch (error) {
    // Clean up uploaded file on error
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    throw new ApiError(500, error.message || 'Failed to transcribe audio');
  }
});

/**
 * @desc    Transcribe audio from buffer/base64
 * @route   POST /api/ai/whisper/transcribe-buffer
 * @access  Private (Doctor only)
 */
exports.transcribeAudioBuffer = asyncHandler(async (req, res) => {
  const { audioData, filename, language = 'en' } = req.body;

  if (!audioData) {
    throw new ApiError(400, 'Audio data is required');
  }

  try {
    // Convert base64 to buffer if needed
    const audioBuffer = Buffer.isBuffer(audioData) 
      ? audioData 
      : Buffer.from(audioData, 'base64');

    const result = await whisperService.transcribeAudioBuffer(
      audioBuffer,
      filename || 'audio.mp3',
      language
    );

    res.status(200).json(
      new ApiResponse(200, result, 'Audio transcribed successfully')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to transcribe audio');
  }
});
