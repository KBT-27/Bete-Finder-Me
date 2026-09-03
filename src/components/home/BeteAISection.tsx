import React, { useState } from 'react';
import { 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare,
  HelpCircle,
  TrendingUp,
  FileText,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { GeminiIcon } from '../common/GeminiIcon';

interface BeteAISectionProps {
  onOpenAIChat: (initialQuery?: string) => void;
}

export const BeteAISection: React.FC<BeteAISectionProps> = ({ onOpenAIChat }) => {
  const { isAmharic } = useLanguage();
  const [quickQuery, setQuickQuery] = useState('');

  const sampleQuestions = [
    {
      icon: HelpCircle,
      en: 'What can Bete Finder & Bete Assistance do?',
      am: 'ቤቴ ፈላጊ እና Bete Assistance ምን ምን አገልግሎት ይሰጣሉ?',
      query: 'What can Bete Finder and Bete Assistance do to help me find or post a home in Ethiopia?'
    },
    {
      icon: TrendingUp,
      en: 'Average rent in Bole, Kazanchis & CMC?',
      am: 'በቦሌ፣ ካዛንቺስና ሲኤምሲ አማካይ የቤት ኪራይ ዋጋ ስንት ነው?',
      query: 'What is the average rent in Addis Ababa for Bole, Kazanchis, and CMC?'
    },
    {
      icon: FileText,
      en: 'Legal tenancy agreements & advance rent rules?',
      am: 'የቤት ኪራይ ውል ስምምነትና የቅድመ ክፍያ ደንቦች ምን ይመስላሉ?',
      query: 'What are the legal rules and customs for advance rent and contracts in Ethiopia?'
    },
    {
      icon: Building2,
      en: 'Bank mortgage schemes in Ethiopia (CBE, Awash)?',
      am: 'የኢትዮጵያ ንግድ ባንክ እና አዋሽ የቤት ብድር (Mortgage) እንዴት ይሰራል?',
      query: 'How do mortgage loans work for buying a house in Ethiopia with CBE and Awash Bank?'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickQuery.trim()) {
      onOpenAIChat(quickQuery);
      setQuickQuery('');
    } else {
      onOpenAIChat();
    }
  };

  return (
    <section id="gemini-ai-home-section" className="py-14 sm:py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden">
      {/* Decorative Subtle Grid & Gemini Sheen */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text & Value Prop */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider">
              <GeminiIcon size={16} />
              <span>{isAmharic ? 'በ Google Gemini የተደገፈ' : 'Powered by Google Gemini'}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {isAmharic ? (
                <>
                  ስለ ቤቴ ፈላጊና ሪል እስቴት <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Bete Assistance</span>ን ይጠይቁ
                </>
              ) : (
                <>
                  Ask <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Bete Assistance</span> Any Question
                </>
              )}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {isAmharic 
                ? 'ስለ ቤቴ ፈላጊ (Bete Finder) አጠቃቀም፣ በቦሌ፣ ካዛንቺስ፣ ሲኤምሲ፣ ሳርቤት ስላሉ የቤት ዋጋዎች፣ ውል ስምምነት ህጎች፣ የደላላ ኮሚሽን፣ የባንክ ብድር ወይም ማንኛውም የድርና አጠቃላይ እውቀት ጥያቄ Bete Assistance (በ Gemini የተደገፈ) በቀጥታ ይመልስልዎታል።' 
                : 'Get direct answers about Bete Finder features, Ethiopian rental rates, purchase prices, tenancy contracts, bank mortgages, or any topic on the web from Bete Assistance, powered by Gemini.'}
            </p>

            {/* AI Capabilities list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{isAmharic ? 'የቤቴ ፈላጊ መመሪያ እና ድጋፍ' : 'Bete Finder Guide & Support'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{isAmharic ? 'የሁለት ቋንቋ ድጋፍ (አማርኛ / English)' : 'Bilingual (Amharic & English)'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{isAmharic ? 'የአካባቢና የሰፈር ዋጋ ንፅፅር' : 'Neighborhood & Rent Comparisons'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{isAmharic ? 'የድር እና አጠቃላይ እውቀት ምላሾች' : 'Web & Real Estate Knowledge'}</span>
              </div>
            </div>
          </div>

          {/* Right Interactive AI Search Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-indigo-950/60">
              
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-700/60 flex items-center justify-center shadow-lg ring-2 ring-indigo-500/30">
                    <GeminiIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                      <span>Bete Assistance</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-[9px] font-bold text-indigo-300">
                        Gemini
                      </span>
                    </h3>
                    <p className="text-[11px] text-cyan-400 font-medium">
                      {isAmharic ? 'በመስመር ላይ ይገኛል (Online)' : 'Ready to Answer Questions'}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 border border-white/10">
                  {isAmharic ? 'አማርኛ / English' : 'Bilingual AI'}
                </span>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={quickQuery}
                    onChange={(e) => setQuickQuery(e.target.value)}
                    placeholder={
                      isAmharic 
                        ? 'ስለ ቤቴ ፈላጊ፣ ቤት ኪራይ፣ ግዢ ወይም ማንኛውንም ጥያቄ ይጠይቁ...' 
                        : 'Ask anything about Bete Finder, real estate, or the web...'
                    }
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-slate-950 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-sm text-white placeholder:text-slate-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Popular Questions Grid */}
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isAmharic ? 'ተደጋጋሚ ጥያቄዎች (ጠቅ ያድርጉ):' : 'Popular Questions:'}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sampleQuestions.map((p, idx) => {
                      const IconComp = p.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onOpenAIChat(p.query)}
                          className="p-3 rounded-xl bg-slate-950/70 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group flex items-start justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <IconComp className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-slate-300 group-hover:text-indigo-300 font-medium leading-snug">
                              {isAmharic ? p.am : p.en}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Chat Launcher */}
                <button
                  type="button"
                  onClick={() => onOpenAIChat()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all hover:scale-101 cursor-pointer"
                >
                  <GeminiIcon size={18} />
                  <span>{isAmharic ? 'ከ Bete Assistance ጋር ይወያዩ' : 'Chat with Bete Assistance'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export const GeminiAISection = BeteAISection;
