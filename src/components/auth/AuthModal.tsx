import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Home,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth, AuthModalMode } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ResetPasswordView } from './ResetPasswordView';
import { isSlashAllowedForPassword, getRegisteredUsers } from '../../lib/passwords';
import { authenticateWithGoogle, GoogleUserProfile } from '../../lib/googleAuth';

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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

export const AuthModal: React.FC = () => {
  const { t, language } = useLanguage();
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen, 
    login, 
    signup,
    loginWithGoogle,
    requestPasswordReset,
    changePassword,
    authModalInitialMode,
    setAuthModalInitialMode,
    activeResetToken,
    setActiveResetToken
  } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(authModalInitialMode || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('tenant');
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<{
    name: string;
    email: string;
    avatar: string;
  } | null>(null);
  
  // Loading and alerts
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDeliveredViaSmtp, setIsDeliveredViaSmtp] = useState<boolean>(false);

  useEffect(() => {
    if (authModalInitialMode) {
      setMode(authModalInitialMode);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeliveredViaSmtp(false);
    setPendingGoogleProfile(null);
  }, [authModalInitialMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setPendingGoogleProfile(null);
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      // Direct Google Sign-In with configured/given Google Client ID
      const authRes = await authenticateWithGoogle();

      if (authRes.success && authRes.profile) {
        await handleSelectGoogleAccount(authRes.profile);
      } else if (authRes.error && !authRes.error.includes('closed') && !authRes.error.includes('cancel')) {
        setErrorMessage(authRes.error);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMessage(language === 'am' ? 'የ Google መግባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።' : 'Google sign-in could not be completed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (profile: GoogleUserProfile) => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { email: gEmail, name: gName, avatar: gAvatar } = profile;
      const gEmailNorm = (gEmail || '').trim().toLowerCase();
      const registered = getRegisteredUsers();
      const existing = registered.find(u => (u.email || '').trim().toLowerCase() === gEmailNorm);

      const isOwnerEmail = 
        gEmailNorm === 'kalebbereket49@gmail.com' ||
        gEmailNorm === 'kalebbereker49@gmail.com';

      if (existing || isOwnerEmail) {
        // Existing user or owner - log in directly with their profile role
        const targetRole = isOwnerEmail ? 'owner' : (existing?.role || 'tenant');
        const res = await loginWithGoogle(targetRole, profile);
        if (res.success) {
          setSuccessMessage(
            language === 'am' 
              ? `በ Google (${gEmail}) በተሳካ ሁኔታ ገብተዋል!` 
              : `Successfully signed in as ${gName || gEmail}!`
          );
          setTimeout(() => {
            handleClose();
          }, 600);
        } else {
          setErrorMessage(res.message || 'Google login failed.');
        }
      } else {
        // New user registering with Google!
        if (mode === 'signup') {
          // In Sign Up mode, the user has selected their "I am a..." role
          const res = await loginWithGoogle(selectedRole, profile);
          if (res.success) {
            setSuccessMessage(
              language === 'am'
                ? `በ Google (${gEmail}) እንደ ${selectedRole === 'tenant' ? 'ተከራይ/ገዢ' : 'አከራይ'} በተሳካ ሁኔታ ተመዝግበዋል!`
                : `Successfully registered with Google as ${selectedRole === 'tenant' ? 'Tenant / Buyer' : 'Landlord'}!`
            );
            setTimeout(() => {
              handleClose();
            }, 600);
          } else {
            setErrorMessage(res.message || 'Google registration failed.');
          }
        } else {
          // Clicked from Sign In tab, ask "I am a..." to complete registration
          setPendingGoogleProfile({
            name: gName || 'Google User',
            email: gEmail,
            avatar: gAvatar || 'https://lh3.googleusercontent.com/a/ACg8ocIS8YgD1xYpUaN7c4l6WjZg8M8yBqH3q4y9wR=s96-c'
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In error.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteGoogleRegistration = async () => {
    if (!pendingGoogleProfile) return;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await loginWithGoogle(selectedRole, pendingGoogleProfile);
      if (res.success) {
        setSuccessMessage(
          language === 'am'
            ? `በ Google እንደ ${selectedRole === 'tenant' ? 'ተከራይ/ገዢ' : 'አከራይ'} በተሳካ ሁኔታ ተመዝግበዋል!`
            : `Successfully registered with Google as ${selectedRole === 'tenant' ? 'Tenant / Buyer' : 'Landlord'}!`
        );
        setTimeout(() => {
          handleClose();
        }, 600);
      } else {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Registration error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage(language === 'am' ? 'እባክዎ የ Gmail አድራሻ ያስገቡ።' : 'Please enter an email address.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const result = login(email, password);
        if (result.success) {
          handleClose();
          setEmail('');
          setPassword('');
        } else {
          setErrorMessage(result.message || (language === 'am' ? 'መግባት አልተሳካም። እባክዎ መረጃዎን ይፈትሹ።' : 'Login failed. Please check your credentials.'));
        }
      } else if (mode === 'signup') {
        if (!password.trim() || password.length < 6) {
          setErrorMessage(language === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።' : 'Password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        if (!isSlashAllowedForPassword(email, password)) {
          setErrorMessage(language === 'am' 
            ? 'የ "/" ምልክት በይለፍ ቃል ውስጥ ለአድሚንና ለባለቤት መለያዎች ብቻ የተፈቀደ ነው።'
            : "The '/' symbol in passwords is reserved for Admin and Owner accounts only.");
          setIsLoading(false);
          return;
        }
        const result = signup({
          name: name.trim() || email.split('@')[0],
          email: email.trim(),
          phone: phone.trim() || '+251995406697',
          password: password.trim(),
          role: selectedRole
        });
        if (result.success) {
          setSuccessMessage(language === 'am' ? 'መለያዎ በተሳካ ሁኔታ ተመዝግቧል!' : 'Account registered successfully! Logging you in...');
          setTimeout(() => {
            handleClose();
            setEmail('');
            setPassword('');
            setName('');
            setPhone('');
          }, 800);
        } else {
          setErrorMessage(result.message || (language === 'am' ? 'ምዝገባ አልተሳካም።' : 'Registration failed.'));
        }
      } else if (mode === 'forgot') {
        const trimmedEmail = email.trim().toLowerCase();
        const trimmedPhone = phone.trim();

        if (!trimmedEmail) {
          setErrorMessage(language === 'am' ? 'እባክዎ የተመዘገበውን Gmail / ኢሜይል ያስገቡ።' : 'Please enter your registered Gmail / Email address.');
          setIsLoading(false);
          return;
        }

        if (!trimmedPhone) {
          setErrorMessage(language === 'am' ? 'እባክዎ የተመዘገበውን ስልክ ቁጥር ያስገቡ።' : 'Please enter your registered Phone Number.');
          setIsLoading(false);
          return;
        }

        if (trimmedEmail.includes('/')) {
          const isRoleAllowed = trimmedEmail.endsWith('/admin') || trimmedEmail.endsWith('/owner');
          if (!isRoleAllowed) {
            setErrorMessage(language === 'am' 
              ? 'የ "/" ምልክት ለአድሚንና ለባለቤት መለያዎች ብቻ የተፈቀደ ነው።' 
              : 'The "/" symbol in email is reserved for Admin and Owner accounts only.');
            setIsLoading(false);
            return;
          }
        }

        const res = await requestPasswordReset(trimmedEmail, trimmedPhone);
        if (res.success) {
          setIsDeliveredViaSmtp(Boolean(res.delivered));
          setSuccessMessage(res.message || (language === 'am'
            ? 'ባለ 6 አሃዝ የማረጋገጫ ቁጥር ወደ Gmail Primary Inbox ተልኳል!'
            : 'A 6-digit verification code has been dispatched to your Gmail Primary Inbox.'));
        } else {
          setErrorMessage(res.message || (language === 'am'
            ? 'የገቡት Gmail እና ስልክ ቁጥር በመረጃ ቋቱ ከተመዘገበ መለያ ጋር አይዛመድም።'
            : 'The entered Gmail and Phone Number do not match any registered account in the database.'));
        }
      } else if (mode === 'change') {
        // Change Password Handler: Asks for Gmail, Phone, Current Password, New Password
        if (!currentPassword.trim()) {
          setErrorMessage(language === 'am' ? 'እባክዎ የአሁኑን የይለፍ ቃል ያስገቡ።' : 'Please enter your current password.');
          setIsLoading(false);
          return;
        }
        if (!newPassword.trim() || newPassword.trim().length < 6) {
          setErrorMessage(language === 'am' ? 'አዲሱ የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት።' : 'New password must be at least 6 characters.');
          setIsLoading(false);
          return;
        }

        if (!isSlashAllowedForPassword(email, newPassword)) {
          setErrorMessage(language === 'am'
            ? 'የ "/" ምልክት በይለፍ ቃል ውስጥ ለአድሚንና ለባлеቤት መለያዎች ብቻ የተፈቀደ ነው።'
            : "The '/' symbol in passwords is reserved for Admin and Owner accounts only.");
          setIsLoading(false);
          return;
        }

        const res = await changePassword({
          email: email.trim(),
          phone: phone.trim(),
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        });

        if (res.success) {
          setSuccessMessage(res.message || (language === 'am' ? 'የይለፍ ቃልዎ በተሳካ ሁኔታ ተቀይሯል!' : 'Your password has been changed successfully!'));
          setTimeout(() => {
            setMode('signin');
            setPassword(newPassword.trim());
            setCurrentPassword('');
            setNewPassword('');
          }, 1200);
        } else {
          setErrorMessage(res.message || (language === 'am' ? 'የይለፍ ቃል መቀየር አልተሳካም።' : 'Failed to change password.'));
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-auto border border-slate-100 max-h-[95vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          id="auth-modal-close-btn"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3 shadow-inner">
            {mode === 'forgot' ? (
              <KeyRound className="w-6 h-6" />
            ) : mode === 'change' ? (
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'signin' && t('authSignInTitle')}
            {mode === 'signup' && t('authSignUpTitle')}
            {mode === 'forgot' && (language === 'am' ? 'የይለፍ ቃል ማረጋገጫ' : 'Reset Forgotten Password')}
            {mode === 'change' && (language === 'am' ? 'የይለፍ ቃል ቀይር' : 'Change Password')}
            {mode === 'reset' && (language === 'am' ? 'አዲስ የይለፍ ቃል ይፍጠሩ' : 'Set New Password')}
          </h2>
          {(mode === 'forgot' || mode === 'change' || mode === 'reset') && (
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'forgot' && (language === 'am' 
                ? 'የ Gmail አድራሻዎን ያስገቡ፤ ባለ 6 አሃዝ የማረጋገጫ ቁጥር ወዲያውኑ ይላክልዎታል'
                : 'Enter your Gmail address to receive an automatic 6-digit verification code in your Primary Inbox')}
              {mode === 'change' && (language === 'am'
                ? 'የ Gmail አድራሻዎን፣ ስልክ ቁጥርዎን፣ የአሁኑን እና አዲሱን የይለፍ ቃል ያስገቡ'
                : 'Enter your Gmail, phone number, current password, and new password')}
              {mode === 'reset' && (language === 'am'
                ? 'አዲሱን የይለፍ ቃልዎን እዚህ ያስገቡ'
                : 'Enter the 6-digit code received in your email to set a new password')}
            </p>
          )}
        </div>

        {/* Mode Switcher Tabs - Strictly Sign In and Sign Up only */}
        {mode !== 'reset' && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('authSignInTab')}
            </button>
            <button
              type="button"
              id="auth-tab-signup"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('authSignUpTab')}
            </button>
          </div>
        )}

        {/* Reset Password View */}
        {mode === 'reset' ? (
          <ResetPasswordView 
            initialToken={activeResetToken || ''}
            onSuccess={() => {
              setSuccessMessage(language === 'am' ? 'የይለፍ ቃልዎ ተቀይሯል! አሁን መግባት ይችላሉ።' : 'Password reset successfully! Please sign in with your new password.');
              setMode('signin');
            }}
            onCancel={() => setMode('signin')}
          />
        ) : pendingGoogleProfile ? (
          /* Google New User Role Selection Prompt */
          <div className="py-2 animate-fade-in text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full border-2 border-emerald-500 overflow-hidden shadow-md bg-slate-100 flex items-center justify-center">
              {pendingGoogleProfile.avatar ? (
                <img 
                  src={pendingGoogleProfile.avatar} 
                  alt={pendingGoogleProfile.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCheck className="w-8 h-8 text-emerald-600" />
              )}
            </div>

            <h3 className="text-base font-black text-slate-900 mb-1">
              {language === 'am' ? `እንኳን ደህና መጡ ${pendingGoogleProfile.name}!` : `Welcome, ${pendingGoogleProfile.name}!`}
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-medium px-2">
              {language === 'am' 
                ? 'በ Google ምዝገባዎን ለማጠናቀቅ እባክዎ ሚናዎን ይምረጡ፡' 
                : 'Please select who you are to complete your registration with Google:'}
            </p>

            {/* Error in Google Registration */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2.5 mb-5 text-left">
              <button
                type="button"
                id="google-reg-role-tenant"
                onClick={() => setSelectedRole('tenant')}
                className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3.5 cursor-pointer ${
                  selectedRole === 'tenant'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${selectedRole === 'tenant' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-xs text-slate-900">
                    {language === 'am' ? 'ተከራይ / ገዢ (Tenant / Buyer)' : 'Tenant / Home Buyer'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'am' ? 'ቤቶችን ለመከራየት ወይም ለመግዛት' : 'Looking to rent or purchase properties in Ethiopia'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="google-reg-role-landlord"
                onClick={() => setSelectedRole('landlord')}
                className={`w-full p-3.5 rounded-xl border-2 transition-all flex items-center gap-3.5 cursor-pointer ${
                  selectedRole === 'landlord'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${selectedRole === 'landlord' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-xs text-slate-900">
                    {language === 'am' ? 'የቤት ባለቤት / አከራይ (Landlord / Owner)' : 'Landlord / Property Owner'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'am' ? 'ቤቶችን ለማከራየት ወይም ለመሸጥ' : 'Looking to list, rent out, or sell properties'}
                  </div>
                </div>
              </button>
            </div>

            <div className="mb-4 p-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">
                {language === 'am' ? 'የመጀመሪያ ፕላን፡' : 'Initial Membership Plan:'}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <span>🌱</span>
                <span>{language === 'am' ? 'ነፃ ፕላን (Free Plan)' : 'Free Plan (0 ETB / No fee)'}</span>
              </span>
            </div>

            <button
              type="button"
              id="google-reg-confirm-btn"
              onClick={handleCompleteGoogleRegistration}
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>
                  {language === 'am' ? 'በ Google ምዝገባውን አጠናቅቅና ግባ' : 'Complete Registration with Google'}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPendingGoogleProfile(null)}
              className="mt-3 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {language === 'am' ? 'ይቅር / ተመለስ' : 'Cancel'}
            </button>
          </div>
        ) : (
          <>
            {/* Notifications */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2 text-emerald-900 text-xs animate-fade-in shadow-xs">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div className="flex-1">
                    <span className="font-bold block text-[13px]">{successMessage}</span>
                    {mode === 'forgot' && (
                      <div className="mt-1.5 text-[11px] text-emerald-800 font-medium">
                        {isDeliveredViaSmtp ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded font-semibold text-[10px]">
                            <Mail className="w-3 h-3" />
                            <span>{language === 'am' ? 'የ 6-አሃዝ ኮድ ወደ Gmail Primary Inbox ተልኳል' : '6-digit code delivered to your Gmail Primary Inbox'}</span>
                          </div>
                        ) : (
                          <span>{language === 'am' ? 'እባክዎ የ Gmail ሳጥንዎን ይፈትሹ' : 'Please check your Gmail inbox for the 6-digit code.'}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="w-full mt-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                  >
                    {language === 'am' ? 'የተላከውን ባለ 6 አሃዝ ኮድ እዚህ ያስገቡ' : 'Enter 6-Digit Verification Code'}
                  </button>
                )}
              </div>
            )}

            {/* In Sign Up Mode: Top Role Selection */}
            {mode === 'signup' && (
              <div className="mb-3.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'am' ? '1. እኔ (I am a)...' : '1. I am a...'}</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {selectedRole === 'tenant' 
                      ? (language === 'am' ? 'ተከራይ / ገዢ' : 'Tenant / Buyer')
                      : (language === 'am' ? 'የቤት ባለቤት / አከራይ' : 'Landlord / Owner')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="role-btn-tenant"
                    onClick={() => setSelectedRole('tenant')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'tenant'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>🏠</span>
                    <span className="truncate">{language === 'am' ? 'ተከራይ / ገዢ' : 'Tenant / Buyer'}</span>
                  </button>

                  <button
                    type="button"
                    id="role-btn-landlord"
                    onClick={() => setSelectedRole('landlord')}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedRole === 'landlord'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏢</span>
                    <span className="truncate">{language === 'am' ? 'አከራይ / ባለቤት' : 'Landlord / Owner'}</span>
                  </button>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {language === 'am' ? 'የምዝገባ ፕላን (Plan):' : 'Starting Membership:'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <span>🌱</span>
                    <span>{language === 'am' ? 'ነፃ ፕላን (Free Plan - 0 ETB)' : 'Free Plan (0 ETB - Free forever)'}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Google One-Click Auth */}
            {mode !== 'forgot' && mode !== 'change' && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  id="google-signin-btn"
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>
                        {mode === 'signup'
                          ? (language === 'am' 
                              ? `በ Google እንደ ${selectedRole === 'tenant' ? 'ተከራይ/ገዢ' : 'አከራይ'} ይመዝገቡ` 
                              : `Sign Up with Google as ${selectedRole === 'tenant' ? 'Tenant / Buyer' : 'Landlord'}`)
                          : t('authGoogleContinue')}
                      </span>
                    </>
                  )}
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                    {mode === 'signup' 
                      ? (language === 'am' ? 'ወይም በኢሜይል ይመዝገቡ' : 'OR REGISTER WITH EMAIL')
                      : t('authOrEmail')}
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>
              </div>
            )}

            {/* Authentication / Forgot / Change Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name for Sign Up */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{t('authNameLabel')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      id="signup-name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Abel Bekele"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Gmail / Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {mode === 'forgot' ? (
                    language === 'am' ? '1. የተመዘገበ Gmail / ኢሜይል *' : '1. Registered Gmail / Email *'
                  ) : mode === 'change' ? (
                    language === 'am' ? '1. የተመዘገበ Gmail / ኢሜይል *' : '1. Registered Gmail / Email *'
                  ) : (
                    t('authEmailLabel')
                  )}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    inputMode="email"
                    autoComplete="email"
                    required
                    id="auth-email-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone Number for Sign Up, Forgot Password, and Change Password */}
              {(mode === 'signup' || mode === 'change' || mode === 'forgot') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {mode === 'forgot' ? (
                      language === 'am' ? '2. የተመዘገበ ስልክ ቁጥር *' : '2. Registered Phone Number *'
                    ) : mode === 'change' ? (
                      language === 'am' ? '2. የተመዘገበ ስልክ ቁጥር *' : '2. Registered Phone Number *'
                    ) : (
                      t('authPhoneLabel')
                    )}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required={mode === 'change' || mode === 'forgot'}
                      id="auth-phone-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09... or +251..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Current Password (for Change Password Mode) */}
              {mode === 'change' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'am' ? '3. የአሁኑ የይለፍ ቃል *' : '3. Current Password *'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      id="change-current-password-input"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password (for Change Password Mode) */}
              {mode === 'change' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {language === 'am' ? '4. አዲስ የይለፍ ቃል (ቢያንስ 6 ቁምፊዎች) *' : '4. New Password (min 6 characters) *'}
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      id="change-new-password-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Password for Sign In & Sign Up */}
              {(mode === 'signin' || mode === 'signup') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      {t('authPasswordLabel')}
                    </label>
                    {mode === 'signin' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id="forgot-password-link-btn"
                          onClick={() => {
                            setMode('forgot');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          {t('authForgotPasswordLink')}
                        </button>
                        <span className="text-slate-300 text-xs">|</span>
                        <button
                          type="button"
                          id="change-password-link-btn"
                          onClick={() => {
                            setMode('change');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                        >
                          {language === 'am' ? 'ይለፍ ቃል ቀይር' : 'Change Password'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      id="auth-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="auth-submit-btn"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer mt-3 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>
                    {mode === 'signin' && t('authSubmitSignIn')}
                    {mode === 'signup' && t('authSubmitSignUp')}
                    {mode === 'forgot' && (language === 'am' ? 'ባለ 6 አሃዝ ኮድ ላክ' : 'Send 6-Digit Verification Code')}
                    {mode === 'change' && (language === 'am' ? 'የይለፍ ቃል ቀይር' : 'Change Password')}
                  </span>
                )}
              </button>

              {/* Back to Sign In button for Forgot and Change modes */}
              {(mode === 'forgot' || mode === 'change') && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{t('authBackToSignIn')}</span>
                  </button>
                </div>
              )}
            </form>
          </>
        )}

      </div>
    </div>
  );
};
