import React from 'react';
import { Sparkles, Bot, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface FloatingBeteAIButtonProps {
  onClick: () => void;
}

export const FloatingBeteAIButton: React.FC<FloatingBeteAIButtonProps> = ({ onClick }) => {
  const { isAmharic } = useLanguage();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        id="floating-bete-ai-btn"
        onClick={onClick}
        aria-label="Open Bete AI Assistant"
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-slate-900 text-white shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all duration-300"
      >
        {/* Glow Ring */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400 opacity-40 blur-sm group-hover:opacity-75 transition-opacity pointer-events-none" />

        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/10">
          <Bot className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        </div>

        <div className="relative text-left pr-1 hidden sm:block">
          <div className="text-[11px] font-black leading-tight text-white flex items-center gap-1">
            <span>Bete AI</span>
            <Sparkles className="w-3 h-3 text-amber-300" />
          </div>
          <div className="text-[9px] font-bold text-emerald-200">
            {isAmharic ? 'የሪል እስቴት ረዳት' : 'AI Assistant'}
          </div>
        </div>

        {/* Live Status Indicator Dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
      </button>
    </div>
  );
};
