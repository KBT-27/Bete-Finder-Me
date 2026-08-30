import React, { useState } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  LayoutGrid, 
  List, 
  X, 
  RotateCcw,
  Sparkles,
  MapPin,
  Building2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { PropertyCard } from '../common/PropertyCard';
import { PropertyFilters } from './PropertyFilters';

export const PropertiesView: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { 
    filteredProperties, 
    filters, 
    updateFilter, 
    resetFilters,
    activeListingType,
    setActiveListingType 
  } = useProperties();

  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="bg-slate-50 min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Top Breadcrumb & Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <span>Home</span>
            <span>/</span>
            <span className="text-emerald-700">Properties in Ethiopia</span>
            {filters.city !== 'all' && (
              <>
                <span>/</span>
                <span className="text-slate-900 font-bold">{filters.city}</span>
              </>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {filters.listingType === 'sale' 
                  ? 'Properties for Sale in Ethiopia' 
                  : filters.listingType === 'rent' 
                  ? 'Rental Houses & Apartments in Ethiopia' 
                  : 'Real Estate & Properties in Ethiopia'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {filteredProperties.length} {t('propertiesFound')}
              </p>
            </div>

            {/* Quick Listing Type Switcher */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
              <button
                onClick={() => {
                  setActiveListingType('all');
                  updateFilter('listingType', 'all');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filters.listingType === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setActiveListingType('rent');
                  updateFilter('listingType', 'rent');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filters.listingType === 'rent' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('filterRentOnly')}
              </button>
              <button
                onClick={() => {
                  setActiveListingType('sale');
                  updateFilter('listingType', 'sale');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  filters.listingType === 'sale' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('filterBuyOnly')}
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar (Search, Mobile Filter Toggle, Sort, Grid/List) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 mb-6 shadow-2xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => updateFilter('searchQuery', e.target.value)}
                placeholder="Search neighborhood (Bole, CMC, Kazanchis, Summit)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => updateFilter('searchQuery', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Actions: Mobile Filters Button, Sort Dropdown, View Toggle */}
            <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end">
              
              {/* Mobile Filter Drawer Button */}
              <button
                onClick={() => setIsMobileFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Filters</span>
                {(filters.selectedAmenities.length > 0 || filters.verifiedOnly || filters.city !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">{t('filterSortBy')}:</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                  className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="price-asc">{t('sortPriceAsc')}</option>
                  <option value="price-desc">{t('sortPriceDesc')}</option>
                  <option value="popular">{t('sortPopular')}</option>
                  <option value="area">Area (Largest First)</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-700'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Main Content Layout: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Left Sidebar Filters */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <PropertyFilters />
            </div>
          </div>

          {/* Right Main Listings Area */}
          <div className="lg:col-span-3">
            
            {filteredProperties.length > 0 ? (
              <div className={
                viewMode === 'grid' 
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "space-y-6"
              }>
                {filteredProperties.map(prop => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            ) : (
              /* Empty Search Results State */
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Matching Properties</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  {t('noPropertiesFound')}
                </p>
                <button
                  id="empty-reset-filters-btn"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('resetFiltersBtn')}</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Mobile Filters Modal Drawer */}
      {isMobileFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-4 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
              <h2 className="font-extrabold text-base text-slate-900">Filter Properties</h2>
              <button
                onClick={() => setIsMobileFilterDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <PropertyFilters onCloseMobile={() => setIsMobileFilterDrawerOpen(false)} />
          </div>
        </div>
      )}

    </div>
  );
};
