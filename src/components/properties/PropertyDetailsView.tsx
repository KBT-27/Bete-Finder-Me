import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize, 
  ShieldCheck, 
  Zap, 
  Droplets, 
  Phone, 
  Send, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Heart, 
  Share2, 
  Calculator, 
  Check, 
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { AMENITIES_LIST } from '../../data/ethiopianLocations';
import { PropertyCard } from '../common/PropertyCard';

export const PropertyDetailsView: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { 
    selectedProperty, 
    setCurrentView, 
    properties, 
    toggleFavorite, 
    isFavorite,
    bookTour 
  } = useProperties();
  const { user, setIsAuthModalOpen } = useAuth();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [tourDate, setTourDate] = useState('');
  const [tourTime, setTourTime] = useState('10:00 AM');
  const [tourNotes, setTourNotes] = useState('');
  const [isTourBooked, setIsTourBooked] = useState(false);
  const [depositMonths, setDepositMonths] = useState(3);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!selectedProperty) {
    return (
      <div className="min-h-screen py-16 text-center">
        <p className="text-slate-500 mb-4">No property selected.</p>
        <button
          onClick={() => setCurrentView('properties')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold"
        >
          {t('detailsBack')}
        </button>
      </div>
    );
  }

  const isFav = isFavorite(selectedProperty.id);

  const formattedPrice = new Intl.NumberFormat('en-ET', {
    maximumFractionDigits: 0
  }).format(selectedProperty.price);

  const totalMoveInEstimate = (selectedProperty.price * depositMonths) + (selectedProperty.price); // Deposit + First month rent

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!tourDate) return;
    const success = bookTour(selectedProperty.id, tourDate, tourTime, tourNotes);
    if (success) {
      setIsTourBooked(true);
      setTimeout(() => setIsTourBooked(false), 6000);
    }
  };

  const similarProperties = properties
    .filter(p => p.id !== selectedProperty.id && (p.propertyType === selectedProperty.propertyType || p.subcity === selectedProperty.subcity))
    .slice(0, 3);

  return (
    <div className="bg-slate-50 min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            id="details-back-btn"
            onClick={() => setCurrentView('properties')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-500 text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('detailsBack')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
              title="Share property"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => toggleFavorite(selectedProperty.id)}
              className={`p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition-colors ${
                isFav ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
              title="Save favorite"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Property Header Info */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-lg text-white ${
                  selectedProperty.listingType === 'rent' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  {selectedProperty.listingType === 'rent' ? t('cardForRent') : t('cardForSale')}
                </span>

                {selectedProperty.payPlan === 'vip' && (
                  <span className="flex items-center gap-1 text-xs font-black px-3 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                    <span>👑 VIP TOP+ Tier</span>
                  </span>
                )}
                {selectedProperty.payPlan === 'premium' && (
                  <span className="flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md">
                    <span>⭐ Premium 5x TOP+</span>
                  </span>
                )}
                {selectedProperty.payPlan === 'basic' && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-200">
                    <span>Basic 2x</span>
                  </span>
                )}

                {selectedProperty.isVerified && (
                  <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t('cardVerified')}</span>
                  </span>
                )}
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {selectedProperty.propertyType}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                {isAmharic ? selectedProperty.titleAm : selectedProperty.title}
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{selectedProperty.address}, {selectedProperty.neighborhood}, {selectedProperty.subcity}, {selectedProperty.city}</span>
              </div>
            </div>

            {/* Price Tag Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 lg:text-right shrink-0">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Price / ዋጋ</p>
              <div className="flex items-baseline gap-1.5 lg:justify-end mt-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {formattedPrice}
                </span>
                <span className="text-sm font-bold text-slate-300">ETB (ብር)</span>
                {selectedProperty.listingType === 'rent' && (
                  <span className="text-xs text-slate-400 font-medium">{t('cardPerMonth')}</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Direct Landlord Price • No Markup</p>
            </div>
          </div>
        </div>

        {/* Photo Gallery Grid */}
        <div className="space-y-4 mb-8">
          {/* Main Large Active Image */}
          <div className="relative aspect-16/9 md:aspect-21/9 rounded-3xl overflow-hidden bg-slate-900 shadow-md">
            <img
              src={selectedProperty.images[activeImageIndex] || selectedProperty.images[0]}
              alt={selectedProperty.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
              Photo {activeImageIndex + 1} of {selectedProperty.images.length}
            </div>
          </div>

          {/* Thumbnails Row */}
          {selectedProperty.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {selectedProperty.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-16/10 rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx ? 'border-emerald-500 scale-98 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2-Column Main Layout: Specs & Details VS Contact & Booking */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Columns: Overview, Description, Amenities, Calculator */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Specs Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 mb-4">{t('detailsOverview')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Bed className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{t('cardBeds')}</p>
                  <p className="text-base font-extrabold text-slate-900">{selectedProperty.bedrooms} Rooms</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">{t('cardBaths')}</p>
                  <p className="text-base font-extrabold text-slate-900">{selectedProperty.bathrooms} Baths</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Maximize className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Floor Area</p>
                  <p className="text-base font-extrabold text-slate-900">{selectedProperty.areaSqm} sqm (ካሬ)</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Furnishing</p>
                  <p className="text-base font-extrabold text-slate-900">{selectedProperty.isFurnished ? 'Furnished' : 'Unfurnished'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 mb-3">{t('detailsDescription')}</h2>
              <p className="text-sm sm:text-base text-slate-650 leading-relaxed whitespace-pre-line">
                {isAmharic ? selectedProperty.descriptionAm : selectedProperty.description}
              </p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 mb-4">{t('detailsAmenities')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITIES_LIST.map(amenity => {
                  const hasAmenity = selectedProperty.amenities.includes(amenity.id);
                  return (
                    <div
                      key={amenity.id}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs sm:text-sm font-semibold ${
                        hasAmenity
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        hasAmenity ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {hasAmenity ? <Check className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate">{isAmharic ? amenity.amName : amenity.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rent & Deposit Calculator */}
            {selectedProperty.listingType === 'rent' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-extrabold text-slate-900">{t('detailsCalculator')}</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        {t('detailsRentAmount')}
                      </label>
                      <p className="text-xl font-extrabold text-slate-900">
                        {formattedPrice} ETB / Month
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        {t('detailsDepositMonths')}: <span className="text-emerald-700 font-black">{depositMonths} months</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="6"
                        step="1"
                        value={depositMonths}
                        onChange={(e) => setDepositMonths(Number(e.target.value))}
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>1 Month</span>
                        <span>3 Months (Standard)</span>
                        <span>6 Months</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-slate-800">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{t('detailsTotalMoveIn')}</p>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
                      {totalMoveInEstimate.toLocaleString()} ETB
                    </p>
                    <p className="text-xs text-slate-600 mt-2">
                      Includes 1st month rent ({formattedPrice} ETB) + {depositMonths} months deposit ({(selectedProperty.price * depositMonths).toLocaleString()} ETB).
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Landlord Card & Book Tour Visit */}
          <div className="space-y-6">
            
            {/* Owner & Broker Contact Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedProperty.owner.avatar}
                  alt={selectedProperty.owner.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">{selectedProperty.owner.name}</h3>
                  <p className="text-xs font-semibold text-emerald-700 capitalize">{selectedProperty.owner.role} • {selectedProperty.owner.rating} ★ Rating</p>
                  {selectedProperty.owner.isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 mt-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t('detailsVerifiedOwner')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${selectedProperty.owner.phone}`}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{t('detailsCallOwner')} ({selectedProperty.owner.phone})</span>
                </a>

                {selectedProperty.owner.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedProperty.owner.whatsapp.replace(/\+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    <span>{t('detailsWhatsApp')}</span>
                  </a>
                )}

                {selectedProperty.owner.telegram && (
                  <a
                    href={`https://t.me/${selectedProperty.owner.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4 text-sky-600" />
                    <span>{t('detailsTelegram')}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Schedule Tour Booking Form */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">{t('detailsBookTour')}</h3>
              </div>

              {isTourBooked ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-sm">{t('detailsTourSuccess')}</p>
                  <p className="text-xs text-slate-600">The property agent will contact you on {tourDate} at {tourTime}.</p>
                </div>
              ) : (
                <form onSubmit={handleTourSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {t('detailsTourDate')}
                    </label>
                    <input
                      type="date"
                      required
                      value={tourDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setTourDate(e.target.value)}
                      className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {t('detailsTourTime')}
                    </label>
                    <select
                      value={tourTime}
                      onChange={(e) => setTourTime(e.target.value)}
                      className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                    >
                      <option value="09:00 AM">09:00 AM (Morning)</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="02:00 PM">02:00 PM (Afternoon)</option>
                      <option value="04:30 PM">04:30 PM</option>
                      <option value="06:00 PM">06:00 PM (Evening)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      {t('detailsTourNotes')}
                    </label>
                    <textarea
                      rows={2}
                      value={tourNotes}
                      onChange={(e) => setTourNotes(e.target.value)}
                      placeholder="e.g. Please confirm backup generator status..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-slate-900 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {t('detailsTourSubmit')}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

        {/* Similar Properties Section */}
        {similarProperties.length > 0 && (
          <div className="mt-14 pt-10 border-t border-slate-200">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6">
              {t('detailsSimilar')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {similarProperties.map(prop => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
