import React from 'react';
import { Clock, ArrowRight, PlusCircle, Home } from 'lucide-react';
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

          {latestProperties.length > 0 && (
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
          )}
        </div>

        {latestProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestProperties.map(prop => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto">
            <div className="w-16 h-16 bg-white text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-xs">
              <Home className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              No Listings Published Yet
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Your database is fresh and ready. Post your first listing to have it immediately saved to the connected Neon PostgreSQL database!
            </p>
            <button
              onClick={() => {
                setCurrentView('post');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Create First Listing (አዲስ ቤት ይለጥፉ)</span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
