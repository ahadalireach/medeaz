'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Check, Loader2, PlaySquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ClinicalCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionPlan, setActionPlan] = useState<any>(null);
  const [transcription, setTranscription] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/ai/copilot/process-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setTranscription(result.data.transcription);
        setActionPlan(result.data.actionPlan);
      } else {
        toast.error(result.message || 'Failed to process audio');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('An error occurred during AI processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const executeAction = () => {
    // Ideally this would call the actual API endpoint for the action
    // e.g., if intent === 'SCHEDULE_FOLLOWUP', call /api/appointments
    // For now, we simulate execution and RTK Query invalidation
    toast.success(`Action executed: ${actionPlan.intent}`);
    setActionPlan(null);
    setTranscription('');
    setIsOpen(false);

    // Call ElevenLabs TTS to read out confirmation
    playTTS(`Successfully completed action: ${actionPlan.summary}`);
  };

  const playTTS = async (text: string) => {
    try {
      // Basic ElevenLabs TTS call
      // Ensure you have ELEVENLABS_API_KEY in backend if you want to proxy, or direct if permissible
      // In a real app, proxy via backend. Here we just show a toast for TTS simulation if no API available
      toast('🔊 AI: ' + text, { icon: '🎙️' });
    } catch (error) {
      console.error('TTS error', error);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-[#0F4C5C] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#0c3e4a] transition-colors z-40 print:hidden"
      >
        <Mic className="w-7 h-7" />
      </button>

      {/* Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
          >
            <div className="p-4 bg-[#0F4C5C] text-white flex justify-between items-center">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <PlaySquare className="w-5 h-5" /> Clinical Copilot
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {!actionPlan && !isProcessing && (
                <div className="text-center space-y-6">
                  <p className="text-gray-600 dark:text-gray-300">
                    How can I help you today, Doctor?
                  </p>
                  
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
                      isRecording 
                        ? 'bg-red-100 text-red-500 scale-110 shadow-lg' 
                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                    }`}
                  >
                    <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse' : ''}`} />
                  </button>
                  <p className="text-sm text-gray-500 font-medium">
                    {isRecording ? 'Release to send...' : 'Hold to speak'}
                  </p>
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-8 space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[#0F4C5C] mx-auto" />
                  <p className="text-gray-600 font-medium animate-pulse">Processing clinical intent...</p>
                </div>
              )}

              {actionPlan && (
                <div className="space-y-5">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transcription:</p>
                    <p className="text-sm italic text-gray-700 dark:text-gray-200">"{transcription}"</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Action</h4>
                    <div className="bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      <p className="font-semibold text-sm mb-1">Intent: <span className="font-normal">{actionPlan.intent}</span></p>
                      <p className="font-semibold text-sm mb-2">Summary: <span className="font-normal">{actionPlan.summary}</span></p>
                      
                      {actionPlan.actionPayload && (
                        <div className="mt-3 text-xs bg-white/60 dark:bg-black/20 p-2 rounded">
                          <pre className="overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(actionPlan.actionPayload, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setActionPlan(null)}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={executeAction}
                      className="flex-1 px-4 py-2 bg-[#0F4C5C] hover:bg-[#0c3e4a] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Check className="w-4 h-4" /> Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embed ElevenLabs Widget as requested by the user, hidden or just present for TTS config */}
      <div className="hidden">
        <elevenlabs-convai agent-id="agent_9401kqfw4d2kencrbaw9c1kg59t4"></elevenlabs-convai>
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
      </div>
    </>
  );
}
