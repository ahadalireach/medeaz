'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatWithAIMutation } from '@/store/api/aiApi';
import { useTranslations } from 'next-intl';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function AIAssistantPage() {
  const t = useTranslations();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'disclaimer', role: 'model', content: t('ai.disclaimer') },
  ]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [chatWithAI, { isLoading }] = useChatWithAIMutation();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const conversationHistory = messages
    .filter(m => m.id !== 'disclaimer')
    .map(m => ({ role: m.role, content: m.content }));

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const result = await chatWithAI({ message: userMessage.content, conversationHistory }).unwrap();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: result.data.reply,
      }]);
    } catch {
      toast.error(t('ai.processingFailed'));
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold font-heading tracking-tight text-text-primary">AI Assistant</h1>
          <p className="text-sm font-body text-text-secondary mt-1">{t('ai.disclaimer').slice(0, 50)}...</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-black/5 bg-white">
        <div 
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3"
        >
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Bot size={14} className="text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-body
                ${msg.role === 'user'
                  ? 'rounded-br-sm bg-primary text-white'
                  : msg.id === 'disclaimer'
                    ? 'rounded-bl-sm bg-primary/10 text-primary border border-primary/20'
                    : 'rounded-bl-sm bg-background  border border-black/5  text-text-primary '
                }`}
                dir="auto"
              >
                {msg.role === 'model' ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed prose-headings:font-heading prose-headings:mt-2 prose-headings:mb-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:font-semibold">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mr-2">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#F4F3EE] border border-black/5">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-black/5 p-4 flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ai.askQuestion')}
            rows={1}
            dir="auto"
            className="flex-1 resize-none px-3.5 py-2.5 rounded-lg text-sm font-body bg-[#F4F3EE] border border-black/8 placeholder:text-text-muted :text-[#78716C] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent max-h-32 overflow-y-auto font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-primary text-black hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
