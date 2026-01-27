'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef(messages.length);

  const charsRemaining = maxMessageLength - input.length;
  const isOverLimit = input.length > maxMessageLength;

  // Scroll til toppen ved første lasting
  useEffect(() => {
    if (isInitialLoad) {
      window.scrollTo(0, 0);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad]);

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
    <div className="flex flex-col h-[100dvh] md:h-[600px] md:max-h-[700px] bg-slate-900">
      {/* Tips bar */}
      <div className="bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300 flex justify-between items-center border-b border-emerald-500/20 gap-2">
        <span className="flex-1">
          <b>Tips:</b> {getTips()}
        </span>
        <span className={`shrink-0 ${messageCount >= maxMessages - 5 ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
          {messageCount}/{maxMessages}
        </span>
      </div>

      {/* Warning banner */}
      {limitWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-sm text-amber-300 flex justify-between items-center gap-2">
          <span className="flex-1">{limitWarning}</span>
          <button
            onClick={onClearWarning}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors font-medium text-lg"
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
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-emerald-400 border border-white/10'
                }`}
              >
                {msg.role === 'user' ? <UserIcon /> : <AIIcon />}
              </div>

              {/* Message bubble */}
              <div className="flex flex-col gap-1">
                <span
                  className={`text-sm font-medium ${
                    msg.role === 'user' ? 'text-right text-slate-400' : 'text-slate-400'
                  }`}
                >
                  {getChatLabel(msg.role as 'user' | 'ai')}
                </span>
                <div
                  className={`p-3 md:p-4 shadow-sm text-[15px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-l-2xl rounded-tr-2xl'
                      : 'bg-slate-800 text-slate-100 border border-white/10 rounded-r-2xl rounded-bl-2xl'
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
            <div className="bg-slate-800 px-4 py-2 rounded-full flex gap-1 animate-pulse border border-white/10">
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 md:p-4 bg-slate-800/50 border-t border-white/10 flex flex-col gap-2 md:gap-3">
        {/* Character counter */}
        <div className="flex justify-between items-center text-sm">
          <span className={`${isOverLimit ? 'text-red-400 font-medium' : charsRemaining <= 100 ? 'text-amber-400' : 'text-slate-500'}`}>
            {isOverLimit ? `${Math.abs(charsRemaining)} tegn for mye` : `${charsRemaining} tegn igjen`}
          </span>
          {isAtMessageLimit && (
            <span className="text-amber-400 font-medium text-right">Maks nådd - avslutt for veiledning</span>
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
            className={`flex-1 bg-slate-900 border rounded-xl px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-emerald-500
                     text-white placeholder-slate-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${isOverLimit ? 'border-red-500 focus:ring-red-500' : 'border-white/10'}`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isOverLimit || isAtMessageLimit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon />
          </button>
        </div>

        {/* Analysis button */}
        <button
          onClick={onRunAnalysis}
          className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400
                   font-medium py-3 rounded-xl flex items-center justify-center gap-2
                   transition-colors mt-2 border border-emerald-500/30"
        >
          <AnalysisIcon />
          Avslutt og få veiledning
        </button>
      </div>
    </div>
  );
}
