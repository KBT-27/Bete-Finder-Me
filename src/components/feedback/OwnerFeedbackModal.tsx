import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Star, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { sendOwnerFeedback } from '../../lib/feedback';
import { OwnerFeedback } from '../../types';

interface OwnerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: OwnerFeedback['category'];
  propertyContext?: { id: string; title: string };
  onSuccessToast?: (msg: string) => void;
}

export const OwnerFeedbackModal: React.FC<OwnerFeedbackModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  propertyContext,
  onSuccessToast
}) => {
  const { user } = useAuth();
  const { isAmharic } = useLanguage();

  // All fields start completely unfilled
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<OwnerFeedback['category'] | ''>('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guarantee that every time the modal opens, ALL questions/fields are strictly blank and not filled
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setRating(0);
      setHoverRating(null);
      setCategory(initialCategory || '');
      setIsSubmitted(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialCategory]);

  const handleResetAllQuestions = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setRating(0);
    setHoverRating(null);
    setCategory('');
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setErrorMsg(isAmharic ? 'እባክዎ የአስተያየት ዓይነት ይምረጡ።' : 'Please select a feedback category.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg(isAmharic ? 'እባክዎ መልዕክትዎን ያስገቡ።' : 'Please provide your message or feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await sendOwnerFeedback({
        name: name.trim() || 'Anonymous User',
        email: email.trim() || 'guest@betefinder.com',
        phone: phone.trim() || '',
        category: category as OwnerFeedback['category'],
        rating: rating > 0 ? rating : 5,
        message: message.trim(),
        propertyId: propertyContext?.id,
        propertyTitle: propertyContext?.title,
      });

      if (res.success) {
        setIsSubmitted(true);
        if (onSuccessToast) {
          onSuccessToast(
            isAmharic 
              ? '✅ አስተያየትዎ በቀጥታ ደርሷል!' 
              : '✅ Your feedback has been sent directly to the Executive Team!'
          );
        }
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMsg(res.message || 'Failed to submit feedback. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error submitting feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    if (!val || val === 0) {
      return isAmharic ? 'ደረጃ አልተመረጠም (ይምረጡ)' : 'Not rated yet (tap stars)';
    }
    if (isAmharic) {
      switch (val) {
        case 5: return 'እጅግ በጣም ጥሩ (Excellent)';
        case 4: return 'በጣም ጥሩ (Very Good)';
        case 3: return 'ጥሩ (Average)';
        case 2: return 'መሻሻል ያለበት (Needs Improvement)';
        case 1: return 'ዝቅተኛ (Poor)';
        default: return '';
      }
    }
    switch (val) {
      case 5: return '5 Stars - Excellent';
      case 4: return '4 Stars - Great Experience';
      case 3: return '3 Stars - Satisfactory';
      case 2: return '2 Stars - Needs Improvement';
      case 1: return '1 Star - Disappointed';
      default: return '';
    }
  };

  return (
    <div 
      id="owner-feedback-modal-overlay"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-auto mx-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - Centered & Prominent */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  {isAmharic ? 'አስተያየት ወይም ጥያቄ ይላኩ' : 'Send Feedback & Inquiry'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Direct Inbox
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAmharic 
                  ? 'አስተያየትዎ በቀጥታ ለአስተዳዳሪው ይደርሳል' 
                  : 'Delivered directly to the Owner & Administration team'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetAllQuestions}
              title={isAmharic ? 'ሁሉንም ጥያቄዎች ባዶ አድርግ' : 'Reset all fields to blank'}
              className="text-[11px] font-bold text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isAmharic ? 'ባዶ አድርግ' : 'Clear'}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isSubmitted ? (
            <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-black text-slate-900">
                  {isAmharic ? 'አስተያየትዎ በተሳካ ሁኔታ ተልኳል!' : 'Feedback Sent Successfully!'}
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  {isAmharic
                    ? 'እናመሰግናለን! አስተያየትዎ ተመዝግቧል፤ አስፈላጊ ከሆነ በስልክ ወይም በኢሜይል እናገኝዎታለን።'
                    : 'Thank you! Your feedback has been received and will be reviewed by the administration.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isAmharic ? 'ዝጋ' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Optional Property Context Pill */}
              {propertyContext && (
                <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-950">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold">{isAmharic ? 'የተገናኘ ቤት:' : 'Regarding Property:'} </span>
                    <span className="font-semibold text-indigo-700">{propertyContext.title}</span>
                  </div>
                </div>
              )}

              {/* Error message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Category Selector - Unselected by default */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {isAmharic ? 'የአስተያየት ዓይነት ይምረጡ *' : '1. Select Feedback Category *'}
                  </label>
                  {!category && (
                    <span className="text-[10px] text-amber-600 font-semibold animate-pulse">
                      {isAmharic ? 'አንዱን ይምረጡ' : 'Not selected yet'}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'rental', label: isAmharic ? 'የኪራይ ጥያቄ' : 'Rental Inquiry' },
                    { id: 'sale', label: isAmharic ? 'የሽያጭ ጥያቄ' : 'Sale Inquiry' },
                    { id: 'platform', label: isAmharic ? 'የመተግበሪያ አስተያየት' : 'Platform / App' },
                    { id: 'support', label: isAmharic ? 'እርዳታ / ድጋፍ' : 'Support / Help' },
                    { id: 'bug', label: isAmharic ? 'ችግር ሪፖርት' : 'Report Issue' },
                    { id: 'general', label: isAmharic ? 'አጠቃላይ አስተያየት' : 'General Notes' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                        category === cat.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-2 ring-indigo-400/40'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating - 0 stars / Not rated by default */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    {isAmharic ? '2. የእርካታ ደረጃዎን ይምረጡ (አማራጭ)' : '2. How was your experience? (Optional)'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-600">
                    {getRatingLabel(hoverRating !== null ? hoverRating : rating)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating !== null ? hoverRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                      >
                        <Star 
                          className={`w-6 h-6 transition-colors ${
                            active 
                              ? 'fill-amber-400 text-amber-500 drop-shadow-xs' 
                              : 'text-slate-300 hover:text-slate-400'
                          }`} 
                        />
                      </button>
                    );
                  })}
                  {rating > 0 && (
                    <button
                      type="button"
                      onClick={() => setRating(0)}
                      className="ml-2 text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
                    >
                      {isAmharic ? 'ሰርዝ' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>

              {/* Sender Name & Contact - Blank / Empty by default */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'ሙሉ ስም (አማራጭ)' : '3. Full Name (Optional)'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAmharic ? 'ስምዎን ያስገቡ...' : 'e.g. Abebe Kebede'}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isAmharic ? 'ስልክ ቁጥር (አማራጭ)' : 'Phone Number (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 9..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isAmharic ? 'ኢሜይል (አማራጭ)' : 'Email Address (Optional)'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Message Box - Blank / Empty by default */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {isAmharic ? '4. የእርስዎ አስተያየት ወይም ጥያቄ *' : '4. Your Message or Feedback *'}
                  </label>
                  <span className="text-[10px] text-slate-400">{message.length}/1000</span>
                </div>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder={
                    isAmharic
                      ? 'እባክዎ ማንኛውንም አስተያየት፣ የኪራይ/ሽያጭ ጥያቄ ወይም ማሻሻያ እዚህ ይጻፉ...'
                      : 'Write your comments, rental/sales inquiries, or suggestions here...'
                  }
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleResetAllQuestions}
                  className="text-xs text-slate-400 hover:text-slate-700 underline font-medium cursor-pointer"
                >
                  {isAmharic ? 'ሁሉንም አጽዳ' : 'Clear Form'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    {isAmharic ? 'ይቅር' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-black shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>{isAmharic ? 'በመላክ ላይ...' : 'Sending...'}</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{isAmharic ? 'አስተያየት ላክ' : 'Submit Feedback'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
