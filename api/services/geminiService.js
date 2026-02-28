const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('Gemini API key not configured');
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Retry helper with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in ms
   * @returns {Promise} Result of function
   */
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 2000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        const isRateLimitError = error.message?.includes('429') || 
                                 error.message?.includes('RATE_LIMIT_EXCEEDED') ||
                                 error.message?.includes('Quota exceeded');
        
        const isLastRetry = i === maxRetries - 1;
        
        if (!isRateLimitError || isLastRetry) {
          throw error;
        }
        
        // Exponential backoff: 2s, 4s, 8s
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Generate chat response from Gemini
   * @param {string} message - User message
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<string>} AI response
   */
  async chat(message, conversationHistory = []) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const chat = this.model.startChat({
        history: conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chat error:', error.message);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Parse prescription from transcribed text
   * @param {string} transcription - Raw text from audio
   * @returns {Promise<Object>} Structured prescription data
   */
  /**
   * Rule-based fallback parser for when AI is unavailable.
   * Handles: multi-medicine transcripts, lowercase units, tight frequency/duration extraction.
   */
  parseWithRules(transcription) {
    // Step 1: Normalise text — lowercase dosage units only
    const normalised = transcription
      .replace(/\b(\d+\.?\d*)\s*(MG|ML|MCG|IU|GM|G)\b/g, (_, n, u) => `${n}${u.toLowerCase()}`)
      .replace(/\bmilligrams?\b/gi, 'mg')
      .replace(/\bmillilitres?\b/gi, 'ml')
      .replace(/\bgrams?\b/gi, 'g')
      .replace(/\s+/g, ' ')
      .trim();

    // Step 2: Diagnoses
    let diagnosis = 'General consultation';
    const diagPatterns = [
      /(?:diagnosed? with|suffering from|presenting with|patient has|has|condition[:\s]+)([^.,;\n]{3,60})/i,
    ];
    for (const p of diagPatterns) {
      const m = normalised.match(p);
      if (m) { diagnosis = m[1].trim(); break; }
    }

    // Step 3: Split transcript into per-medicine segments.
    // Strategy: find positions where a drug-like word is immediately followed by a dosage (number + unit)
    // or follows a separator keyword. Each such position starts a new segment.
    const skipWords = new Set([
      'patient','doctor','prescription','the','and','for','with','has','this','that',
      'please','also','then','take','give','note','after','before','during','food',
      'water','meal','meals','morning','night','evening','daily','day','days','week',
      'weeks','once','twice','thrice','times','time','prescribe','prescribed','give',
      'administer','start','tablet','tablets','capsule','capsules','syrup','injection',
    ]);

    // Find all medicine-start positions: word NOT in skipWords followed by dosage like "500mg"
    const medStartRegex = /\b([A-Za-z]{3,})\s+(\d+\.?\d*\s*(?:mg|ml|g|mcg|iu|units?|tabs?|tablets?|caps?|capsules?|drops?))/gi;
    const segments = [];
    let lastIndex = 0;
    let m;
    const positions = [];

    while ((m = medStartRegex.exec(normalised)) !== null) {
      const word = m[1].toLowerCase();
      if (!skipWords.has(word)) {
        positions.push(m.index);
      }
    }

    if (positions.length === 0) {
      // No dosage-anchored medicines found — still try to extract from the whole text
      segments.push(normalised);
    } else {
      for (let i = 0; i < positions.length; i++) {
        const start = positions[i];
        const end = positions[i + 1] ?? normalised.length;
        segments.push(normalised.slice(start, end).trim());
      }
      // Include any text before the first detected medicine (may contain diagnosis)
      if (positions[0] > 0) {
        segments.unshift(normalised.slice(0, positions[0]).trim());
      }
    }

    // Helpers
    const extractDosage = (seg) => {
      const m = seg.match(/(\d+\.?\d*)\s*(mg|ml|g|mcg|iu|units?|tablets?|tabs?|caps?|capsules?|drops?)/i);
      return m ? `${m[1]}${m[2].toLowerCase()}` : 'as directed';
    };

    const extractFrequency = (seg) => {
      const patterns = [
        /(\d+)\s*times?\s*(?:a\s*)?(?:day|daily)/i,         // 3 times a day
        /\b(once|twice|thrice)\s*(?:a\s*)?(?:day|daily)?/i, // twice daily
        /\b(od|bd|bid|tid|tds|qid)\b/i,                     // abbreviations
        /every\s+(\d+)\s*hours?/i,                           // every 8 hours
        /(\d+)\s*times?\s*(?:a\s*)?week/i,                   // 3 times a week
        /(\d+)\s*times?/i,                                   // fallback: "3 times" (no daily)
      ];
      for (const p of patterns) {
        const m = seg.match(p);
        if (m) return m[0].trim();
      }
      return 'as directed';
    };

    const extractDuration = (seg) => {
      // Match "for 7 days" OR plain "7 days" (no "for" required)
      const m = seg.match(/(?:for\s+)?(\d+)\s*(days?|weeks?|months?)/i);
      return m ? `${m[1]} ${m[2].toLowerCase()}` : 'as directed';
    };

    const extractInstructions = (seg) => {
      const patterns = [
        /\b(after|before|with)\s+(meals?|food|water|breakfast|lunch|dinner|sleep)\b/i,
        /\b(at\s+bedtime|at\s+night|in\s+the\s+morning|on\s+empty\s+stomach)\b/i,
      ];
      for (const p of patterns) {
        const m = seg.match(p);
        if (m) return m[0].trim();
      }
      return '';
    };

    // Step 4: Parse each segment into a medicine entry
    const medicines = [];
    const seenMeds = new Set();

    for (const seg of segments) {
      if (!seg || seg.length < 3) continue;

      // Extract medicine name: first non-skip word in this segment
      const words = seg.split(/\s+/);
      let name = '';
      for (const word of words) {
        const clean = word.replace(/[^a-zA-Z]/g, '');
        if (clean.length >= 3 && !skipWords.has(clean.toLowerCase()) && /^[A-Za-z]/.test(clean)) {
          // Make sure it's not purely a number or unit
          if (!/^\d/.test(clean) && !/^(?:mg|ml|g|mcg|iu)$/i.test(clean)) {
            name = word.replace(/[^a-zA-Z]/g, '');
            break;
          }
        }
      }
      if (!name || seenMeds.has(name.toLowerCase())) continue;
      seenMeds.add(name.toLowerCase());

      medicines.push({
        name,
        dosage: extractDosage(seg),
        frequency: extractFrequency(seg),
        duration: extractDuration(seg),
        instructions: extractInstructions(seg),
      });

      if (medicines.length >= 8) break;
    }

    return {
      diagnosis,
      medicines,
      notes: normalised,
      parsedBy: 'rule-based',
    };
  }

  async parsePrescription(transcription) {
    // Try Gemini first; fall back to rule-based parser on any error
    try {
      if (!this.apiKey || !this.genAI) {
        console.log('Gemini not configured, using rule-based parser');
        return this.parseWithRules(transcription);
      }

      const prompt = `
You are a medical AI assistant helping to structure prescription data. 
Parse the following prescription transcription and extract structured information.

Transcription: "${transcription}"

Extract and return ONLY a valid JSON object with the following structure:
{
  "diagnosis": "primary diagnosis or condition",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "dosage amount and form (e.g., 500mg tablet)",
      "frequency": "how often to take (e.g., twice daily, every 8 hours)",
      "duration": "how long to take (e.g., 7 days, 2 weeks)",
      "instructions": "additional instructions (e.g., take with food, before sleep)"
    }
  ],
  "notes": "any additional notes or warnings"
}

Rules:
- Extract all mentioned medicines
- If dosage/frequency/duration is not mentioned for a medicine, use reasonable defaults or "as directed"
- If diagnosis is not clear, use "General consultation" or the most relevant symptom
- Keep the response as a pure JSON object, no additional text
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsed = JSON.parse(text);
      return {
        diagnosis: parsed.diagnosis || 'General consultation',
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
        notes: parsed.notes || ''
      };
    } catch (error) {
      console.warn('Gemini parsing failed, falling back to rule-based parser:', error.message);
      return this.parseWithRules(transcription);
    }
  }

  /**
   * Transcribe audio to text using Gemini API
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} mimeType - Audio MIME type (e.g., 'audio/mpeg', 'audio/wav')
   * @param {string} language - Language code (optional)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioBuffer, mimeType = 'audio/mpeg', language = 'en') {
    return this.retryWithBackoff(async () => {
      try {
        if (!this.apiKey) {
          throw new Error('Gemini API key not configured');
        }

        // Convert buffer to base64
        const base64Audio = audioBuffer.toString('base64');

        // Use Gemini 1.5 Flash for multimodal audio transcription (higher free tier quota)
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Transcribe the following audio accurately. Return only the transcribed text without any additional commentary or formatting.`;

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          { text: prompt }
        ]);

        const response = await result.response;
        const text = response.text().trim();

        return {
          text: text,
          language: language,
          success: true
        };
      } catch (error) {
        console.error('Gemini audio transcription error:', error.message);
        throw error;
      }
    });
  }

  /**
   * Get health advice or answer medical queries
   * @param {string} query - User's health question
   * @returns {Promise<string>} Health advice
   */
  async getHealthAdvice(query) {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      const systemPrompt = `
You are a helpful medical information assistant. Provide general health information and advice.

IMPORTANT DISCLAIMERS:
- You do not diagnose medical conditions
- You do not prescribe medications
- You do not replace professional medical advice
- For serious symptoms or emergencies, always advise to consult a doctor immediately

Provide helpful, accurate, and easy-to-understand health information.
`;

      const fullPrompt = `${systemPrompt}\n\nUser Query: ${query}\n\nResponse:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini health advice error:', error.message);
      throw new Error('Failed to get health advice');
    }
  }
}

module.exports = new GeminiService();
