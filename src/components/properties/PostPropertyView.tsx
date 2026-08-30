import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Banknote, 
  UploadCloud, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Droplets
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { ETHIOPIAN_LOCATIONS, AMENITIES_LIST } from '../../data/ethiopianLocations';
import { PropertyType, ListingType } from '../../types';

export const PostPropertyView: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { addProperty, setSelectedProperty, setCurrentView } = useProperties();
  const { user, setIsAuthModalOpen } = useAuth();

  const [title, setTitle] = useState('');
  const [titleAm, setTitleAm] = useState('');
  const [listingType, setListingType] = useState<ListingType>('rent');
  const [propertyType, setPropertyType] = useState<PropertyType>('Apartment');
  const [price, setPrice] = useState<number>(45000);
  const [city, setCity] = useState('Addis Ababa');
  const [subcity, setSubcity] = useState('Bole');
  const [neighborhood, setNeighborhood] = useState('Bole Atlas');
  const [address, setAddress] = useState('Near Atlas Hotel');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [areaSqm, setAreaSqm] = useState(120);
  const [floor, setFloor] = useState(3);
  const [isFurnished, setIsFurnished] = useState(true);
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['generator', 'waterTank', 'wifi', 'parking', 'security']);
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
  ]);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [phone, setPhone] = useState(user?.phone || '+251911223344');
  const [telegram, setTelegram] = useState(user?.name ? `@${user.name.toLowerCase().replace(/\s+/g, '')}` : '@');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddImage = () => {
    if (customImageUrl.trim()) {
      setImages(prev => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const formattedTelegram = telegram.trim().startsWith('@') ? telegram.trim() : `@${telegram.trim()}`;

    const newProp = addProperty({
      title: title || `${propertyType} in ${neighborhood}, ${subcity}`,
      titleAm: titleAm || `በ${subcity} ${neighborhood} የሚገኝ ${propertyType}`,
      description: description || `Modern ${propertyType.toLowerCase()} located in prime ${neighborhood}, ${subcity}. Includes backup generator, water reserve tank, and 24/7 security.`,
      descriptionAm: `በ${subcity} ${neighborhood} የሚገኝ ንጹህና ዘመናዊ ${propertyType}። የውሃና መብራት ችግር የሌለበት።`,
      price: Number(price),
      pricePeriod: listingType === 'rent' ? 'month' : 'total',
      currency: 'ETB',
      listingType,
      propertyType,
      city,
      subcity,
      neighborhood,
      address,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      areaSqm: Number(areaSqm),
      floor: Number(floor),
      isFurnished,
      isVerified: user.role === 'admin' || user.role === 'owner',
      isFeatured: false,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'],
      amenities: selectedAmenities,
      owner: {
        id: user.id,
        name: user.name,
        phone,
        email: user.email,
        role: user.role === 'admin' ? 'agency' : (user.role === 'landlord' ? 'landlord' : 'broker'),
        isVerified: user.role === 'admin' || user.role === 'owner',
        rating: 4.9,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        telegram: formattedTelegram,
        whatsapp: whatsapp.trim() || undefined
      },
      hasBackupGenerator: selectedAmenities.includes('generator'),
      hasWaterTank: selectedAmenities.includes('waterTank'),
      hasSecurity: selectedAmenities.includes('security'),
      hasParking: selectedAmenities.includes('parking'),
      hasElevator: selectedAmenities.includes('elevator')
    });

    setNewPropertyId(newProp.id);
    setIsSuccess(true);
  };

  const selectedLoc = ETHIOPIAN_LOCATIONS.find(l => l.city === city);

  if (isSuccess) {
    const isStaff = user?.role === 'admin' || user?.role === 'owner';
    return (
      <div className="bg-slate-50 min-h-screen py-16">
        <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            {isStaff ? t('postSuccessTitle') : 'Property Submitted for Verification!'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {isStaff 
              ? t('postSuccessDesc')
              : 'Your property has been sent to the Owner for verification. Once approved, it will be published live on Bete Finder.'}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
            >
              View In My Properties
            </button>
            <button
              onClick={() => {
                setCurrentView('properties');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
            >
              Browse Property Listings
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setTitle('');
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Post Another Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Direct Landlord & Broker Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('postTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-xl mx-auto">
            {t('postSubtitle')}
          </p>
        </div>

        {/* Post Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8">
          
          {/* Section 1: Basic Purpose & Type */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>{t('postStep1')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('postPurposeLabel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType('rent')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      listingType === 'rent' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    For Rent (የሚከራይ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('sale')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      listingType === 'sale' ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    For Sale (የሚሸጥ)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('postTypeLabel')}
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full py-2.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="Apartment">Apartment (አፓርታማ)</option>
                  <option value="Villa">Villa (ቪላ)</option>
                  <option value="Condominium">Condominium (ኮንዶሚኒየም)</option>
                  <option value="Studio">Studio (ስቱዲዮ)</option>
                  <option value="Commercial">Commercial / Office (የንግድ ቦታ)</option>
                  <option value="Townhouse">Townhouse (ታውንሀውስ)</option>
                  <option value="Guest House">Guest House (የእንግዳ ማረፊያ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postTitleLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern 3-Bedroom Apartment in Bole Atlas"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postTitleAmLabel')}
                </label>
                <input
                  type="text"
                  value={titleAm}
                  onChange={(e) => setTitleAm(e.target.value)}
                  placeholder="ለምሳሌ፡ በቦሌ አትላስ የሚገኝ ዘመናዊ ባለ 3 መኝታ አፓርታማ"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 amharic-font"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('postPriceLabel')} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full p-2.5 pr-20 text-sm font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">
                  ETB {listingType === 'rent' ? '/ Month' : 'Total'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Location & Dimensions */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>{t('postStep2')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postCityLabel')}
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                >
                  {ETHIOPIAN_LOCATIONS.map(loc => (
                    <option key={loc.city} value={loc.city}>{loc.city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postSubcityLabel')}
                </label>
                <select
                  value={subcity}
                  onChange={(e) => setSubcity(e.target.value)}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                >
                  {selectedLoc ? (
                    selectedLoc.subcities.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))
                  ) : (
                    <option value="Central">Central</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postNeighborhoodLabel')}
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. Bole Atlas, CMC Phase 2"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('postAddressLabel')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. In front of Edna Mall, Bole Road"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postBedsLabel')}</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postBathsLabel')}</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postAreaLabel')}</label>
                <input
                  type="number"
                  min="10"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postFloorLabel')}</label>
                <input
                  type="number"
                  min="0"
                  value={floor}
                  onChange={(e) => setFloor(Number(e.target.value))}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Amenities & Photos */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span>{t('postStep3')}</span>
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t('postAmenitiesLabel')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {AMENITIES_LIST.map(amenity => {
                  const isChecked = selectedAmenities.includes(amenity.id);
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isChecked ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{isAmharic ? amenity.amName : amenity.name}</span>
                      {isChecked && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('postPhotosLabel')}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Paste image URL (e.g. Unsplash or hosted photo)"
                  className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Add Image
                </button>
              </div>

              {/* Photos Preview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-16/10 rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={img} alt={`Upload ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Contact & Publish */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>{t('postStep4')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postPhoneLabel')} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 911 223344"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telegram Username (የቴሌግራም ስም) *
                </label>
                <input
                  type="text"
                  required
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                WhatsApp Number (Optional - የዋትስአፕ ቁጥር)
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+251 995 406697 (optional)"
                className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('postDescLabel')}
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail key advantages (e.g. modern elevator, water pressure booster, 24-hour security, proximity to embassies, supermarkets)..."
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Note on Owner verification */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-950 leading-relaxed">
                <p className="font-bold">Owner Quality & Safety Verification</p>
                <p className="text-blue-800/90 text-[11px] mt-0.5">
                  Every submitted property listing is verified by the platform owner to protect buyers and tenants from fraudulent listings.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              id="submit-property-btn"
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:shadow-xl active:scale-99 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('postSubmitBtn')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
