import React from 'react';
import { 
  Heart, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  ShieldCheck, 
  Zap, 
  Droplets,
  ArrowRight,
  Phone
} from 'lucide-react';
import { Property } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect }) => {
  const { t, isAmharic } = useLanguage();
  const { toggleFavorite, isFavorite, setSelectedProperty, setCurrentView } = useProperties();

  const isFav = isFavorite(property.id);

  const handleClick = () => {
    if (onSelect) {
      onSelect(property);
    } else {
      setSelectedProperty(property);
      setCurrentView('details');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-ET', {
    maximumFractionDigits: 0
  }).format(property.price);

  return (
    <div 
      id={`property-card-${property.id}`}
      className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between"
    >
      <div>
        {/* Image Container with Badges */}
        <div className="relative aspect-16/10 overflow-hidden bg-slate-100 cursor-pointer" onClick={handleClick}>
          <img
            src={property.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
            alt={property.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Gradient Overlay for badges */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Rent or Sale Badge */}
              <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg text-white shadow-xs ${
                property.listingType === 'rent' ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                {property.listingType === 'rent' ? t('cardForRent') : t('cardForSale')}
              </span>

              {/* Pay Plan Badge */}
              {property.payPlan === 'vip' && (
                <span className="flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                  <span>👑 VIP TOP+</span>
                </span>
              )}
              {property.payPlan === 'premium' && (
                <span className="flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md">
                  <span>⭐ 5x TOP+</span>
                </span>
              )}
              {property.payPlan === 'basic' && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-900/90 text-slate-200 shadow-xs">
                  <span>Basic 2x</span>
                </span>
              )}

              {/* Verified Badge */}
              {property.isVerified && (
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-blue-600/90 text-white backdrop-blur-xs shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{t('cardVerified')}</span>
                </span>
              )}

              {/* Featured Badge */}
              {property.isFeatured && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-500 text-slate-950 shadow-xs">
                  {t('cardFeatured')}
                </span>
              )}
            </div>

            {/* Favorite Action Button */}
            <button
              id={`fav-btn-${property.id}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(property.id);
              }}
              title={isFav ? 'Remove from favorites' : 'Save to favorites'}
              className="pointer-events-auto w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600 flex items-center justify-center transition-all shadow-md active:scale-90"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Essential Ethiopian Amenities Tags (Generator / Water Tank) */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 pointer-events-none">
            {property.hasBackupGenerator && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-amber-300 backdrop-blur-xs">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Gen</span>
              </span>
            )}
            {property.hasWaterTank && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-sky-300 backdrop-blur-xs">
                <Droplets className="w-3 h-3 text-sky-400" />
                <span>Roto Tank</span>
              </span>
            )}
          </div>
        </div>

        {/* Property Info Content */}
        <div className="p-4 sm:p-5">
          
          {/* Price & Property Type */}
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {formattedPrice}
              </span>
              <span className="text-xs font-bold text-emerald-700">ETB (ብር)</span>
              {property.listingType === 'rent' && (
                <span className="text-xs text-slate-500 font-medium">{t('cardPerMonth')}</span>
              )}
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              {property.propertyType}
            </span>
          </div>

          {/* Title */}
          <h3 
            onClick={handleClick}
            className="font-bold text-base text-slate-900 line-clamp-1 hover:text-emerald-700 transition-colors cursor-pointer mb-1.5"
            title={isAmharic ? property.titleAm : property.title}
          >
            {isAmharic ? property.titleAm : property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.neighborhood}, {property.subcity}, {property.city}</span>
          </div>

          {/* Spec Badges: Beds, Baths, SqM */}
          <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-b border-slate-100 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5 justify-center">
              <Bed className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{property.bedrooms} {t('cardBeds')}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center border-l border-r border-slate-100">
              <Bath className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{property.bathrooms} {t('cardBaths')}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <Maximize className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{property.areaSqm} {t('cardSqM')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Card Footer: Owner Info & CTA Button */}
      <div className="px-4 sm:px-5 pb-4 pt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={property.owner.avatar}
            alt={property.owner.name}
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">{property.owner.name}</p>
            <p className="text-[10px] text-slate-400 capitalize">{property.owner.role}</p>
          </div>
        </div>

        <button
          id={`view-details-${property.id}`}
          onClick={handleClick}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
        >
          <span>{t('cardViewDetails')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
};
