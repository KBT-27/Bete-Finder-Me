import React from 'react';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Send,
  Crown,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { ListingPlan } from '../../types';

export const PlansPricingView: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { 
    plans,
    telebirrSettings,
    setSelectedPlan, 
    setIsPaymentModalOpen, 
    setPendingPaymentPurpose 
  } = useProperties();
  const { user, updateUser, setIsAuthModalOpen } = useAuth();

  const handleSelectPlan = (plan: ListingPlan) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (plan.price === 0) {
      updateUser({ activePlan: 'basic' });
      return;
    }

    setSelectedPlan(plan);
    setPendingPaymentPurpose('plan');
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-extrabold mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Telebirr Fast Mobile Checkout ({telebirrSettings.accountNumber})</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            {t('pricingTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            {t('pricingSubtitle')}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map(plan => {
            const isCurrent = user?.activePlan === plan.id;
            const isVip = plan.id === 'vip';
            const isPremium = plan.id === 'premium';
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPremium
                    ? 'bg-slate-900 text-white shadow-2xl scale-102 border-2 border-emerald-500'
                    : isVip
                    ? 'bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 text-white shadow-2xl border-2 border-amber-400'
                    : 'bg-white text-slate-900 border border-slate-200 shadow-xs hover:shadow-lg'
                }`}
              >
                {/* Top Badge */}
                {isPremium && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-extrabold uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}

                {isVip && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md flex items-center gap-1">
                    <Crown className="w-3 h-3 text-slate-950" />
                    <span>VIP Verified Spotlight</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className={`text-xl font-extrabold ${isPremium || isVip ? 'text-white' : 'text-slate-900'}`}>
                      {isAmharic ? plan.nameAm : plan.name}
                    </h3>
                    {plan.multiplierText && (
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isVip
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : isPremium
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {isAmharic ? plan.multiplierTextAm : plan.multiplierText}
                      </span>
                    )}
                  </div>

                  {/* Highlights Bar */}
                  <div className="flex flex-wrap gap-1.5 my-3">
                    {plan.renewInterval && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isPremium || isVip ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {isAmharic ? plan.renewIntervalAm : plan.renewInterval}
                      </span>
                    )}
                    {plan.topBadgeCount && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        isVip ? 'bg-amber-400 text-slate-950' : 'bg-emerald-500 text-white'
                      }`}>
                        <Award className="w-3 h-3" />
                        {isAmharic ? plan.topBadgeCountAm : plan.topBadgeCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 my-4">
                    <span className={`text-3xl sm:text-4xl font-black ${
                      isVip ? 'text-amber-400' : isPremium ? 'text-emerald-400' : 'text-slate-900'
                    }`}>
                      {plan.price === 0 ? 'Free' : `${plan.price.toLocaleString()} ETB`}
                    </span>
                    {plan.price > 0 && (
                      <span className={`text-xs font-semibold ${isPremium || isVip ? 'text-slate-300' : 'text-slate-500'}`}>
                        / {plan.durationDays} days
                      </span>
                    )}
                  </div>

                  <p className={`text-xs mb-6 pb-6 border-b ${
                    isPremium || isVip ? 'text-slate-300 border-white/10' : 'text-slate-500 border-slate-100'
                  }`}>
                    {plan.price === 0 ? 'Basic tier to get started' : `Pay strictly via Telebirr (${telebirrSettings.accountNumber} - ${telebirrSettings.accountName})`}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {(isAmharic ? plan.featuresAm : plan.features).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isVip
                            ? 'bg-amber-400/20 text-amber-400'
                            : isPremium
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className={isPremium || isVip ? 'text-slate-200 font-medium' : 'text-slate-700 font-medium'}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                  {/* Plan Action CTA */}
                <div>
                  {isCurrent ? (
                    <div className="w-full py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-center text-sm flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{t('pricingActivePlan')}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-xs active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                        isVip
                          ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-400/25'
                          : isPremium
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                          : 'bg-slate-900 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {plan.price > 0 && <Send className="w-4 h-4" />}
                      <span>{plan.price === 0 ? t('pricingChoosePlan') : t('pricingPayTelebirr')}</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
