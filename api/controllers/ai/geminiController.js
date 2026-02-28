const geminiService = require('../../services/geminiService');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * @desc    Chat with Gemini AI
 * @route   POST /api/ai/gemini/chat
 * @access  Private
 */
exports.chat = asyncHandler(async (req, res) => {
  const { message, conversationHistory } = req.body;

  if (!message || message.trim().length === 0) {
    throw new ApiError(400, 'Message is required');
  }

  try {
    const response = await geminiService.chat(message, conversationHistory || []);

    res.status(200).json(
      new ApiResponse(200, { response }, 'AI response generated successfully')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to generate AI response');
  }
});

/**
 * @desc    Get health advice from Gemini
 * @route   POST /api/ai/gemini/health-advice
 * @access  Private (Patient)
 */
exports.getHealthAdvice = asyncHandler(async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, 'Query is required');
  }

  try {
    const advice = await geminiService.getHealthAdvice(query);

    res.status(200).json(
      new ApiResponse(200, { advice }, 'Health advice generated successfully')
    );
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to get health advice');
  }
});
