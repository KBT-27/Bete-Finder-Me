import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Home, 
  Building2, 
  Banknote, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  ChevronDown 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { ETHIOPIAN_LOCATIONS } from '../../data/ethiopianLocations';
import { PropertyType } from '../../types';

export const HeroSection: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { 
    filters, 
    updateFilter, 
    setCurrentView, 
    activeListingType, 
    setActiveListingType 
  } = useProperties();

  const [localSearch, setLocalSearch] = useState(filters.searchQuery);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<PropertyType | 'all'>('all');
  const [selectedMaxPrice, setSelectedMaxPrice] = useState<number>(2000000);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('searchQuery', localSearch);
    updateFilter('city', selectedCity);
    updateFilter('propertyType', selectedType);
    updateFilter('maxPrice', selectedMaxPrice);
    updateFilter('listingType', activeListingType);
    setCurrentView('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const propertyTypes: PropertyType[] = [
    'Apartment',
    'Villa',
    'Condominium',
    'Studio',
    'Commercial',
    'Townhouse',
    'Guest House'
  ];

  return (
    <section className="relative overflow-hidden bg-slate-900 pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Background Graphic & Atmosphere */}
      <div className="absolute inset-0 z-0 opacity-25">
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=2000&q=80"
          alt="Addis Ababa Real Estate Backdrop"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Trust Eyebrow */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold mb-5 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{t('heroBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            {t('heroTitlePrefix')}{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              {t('heroTitleHome')}
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* Hero Search Box Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl border border-slate-100">
          
          {/* Rent vs Buy Tabs */}
          <div className="flex items-center gap-2 mb-5">
            <button
              id="hero-tab-rent"
              type="button"
              onClick={() => setActiveListingType('rent')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeListingType === 'rent'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('heroTabRent')}
            </button>
            <button
              id="hero-tab-buy"
              type="button"
              onClick={() => setActiveListingType('sale')}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeListingType === 'sale'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t('heroTabBuy')}
            </button>
            <button
              id="hero-tab-all"
              type="button"
              onClick={() => setActiveListingType('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeListingType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              All Listings
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            
            {/* Main Text Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="hero-search-input"
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={t('heroSearchPlaceholder')}
                className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Dropdown Filters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Location Selector */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('heroLocationLabel')}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                  <select
                    id="hero-city-select"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="all">{t('heroAllCities')}</option>
                    {ETHIOPIAN_LOCATIONS.map(loc => (
                      <option key={loc.city} value={loc.city}>{loc.city}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Property Type Selector */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('heroPropertyTypeLabel')}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600" />
                  <select
                    id="hero-type-select"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value="all">{t('heroAllTypes')}</option>
                    {propertyTypes.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Max Price Selector */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('heroPriceRangeLabel')}
                </label>
                <div className="relative">
                  <Banknote className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                  <select
                    id="hero-price-select"
                    value={selectedMaxPrice}
                    onChange={(e) => setSelectedMaxPrice(Number(e.target.value))}
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    <option value={2000000}>Any Price</option>
                    <option value={30000}>Up to 30,000 ETB</option>
                    <option value={60000}>Up to 60,000 ETB</option>
                    <option value={100000}>Up to 100,000 ETB</option>
                    <option value={250000}>Up to 250,000 ETB</option>
                    <option value={5000000}>Up to 5M ETB (Buy)</option>
                    <option value={50000000}>Up to 50M ETB (Buy)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                id="hero-search-submit-btn"
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:shadow-xl active:scale-99 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-5 h-5" />
                <span>{t('heroSearchBtn')}</span>
              </button>
            </div>

          </form>

        </div>

        {/* Ethiopian Real Estate Key Metrics */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-2xl sm:text-3xl font-black text-white">450+</p>
            <p className="text-xs text-slate-300 mt-1">{t('heroStatsProperties')}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-2xl sm:text-3xl font-black text-amber-400">100%</p>
            <p className="text-xs text-slate-300 mt-1">Verified Landlords</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-2xl sm:text-3xl font-black text-emerald-400">6+</p>
            <p className="text-xs text-slate-300 mt-1">{t('heroStatsCities')}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
            <p className="text-2xl sm:text-3xl font-black text-sky-400">12,000+</p>
            <p className="text-xs text-slate-300 mt-1">{t('heroStatsUsers')}</p>
          </div>
        </div>

      </div>
    </section>
  );
};
