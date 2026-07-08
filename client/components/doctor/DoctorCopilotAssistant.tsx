'use client';
 
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { toggleDoctorCopilot } from '@/store/slices/uiSlice';
import { X, Mic, Send, Loader2, Bot, Volume2, VolumeX, FileText, Activity, Users, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { useGetPatientsQuery } from '@/store/api/doctorApi'; // To get patients for Patient Focus Mode
import { useLocale, useTranslations } from 'next-intl';
 
export default function DoctorCopilotAssistant() {
  const locale = useLocale();
  const t = useTranslations();
  const isRtl = locale === 'ur';
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
      recognition.lang = document.documentElement.lang === 'ur' ? 'ur-PK' : 'en-US';
 
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
 
  // Update recognition language if the app language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = document.documentElement.lang === 'ur' ? 'ur-PK' : 'en-US';
    }
  }, [t]);
 
  // Cancel speech when closed or unmounted
  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);
 
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
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
    utterance.lang = document.documentElement.lang === 'ur' ? 'ur-PK' : 'en-US';
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
    <div 
      className={`fixed inset-y-0 ${isRtl ? 'left-0 border-r' : 'right-0 border-l'} w-full sm:w-[400px] bg-white border-gray-200 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 print:hidden`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#00b495] text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-white" />
          <h2 className="text-white font-semibold text-lg tracking-wide">{t('assistant.doctorTitle')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleVoice}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${voiceEnabled ? 'bg-white/20 text-white' : 'bg-black/10 text-white/70'}`}
            title={t('assistant.voiceTitle')}
          >
            {voiceEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t('assistant.voiceOn')}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t('assistant.voiceOff')}</span>
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
        <label className="block text-xs font-bold text-[#00b495] mb-1">{t('assistant.patientFocus')}</label>
        <select
          className="w-full text-sm p-2 rounded-md border border-gray-200 focus:outline-none focus:border-[#00b495]"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
        >
          <option value="">{t('assistant.globalContext')}</option>
          {patientsData?.data?.patients?.map((p: any) => (
            <option key={p._id} value={p._id}>{p.name} ({p.phone || t('assistant.noPhone')})</option>
          ))}
        </select>
      </div>
 
      {/* Action Chips */}
      <div className="p-3 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50/50">
        <button onClick={() => handleSend(t('assistant.queries.summarizePatient'), 'SUMMARIZE_PATIENT')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <Users className="w-3 h-3" /> {t('assistant.chips.summarizePatient')}
        </button>
        <button onClick={() => handleSend(t('assistant.queries.draftPrescription'), 'DRAFT_PRESCRIPTION')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <FileText className="w-3 h-3" /> {t('assistant.chips.draftPrescription')}
        </button>
        <button onClick={() => handleSend(t('assistant.queries.todaysLoad'), 'TODAYS_LOAD')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <Activity className="w-3 h-3" /> {t('assistant.chips.todaysLoad')}
        </button>
        <button onClick={() => handleSend(t('assistant.queries.followUpAlerts'), 'FOLLOW_UP_ALERTS')} className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-[#00b495] hover:text-white hover:border-[#00b495] transition">
          <AlertCircle className="w-3 h-3" /> {t('assistant.chips.followUpAlerts')}
        </button>
      </div>
 
      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-10 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-[#00b495]">{t('assistant.doctorCopilot')}</p>
            <p className="text-sm mt-1 max-w-[280px] mx-auto">{t('assistant.doctorDesc')}</p>
          </div>
        )}
 
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${msg.role === 'user'
              ? 'bg-[#00b495] text-white rounded-br-none'
              : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-none prose prose-sm max-w-none prose-h3:text-[#00b495] prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1'
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
              <span className="text-sm text-gray-500">{t('assistant.copilotThinking')}</span>
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
            title={t('assistant.dictateTitle')}
          >
            <Mic className="w-5 h-5" />
          </button>
 
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t('assistant.askDoctor')}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:border-[#00b495] focus:ring-1 focus:ring-[#00b495] transition-all"
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
