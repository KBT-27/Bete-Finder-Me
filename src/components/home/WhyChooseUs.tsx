import React from 'react';
import { ShieldCheck, PhoneCall, Zap, Headphones } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const WhyChooseUs: React.FC = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      id: 'verified',
      icon: <ShieldCheck className="w-7 h-7 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-200',
      title: t('whyVerifiedTitle'),
      desc: t('whyVerifiedDesc')
    },
    {
      id: 'payments',
      icon: <Zap className="w-7 h-7 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-200',
      title: t('whyPaymentTitle'),
      desc: t('whyPaymentDesc')
    },
    {
      id: 'direct',
      icon: <PhoneCall className="w-7 h-7 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-200',
      title: t('whyDirectTitle'),
      desc: t('whyDirectDesc')
    },
    {
      id: 'support',
      icon: <Headphones className="w-7 h-7 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-200',
      title: t('whySupportTitle'),
      desc: t('whySupportDesc')
    }
  ];

  return (
    <section className="py-14 lg:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('whyTitle')}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            {t('whySubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map(b => (
            <div
              key={b.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs hover:shadow-lg transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border ${b.bg}`}>
                {b.icon}
              </div>
              <h3 className="font-bold text-base text-slate-900 mb-2">
                {b.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {b.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
