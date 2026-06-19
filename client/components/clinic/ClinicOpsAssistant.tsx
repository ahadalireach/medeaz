'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { toggleClinicOps } from '@/store/slices/uiSlice';
import { X, Mic, Send, Loader2, Bot, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';

export default function ClinicOpsAssistant() {
  const isOpen = useSelector((state: RootState) => state.ui.clinicOpsOpen);
  const dispatch = useDispatch();
  
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);

  // Initialize Speech Recognition
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

  // Initialize Socket.io
  useEffect(() => {
    if (!isOpen) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    socketRef.current = io(url, {
      auth: { token }
    });

    socketRef.current.on('appointmentStatusChanged', (data: any) => {
      setLiveEvents(prev => [`Appointment status updated: ${data.status}`, ...prev].slice(0, 5));
    });

    socketRef.current.on('newAppointment', () => {
      setLiveEvents(prev => ['New appointment scheduled', ...prev].slice(0, 5));
    });

    socketRef.current.on('staffUpdated', () => {
      setLiveEvents(prev => ['Staff schedule changed', ...prev].slice(0, 5));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, liveEvents]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Clean markdown hashes for speech
    const cleanText = text.replace(/#/g, '').replace(/\*/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim()) return;

    const userMessage = textToSend;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/ai/clinic-ops/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessage })
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
      <div className="flex items-center justify-between p-4 bg-[#00b495] text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h2 className="font-semibold text-lg tracking-wide">Medeaz AI</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
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
          <button onClick={() => dispatch(toggleClinicOps())} className="text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Events Ticker */}
      {liveEvents.length > 0 && (
        <div className="bg-[#e6f8f4] border-b border-[#00b495]/20 p-2 text-xs font-medium text-[#00b495]">
          <span className="animate-pulse mr-2">🔴</span> Live: {liveEvents[0]}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-10 text-gray-500">
            <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">Clinic Operations Analyst</p>
            <p className="text-sm mt-1 max-w-[250px] mx-auto">Ask me about revenue, doctor workload, or scheduling risks.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm ${
              msg.role === 'user' 
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
              <span className="text-sm text-gray-500">Analyzing clinic data...</span>
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
            className={`p-3 rounded-full transition-colors flex-shrink-0 ${
              isListening 
                ? 'bg-red-100 text-red-500 animate-pulse' 
                : 'bg-[#e6f8f4] text-[#00b495] hover:bg-[#b3e9df]'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about operations..."
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
