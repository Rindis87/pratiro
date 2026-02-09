'use client';

import { useState, useRef, useEffect } from 'react';
import { Message } from '../config/types';

// Sjekk om vi er på mobil (under 768px)
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

interface ChatStepProps {
  messages: Message[];
  isTyping: boolean;
  getChatLabel: (role: 'user' | 'ai') => string;
  getTips: () => string;
  onSendMessage: (text: string) => Promise<{ success: boolean; error?: string }>;
  onRunAnalysis: () => void;
  maxMessageLength: number;
  maxMessages: number;
  messageCount: number;
  isAtMessageLimit: boolean;
  limitWarning: string | null;
  onClearWarning: () => void;
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
    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function ChatStep({
  messages,
  isTyping,
  getChatLabel,
  getTips,
  onSendMessage,
  onRunAnalysis,
  maxMessageLength,
  maxMessages,
  messageCount,
  isAtMessageLimit,
  limitWarning,
  onClearWarning,
}: ChatStepProps) {
  const [input, setInput] = useState('');
  const isInitialLoadRef = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(messages.length);

  const charsRemaining = maxMessageLength - input.length;
  const isOverLimit = input.length > maxMessageLength;

  // Scroll til toppen ved første lasting
  useEffect(() => {
    if (isInitialLoadRef.current) {
      window.scrollTo(0, 0);
      isInitialLoadRef.current = false;
    }
  }, []);

  // Auto-scroll til bunn KUN når nye meldinger kommer (ikke ved oppstart)
  useEffect(() => {
    const hasNewMessages = messages.length > prevMessageCountRef.current;

    if (hasNewMessages || isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCountRef.current = messages.length;
  }, [messages, isTyping]);

  // Fokuser input kun på desktop
  useEffect(() => {
    if (!isMobile() && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isOverLimit || isAtMessageLimit) return;
    onClearWarning();
    const text = input;
    setInput('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="flex flex-col flex-1 min-h-0 md:h-[600px] md:max-h-[700px] bg-[#FDFCFB]">
      {/* Tips bar */}
      <div className="bg-[rgba(42,64,54,0.05)] px-4 py-2 text-sm text-[#2A4036] flex justify-between items-center border-b border-[rgba(42,64,54,0.1)] gap-2">
        <span className="flex-1">
          <b>Tips:</b> {getTips()}
        </span>
        <span className={`shrink-0 ${messageCount >= maxMessages - 5 ? 'text-amber-600 font-medium' : 'text-[#7D786D]'}`}>
          {messageCount}/{maxMessages}
        </span>
      </div>

      {/* Warning banner */}
      {limitWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-700 flex justify-between items-center gap-2">
          <span className="flex-1">{limitWarning}</span>
          <button
            onClick={onClearWarning}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors font-medium text-lg"
            aria-label="Lukk advarsel"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 md:space-y-6">
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
                    ? 'bg-[#2A4036] text-white'
                    : 'bg-[#E7ECEA] text-[#2A4036] border border-black/[0.06]'
                }`}
              >
                {msg.role === 'user' ? <UserIcon /> : <AIIcon />}
              </div>

              {/* Message bubble */}
              <div className="flex flex-col gap-1">
                <span
                  className={`text-sm font-medium ${
                    msg.role === 'user' ? 'text-right text-[#7D786D]' : 'text-[#7D786D]'
                  }`}
                >
                  {getChatLabel(msg.role as 'user' | 'ai')}
                </span>
                <div
                  className={`p-3 md:p-4 shadow-sm text-[15px] md:text-[15px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#2A4036] text-white rounded-l-2xl rounded-tr-2xl'
                      : 'bg-white text-[#252825] border border-black/[0.06] rounded-r-2xl rounded-bl-2xl'
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
            <div className="bg-[#E7ECEA] px-4 py-2 rounded-full flex gap-1 animate-pulse border border-black/[0.04]">
              <span className="w-1.5 h-1.5 bg-[#7D786D] rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-[#7D786D] rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-[#7D786D] rounded-full"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 md:p-4 bg-[#F7F5F0] border-t border-black/[0.06] flex flex-col gap-2 md:gap-3">
        {/* Character counter */}
        <div className="flex justify-between items-center text-sm">
          <span className={`${isOverLimit ? 'text-red-600 font-medium' : charsRemaining <= 100 ? 'text-amber-600' : 'text-[#7D786D]'}`}>
            {isOverLimit ? `${Math.abs(charsRemaining)} tegn for mye` : `${charsRemaining} tegn igjen`}
          </span>
          {isAtMessageLimit && (
            <span className="text-amber-600 font-medium text-right">Maks nådd - avslutt for veiledning</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAtMessageLimit ? "Maks meldinger nådd" : "Skriv svaret ditt..."}
            disabled={isAtMessageLimit}
            maxLength={maxMessageLength + 50}
            className={`flex-1 bg-white border rounded-xl px-4 py-3 min-h-[48px] text-base
                     focus:outline-none focus:ring-2 focus:ring-[#2A4036]/30
                     text-[#252825] placeholder-[#7D786D]
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${isOverLimit ? 'border-red-500 focus:ring-red-500' : 'border-black/[0.08]'}`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isOverLimit || isAtMessageLimit}
            className="bg-[#2A4036] hover:bg-[#1F3029] text-white p-3 min-w-[48px] min-h-[48px] rounded-xl
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <SendIcon />
          </button>
        </div>

        {/* Analysis button */}
        <button
          onClick={onRunAnalysis}
          disabled={isTyping}
          className="w-full bg-[rgba(42,64,54,0.06)] hover:bg-[rgba(42,64,54,0.1)] text-[#2A4036]
                   font-medium py-3 min-h-[48px] rounded-xl flex items-center justify-center gap-2
                   transition-colors mt-1 border border-[rgba(42,64,54,0.15)]
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AnalysisIcon />
          Avslutt og få veiledning
        </button>
      </div>
    </div>
  );
}
