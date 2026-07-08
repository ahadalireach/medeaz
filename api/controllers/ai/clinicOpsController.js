const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const ApiResponse = require('../../utils/ApiResponse');
const Clinic = require('../../models/Clinic');
const { getClinicOpsSession, storeClinicOpsSession, getClinicContext, storeClinicContext } = require('../../services/redisService');
const { buildClinicContext } = require('../../services/clinicContextBuilder');
const { getSystemPrompt } = require('../../services/prompts/clinicOpsPrompt');
const groqService = require('../../services/groqService');
 
/**
 * Handles the Clinic Operations AI query from a clinic admin.
 * Assembles the full clinic context, queries the Groq API with context,
 * manages conversation history, and handles errors gracefully.
 */
exports.queryOps = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) throw new ApiError(400, "Message is required");
 
  // Get clinicId from logged-in admin
  const clinicId = req.user.clinicId || (await Clinic.findOne({ adminId: req.user._id }))?._id;
  if (!clinicId) throw new ApiError(404, "Clinic not found for this admin");
 
  // 1. Get/Assemble clinic context snapshot with caching
  let context;
  try {
    // Check Redis cache first
    context = await getClinicContext(clinicId);
    if (!context) {
      // Cache miss: build context and store in Redis
      context = await buildClinicContext(clinicId);
      await storeClinicContext(clinicId, context);
    }
  } catch (err) {
    console.error("Clinic Ops Context build/fetch error:", err);
    // Failure path: return user-friendly message
    return res.status(200).json(new ApiResponse(200, {
      reply: "Unable to load clinic data. Please refresh and try again."
    }, "Context build failed fallback"));
  }
 
  // 2. Chat history (slice to last 6 messages: 3 user + 3 assistant turns max)
  let history = [];
  const storedSession = await getClinicOpsSession(req.user._id);
  if (storedSession) {
    if (Array.isArray(storedSession)) {
      history = storedSession;
    } else if (typeof storedSession === "string") {
      try {
        history = JSON.parse(storedSession);
      } catch (e) {}
    }
  }
  const lastSixHistory = Array.isArray(history) ? history.slice(-6) : [];
 
  // 3. Formulate system prompt
  const systemPrompt = getSystemPrompt(context.clinic.name, context);
 
  // 4. Sanitize user message to neutralize prompt injection
  const sanitizedMessage = message.trim().replace(/(?:ignore|forget|system)/gi, "");
 
  // 5. Call Groq
  let responseText;
  try {
    responseText = await groqService.clinicOpsChat(systemPrompt, sanitizedMessage, lastSixHistory);
  } catch (err) {
    console.error("Groq clinic ops query error:", err);
    // Failure path: return user-friendly message
    return res.status(200).json(new ApiResponse(200, {
      reply: "AI assistant is temporarily unavailable. Try again in a moment."
    }, "AI assistant error fallback"));
  }
 
  // 6. Update and store chat history
  history.push({ role: 'user', content: message });
  history.push({ role: 'assistant', content: responseText });
  if (history.length > 10) history = history.slice(-10);
  await storeClinicOpsSession(req.user._id, JSON.stringify(history));
 
  res.status(200).json(new ApiResponse(200, { reply: responseText }, "Ops AI response generated"));
});
