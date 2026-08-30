import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { PropertyCard } from '../common/PropertyCard';
import { PropertyType } from '../../types';

export const FeaturedProperties: React.FC = () => {
  const { t } = useLanguage();
  const { featuredProperties, setCurrentView, resetFilters, updateFilter } = useProperties();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Apartment' | 'Villa' | 'Condominium' | 'Studio'>('all');

  const filteredListings = featuredProperties.filter(prop => {
    if (selectedFilter === 'all') return true;
    return prop.propertyType === selectedFilter;
  });

  const handleViewAll = () => {
    resetFilters();
    updateFilter('verifiedOnly', false);
    setCurrentView('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-14 lg:py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Verified Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('featuredTitle')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-xl">
              {t('featuredSubtitle')}
            </p>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {(['all', 'Apartment', 'Villa', 'Condominium', 'Studio'] as const).map(filterKey => (
              <button
                key={filterKey}
                onClick={() => setSelectedFilter(filterKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFilter === filterKey
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {filterKey === 'all' ? 'All Featured' : filterKey}
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredListings.slice(0, 6).map(prop => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <button
            id="featured-view-all-btn"
            onClick={handleViewAll}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <span>{t('featuredViewAll')}</span>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
          </button>
        </div>

      </div>
    </section>
  );
};
