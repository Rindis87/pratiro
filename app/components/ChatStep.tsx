'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '../config/types';

interface ChatStepProps {
  messages: Message[];
  isTyping: boolean;
  getChatLabel: (role: 'user' | 'ai') => string;
  getTips: () => string;
  onSendMessage: (text: string) => void;
  onRunAnalysis: () => void;
}

// Icons
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h.01" />
    <path d="M12 10h.01" />
    <path d="M16 10h.01" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const AnalysisIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function ChatStep({
  messages,
  isTyping,
  getChatLabel,
  getTips,
  onSendMessage,
  onRunAnalysis,
}: ChatStepProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="flex flex-col h-[600px] bg-[#F9F8F6]">
      {/* Tips bar */}
      <div className="bg-[#2D4A3E]/5 px-4 py-2 text-xs text-[#2D4A3E] flex justify-center text-center border-b border-[#2D4A3E]/10">
        <span>
          <b>Pratiro-tips:</b> {getTips()}
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {filteredMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#2D4A3E] text-white'
                    : 'bg-white text-[#3D6B5A] border border-[#3D6B5A]/20'
                }`}
              >
                {msg.role === 'user' ? <UserIcon /> : <AIIcon />}
              </div>

              {/* Message bubble */}
              <div className="flex flex-col gap-1">
                <span
                  className={`text-xs font-medium ${
                    msg.role === 'user' ? 'text-right text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {getChatLabel(msg.role as 'user' | 'ai')}
                </span>
                <div
                  className={`p-4 shadow-sm text-[15px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2D4A3E] text-white rounded-l-2xl rounded-tr-2xl'
                      : 'bg-white text-[#2C2C2C] border border-gray-200 rounded-r-2xl rounded-bl-2xl'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start ml-14">
            <div className="bg-gray-200 px-4 py-2 rounded-full flex gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv svaret ditt..."
            className="flex-1 bg-[#F9F8F6] border border-gray-300 rounded-xl px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-[#2D4A3E]
                     text-[#2C2C2C] placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-[#2D4A3E] hover:bg-[#3D6B5A] text-white p-3 rounded-xl
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon />
          </button>
        </div>

        {/* Analysis button */}
        <button
          onClick={onRunAnalysis}
          className="w-full bg-[#2D4A3E]/5 hover:bg-[#2D4A3E]/10 text-[#2D4A3E]
                   font-medium py-3 rounded-xl flex items-center justify-center gap-2
                   transition-colors mt-2 border border-[#2D4A3E]/10"
        >
          <AnalysisIcon />
          Avslutt og få veiledning
        </button>
      </div>
    </div>
  );
}
