import React from 'react';
import { 
  Building, 
  Home, 
  Layers, 
  SquareAsterisk, 
  Briefcase, 
  Castle, 
  Hotel 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { PropertyType } from '../../types';

export const PropertyCategories: React.FC = () => {
  const { t } = useLanguage();
  const { properties, updateFilter, setCurrentView } = useProperties();

  const categories: { type: PropertyType; titleKey: any; icon: React.ReactNode; color: string }[] = [
    {
      type: 'Apartment',
      titleKey: 'catApartment',
      icon: <Building className="w-6 h-6" />,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      type: 'Villa',
      titleKey: 'catVilla',
      icon: <Castle className="w-6 h-6" />,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      type: 'Condominium',
      titleKey: 'catCondominium',
      icon: <Layers className="w-6 h-6" />,
      color: 'bg-sky-50 text-sky-600 border-sky-200'
    },
    {
      type: 'Studio',
      titleKey: 'catStudio',
      icon: <SquareAsterisk className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      type: 'Commercial',
      titleKey: 'catCommercial',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    },
    {
      type: 'Townhouse',
      titleKey: 'catTownhouse',
      icon: <Home className="w-6 h-6" />,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      type: 'Guest House',
      titleKey: 'catGuestHouse',
      icon: <Hotel className="w-6 h-6" />,
      color: 'bg-teal-50 text-teal-600 border-teal-200'
    }
  ];

  const handleCategorySelect = (type: PropertyType) => {
    updateFilter('propertyType', type);
    setCurrentView('properties');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-12 lg:py-16 bg-white border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('categoriesTitle')}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2">
            {t('categoriesSubtitle')}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {categories.map(cat => {
            const count = properties.filter(p => p.propertyType === cat.type).length;
            return (
              <button
                id={`category-btn-${cat.type.toLowerCase().replace(/\s+/g, '-')}`}
                key={cat.type}
                onClick={() => handleCategorySelect(cat.type)}
                className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer text-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border transition-transform group-hover:scale-110 ${cat.color}`}>
                  {cat.icon}
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t(cat.titleKey)}
                </h3>
                <span className="text-[11px] text-slate-600 mt-1 font-medium">
                  {count > 0 ? `${count} listings` : 'Browse'}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
