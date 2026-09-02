import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
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

interface BeteAISectionProps {
  onOpenAIChat: (initialQuery?: string) => void;
}

export const BeteAISection: React.FC<BeteAISectionProps> = ({ onOpenAIChat }) => {
  const { isAmharic } = useLanguage();
  const [quickQuery, setQuickQuery] = useState('');

  const sampleQuestions = [
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
    },
    {
      icon: ShieldCheck,
      en: 'Backup water (Roto) & generator tips for renters?',
      am: 'በአዲስ አበባ የውሃ ሮቶ ታንከር እና ጀነሬተር አስፈላጊነት?',
      query: 'What should I know about backup water tanks and generators when renting in Addis Ababa?'
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
    <section id="bete-ai-home-section" className="py-14 sm:py-20 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Decorative Subtle Grid */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Text & Value Prop */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{isAmharic ? 'የኢትዮጵያ ሪል እስቴት AI ረዳት' : 'Ethiopia Real Estate AI Advisor'}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {isAmharic ? (
                <>
                  ስለ ቤት ኪራይ፣ ግዢ እና የገበያ ዋጋ <span className="text-emerald-400">Bete AI</span>ን ይጠይቁ
                </>
              ) : (
                <>
                  Ask <span className="text-emerald-400">Bete AI</span> Any Ethiopian Real Estate Question
                </>
              )}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {isAmharic 
                ? 'በቦሌ፣ ካዛንቺስ፣ ሲኤምሲ፣ ሳርቤት እና በክልል ከተሞች ስላሉ የቤት ዋጋዎች፣ የውል ስምምነት ህጎች፣ የደላላ ኮሚሽን፣ የባንክ ብድር ወይም የፍለጋ መመሪያዎች በማንኛውም ሰዓት በአማርኛ እና በእንግሊዝኛ ይጠይቁ።' 
                : 'Your 24/7 intelligent real estate advisor in Ethiopia. Ask questions in Amharic or English about neighborhood prices, tenancy contracts, broker commission standards, bank mortgages, and amenities.'}
            </p>

            {/* AI Capabilities list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAmharic ? 'የሁለት ቋንቋ ምላሽ (አማርኛ / English)' : 'Bilingual Support (Amharic & English)'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAmharic ? 'የአካባቢና የሰፈር ዋጋ ንፅፅር' : 'Neighborhood & Rent Comparisons'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAmharic ? 'የውል ስምምነትና የህግ መረጃ' : 'Tenancy Legal Advice & Customs'}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isAmharic ? 'የባንክ ብድር እና የፍጆታ ምክሮች' : 'Mortgage & Utility Guidance'}</span>
              </div>
            </div>
          </div>

          {/* Right Interactive AI Search Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-emerald-950/50">
              
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <Bot className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">Bete AI Assistant</h3>
                    <p className="text-[11px] text-emerald-400 font-medium">
                      {isAmharic ? 'በመስመር ላይ ይገኛል (Online)' : 'Active • Ready to Answer'}
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
                        ? 'ለምሳሌ፡ ቦሌ ውስጥ አማካይ የቤት ኪራይ ዋጋ ስንት ነው?...' 
                        : 'e.g. What is the average rent in Bole or CMC?...'
                    }
                    className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 text-sm text-white placeholder:text-slate-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all hover:scale-105 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Popular Questions Grid */}
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isAmharic ? 'ተደጋጋሚ ጥያቄዎች (ጠቅ ያድርጉ):' : 'Popular Real Estate Questions:'}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sampleQuestions.map((p, idx) => {
                      const IconComp = p.icon;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onOpenAIChat(p.query)}
                          className="p-3 rounded-xl bg-slate-950/70 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group flex items-start justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <IconComp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-slate-300 group-hover:text-emerald-300 font-medium leading-snug">
                              {isAmharic ? p.am : p.en}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Full Chat Launcher */}
                <button
                  type="button"
                  onClick={() => onOpenAIChat()}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all hover:scale-101 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-amber-300" />
                  <span>{isAmharic ? 'ከBete AI ጋር ውይይት ይጀምሩ' : 'Start Conversation with Bete AI'}</span>
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
