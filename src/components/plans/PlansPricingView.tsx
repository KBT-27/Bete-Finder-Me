import React, { useState } from 'react';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Send,
  Crown,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  Building2,
  UserX,
  ArrowRight,
  PlusCircle,
  X,
  Info
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
    setPendingPaymentPurpose,
    userPostedProperties,
    setCurrentView
  } = useProperties();
  const { user, updateUser, setIsAuthModalOpen } = useAuth();

  // Dialog states for restriction feedback
  const [showTenantBlockedModal, setShowTenantBlockedModal] = useState(false);
  const [showNoPropertyModal, setShowNoPropertyModal] = useState(false);

  const isTenant = user?.role === 'tenant';
  const hasPostedProperties = userPostedProperties.length > 0;
  const isEligibleToPurchase = user && !isTenant && hasPostedProperties;

  const handleSelectPlan = (plan: ListingPlan) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    // Restriction 1: Tenant/Buyer role cannot get packages
    if (isTenant) {
      setShowTenantBlockedModal(true);
      return;
    }

    // Restriction 2: Must post a property first to get packages
    if (!hasPostedProperties) {
      setShowNoPropertyModal(true);
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

  const handleSwitchToLandlordAndPost = () => {
    updateUser({ role: 'landlord' });
    setShowTenantBlockedModal(false);
    setCurrentView('post');
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
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

        {/* Informational Policy Banner: Plans require posted properties and Landlord role */}
        <div className="max-w-4xl mx-auto mb-10 p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shrink-0 mt-0.5 sm:mt-0 font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-xs sm:text-sm text-slate-900">
                {isAmharic ? 'የማስተዋወቂያ ፓኬጅ ደንብ (Package Eligibility Rule)' : 'Listing Package Eligibility Rule'}
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                {isAmharic 
                  ? 'የቪአይፒ (VIP) እና ፕሪሚየም ፓኬጆች ለንብረት ባለቤቶች (Landlords) ብቻ የተዘጋጁ ናቸው። ፓኬጅ ለመግዛት ወይም ለማግበር ቢያንስ አንድ ቤት/ንብረት መለጠፍ ግዴታ ነው። ተከራይ/ገዢ (Tenant) መለያ ያላቸው ተጠቃሚዎች ፓኬጅ መግዛት አይችሉም።'
                  : 'Promotion packages (VIP, Premium, Basic) are exclusively for Landlords with active property listings. Users must post at least one property before activating a package. Tenant/Buyer accounts cannot purchase listing packages.'
                }
              </p>
            </div>
          </div>

          {user && !hasPostedProperties && (
            <button
              onClick={() => setCurrentView('post')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all self-end sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isAmharic ? 'ንብረት ይለጥፉ' : 'Post Property First'}</span>
            </button>
          )}
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
                      <span>
                        {user && isTenant 
                          ? (isAmharic ? 'የባለቤት ፓኬጅ (Landlords Only)' : 'Landlords Only (Tenant Info)')
                          : user && !hasPostedProperties
                          ? (isAmharic ? 'መጀመሪያ ንብረት ይለጥፉ' : 'Post Property First')
                          : (plan.price === 0 ? t('pricingChoosePlan') : t('pricingPayTelebirr'))
                        }
                      </span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* ============================================================== */}
      {/* RESTRICTION MODAL 1: Tenant / Buyer cannot get packages */}
      {/* ============================================================== */}
      {showTenantBlockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowTenantBlockedModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <UserX className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {isAmharic ? 'ተከራይ/ገዢ ፓኬጅ መግዛት አይችልም' : 'Tenant / Buyer Accounts Cannot Get Packages'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {isAmharic
                  ? 'የማስተዋወቂያ ፓኬጆች (VIP & Premium) የተዘጋጁት ለንብረት አከራይና ሻጮች (Landlords) ብቻ ነው። እንደ ተከራይ/ገዢ ሁሉንም ቤቶች በነጻ መጎብኘትና ባለቤቶችን በቀጥታ መደወል ይችላሉ።'
                  : 'Listing and Promotion packages (Basic, Premium, VIP) are designed specifically for Property Owners and Landlords to spotlight listings. As a Tenant/Buyer, browsing and contacting verified owners is always 100% free!'
                }
              </p>
            </div>

            <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>{isAmharic ? 'የሚከራይ ወይም የሚሸጥ ቤት አለዎት?' : 'Do you have a property to rent or sell?'}</span>
              </p>
              <p className="text-slate-600">
                {isAmharic 
                  ? 'መለያዎን ወደ «አከራይ/ባለቤት (Landlord)» በመቀየር ንብረትዎን ከለጠፉ በኋላ ፓኬጆችን ማግኘት ይችላሉ።'
                  : 'You can switch your account type to "Landlord / Owner" and post your property listing to activate promotion packages.'
                }
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSwitchToLandlordAndPost}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAmharic ? 'መለያዬን ወደ አከራይ ቀይረህ ንብረት አስገባ' : 'Switch to Landlord & Post Property'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTenantBlockedModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {isAmharic ? 'ዝጋ (Close)' : 'I Understand, Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RESTRICTION MODAL 2: Must post at least 1 property first */}
      {/* ============================================================== */}
      {showNoPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowNoPropertyModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {isAmharic ? 'መጀመሪያ ንብረትዎን ይለጥፉ' : 'Post a Property to Activate Packages'}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {isAmharic
                  ? 'የማስተዋወቂያ ፓኬጅ (VIP & Premium) ከመግዛትዎ በፊት ቢያንስ አንድ ቤት፣ ቪላ ወይም አፓርታማ መለጠፍ ያስፈልግዎታል። ንብረትዎን ከለጠፉ በኋላ ፓኬጁ በቀጥታ ይተገበራል።'
                  : 'You cannot acquire a package without posting a property first. Promotion packages are linked directly to your property listings to provide VIP ranking, gold aura, and verified owner spotlight.'
                }
              </p>
            </div>

            <div className="my-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isAmharic ? 'ንብረት ከለጠፉ በኋላ የሚገኝ ጥቅም' : 'Benefits applied once property is posted:'}</span>
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-emerald-900">
                <li>{isAmharic ? 'የመጀመሪያ ደረጃ ፍለጋ (Top #1 Ranking)' : 'Top #1 Search Ranking in Addis Ababa'}</li>
                <li>{isAmharic ? 'የተረጋገጠ አርማ እና የወርቅ ኦውራ' : 'Priority Verified Gold Badge & Aura'}</li>
                <li>{isAmharic ? 'የቴሌብር ፈጣን ክፍያ ማረጋገጫ' : 'Fast Telebirr Direct Approval'}</li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowNoPropertyModal(false);
                  setCurrentView('post');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isAmharic ? 'አሁን ንብረት ይለጥፉ (Post Property Now)' : 'Post Property Listing Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNoPropertyModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {isAmharic ? 'ተመለስ (Back)' : 'Cancel & Go Back'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

