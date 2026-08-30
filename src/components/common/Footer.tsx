import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Send, 
  Heart, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { setCurrentView, updateFilter, setActiveListingType } = useProperties();

  const handleLocationClick = (city: string, subcity?: string) => {
    updateFilter('city', city);
    if (subcity) updateFilter('subcity', subcity);
    setCurrentView('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTypeClick = (type: any) => {
    updateFilter('propertyType', type);
    setCurrentView('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Top Banner / Trust Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left items-center">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">100% Verified Real Estate</h4>
                <p className="text-xs text-slate-400">Inspected by our Addis Ababa field team</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Instant Telebirr & CBE Birr</h4>
                <p className="text-xs text-slate-400">Safe, frictionless digital payments</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Direct Landlord Contact</h4>
                <p className="text-xs text-slate-400">Zero unnecessary middlemen commissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white">Bete Finder</span>
                  <span className="text-xs bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded-sm border border-amber-500/30">ቤቴ</span>
                </div>
                <p className="text-xs text-slate-400">Ethiopian Real Estate Network</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              {t('footerDesc')}
            </p>

            <div className="space-y-2.5 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">+251995406697 / +251726584033</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="mailto:betefinder.support@gmail.com" className="hover:text-emerald-400 transition-colors">
                  betefinder.support@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-emerald-400 shrink-0" />
                <a 
                  href="https://t.me/Bete_Finder_Support" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Support: <strong className="text-slate-200">@Bete_Finder_Support</strong>
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-amber-400 shrink-0" />
                <a 
                  href="https://t.me/Bete_Finder" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition-colors"
                >
                  Telegram Channel: <strong className="text-slate-200">t.me/Bete_Finder</strong>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
              {t('footerQuickLinks')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('navHome')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveListingType('rent');
                    setCurrentView('properties');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('navRent')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveListingType('sale');
                    setCurrentView('properties');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('navSale')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('post');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('navPostProperty')}
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('pricing');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {t('navPricing')}
                </button>
              </li>
            </ul>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
              Property Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => handleTypeClick('Apartment')} className="hover:text-emerald-400 transition-colors">
                  {t('catApartment')}
                </button>
              </li>
              <li>
                <button onClick={() => handleTypeClick('Villa')} className="hover:text-emerald-400 transition-colors">
                  {t('catVilla')}
                </button>
              </li>
              <li>
                <button onClick={() => handleTypeClick('Condominium')} className="hover:text-emerald-400 transition-colors">
                  {t('catCondominium')}
                </button>
              </li>
              <li>
                <button onClick={() => handleTypeClick('Studio')} className="hover:text-emerald-400 transition-colors">
                  {t('catStudio')}
                </button>
              </li>
              <li>
                <button onClick={() => handleTypeClick('Commercial')} className="hover:text-emerald-400 transition-colors">
                  {t('catCommercial')}
                </button>
              </li>
            </ul>
          </div>

          {/* Popular Locations */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wider uppercase">
              {t('footerPopularSearches')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => handleLocationClick('Addis Ababa', 'Bole')} className="hover:text-emerald-400 transition-colors">
                  Bole, Addis Ababa
                </button>
              </li>
              <li>
                <button onClick={() => handleLocationClick('Addis Ababa', 'Yeka')} className="hover:text-emerald-400 transition-colors">
                  CMC / Yeka, Addis Ababa
                </button>
              </li>
              <li>
                <button onClick={() => handleLocationClick('Addis Ababa', 'Kirkos')} className="hover:text-emerald-400 transition-colors">
                  Kazanchis & Old Airport
                </button>
              </li>
              <li>
                <button onClick={() => handleLocationClick('Hawassa')} className="hover:text-emerald-400 transition-colors">
                  Hawassa Lakefront
                </button>
              </li>
              <li>
                <button onClick={() => handleLocationClick('Bahir Dar')} className="hover:text-emerald-400 transition-colors">
                  Bahir Dar Lake Tana
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Bete Finder (ቤቴ). {t('footerRights')}</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              Telebirr Official Direct Payment (0995406697) 🇪🇹
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
