import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { PropertyCard } from '../common/PropertyCard';

export const LatestProperties: React.FC = () => {
  const { t } = useLanguage();
  const { latestProperties, setCurrentView, resetFilters } = useProperties();

  return (
    <section className="py-14 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold mb-2">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Just Added</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('latestTitle')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              {t('latestSubtitle')}
            </p>
          </div>

          <button
            onClick={() => {
              resetFilters();
              setCurrentView('properties');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
          >
            <span>Browse All Listings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {latestProperties.map(prop => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>

      </div>
    </section>
  );
};
