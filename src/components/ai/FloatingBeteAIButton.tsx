import React, { useState, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { GeminiIcon } from '../common/GeminiIcon';

interface FloatingGeminiButtonProps {
  onClick: () => void;
}

export const FloatingGeminiButton: React.FC<FloatingGeminiButtonProps> = ({ onClick }) => {
  const { isAmharic } = useLanguage();
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

  return (
    <div 
      className={`fixed bottom-6 ${position === 'right' ? 'right-6' : 'left-6'} z-40 flex items-center ${position === 'right' ? 'flex-row-reverse' : 'flex-row'} gap-2 transition-all duration-300`}
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

      {/* Dock Position Switcher (Move Left/Right) */}
      <button
        id="gemini-switch-side-btn"
        onClick={toggleSide}
        title={position === 'right' ? (isAmharic ? 'ወደ ግራ አዙር' : 'Move circle to Left') : (isAmharic ? 'ወደ ቀኝ አዙር' : 'Move circle to Right')}
        className="w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-transform hover:scale-110 active:scale-90 cursor-pointer opacity-70 hover:opacity-100"
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// Backward-compatible alias
export const FloatingBeteAIButton = FloatingGeminiButton;

