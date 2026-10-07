import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  Sparkles, 
  Crown, 
  RefreshCw, 
  ShieldCheck, 
  Link as LinkIcon, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  DEFAULT_OWNER_PHOTO, 
  AVATAR_PRESETS, 
  processUploadedImage 
} from '../../constants/ownerAvatar';

interface ChangePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePhotoModal: React.FC<ChangePhotoModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, ownerCredentials, updateOwnerSecurity } = useAuth();
  const { language } = useLanguage();
  const isAmharic = language === 'am';

  const isOwner = user?.role === 'owner' || user?.email?.endsWith('/owner');

  const currentPhoto = user?.avatar || (isOwner ? (ownerCredentials?.avatar || DEFAULT_OWNER_PHOTO) : DEFAULT_OWNER_PHOTO);
  
  const [selectedPhoto, setSelectedPhoto] = useState<string>(currentPhoto);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const optimizedDataUrl = await processUploadedImage(file);
      setSelectedPhoto(optimizedDataUrl);
      setSuccessMsg(isAmharic ? 'ፎቶው በተሳካ ሁኔታ ተመርጧል! "ፎቶ አስቀምጥ" የሚለውን ይጫኑ።' : 'Photo loaded! Click "Save Photo" to apply.');
    } catch (err: any) {
      setErrorMsg(err?.message || (isAmharic ? 'ፎቶውን ማስገባት አልተቻለም። እባክዎ እንደገና ይሞክሩ።' : 'Failed to process image. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const photoToSave = selectedPhoto.trim();

      // 1. Update active user context and persistent store
      updateUser({ avatar: photoToSave });

      // 2. If Owner, also update Owner Master Credentials explicitly
      if (isOwner) {
        updateOwnerSecurity(
          ownerCredentials.email,
          ownerCredentials.password,
          ownerCredentials.name,
          ownerCredentials.phone,
          photoToSave,
          ownerCredentials.bio
        );
      }

      setSuccessMsg(isAmharic ? 'የመለያ ፎቶዎ በተሳካ ሁኔታ ተቀይሯል!' : 'Profile photo successfully updated!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || (isAmharic ? 'ፎቶውን ማስቀመጥ አልተቻለም።' : 'Failed to save photo.'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToOfficialOwner = () => {
    setSelectedPhoto(DEFAULT_OWNER_PHOTO);
    setSuccessMsg(isAmharic ? 'የባለቤቱ ይፋዊ ፎቶ ተመርጧል!' : 'Selected official Kaleb Bereket Owner photo!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  {isAmharic ? 'የመለያ ፎቶ ቀይር' : 'Change Profile Photo'}
                </h2>
                {isOwner && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>OWNER</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {isOwner 
                  ? (isAmharic ? 'የይፋዊ ባለቤት ካሌብ በረከት ፎቶ እና ማስተካከያ' : 'Update the official Owner photo across Bete Finder') 
                  : (isAmharic ? 'የእርስዎን መለያ ፎቶ ይምረጡ ወይም ያስገቡ' : 'Choose or upload your profile picture')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Owner Highlight Banner */}
          {isOwner && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 text-amber-950 text-xs flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-900">
                  {isAmharic ? 'ይፋዊ የባለቤት ፎቶ አስተዳዳሪ (ካሌብ በረከት)' : 'Official Owner Identity (Kaleb Bereket)'}
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5 leading-relaxed">
                  {isAmharic 
                    ? 'የተጫነውን ፎቶ (መነጽር ያደረጉበት እና የምስክር ወረቀት የያዙበት) ወይም የራስዎን አዲስ ፎቶ በመጫን በሁሉም ቦታ የባለቤቱ ይፋዊ ፎቶ እንዲሆን ማድረግ ይችላሉ።'
                    : 'Set your official owner school portrait (holding certificate with sunglasses) or upload your photo directly to display as the Master Owner across all listings and feedback.'}
                </p>
              </div>
            </div>
          )}

          {/* Current & Live Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative shrink-0">
              <img
                src={selectedPhoto || DEFAULT_OWNER_PHOTO}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl ring-2 ring-indigo-500/30"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_OWNER_PHOTO;
                }}
              />
              {isOwner && (
                <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-lg border-2 border-white">
                  <Crown className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm font-black text-slate-900">{user.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 capitalize">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500">{user.email}</p>
              <div className="pt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleResetToOfficialOwner}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>{isAmharic ? 'የካሌብ ይፋዊ ፎቶ ምረጥ' : 'Use Official Kaleb Photo'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ከመሳሪያዎ ጫን' : 'Upload File'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presets' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'ዝግጁ ፎቶዎች' : 'Preset Avatars'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'url' 
                  ? 'bg-white text-indigo-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'በሊንክ (URL)' : 'Image URL'}</span>
            </button>
          </div>

          {/* TAB 1: Upload from Device */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/30 hover:bg-indigo-50/70 rounded-2xl p-6 text-center cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {isAmharic ? 'ፎቶ ለመምረጥ እዚህ ይጫኑ' : 'Click to upload photo from your device'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isAmharic ? 'JPG, PNG, WebP (ከስልክዎ ወይም ኮምፒውተር)' : 'JPG, PNG, WebP supported from phone or computer'}
                </p>
                <button
                  type="button"
                  className="mt-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  {isAmharic ? 'ፎቶ ምረጥ...' : 'Browse Image...'}
                </button>
              </div>

              {isOwner && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isAmharic 
                      ? 'የተጫነው ፎቶ ወዲያውኑ የባለቤቱ ይፋዊ ፎቶ ሆኖ በመላው መተግበሪያው ላይ ይተገበራል።' 
                      : 'Uploaded image will automatically become the verified Owner photo across the entire system.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600">
                {isAmharic ? 'የተዘጋጁ ምርጥ ፎቶዎችን ይምረጡ' : 'Select from curated avatars'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedPhoto === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(preset.url);
                        setErrorMsg(null);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_OWNER_PHOTO;
                          }}
                        />
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white p-0.5 rounded-full shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {isAmharic ? preset.nameAmharic : preset.name}
                        </p>
                        {preset.badge && (
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                            preset.category === 'owner'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {preset.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Image URL */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {isAmharic ? 'የፎቶው ድረ-ገጽ ሊንክ (Image URL)' : 'Paste Custom Image URL'}
              </label>
              <div className="relative">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://example.com/my-photo.jpg"
                  className="w-full pl-9 pr-20 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={!customUrl.trim()}
                  onClick={() => {
                    if (customUrl.trim()) {
                      setSelectedPhoto(customUrl.trim());
                      setCustomUrl('');
                    }
                  }}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  {isAmharic ? 'ተግብር' : 'Apply'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                {isAmharic 
                  ? 'የማንኛውንም ይፋዊ ምስል ሊንክ እዚህ በማስገባት መጠቀም ይችላሉ።' 
                  : 'Enter direct image URL (.jpg, .png, .webp).'}
              </p>
            </div>
          )}

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
          >
            {isAmharic ? 'ሰርዝ' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={isProcessing || selectedPhoto === currentPhoto}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{isAmharic ? 'ፎቶ አስቀምጥ' : 'Save Photo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
