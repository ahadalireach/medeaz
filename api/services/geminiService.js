const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const CHAT_SYSTEM_PROMPT = `You are a helpful medical AI assistant for Medeaz, a healthcare platform.
You provide general health guidance and information only.
You never diagnose conditions or replace a doctor's advice.
Always recommend consulting a doctor for serious concerns.
If you detect an emergency situation, immediately advise the user to call emergency services.
Keep responses concise, clear, and in the same language the user writes in (Urdu or English).
Format responses in Markdown.`;

// List of potential model IDs to try in order of preference
const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-pro-latest",
  "gemini-2.0-pro",
];

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn("Gemini API key not configured");
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      // Initialize with gemini-2.0-flash as it is confirmed to exist for this key
      this.activeModelId = "gemini-2.0-flash";
      this.model = this.genAI.getGenerativeModel({ model: this.activeModelId });
    }
  }

  /**
   * Automatically discover and set the working model for this API key
   */
  async discoverModel() {
    for (const modelId of MODEL_CANDIDATES) {
      try {
        const testModel = this.genAI.getGenerativeModel({ model: modelId });
        await testModel.generateContent("hi");
        this.activeModelId = modelId;
        this.model = testModel;
        console.log(
          `Gemini Service: Auto-discovered working model: ${modelId}`,
        );
        return true;
      } catch (err) {
        console.warn(`Gemini Service: Model ${modelId} failed: ${err.message}`);
      }
    }
    return false;
  }

  async retryWithBackoff(fn, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error; // Last attempt, rethrow
        console.warn(
          `Attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`,
          error.message,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  async chat(message, conversationHistory = []) {
    try {
      if (!this.apiKey) throw new Error("Gemini API key not configured");

      const attemptWithModel = async (currentModelId) => {
        const modelObj = this.genAI.getGenerativeModel({
          model: currentModelId,
        });
        const chat = modelObj.startChat({
          history: [
            { role: "user", parts: [{ text: CHAT_SYSTEM_PROMPT }] },
            {
              role: "model",
              parts: [
                {
                  text: "Understood. I am ready to assist patients with general health guidance.",
                },
              ],
            },
            ...conversationHistory
              .filter((h) => h.content?.trim())
              .map((msg) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
              })),
          ],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        return response.text();
      };

      // Try current model first
      try {
        console.log(`Chatting with current model: ${this.activeModelId}`);
        return await attemptWithModel(this.activeModelId);
      } catch (error) {
        const isQuotaIssue =
          error.message?.includes("429") || error.message?.includes("quota");
        const isNotFound =
          error.message?.includes("not found") ||
          error.message?.includes("404");

        if (isQuotaIssue || isNotFound) {
          console.log(
            `Model ${this.activeModelId} failed (${isQuotaIssue ? "Quota" : "404"}). Searching for alternative...`,
          );

          // Filter out the one that just failed
          const alternatives = MODEL_CANDIDATES.filter(
            (m) => m !== this.activeModelId,
          );

          for (const alt of alternatives) {
            try {
              console.log(`Trying alternative model: ${alt}`);
              const reply = await attemptWithModel(alt);
              this.activeModelId = alt; // Found a new winner!
              this.model = this.genAI.getGenerativeModel({ model: alt });
              console.log(`Sucessfully switched to: ${alt}`);
              return reply;
            } catch (altError) {
              console.warn(`Alternative ${alt} failed: ${altError.message}`);
            }
          }
        }
        throw error; // If all else fails
      }
    } catch (error) {
      console.error("Final Gemini chat error:", error.message);
      throw new Error(
        error.message ||
          "AI service currently experiencing high load. Please try again soon.",
      );
    }
  }

  async parsePrescription(transcription) {
    try {
      if (!this.apiKey || !this.genAI)
        return this.parseWithRules(transcription);
      const result = await this.model.generateContent(
        `Parse this prescription: "${transcription}"`,
      );
      const response = await result.response;
      let text = response
        .text()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return JSON.parse(text);
    } catch (error) {
      return this.parseWithRules(transcription);
    }
  }

  parseWithRules(transcription) {
    return {
      diagnosis: "General consultation",
      medicines: [],
      notes: transcription,
      parsedBy: "fallback",
    };
  }

  async transcribeAudio(audioBuffer, mimeType = "audio/mpeg", language = "en") {
    try {
      if (!this.apiKey) throw new Error("Gemini API key not configured");
      const base64Audio = audioBuffer.toString("base64");
      const result = await this.model.generateContent([
        { inlineData: { mimeType, data: base64Audio } },
        { text: "Transcribe this audio accurately." },
      ]);
      const response = await result.response;
      return { text: response.text().trim(), language, success: true };
    } catch (error) {
      console.error("Gemini transcription error:", error.message);
      throw error;
    }
  }

  async getHealthAdvice(query) {
    return this.chat(query);
  }
}

const geminiServiceInstance = new GeminiService();
module.exports = geminiServiceInstance;
module.exports.chatWithGemini = (message, history) =>
  geminiServiceInstance.chat(message, history);
