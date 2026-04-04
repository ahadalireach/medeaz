const fs = require('fs');
const geminiService = require('./geminiService');

class WhisperService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
  }

  /**
   * Transcribe audio to text using Gemini API
   * @param {string} audioFilePath - Path to audio file
   * @param {string} language - Language code (en, ur, etc.)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioFilePath, language = 'en') {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Read audio file as buffer
      const audioBuffer = fs.readFileSync(audioFilePath);
      
      // Determine MIME type from file extension
      const mimeType = this.getMimeType(audioFilePath);

      // Use Gemini service for transcription
      const result = await geminiService.transcribeAudio(audioBuffer, mimeType, language);

      return {
        text: result.text,
        language: language,
        success: true
      };
    } catch (error) {
      console.error('Gemini transcription error:', error.message);
      throw new Error(
        error.message || 
        'Failed to transcribe audio'
      );
    }
  }

  /**
   * Get MIME type from file path
   * @param {string} filePath - File path
   * @returns {string} MIME type
   */
  getMimeType(filePath) {
    const ext = filePath.toLowerCase().split('.').pop();
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      'flac': 'audio/flac'
    };
    return mimeTypes[ext] || 'audio/mpeg';
  }

  /**
   * Transcribe audio buffer (instead of file path)
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {string} filename - Original filename
   * @param {string} language - Language code
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudioBuffer(audioBuffer, filename, language = 'en') {
    try {
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured');
      }

      // Determine MIME type from filename
      const mimeType = this.getMimeType(filename);

      // Use Gemini service for transcription
      const result = await geminiService.transcribeAudio(audioBuffer, mimeType, language);

      return {
        text: result.text,
        language: language,
        success: true
      };
    } catch (error) {
      console.error('Gemini transcription error:', error.message);
      throw new Error(
        error.message || 
        'Failed to transcribe audio'
      );
    }
  }
}

module.exports = new WhisperService();
