import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  X, 
  RefreshCw, 
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { BeteAIMessage, BeteAISearchContext } from '../../types';
import { safeFetchJson } from '../../lib/apiHelper';
import { GeminiIcon } from '../common/GeminiIcon';

interface BeteAIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export const BeteAIAssistantModal: React.FC<BeteAIAssistantModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = ''
}) => {
  const { isAmharic } = useLanguage();
  const { updateFilter, setCurrentView } = useProperties();

  const [inputMessage, setInputMessage] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<BeteAIMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: isAmharic 
        ? `እንኳን ወደ **Bete Assistance** (በ **Google Gemini** የተደገፈ) በደህና መጡ! 

ስለ ቤቴ ፈላጊ (Bete Finder) አጠቃቀም፣ ስለ ኢትዮጵያ ሪል እስቴት፣ የቤት ኪራይና ግዢ፣ ወይም ማንኛውንም የድርና አጠቃላይ እውቀት ጥያቄዎን ይጠይቁኝ፤ በደስታ እመልስልዎታለሁ።`
        : `Welcome to **Bete Assistance** (powered by **Google Gemini**)! 

I can answer any questions about the Bete Finder platform, Ethiopian real estate & rentals, tenancy laws, bank mortgages, as well as any questions about the web and general knowledge. What would you like to know?`,
      userResponsePart: isAmharic 
        ? 'እንኳን ወደ Bete Assistance በደህና መጡ! ስለ ቤቴ ፈላጊ፣ ሪል እስቴት ወይም ማንኛውንም አጠቃላይ ጥያቄ ይጠይቁኝ።'
        : 'Welcome to Bete Assistance! Ask me anything about Bete Finder, real estate, or general knowledge.',
      timestamp: Date.now()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle initial prompt
  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInputMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Suggested prompts for Q&A questions
  const suggestedPrompts = [
    isAmharic ? 'Bete Finder እና Bete Assistance ምን ምን መስራት ይችላሉ?' : 'What can Bete Finder & Bete Assistance do?',
    isAmharic ? 'በአዲስ አበባ አማካይ የቤት ኪራይ ዋጋ ስንት ነው? (ቦሌ፣ ካዛንቺስ፣ ሲኤምሲ)' : 'Average rent in Addis Ababa (Bole vs CMC vs Kazanchis)?',
    isAmharic ? 'የቤት ኪራይ ውል ስምምነት እና የቅድመ ክፍያ ደንቦች ምን ይመስላሉ?' : 'Legal tenancy agreements & advance rent rules in Ethiopia?',
    isAmharic ? 'የኢትዮጵያ ንግድ ባንክ እና አዋሽ የቤት መግዣ ብድር እንዴት ይሰራል?' : 'How do CBE / Awash Bank mortgage loans work in Ethiopia?'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: BeteAIMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const res = await safeFetchJson<any>('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-5),
          language: isAmharic ? 'am' : 'en'
        })
      });

      if (res.success && res.data) {
        const fullText = (res.data.text || '').trim();
        const searchContext: BeteAISearchContext = res.data.searchContext || {};

        const botMsg: BeteAIMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: fullText,
          userResponsePart: fullText,
          searchContext,
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: BeteAIMessage = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: isAmharic
            ? 'ይቅርታ፣ ጥያቄዎን መመለስ አልቻልኩም። እባክዎ ጥያቄዎን በድጋሚ ይጠይቁ።'
            : 'Sorry, I could not process your question. Please try asking again.',
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: BeteAIMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: isAmharic
          ? 'ይቅርታ፣ ግንኙነቱ ተቋርጧል። እባክዎ ጥቂት ቆይተው እንደገና ይሞክሩ።'
          : 'Network error occurred. Please try again shortly.',
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      id="gemini-ai-assistant-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[85vh] max-h-[700px] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-lg ring-2 ring-indigo-500/30">
                <GeminiIcon size={22} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">Bete Assistance</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-black text-indigo-300 uppercase">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isAmharic ? 'የቤቴ ፈላጊ፣ ሪል እስቴት እና አጠቃላይ እውቀት ረዳት' : 'Bete Finder, Real Estate & General Knowledge Assistant'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
          {messages.map((msg) => {
            const isBot = msg.sender === 'assistant';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isBot 
                    ? 'bg-slate-950 border border-slate-700 text-white' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {isBot ? <GeminiIcon size={18} /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Content Bubble */}
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-xs leading-relaxed ${
                  isBot 
                    ? 'bg-white text-slate-800 border border-slate-200/90 whitespace-pre-wrap font-medium' 
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white whitespace-pre-wrap'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-white shrink-0">
                <GeminiIcon size={18} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{isAmharic ? 'Bete Assistance ምላሽ በማዘጋጀት ላይ...' : 'Bete Assistance is preparing your answer...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-100/90 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-indigo-600" />
            <span>{isAmharic ? 'ጥያቄዎች:' : 'Questions:'}</span>
          </span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 text-[11px] font-medium text-slate-700 hover:text-indigo-700 transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isAmharic ? 'ስለ ቤቴ ፈላጊ፣ ቤት ኪራይ፣ ግዢ ወይም ማንኛውንም ጥያቄ እዚህ ይጠይቁ...' : 'Ask anything about Bete Finder, real estate, or the web...'}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:hover:from-blue-600 disabled:hover:to-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 shrink-0 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};

export const GeminiAssistantModal = BeteAIAssistantModal;
