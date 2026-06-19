'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { toggleDoctorCopilot } from '@/store/slices/uiSlice';
import { X, Mic, Send, Loader2, Bot, Volume2, VolumeX, FileText, Activity, Users, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useGetPatientsQuery } from '@/store/api/doctorApi'; // To get patients for Patient Focus Mode

export default function DoctorCopilotAssistant() {
  const isOpen = useSelector((state: RootState) => state.ui.doctorCopilotOpen);
  const dispatch = useDispatch();

  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Fetch patients for Patient Focus Mode
  const { data: patientsData } = useGetPatientsQuery(undefined, { skip: !isOpen });

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast.error('Voice recognition failed');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Cancel any ongoing speech before speaking
    const cleanText = text.replace(/#/g, '').replace(/\*/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const toggleVoice = () => {
    if (voiceEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const handleSend = async (textToSend: string = input, focusAction?: string) => {
    const message = textToSend.trim() || focusAction;
    if (!message) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/ai/doctor-copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          patientId: selectedPatientId || undefined,
          action: focusAction
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
        speak(data.data.reply);
      } else {
        toast.error(data.message || 'Error communicating with AI');
      }
    } catch (error) {
      console.error(error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 print:hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#0F4C5C] text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-white" />
          <h2 className="text-white font-semibold text-lg tracking-wide">Doctor Assistant</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${voiceEnabled ? 'bg-white/20 text-white' : 'bg-black/10 text-white/70'}`}
            title="Toggle Assistant Voice Reply"
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Voice ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>Voice OFF</span>
              </>
            )}
          </button>
          <button onClick={() => dispatch(toggleDoctorCopilot())} className="text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Patient Focus Mode Select */}
      <div className="bg-[#e6f8f4] border-b border-[#00b495]/20 p-3">
        <label className="block text-xs font-bold text-[#0F4C5C] mb-1">Patient Focus Mode</label>
        <select
          className="w-full text-sm p-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#0F4C5C]"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">-- Global Context (No Patient Selected) --</option>
          {patientsData?.data?.patients?.map((p: any) => (
            <option key={p._id} value={p._id}>{p.name} ({p.phone || 'No phone'})</option>
          ))}
        </select>
      </div>

      {/* Action Chips */}
      <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50/50">
        <button onClick={() => handleSend('Please summarize the selected patient history.', 'SUMMARIZE_PATIENT')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <Users className="w-3 h-3" /> Summarize Patient
        </button>
        <button onClick={() => handleSend('Draft a prescription based on the voice dictation or last visit.', 'DRAFT_PRESCRIPTION')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <FileText className="w-3 h-3" /> Draft Prescription
        </button>
        <button onClick={() => handleSend('What is my patient load today?', 'TODAYS_LOAD')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <Activity className="w-3 h-3" /> Today's Load
        </button>
        <button onClick={() => handleSend('Show me missed or upcoming follow-up alerts.', 'FOLLOW_UP_ALERTS')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <AlertCircle className="w-3 h-3" /> Follow-up Alerts
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-10 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-[#0F4C5C]">Doctor Copilot</p>
            <p className="text-sm mt-1 max-w-[280px] mx-auto">Select a patient above to load their context, then use the voice mic to dictate notes or prescriptions.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.role === 'user'
              ? 'bg-[#0F4C5C] text-white rounded-br-none'
              : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none prose prose-sm max-w-none prose-h3:text-[#0F4C5C] prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1'
              }`}>
              {msg.role === 'user' ? (
                msg.content
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 rounded-bl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#00b495]" />
              <span className="text-sm text-gray-500">Copilot is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListen}
            className={`p-3 rounded-full transition-colors flex-shrink-0 ${isListening
              ? 'bg-red-100 text-red-500 animate-pulse'
              : 'bg-[#e6f8f4] text-[#00b495] hover:bg-[#b3e9df]'
              }`}
            title="Dictate Prescription or Message"
          >
            <Mic className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type or dictate..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C] transition-all"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-3 bg-[#00b495] text-white rounded-full hover:bg-[#19bca0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
