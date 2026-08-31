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
  Droplets,
  Layers,
  Check,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { ETHIOPIAN_LOCATIONS, AMENITIES_LIST } from '../../data/ethiopianLocations';
import { PropertyType, ListingType } from '../../types';

export const PostPropertyView: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { addProperty, setCurrentView } = useProperties();
  const { user, setIsAuthModalOpen } = useAuth();

  // 1. Basic Info - NO Auto-fill
  const [title, setTitle] = useState('');
  const [titleAm, setTitleAm] = useState('');
  const [listingType, setListingType] = useState<ListingType>('rent');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  
  // Floor House specific fields
  const [floorSize, setFloorSize] = useState<string>(''); // e.g. G+2, G+4
  const [customFloorSize, setCustomFloorSize] = useState<string>('');
  const [finishingStatus, setFinishingStatus] = useState<'finished' | 'unfinished' | ''>('');

  // 2. Location & Specs - NO Auto-fill
  const [city, setCity] = useState('');
  const [subcity, setSubcity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [bathrooms, setBathrooms] = useState<number | ''>('');
  const [areaSqm, setAreaSqm] = useState<number | ''>('');
  const [floor, setFloor] = useState<number | ''>('');
  const [isFurnished, setIsFurnished] = useState<boolean>(false);

  // 3. Amenities & Photos - NO Auto-fill
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // 4. Contact & Publish - NO Auto-fill
  const [phone, setPhone] = useState(user?.phone || '');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAmenityToggle = (id: string) => {
    setSelectedAmenities(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAddImageUrl = () => {
    if (customImageUrl.trim()) {
      setImages(prev => [...prev, customImageUrl.trim()]);
      setCustomImageUrl('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const result = uploadEvent.target?.result as string;
          if (result) {
            setImages(prev => [...prev, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
    // Reset file input
    e.target.value = '';
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!propertyType) {
      setFormError(isAmharic ? 'እባክዎ የቤት ዓይነት ይምረጡ' : 'Please select a property type');
      return;
    }

    if (!price || Number(price) <= 0) {
      setFormError(isAmharic ? 'እባክዎ ትክክለኛ ዋጋ ያስገቡ' : 'Please enter a valid price');
      return;
    }

    if (!city) {
      setFormError(isAmharic ? 'እባክዎ ከተማ ይምረጡ' : 'Please select a city');
      return;
    }

    if (propertyType === 'Floor House' && !finishingStatus) {
      setFormError(isAmharic ? 'እባክዎ የቤቱን አጨራረስ ሁኔታ (ያለቀለት ወይስ ያልተጠናቀቀ) ይምረጡ' : 'Please select whether the Floor House is Finished or Unfinished');
      return;
    }

    const effectiveFloorSize = floorSize === 'other' ? customFloorSize.trim() : floorSize;
    const formattedTelegram = telegram.trim() 
      ? (telegram.trim().startsWith('@') ? telegram.trim() : `@${telegram.trim()}`)
      : undefined;

    const locLabel = neighborhood ? `${neighborhood}, ${subcity || city}` : (subcity ? `${subcity}, ${city}` : city);
    const generatedTitle = title.trim() || `${effectiveFloorSize ? `${effectiveFloorSize} ` : ''}${propertyType} in ${locLabel}`;
    const generatedTitleAm = titleAm.trim() || `በ${locLabel} የሚገኝ ${effectiveFloorSize ? `${effectiveFloorSize} ` : ''}${propertyType === 'Floor House' ? 'ፎቅ ቤት' : propertyType}`;

    const defaultImages = images.length > 0 
      ? images 
      : ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80'];

    addProperty({
      title: generatedTitle,
      titleAm: generatedTitleAm,
      description: description.trim() || (isAmharic ? `በ${locLabel} የሚገኝ ${propertyType}።` : `Well maintained ${propertyType.toLowerCase()} in ${locLabel}.`),
      descriptionAm: description.trim() || `በ${locLabel} የሚገኝ ${propertyType === 'Floor House' ? 'ፎቅ ቤት' : propertyType}።`,
      price: Number(price),
      pricePeriod: listingType === 'rent' ? 'month' : 'total',
      currency: 'ETB',
      listingType,
      propertyType: propertyType as PropertyType,
      floorSize: effectiveFloorSize || undefined,
      finishingStatus: finishingStatus || undefined,
      city: city || 'Addis Ababa',
      subcity: subcity || 'Central',
      neighborhood: neighborhood || '',
      address: address || '',
      bedrooms: bedrooms ? Number(bedrooms) : 0,
      bathrooms: bathrooms ? Number(bathrooms) : 0,
      areaSqm: areaSqm ? Number(areaSqm) : 0,
      floor: floor ? Number(floor) : undefined,
      isFurnished: Boolean(isFurnished),
      isVerified: user.role === 'admin' || user.role === 'owner',
      isFeatured: false,
      images: defaultImages,
      amenities: selectedAmenities,
      owner: {
        id: user.id,
        name: user.name,
        phone: phone.trim() || user.phone || '+251 900 000000',
        email: user.email,
        role: user.role === 'admin' ? 'agency' : (user.role === 'landlord' ? 'landlord' : 'broker'),
        isVerified: user.role === 'admin' || user.role === 'owner',
        rating: 5.0,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        telegram: formattedTelegram,
        whatsapp: whatsapp.trim() || undefined
      },
      hasBackupGenerator: selectedAmenities.includes('generator'),
      hasWaterTank: selectedAmenities.includes('waterTank'),
      hasSecurity: selectedAmenities.includes('security'),
      hasParking: selectedAmenities.includes('parking'),
      hasElevator: selectedAmenities.includes('elevator')
    });

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
            {isStaff ? t('postSuccessTitle') : (isAmharic ? 'የቤት መረጃው በተሳካ ሁኔታ ተልኳል!' : 'Property Submitted for Verification!')}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {isStaff 
              ? t('postSuccessDesc')
              : (isAmharic 
                  ? 'የለጠፉት ቤት መረጃ ትክክለኛነቱ ተረጋግጦ ወዲያውኑ በቤቴ ፈላጊ ላይ ይታያል።'
                  : 'Your property has been submitted. Once verified by the platform admin, it will be published live on Bete Finder.')}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
            >
              {isAmharic ? 'ወደ እኔ ቤቶች ሂድ' : 'View In My Properties'}
            </button>
            <button
              onClick={() => {
                setCurrentView('properties');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሁሉንም ቤቶች አስስ' : 'Browse Property Listings'}
            </button>
            <button
              onClick={() => {
                setIsSuccess(false);
                setTitle('');
                setTitleAm('');
                setPrice('');
                setPropertyType('');
                setFloorSize('');
                setCustomFloorSize('');
                setFinishingStatus('');
                setCity('');
                setSubcity('');
                setNeighborhood('');
                setAddress('');
                setBedrooms('');
                setBathrooms('');
                setAreaSqm('');
                setFloor('');
                setIsFurnished(false);
                setSelectedAmenities([]);
                setImages([]);
                setTelegram('');
                setWhatsapp('');
                setDescription('');
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              {isAmharic ? 'ሌላ ቤት ያስተዋውቁ' : 'Post Another Property'}
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
            <span>{isAmharic ? 'ቀጥተኛ የቤት ማስተዋወቂያ' : 'Direct Landlord & Broker Portal'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t('postTitle')}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-xl mx-auto">
            {t('postSubtitle')}
          </p>
        </div>

        {formError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-bold flex items-center gap-2 animate-shake">
            <Info className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Post Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-md space-y-8">
          
          {/* Section 1: Basic Purpose & Type */}
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{t('postStep1')}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">Step 1 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('postPurposeLabel')} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType('rent')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      listingType === 'rent' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    For Rent (የሚከራይ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('sale')}
                    className={`py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      listingType === 'sale' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    For Sale (የሚሸጥ)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t('postTypeLabel')} *
                </label>
                <select
                  required
                  value={propertyType}
                  onChange={(e) => {
                    setPropertyType(e.target.value as PropertyType);
                  }}
                  className="w-full py-2.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer"
                >
                  <option value="" disabled>-- {isAmharic ? 'የቤት ዓይነት ይምረጡ' : 'Select Property Type'} --</option>
                  <option value="Apartment">Apartment (አፓርታማ)</option>
                  <option value="Villa">Villa (ቪላ)</option>
                  <option value="Floor House">Floor House (ፎቅ ቤት)</option>
                  <option value="Condominium">Condominium (ኮንዶሚኒየም)</option>
                  <option value="Studio">Studio (ስቱዲዮ)</option>
                  <option value="Commercial">Commercial / Office (የንግድ ቦታ)</option>
                  <option value="Townhouse">Townhouse (ታውንሀውስ)</option>
                  <option value="Guest House">Guest House (የእንግዳ ማረፊያ)</option>
                </select>
              </div>
            </div>

            {/* CONDITIONAL SECTION: Floor House (ፎቅ ቤት) Details */}
            {propertyType === 'Floor House' && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50/70 via-purple-50/50 to-indigo-50/70 border-2 border-violet-200 space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 text-violet-900 border-b border-violet-200/80 pb-2.5">
                  <Layers className="w-5 h-5 text-violet-600" />
                  <span className="font-extrabold text-sm">
                    {isAmharic ? 'የፎቅ ቤት ዝርዝር መረጃ (Floor House Details)' : 'Floor House Specifications'}
                  </span>
                </div>

                {/* 1. Floor Size Question (e.g. G+2, G+4) */}
                <div>
                  <label className="block text-xs font-bold text-violet-950 mb-2">
                    {isAmharic ? 'የፎቅ መጠን (Floor Size / Structure) *' : 'Floor Size / Structure (e.g. G+2, G+4) *'}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {['G+1', 'G+2', 'G+3', 'G+4', 'G+5', 'G+6+'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setFloorSize(sz);
                          setCustomFloorSize('');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          floorSize === sz 
                            ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20 scale-102' 
                            : 'bg-white text-violet-900 border border-violet-200 hover:bg-violet-100/70'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFloorSize('other')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        floorSize === 'other'
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
                          : 'bg-white text-violet-900 border border-violet-200 hover:bg-violet-100/70'
                      }`}
                    >
                      {isAmharic ? 'ሌላ መጠን' : 'Other Size'}
                    </button>
                  </div>

                  {floorSize === 'other' && (
                    <input
                      type="text"
                      value={customFloorSize}
                      onChange={(e) => setCustomFloorSize(e.target.value)}
                      placeholder={isAmharic ? 'ለምሳሌ፡ Basement + G+2, G+3 ከቴራስ ጋር...' : 'e.g. Basement + G+2, G+3 with Rooftop...'}
                      className="w-full p-2.5 text-xs sm:text-sm bg-white border border-violet-300 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-violet-500"
                    />
                  )}
                </div>

                {/* 2. Finished Or Unfinished Question */}
                <div>
                  <label className="block text-xs font-bold text-violet-950 mb-2">
                    {isAmharic ? 'ቤቱ ያለቀለት ወይስ ያልተጠናቀቀ ነው? (Finished Or Unfinished?) *' : 'Is the house Finished Or Unfinished? *'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFinishingStatus('finished')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                        finishingStatus === 'finished'
                          ? 'bg-white border-emerald-500 text-emerald-950 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white/70 border-violet-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        finishingStatus === 'finished' ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                      }`}>
                        {finishingStatus === 'finished' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {isAmharic ? 'የተጠናቀቀ / ያለቀለት ቤት' : 'Finished House (የተጠናቀቀ)'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {isAmharic ? 'ሙሉ በሙሉ የተጠናቀቀና ለኑሮ ወይም ለስራ ዝግጁ የሆነ' : 'Fully completed, ready for immediate move-in or operation.'}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFinishingStatus('unfinished')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                        finishingStatus === 'unfinished'
                          ? 'bg-white border-amber-500 text-amber-950 shadow-md ring-2 ring-amber-500/20'
                          : 'bg-white/70 border-violet-200 text-slate-700 hover:bg-white'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        finishingStatus === 'unfinished' ? 'bg-amber-600 text-white' : 'border border-slate-300'
                      }`}>
                        {finishingStatus === 'unfinished' && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-900">
                          {isAmharic ? 'ያልተጠናቀቀ / ከፊል ያለቀ' : 'Unfinished House (ያልተጠናቀቀ)'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                          {isAmharic ? 'ግንባታው በመካሄድ ላይ ያለ ወይም በራስ ምርጫ ለማጠናቀቅ የሚሸጥ/የሚከራይ' : 'Under construction, structure only, or semi-finished.'}
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postTitleLabel')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern G+2 Floor House in Bole Atlas"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
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
                  placeholder="ለምሳሌ፡ በቦሌ አትላስ የሚገኝ ዘመናዊ ጂ+2 ፎቅ ቤት"
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 amharic-font focus:bg-white focus:ring-2 focus:ring-emerald-500"
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
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 55000"
                  className="w-full p-2.5 pr-24 text-sm font-extrabold bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700 pointer-events-none">
                  ETB {listingType === 'rent' ? '/ Month' : 'Total'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Location & Dimensions */}
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>{t('postStep2')}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">Step 2 of 4</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('postCityLabel')} *
                </label>
                <select
                  required
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSubcity('');
                  }}
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>-- {isAmharic ? 'ከተማ ይምረጡ' : 'Select City'} --</option>
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
                  className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- {isAmharic ? 'ክፍለ ከተማ ይምረጡ' : 'Select Subcity'} --</option>
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
                  placeholder="e.g. Bole Atlas, CMC Phase 2, Gerji"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
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
                placeholder="e.g. Near Atlas Hotel, behind Edna Mall"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postBedsLabel')}</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 3"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postBathsLabel')}</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 2"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postAreaLabel')}</label>
                <input
                  type="number"
                  min="1"
                  value={areaSqm}
                  onChange={(e) => setAreaSqm(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 150"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t('postFloorLabel')}</label>
                <input
                  type="number"
                  min="0"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 2"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFurnished}
                  onChange={(e) => setIsFurnished(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  {isAmharic ? 'የቤት ዕቃዎች የተሟሉለት (Furnished)' : 'Fully Furnished (የቤት ዕቃ ያለው)'}
                </span>
              </label>
            </div>
          </div>

          {/* Section 3: Amenities & Photos */}
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                <span>{t('postStep3')}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">Step 3 of 4</span>
            </div>

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
              
              {/* File Upload or URL input */}
              <div className="space-y-3 mb-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Paste image link URL (e.g. hosted photo)"
                    className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1 py-3 px-4 bg-emerald-50/60 hover:bg-emerald-50 border border-dashed border-emerald-300 rounded-xl flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>{isAmharic ? 'ፎቶዎችን ከስልክ/ኮምፒውተር ይምረጡ' : 'Upload photos from device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Photos Preview Grid */}
              {images.length > 0 ? (
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
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>{isAmharic ? 'ምንም ፎቶ አልተጨመረም (ፎቶ ባይኖርም ነባሪ ፎቶ ይሰጠዋል)' : 'No photos added yet (optional, default photo will be used if empty)'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Contact & Publish */}
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>{t('postStep4')}</span>
              </h2>
              <span className="text-xs font-semibold text-slate-400">Step 4 of 4</span>
            </div>

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
                  placeholder="+251 9... or 09..."
                  className="w-full p-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telegram Username (የቴሌግራም ስም)
                </label>
                <input
                  type="text"
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
                placeholder="+251 9... (optional)"
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
                placeholder={isAmharic ? 'ስለ ቤቱ ተጨማሪ ማብራሪያ (ለምሳሌ፡ የውሃና መብራት ሁኔታ፣ የመኪና ማቆሚያ፣ አካባቢው ያለው ምቾት)...' : 'Detail key advantages (e.g. power backup, water reserve tank, 24/7 security, proximity to main road, compound size)...'}
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Note on Owner verification */}
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-950 leading-relaxed">
                <p className="font-bold">{isAmharic ? 'የጥራት እና ደህንነት ማረጋገጫ' : 'Owner Quality & Safety Verification'}</p>
                <p className="text-blue-800/90 text-[11px] mt-0.5">
                  {isAmharic 
                    ? 'ሁሉም የሚለጠፉ ቤቶች ደንበኞችን ከአጭበርባሪ ለመጠበቅና ትክክለኛ መረጃ ለማረጋገጥ በቤቴ ፈላጊ አስተዳዳሪ ጸድቀው ይለቀቃሉ።'
                    : 'Every submitted property listing is verified by the platform owner to protect buyers and tenants from fraudulent listings.'}
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
