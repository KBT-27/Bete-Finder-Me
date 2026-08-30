import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  ShieldCheck,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { isSlashAllowedForPassword } from '../../lib/passwords';

interface ResetPasswordViewProps {
  initialToken?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ 
  initialToken, 
  onSuccess, 
  onCancel 
}) => {
  const { t } = useLanguage();
  const { 
    verifyResetToken, 
    resetPasswordWithToken, 
    activeResetToken, 
    setActiveResetToken,
    login,
    setIsAuthModalOpen,
    setAuthModalInitialMode
  } = useAuth();
  const { setCurrentView } = useProperties();

  // Determine effective token from props, context, or URL
  const [token, setToken] = useState<string>(() => {
    if (initialToken) return initialToken;
    if (activeResetToken) return activeResetToken;
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get('token') || url.searchParams.get('resetToken') || '';
    } catch {
      return '';
    }
  });

  const [targetEmail, setTargetEmail] = useState<string>('');
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Validate token whenever token changes
  useEffect(() => {
    if (!token) {
      setIsTokenValid(false);
      setTokenError('No password reset token provided.');
      return;
    }

    const verification = verifyResetToken(token);
    if (verification.valid && verification.email) {
      setIsTokenValid(true);
      setTargetEmail(verification.email);
      setTokenError(null);
    } else {
      setIsTokenValid(false);
      setTokenError(verification.error || 'This reset link has expired or is invalid.');
    }
  }, [token, verifyResetToken]);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, text: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!isSlashAllowedForPassword(targetEmail, newPassword)) {
      setErrorMessage("The '/' symbol in passwords is reserved for Admin and Owner accounts only.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPasswordWithToken(token, newPassword);
      if (res.success) {
        setIsCompleted(true);
        // Automatically log in with the new password
        if (targetEmail) {
          login(targetEmail, newPassword);
        }
        if (onSuccess) {
          setTimeout(onSuccess, 1500);
        }
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    setActiveResetToken(null);
    if (onCancel) {
      onCancel();
    } else {
      setAuthModalInitialMode('signin');
      setIsAuthModalOpen(true);
      setCurrentView('home');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-slate-200">
      {/* Header Logo & Title */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white mx-auto mb-3 shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          {t('authResetTitle')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {targetEmail ? (
            <span>
              Create a new secure password for <strong className="text-slate-700 font-semibold">{targetEmail}</strong>
            </span>
          ) : (
            'Set a new password for your Bete Finder account'
          )}
        </p>
      </div>

      {/* State: Success / Completed */}
      {isCompleted ? (
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t('authResetSuccess')}
            </h3>
            <p className="text-xs text-slate-600">
              Your password has been updated securely. You are now logged in.
            </p>
          </div>
          <button
            type="button"
            id="reset-success-continue-btn"
            onClick={() => {
              setActiveResetToken(null);
              setIsAuthModalOpen(false);
              setCurrentView('home');
            }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Continue to Bete Finder
          </button>
        </div>
      ) : isTokenValid === false ? (
        /* State: Invalid or missing token / code entry */
        <div className="py-2 space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <KeyRound className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-amber-900 mb-1">
              Enter Verification Code / Token
            </h3>
            <p className="text-xs text-amber-700">
              {tokenError || 'Please enter the 6-digit verification code or token sent to your email.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Verification Code / Reset Token
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.trim())}
                placeholder="e.g. 123456 or rst_..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  if (token) {
                    const verification = verifyResetToken(token);
                    if (verification.valid && verification.email) {
                      setIsTokenValid(true);
                      setTargetEmail(verification.email);
                      setTokenError(null);
                    } else {
                      setIsTokenValid(false);
                      setTokenError(verification.error || 'Invalid code or expired token.');
                    }
                  }
                }}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                Verify
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              id="request-new-reset-link-btn"
              onClick={() => {
                setActiveResetToken(null);
                setAuthModalInitialMode('forgot');
                setIsAuthModalOpen(true);
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Request New Verification Code
            </button>
            <button
              type="button"
              id="cancel-reset-btn"
              onClick={handleBackToLogin}
              className="w-full py-2 bg-transparent hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('authBackToSignIn')}</span>
            </button>
          </div>
        </div>
      ) : (
        /* State: Active Form */
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('authNewPasswordLabel')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="reset-new-password-input"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
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

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                  <span>Strength: {strength.text}</span>
                  <span>{newPassword.length} chars</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('authConfirmPasswordLabel')}
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="reset-confirm-password-input"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-500 font-medium mt-1">Passwords do not match.</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="submit-reset-password-btn"
              disabled={isSubmitting || newPassword.length < 6 || newPassword !== confirmPassword}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{t('authSubmitReset')}</span>
              )}
            </button>
          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('authBackToSignIn')}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
