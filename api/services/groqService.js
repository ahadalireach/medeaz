const axios = require('axios');

const CHAT_SYSTEM_PROMPT = `You are a helpful medical AI assistant for Medeaz, a healthcare platform.
You provide general health guidance and information only.
You never diagnose conditions or replace a doctor's advice.
Always recommend consulting a doctor for serious concerns.
If you detect an emergency situation, immediately advise the user to call emergency services.
Keep responses concise, clear, and in the same language the user writes in (Urdu or English).
Format responses in Markdown.
Do not repeat canned intros across turns.
Adapt your wording and structure to the exact user question so each answer is specific and dynamic.`;

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.model = 'llama-3.3-70b-versatile';
  }

  async chat(message, conversationHistory = [], patientContext = null, preferredLanguage = null) {
    try {
      if (!this.apiKey) throw new Error('Groq API key not configured');

      let systemPrompt = CHAT_SYSTEM_PROMPT;
      
      if (patientContext) {
        systemPrompt += `\n\n[PATIENT MEDICAL HISTORY CONTEXT]\n${patientContext}\n\nUse this history to provide personalized health guidance, but still follow all safety rules.`;
      }
      if (preferredLanguage) {
        const normalized = String(preferredLanguage).toLowerCase();
        const languageHint = normalized.startsWith('ur') ? 'Urdu' : 'English';
        systemPrompt += `\n\n[OUTPUT LANGUAGE]\nReply in ${languageHint} unless the user explicitly asks for another language.`;
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: messages,
          temperature: 0.85,
          max_tokens: 1024,
          top_p: 1,
          frequency_penalty: 0.35,
          presence_penalty: 0.4,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq Chat Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to process AI request with Groq');
    }
  }

  async getHealthAdvice(query, patientContext = null, preferredLanguage = null) {
    return this.chat(query, [], patientContext, preferredLanguage);
  }

  async parsePrescription(transcription) {
    try {
      if (!this.apiKey) throw new Error('Groq API key not configured');

      const prompt = `
        Analyze the following medical prescription text and extract structured information.
        Text: "${transcription}"
        
        Extract:
        1. diagnosis: The main condition or reason for visit.
        2. medicines: A list of medicines mentioned. For each:
           - name: medicine name.
           - dosage: e.g., 500mg, 10ml.
           - frequency: e.g., twice a day, 1-0-1, daily.
           - duration: e.g., 5 days, 1 week.
           - instructions: e.g., after food, before sleep, if needed.
        3. notes: ANY additional advice or clinical notes.
        4. consultationFee: Any mentioned consultation fee as a number.
        5. medicineCost: Any mentioned cost for medicines as a number.

        Return strictly as JSON.
        Example:
        {
          "diagnosis": "Fever",
          "medicines": [{"name": "Panadol", "dosage": "500mg", "frequency": "twice a day", "duration": "3 days", "instructions": "after food"}],
          "notes": "Rest well",
          "consultationFee": 1000,
          "medicineCost": 500
        }
      `;

      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1, // Lower temperature for extraction
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const text = response.data.choices[0].message.content;
      return JSON.parse(text);
    } catch (error) {
      console.error('Groq Parse Error:', error.response?.data || error.message);
      // Fallback to basic rule-based parsing if needed, but for now we throw
      throw new Error('Failed to parse prescription with Groq');
    }
  }
}

const groqServiceInstance = new GroqService();
module.exports = groqServiceInstance;
