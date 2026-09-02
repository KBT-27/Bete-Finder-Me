import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Building2, 
  ArrowRight, 
  X, 
  RefreshCw, 
  SlidersHorizontal,
  HelpCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { BeteAIMessage, BeteAISearchContext } from '../../types';
import { safeFetchJson } from '../../lib/apiHelper';

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
  const { t, isAmharic } = useLanguage();
  const { updateFilter, setCurrentView } = useProperties();

  const [inputMessage, setInputMessage] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<BeteAIMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: isAmharic 
        ? `እንኳን ወደ **ቤቴ ፈላጊ (Bete Finder)** በደህና መጡ! እኔ **Bete AI** ነኝ — በኢትዮጵያ ውስጥ ስለ ሪል እስቴት፣ የቤት ኪራይ፣ ግዢ፣ የገበያ ዋጋ፣ የውል ስምምነት ህጎች፣ የባንክ ብድር እና ተመራጭ ሰፈሮች ማንኛውንም ጥያቄዎን ለመመለስ የተዘጋጀሁ የእርስዎ ብልህ ረዳት ነኝ።

ምን ማወቅ ይፈልጋሉ? ለምሳሌ፡
• በቦሌ፣ ካዛንቺስ ወይም ሲኤምሲ አማካይ የቤት ኪራይ ዋጋ ስንት ነው?
• በኢትዮጵያ ውስጥ የቤት ኪራይ ውል እና የቅድመ ክፍያ ደንቦች ምን ይመስላሉ?
• የባንክ ቤት መግዣ ብድር (Mortgage) እንዴት ይሰራል?
• የተወሰነ በጀትና የክፍል ብዛት ገልጸው ቤቶችን እንዲፈልግልዎ መጠየቅ ይችላሉ!`
        : `Welcome to **Bete Finder**! I am **Bete AI**, your dedicated 24/7 Ethiopian real estate advisor.

You can ask me anything about properties, rental prices, buying guides, tenancy laws, bank mortgages, and neighborhood advice across Ethiopia.

Examples of questions you can ask:
• What is the average rent in Bole, Kazanchis, or CMC?
• What are the legal tenancy agreements and deposit customs in Ethiopia?
• How do bank mortgages (CBE, Awash) work for buying a home?
• Search for properties by budget, bedrooms, and location!`,
      userResponsePart: isAmharic 
        ? 'እንኳን ወደ ቤቴ ፈላጊ በደህና መጡ! እኔ Bete AI ነኝ — ስለ ሪል እስቴት፣ የቤት ኪራይ፣ ግዢ፣ የገበያ ዋጋ፣ የውል ህጎች እና ተመራጭ ሰፈሮች ማንኛውንም ጥያቄዎን ለመመለስ የተዘጋጀሁ የእርስዎ ብልህ ረዳት ነኝ። ዛሬ ምን ማወቅ ይፈልጋሉ?'
        : 'Welcome to Bete Finder! I am Bete AI, your dedicated Ethiopian real estate advisor. You can ask me anything about properties, rental prices, buying guides, tenancy laws, bank mortgages, or search listings. How can I help you today?',
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

  // Suggested prompts for any Q&A question
  const suggestedPrompts = [
    isAmharic ? 'በአዲስ አበባ አማካይ የቤት ኪራይ ዋጋ ስንት ነው? (ቦሌ፣ ካዛንቺስ፣ ሲኤምሲ)' : 'Average rent in Addis Ababa (Bole vs CMC vs Kazanchis)?',
    isAmharic ? 'የቤት ኪራይ ውል ስምምነት እና የቅድመ ክፍያ ደንቦች ምን ይመስላሉ?' : 'Legal tenancy agreements & advance rent rules in Ethiopia?',
    isAmharic ? 'ቦሌ ውስጥ ባለ 2 መኝታ አፓርታማ ኪራይ በ 45,000 ብር' : '2 Bedroom Apartment for rent in Bole under 45k ETB',
    isAmharic ? 'የኢትዮጵያ ንግድ ባንክ እና አዋሽ የቤት መግዣ ብድር (Mortgage) እንዴት ይሰራል?' : 'How do CBE / Awash Bank mortgage loans work in Ethiopia?',
    isAmharic ? 'በአዲስ አበባ የውሃ ሮቶ ታንከር እና ጀነሬተር አስፈላጊነት ምንድን ነው?' : 'Water tank (Roto) & generator backup advice in Addis Ababa?',
    isAmharic ? 'በሲኤምሲ ወይም ሰሚት ኮንዶሚኒየም ኪራይ' : 'Condominium for rent in CMC or Summit'
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

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await safeFetchJson('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-5),
          language: isAmharic ? 'am' : 'en'
        })
      });

      if (res.success && res.data) {
        const fullText = res.data.text || '';
        const searchContext: BeteAISearchContext = res.data.searchContext || {};

        let userPart = fullText;
        let mapPart = '';

        if (fullText.includes('Search Context:') || fullText.includes('የፍለጋ መረጃ:')) {
          const splitTag = fullText.includes('Search Context:') ? 'Search Context:' : 'የፍለጋ መረጃ:';
          const parts = fullText.split(splitTag);
          userPart = parts[0].replace(/^User Response:\s*/i, '').replace(/^የተጠቃሚ ምላሽ:\s*/i, '').trim();
          mapPart = parts[1] ? parts[1].trim() : '';
        } else if (fullText.includes('Map & Search Context:') || fullText.includes('የካርታ እና የፍለጋ መረጃ:')) {
          const splitTag = fullText.includes('Map & Search Context:') ? 'Map & Search Context:' : 'የካርታ እና የፍለጋ መረጃ:';
          const parts = fullText.split(splitTag);
          userPart = parts[0].replace(/^User Response:\s*/i, '').replace(/^የተጠቃሚ ምላሽ:\s*/i, '').trim();
          mapPart = parts[1] ? parts[1].trim() : '';
        } else if (fullText.includes('User Response:')) {
          userPart = fullText.replace(/^User Response:\s*/i, '').trim();
        }

        const botMsg: BeteAIMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: fullText,
          userResponsePart: userPart,
          mapContextPart: mapPart,
          searchContext,
          timestamp: Date.now()
        };

        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(res.message || 'Failed to get response');
      }
    } catch (err: any) {
      const errorMsg: BeteAIMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: isAmharic 
          ? 'ይቅርታ፣ ጥያቄዎን ለማስተናገድ ትንሽ መዘግየት አጋጥሟል። እባክዎ እንደገና ይሞክሩ።'
          : 'Sorry, I encountered a temporary issue processing your request. Please try again.',
        userResponsePart: isAmharic 
          ? 'ይቅርታ፣ ጥያቄዎን ለማስተናገድ ትንሽ መዘግየት አጋጥሟል። እባክዎ እንደገና ይሞክሩ።'
          : 'Sorry, I encountered a temporary issue processing your request. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySearchContext = (ctx?: BeteAISearchContext) => {
    if (!ctx) return;

    if (ctx.city) updateFilter('city', ctx.city);
    if (ctx.subcity) updateFilter('subcity', ctx.subcity);
    if (ctx.propertyType && ctx.propertyType !== 'all') updateFilter('propertyType', ctx.propertyType as any);
    if (ctx.listingIntent && ctx.listingIntent !== 'all') updateFilter('listingType', ctx.listingIntent as any);
    if (ctx.maxPriceLimit) updateFilter('maxPrice', ctx.maxPriceLimit);
    if (ctx.bedroomCount && ctx.bedroomCount !== 'all') updateFilter('minBedrooms', ctx.bedroomCount as any);

    // Close modal and navigate to property catalog
    onClose();
    setCurrentView('properties');
  };

  if (!isOpen) return null;

  return (
    <div 
      id="bete-ai-assistant-modal" 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col h-[90vh] max-h-[750px] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-emerald-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/40">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">Bete AI Assistant</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-black text-emerald-300 uppercase">
                  {isAmharic ? 'የሪል እስቴት ረዳት' : 'Real Estate Advisor'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {isAmharic ? 'ስለ ኢትዮጵያ ቤቶች ማንኛውንም ጥያቄ ይጠይቁ (አማርኛ & English)' : 'Ask any Ethiopian real estate question (Amharic & English)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
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
                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-500/30' 
                    : 'bg-slate-800 text-white'
                }`}>
                  {isBot ? <Bot className="w-4 h-4 text-amber-300" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Content Bubble */}
                <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-xs ${
                  isBot 
                    ? 'bg-white text-slate-800 border border-slate-200/90' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {isBot ? (
                    <div className="space-y-3">
                      {/* Part 1: User Response */}
                      <div className="text-slate-800 whitespace-pre-wrap leading-relaxed font-medium">
                        {msg.userResponsePart || msg.text}
                      </div>

                      {/* Part 2: Search Context Breakdown if relevant */}
                      {msg.mapContextPart && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{isAmharic ? 'የፍለጋ መረጃ' : 'Search Details'}</span>
                          </div>
                          <div className="whitespace-pre-wrap font-mono text-[11px] text-slate-600">
                            {msg.mapContextPart}
                          </div>
                        </div>
                      )}

                      {/* Action Button: Apply to Properties Search */}
                      {msg.searchContext && (msg.searchContext.city || msg.searchContext.targetLocation || msg.searchContext.propertyType || msg.searchContext.maxPriceLimit) && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleApplySearchContext(msg.searchContext)}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-101 cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5 text-amber-300" />
                            <span>{isAmharic ? 'ተዛማጅ ቤቶችን ይመልከቱ' : 'View Matching Properties'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
                <Bot className="w-4 h-4 text-amber-300" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>{isAmharic ? 'Bete AI መልስ በማዘጋጀት ላይ...' : 'Bete AI is answering your question...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2.5 bg-slate-100/80 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-emerald-600" />
            <span>{isAmharic ? 'ፈጣን ጥያቄዎች:' : 'Suggestions:'}</span>
          </span>
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-[11px] font-medium text-slate-700 hover:text-emerald-700 transition-colors shrink-0 shadow-xs cursor-pointer"
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
            placeholder={isAmharic ? 'ስለ ቤት ዋጋ፣ ሰፈር፣ ህግ ወይም ፍለጋ ማንኛውንም ጥያቄ እዚህ ይጠይቁ...' : 'Ask any question about Ethiopian real estate, rents, laws, mortgages...'}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
