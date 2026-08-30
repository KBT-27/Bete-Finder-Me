import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { ETHIOPIAN_LOCATIONS } from '../../data/ethiopianLocations';

export const PopularLocations: React.FC = () => {
  const { t } = useLanguage();
  const { updateFilter, setCurrentView } = useProperties();

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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('locationsTitle')}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            {t('locationsSubtitle')}
          </p>
        </div>

        {/* Location Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ETHIOPIAN_LOCATIONS.map((loc, idx) => (
            <div
              id={`location-card-${loc.city.toLowerCase().replace(/\s+/g, '-')}`}
              key={loc.city}
              onClick={() => handleLocationClick(loc.city)}
              className="group relative h-64 rounded-3xl overflow-hidden cursor-pointer shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-200/80"
            >
              {/* Background Image */}
              <img
                src={loc.image}
                alt={loc.city}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                loading="lazy"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent group-hover:via-slate-950/50 transition-colors" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ethiopia</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  {loc.city}
                </h3>

                <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                  {loc.popularNeighborhoods.slice(0, 3).join(' • ')}
                </p>

                <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/15 text-xs">
                  <span className="font-semibold text-emerald-400">
                    {loc.propertyCount}+ Properties
                  </span>
                  <span className="inline-flex items-center gap-1 text-white font-bold group-hover:translate-x-1 transition-transform">
                    {t('locationsExplore')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
