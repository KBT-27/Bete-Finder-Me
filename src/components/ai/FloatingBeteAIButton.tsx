import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { GeminiIcon } from '../common/GeminiIcon';

interface FloatingGeminiButtonProps {
  onClick: () => void;
  onOpenFeedback?: () => void;
}

export const FloatingGeminiButton: React.FC<FloatingGeminiButtonProps> = ({ 
  onClick, 
  onOpenFeedback 
}) => {
  const { isAmharic } = useLanguage();
  const { openFeedbackModal } = useProperties();
  const [position, setPosition] = useState<'right' | 'left'>('right');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gemini_button_side');
      if (saved === 'left' || saved === 'right') {
        setPosition(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const toggleSide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSide = position === 'right' ? 'left' : 'right';
    setPosition(nextSide);
    try {
      localStorage.setItem('gemini_button_side', nextSide);
    } catch {
      // Ignore
    }
  };

  const handleFeedbackClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenFeedback) {
      onOpenFeedback();
    } else {
      openFeedbackModal();
    }
  };

  return (
    <div 
      id="floating-actions-dock"
      className={`fixed bottom-6 ${position === 'right' ? 'right-6' : 'left-6'} z-40 flex items-center ${position === 'right' ? 'flex-row-reverse' : 'flex-row'} gap-2.5 transition-all duration-300`}
    >
      {/* Circle Bete Assistance (Gemini) Button */}
      <button
        id="floating-gemini-circle-btn"
        onClick={onClick}
        aria-label="Ask Bete Assistance"
        title={isAmharic ? 'Bete Assistance (በ Google Gemini የተደገፈ)' : 'Bete Assistance (Powered by Google Gemini)'}
        className="group relative w-14 h-14 rounded-full bg-slate-950 text-white shadow-2xl shadow-indigo-950/70 border border-slate-700/60 flex items-center justify-center hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer overflow-visible ring-2 ring-indigo-500/30 hover:ring-indigo-400"
      >
        {/* Colorful Gemini Aura Glow */}
        <span className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60 blur-md group-hover:opacity-90 group-hover:blur-lg transition-all pointer-events-none" />

        {/* Circular Inner Background */}
        <div className="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {/* Subtle gradient sheen inside */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-purple-900/30 to-pink-900/20 pointer-events-none" />
          
          {/* Official Google Gemini Sparkle Icon */}
          <GeminiIcon size={30} className="relative z-10 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-12 drop-shadow-md" />
        </div>

        {/* Online Status Pill on Circle */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-gradient-to-tr from-cyan-400 to-blue-500 border-2 border-slate-950"></span>
        </span>
      </button>

      {/* Floating Touch Feedback Button (Styled like the AI Assistance) */}
      <button
        id="floating-touch-feedback-btn"
        onClick={handleFeedbackClick}
        aria-label="Send Direct Feedback"
        title={isAmharic ? 'ለባለቤቱ አስተያየት / ጥቆማ ይላኩ (Direct Feedback)' : 'Touch to send Direct Feedback or Inquiries'}
        className="group relative w-12 h-12 rounded-full bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white shadow-xl shadow-indigo-950/60 border border-indigo-500/40 flex items-center justify-center hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer overflow-visible ring-2 ring-indigo-500/30 hover:ring-indigo-400"
      >
        {/* Subtle indigo-teal aura glow */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 opacity-50 blur-sm group-hover:opacity-85 transition-all pointer-events-none" />

        <div className="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 via-purple-900/30 to-teal-900/20 pointer-events-none" />
          <MessageSquare className="w-5 h-5 text-indigo-200 group-hover:text-white group-hover:scale-110 transition-all relative z-10 drop-shadow-sm" />
        </div>

        {/* Floating badge label on hover */}
        <span className="absolute -top-7 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-900/90 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-indigo-400/30 shadow-md">
          {isAmharic ? 'አስተያየት' : 'Feedback'}
        </span>
      </button>

      {/* Dock Location Switcher (Switch Dock Location Left/Right) */}
      <button
        id="gemini-switch-side-btn"
        onClick={toggleSide}
        title={position === 'right' 
          ? (isAmharic ? 'አካባቢን ቀይር (ወደ ግራ)' : 'Switch Dock Location (Move to Left)') 
          : (isAmharic ? 'አካባቢን ቀይር (ወደ ቀኝ)' : 'Switch Dock Location (Move to Right)')}
        className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer opacity-75 hover:opacity-100"
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// Backward-compatible alias
export const FloatingBeteAIButton = FloatingGeminiButton;

