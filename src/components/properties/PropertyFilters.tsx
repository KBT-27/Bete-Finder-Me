import React from 'react';
import { 
  Filter, 
  RotateCcw, 
  Check, 
  MapPin, 
  Building, 
  ShieldCheck, 
  Banknote, 
  Bed, 
  Bath, 
  Zap, 
  Droplets 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { ETHIOPIAN_LOCATIONS, AMENITIES_LIST } from '../../data/ethiopianLocations';
import { PropertyType, ListingType } from '../../types';

interface PropertyFiltersProps {
  onCloseMobile?: () => void;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({ onCloseMobile }) => {
  const { t, isAmharic } = useLanguage();
  const { 
    filters, 
    updateFilter, 
    resetFilters, 
    activeListingType, 
    setActiveListingType 
  } = useProperties();

  const propertyTypes: PropertyType[] = [
    'Apartment',
    'Villa',
    'Condominium',
    'Studio',
    'Commercial',
    'Townhouse',
    'Guest House'
  ];

  const handleAmenityToggle = (amenityId: string) => {
    const isSelected = filters.selectedAmenities.includes(amenityId);
    const updated = isSelected
      ? filters.selectedAmenities.filter(id => id !== amenityId)
      : [...filters.selectedAmenities, amenityId];
    updateFilter('selectedAmenities', updated);
  };

  const selectedLocationObj = ETHIOPIAN_LOCATIONS.find(loc => loc.city === filters.city);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">{t('filterTitle')}</h3>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-semibold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('filterClear')}</span>
        </button>
      </div>

      {/* Listing Purpose (Rent / Buy) */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {t('filterListingType')}
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveListingType('all');
              updateFilter('listingType', 'all');
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filters.listingType === 'all' && activeListingType === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('filterAll')}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveListingType('rent');
              updateFilter('listingType', 'rent');
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filters.listingType === 'rent' || activeListingType === 'rent'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('filterRentOnly')}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveListingType('sale');
              updateFilter('listingType', 'sale');
            }}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              filters.listingType === 'sale' || activeListingType === 'sale'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('filterBuyOnly')}
          </button>
        </div>
      </div>

      {/* City Location */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {t('filterLocation')}
        </label>
        <select
          value={filters.city}
          onChange={(e) => {
            updateFilter('city', e.target.value);
            updateFilter('subcity', 'all');
          }}
          className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">{t('heroAllCities')}</option>
          {ETHIOPIAN_LOCATIONS.map(loc => (
            <option key={loc.city} value={loc.city}>{loc.city}</option>
          ))}
        </select>
      </div>

      {/* Subcity in Addis Ababa */}
      {filters.city === 'Addis Ababa' && selectedLocationObj && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            {t('filterSubcity')}
          </label>
          <select
            value={filters.subcity}
            onChange={(e) => updateFilter('subcity', e.target.value)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Subcities (ሁሉም ክ/ከተሞች)</option>
            {selectedLocationObj.subcities.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      )}

      {/* Property Type */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {t('filterType')}
        </label>
        <select
          value={filters.propertyType}
          onChange={(e) => updateFilter('propertyType', e.target.value as any)}
          className="w-full py-2 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">{t('heroAllTypes')}</option>
          {propertyTypes.map(pt => (
            <option key={pt} value={pt}>{pt}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {t('filterPriceRange')}
          </label>
          <span className="text-xs font-extrabold text-emerald-700">
            {filters.maxPrice < 2000000 
              ? `Up to ${filters.maxPrice.toLocaleString()} ETB` 
              : 'No Limit'}
          </span>
        </div>
        <input
          type="range"
          min="10000"
          max="500000"
          step="5000"
          value={filters.maxPrice > 500000 ? 500000 : filters.maxPrice}
          onChange={(e) => updateFilter('maxPrice', Number(e.target.value))}
          className="w-full accent-emerald-600 cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-slate-600 mt-1 font-medium">
          <span>10k ETB</span>
          <span>150k ETB</span>
          <span>500k+ ETB</span>
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {t('filterBedrooms')}
        </label>
        <div className="grid grid-cols-5 gap-1">
          {(['all', 1, 2, 3, 4] as const).map(bed => (
            <button
              key={String(bed)}
              type="button"
              onClick={() => updateFilter('minBedrooms', bed as any)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                filters.minBedrooms === bed
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {bed === 'all' ? 'Any' : `${bed}+`}
            </button>
          ))}
        </div>
      </div>

      {/* Verified Listings Only Toggle */}
      <div className="pt-2">
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 cursor-pointer hover:bg-blue-50 transition-colors">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) => updateFilter('verifiedOnly', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500 cursor-pointer accent-blue-600"
          />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-blue-900">{t('filterVerifiedOnly')}</span>
          </div>
        </label>
      </div>

      {/* Must-Have Amenities */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          {t('filterAmenities')}
        </label>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {AMENITIES_LIST.map(amenity => {
            const isChecked = filters.selectedAmenities.includes(amenity.id);
            return (
              <label
                key={amenity.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs transition-colors"
              >
                <span className="text-slate-700 font-medium">
                  {isAmharic ? amenity.amName : amenity.name}
                </span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleAmenityToggle(amenity.id)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </label>
            );
          })}
        </div>
      </div>

      {onCloseMobile && (
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={onCloseMobile}
            className="w-full py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Apply Filters
          </button>
        </div>
      )}

    </div>
  );
};
