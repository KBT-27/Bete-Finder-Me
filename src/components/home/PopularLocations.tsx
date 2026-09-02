import React from 'react';
import { MapPin, ArrowRight, Building2, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { ETHIOPIAN_LOCATIONS } from '../../data/ethiopianLocations';

export const PopularLocations: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { properties, updateFilter, setCurrentView } = useProperties();

  const handleLocationClick = (cityName: string) => {
    updateFilter('city', cityName);
    updateFilter('subcity', 'all');
    setCurrentView('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-14 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isAmharic ? 'የኢትዮጵያ ዋና ዋና የሪል እስቴት ማዕከላት' : 'Major Regional Hubs Across Ethiopia'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('locationsTitle')}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            {t('locationsSubtitle')}
          </p>
        </div>

        {/* Location Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ETHIOPIAN_LOCATIONS.map((loc) => {
            // Truthful, dynamic property count for this city from active database listings
            const realCount = properties.filter(
              p => p.city?.trim().toLowerCase() === loc.city.trim().toLowerCase() ||
                   loc.city.toLowerCase().includes(p.city?.trim().toLowerCase()) ||
                   (p.city?.trim().toLowerCase().includes('bishoftu') && loc.city.toLowerCase().includes('bishoftu')) ||
                   (p.city?.trim().toLowerCase().includes('adama') && loc.city.toLowerCase().includes('adama'))
            ).length;

            return (
              <div
                id={`location-card-${loc.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                key={loc.city}
                onClick={() => handleLocationClick(loc.city)}
                className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer shadow-xs hover:shadow-2xl transition-all duration-300 border border-slate-200/90 hover:border-emerald-500/50 flex flex-col justify-between"
              >
                {/* Background Image */}
                <img
                  src={loc.image}
                  alt={loc.city}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 absolute inset-0"
                  loading="lazy"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent group-hover:via-slate-950/60 transition-colors" />

                {/* Top Hub Tag */}
                <div className="relative z-10 p-4 flex items-start justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-amber-300 border border-amber-400/30">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{isAmharic && loc.regionAm ? loc.regionAm : loc.region}</span>
                  </span>

                  {loc.isMajorHub && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600/90 text-white shadow-xs">
                      {isAmharic ? 'ዋና ማዕከል' : 'Major Hub'}
                    </span>
                  )}
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 p-5 flex flex-col justify-end text-white">
                  <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    {loc.city} {isAmharic && loc.cityAm ? <span className="text-sm font-bold text-amber-300 block sm:inline">({loc.cityAm})</span> : null}
                  </h3>

                  <p className="text-xs text-slate-300 line-clamp-1 mt-1 font-medium">
                    {isAmharic && loc.taglineAm ? loc.taglineAm : (loc.tagline || loc.popularNeighborhoods.slice(0, 3).join(' • '))}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/20 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-emerald-300">
                        {realCount > 0 ? `${realCount} ${isAmharic ? 'ቤቶች' : 'Live Listings'}` : (isAmharic ? 'አዲስ ለመለጠፍ ዝግጁ' : 'Open for Listings')}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-white font-bold group-hover:translate-x-1 transition-transform">
                      {t('locationsExplore')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
