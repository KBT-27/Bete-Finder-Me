import React, { useState, useEffect } from 'react';
import { X, Plus, UserPlus, ArrowLeft, Check, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleUserProfile } from '../../lib/googleAuth';
import { getOwnerCredentials } from '../../lib/passwords';

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (profile: GoogleUserProfile) => void;
  language: 'en' | 'am';
}

const GoogleLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const RECENT_GOOGLE_ACCOUNTS_KEY = 'bete_finder_recent_google_accounts';

export const GoogleAccountChooserModal: React.FC<GoogleAccountChooserModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  language
}) => {
  const [accounts, setAccounts] = useState<GoogleUserProfile[]>([]);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsCustomMode(false);
    setCustomEmail('');
    setCustomName('');
    setCustomError(null);

    const owner = getOwnerCredentials();
    const cleanOwnerEmail = (owner.email || 'kalebbereket49@gmail.com').split('/')[0].toLowerCase();
    const defaultAccounts: GoogleUserProfile[] = [
      {
        id: 'google-owner-primary',
        name: owner.name || 'Kaleb Bereket',
        email: cleanOwnerEmail,
        avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIS8YgD1xYpUaN7c4l6WjZg8M8yBqH3q4y9wR=s96-c',
        verifiedEmail: true
      },
      {
        id: 'google-owner-alt',
        name: 'Kaleb Bereket (Personal)',
        email: 'kalebbereker49@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        verifiedEmail: true
      }
    ];

    try {
      const stored = localStorage.getItem(RECENT_GOOGLE_ACCOUNTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const combined = [...defaultAccounts];
          parsed.forEach((acc: GoogleUserProfile) => {
            if (acc?.email && !combined.some(existing => existing.email.toLowerCase() === acc.email.toLowerCase())) {
              combined.push(acc);
            }
          });
          setAccounts(combined);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load recent Google accounts:', e);
    }

    setAccounts(defaultAccounts);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccountClick = (account: GoogleUserProfile) => {
    // Save to recents
    try {
      const existing = accounts.filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
      const updated = [account, ...existing].slice(0, 5);
      localStorage.setItem(RECENT_GOOGLE_ACCOUNTS_KEY, JSON.stringify(updated));
    } catch (e) {}

    onSelectAccount(account);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    const emailTrimmed = customEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setCustomError(language === 'am' ? 'እባክዎ የ Google ወይም Gmail አድራሻ ያስገቡ።' : 'Please enter your Google or Gmail email address.');
      return;
    }

    if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      setCustomError(language === 'am' ? 'እባክዎ ትክክለኛ የኢሜይል አድራሻ ያስገቡ።' : 'Please enter a valid email address.');
      return;
    }

    const derivedName = customName.trim() || emailTrimmed.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const newProfile: GoogleUserProfile = {
      id: `google-custom-${Date.now()}`,
      name: derivedName,
      email: emailTrimmed,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=0D8ABC&color=fff&rounded=true`,
      verifiedEmail: true
    };

    handleAccountClick(newProfile);
  };

  const isAmharic = language === 'am';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Google Identity Design */}
        <div className="p-6 pb-4 text-center border-b border-slate-100 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 mb-3 shadow-xs">
            <GoogleLogo size={28} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {isAmharic ? 'የ Google መለያ ይምረጡ' : 'Choose an account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isAmharic ? 'ወደ Bete Finder Ethiopia ለመቀጠል' : 'to continue to Bete Finder Ethiopia'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {!isCustomMode ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 px-1">
                {isAmharic ? 'ለመግባት ወይም ለመመዝገብ መለያ ይንኩ፡' : 'Select an account to sign in or register:'}
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {accounts.map((acc, idx) => {
                  const isOwnerAccount = 
                    acc.email.toLowerCase().includes('kalebbereket49@gmail.com') ||
                    acc.email.toLowerCase().includes('kalebbereker49@gmail.com');

                  return (
                    <button
                      key={acc.email + idx}
                      type="button"
                      onClick={() => handleAccountClick(acc)}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all flex items-center gap-3.5 group cursor-pointer shadow-xs hover:shadow-md"
                    >
                      <div className="relative shrink-0">
                        {acc.avatar ? (
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 group-hover:border-blue-400"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                            {acc.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {isOwnerAccount && (
                          <span 
                            title="Owner Verified"
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] ring-2 ring-white"
                          >
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-700">
                            {acc.name}
                          </p>
                          {isOwnerAccount && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-sm border border-amber-300 shrink-0">
                              {isAmharic ? 'ባለቤት' : 'Owner'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate group-hover:text-slate-700 font-mono">
                          {acc.email}
                        </p>
                      </div>

                      <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white rounded-lg transition-all">
                          {isAmharic ? 'ምረጥ' : 'Select'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>


              {/* Use Another Account Button */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full p-3.5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-slate-50 text-left transition-all flex items-center gap-3.5 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                    {isAmharic ? 'ሌላ የ Google መለያ ይጠቀሙ' : 'Use another Google account'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {isAmharic ? 'የእርስዎን Gmail አድራሻ ያስገቡ' : 'Sign in with any other Google / Gmail address'}
                  </p>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </button>
            </div>
          ) : (
            /* Custom Account Form */
            <form onSubmit={handleCustomSubmit} className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomError(null);
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700">
                  {isAmharic ? 'ወደ መለያ ዝርዝር ተመለስ' : 'Back to account list'}
                </span>
              </div>

              {customError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{customError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የ Google / Gmail አድራሻዎ *' : 'Google / Gmail Email Address *'}
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'የእርስዎ ስም (አማራጭ)' : 'Your Full Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Abebe Bikila"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <GoogleLogo size={16} />
                <span>{isAmharic ? 'በዚህ መለያ ይቀጥሉ' : 'Continue with this Account'}</span>
              </button>
            </form>
          )}

          {/* Privacy & Terms Note (Google Style) */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center leading-relaxed">
            {isAmharic ? (
              <p>
                ለመቀጠል Google ስምዎን፣ የኢሜይል አድራሻዎን እና የመገለጫ ፎቶዎን ለ Bete Finder ያጋራል።
              </p>
            ) : (
              <p>
                To continue, Google will share your name, email address, and profile picture with Bete Finder.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
