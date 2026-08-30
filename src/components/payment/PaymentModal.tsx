import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  Upload, 
  Sparkles, 
  Info, 
  Calendar, 
  User, 
  Phone,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';

export const PaymentModal: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { 
    isPaymentModalOpen, 
    setIsPaymentModalOpen, 
    selectedPlan, 
    pendingPaymentPurpose,
    submitPaymentRequest,
    setCurrentView,
    telebirrSettings
  } = useProperties();
  const { user } = useAuth();

  const [selectedNetwork, setSelectedNetwork] = useState('Telebirr');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [payerName, setPayerName] = useState(user?.name || telebirrSettings.accountName);
  const [payerPhone, setPayerPhone] = useState(user?.phone || telebirrSettings.accountNumber);
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!isPaymentModalOpen) return null;

  const basePrice = selectedPlan?.price || (pendingPaymentPurpose === 'boost' ? 399 : 599);
  const totalAmount = basePrice * durationMonths;
  const planTitle = selectedPlan 
    ? (isAmharic ? selectedPlan.nameAm : selectedPlan.name) 
    : 'Boost Premium Others';

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(telebirrSettings.accountNumber);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim() || !payerPhone.trim() || !transactionRef.trim()) {
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // Send payment request to Owner for review & approval
      submitPaymentRequest({
        userName: payerName.trim(),
        userPhone: payerPhone.trim(),
        transactionRef: transactionRef.trim(),
        screenshotUrl: screenshotPreview || undefined,
        plan: selectedPlan,
        durationMonths,
        totalAmount
      });

      setIsProcessing(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleDone = () => {
    setIsSuccess(false);
    setIsPaymentModalOpen(false);
    setTransactionRef('');
    setScreenshotPreview(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={() => setIsPaymentModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900">
                Payment Sent to Owner!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                የክፍያ ማረጋገጫ ጥያቄዎ ለባለቤቱ በተሳካ ሁኔታ ተልኳል
              </p>
            </div>

            <div className="bg-emerald-50 text-emerald-950 p-5 rounded-2xl border border-emerald-200 text-xs text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Status: Awaiting Owner Verification</span>
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                Your Telebirr payment reference (<strong className="font-mono text-emerald-950 font-bold">{transactionRef}</strong>) and screenshot details have been transmitted to the owner (<strong className="text-slate-900">Desalegn Guta / Kaleb Bereket</strong>).
              </p>
              <div className="pt-2 border-t border-emerald-200/80 text-[11px] text-emerald-900">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Activation Instruction:</span>
                </p>
                <p>
                  As soon as the owner verifies your Telebirr SIM PIN payment, your <strong className="text-emerald-950 font-bold">{planTitle}</strong> ({durationMonths} month{durationMonths > 1 ? 's' : ''}) will be automatically activated and will run for the complete duration.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
              <span>Recipient: <strong>Desalegn Guta (0995406697)</strong></span>
              <span className="font-black text-slate-900">{totalAmount.toLocaleString()} ETB</span>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View Request in Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Telebirr Payment Gateway
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Official Ethiopian Mobile Money Integration
              </p>
            </div>

            {/* Selected Package Summary Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 mb-5 shadow-md">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                    Selected Package
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {planTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400">{totalAmount.toLocaleString()}</span>
                  <span className="text-xs font-bold text-slate-300 ml-1">ETB</span>
                </div>
              </div>

              {/* Duration selection */}
              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between gap-2">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Boost Premium Others Duration:</span>
                </label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(Number(e.target.value))}
                  className="bg-slate-800 text-xs font-bold text-emerald-300 border border-slate-600 rounded-lg px-2.5 py-1 focus:outline-hidden focus:border-emerald-400 cursor-pointer"
                >
                  <option value={1}>1 month (30 days)</option>
                  <option value={2}>2 months (60 days)</option>
                  <option value={3}>3 months (90 days)</option>
                  <option value={6}>6 months (180 days)</option>
                </select>
              </div>
            </div>

            {/* Official Telebirr Recipient Account Info Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-950 font-bold">Select your network*:</span>
                <span className="text-xs font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                  Telebirr
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-950 font-bold">Recipient Account Name:</span>
                <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                  {telebirrSettings.accountName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-950 font-bold">Your phone number* / Send to:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono shadow-2xs">
                    {telebirrSettings.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    title="Copy phone number"
                  >
                    {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* User Form for Payment Verification */}
            <form onSubmit={handleCompletePayment} className="space-y-3.5">
              
              {/* Network selection (locked to Telebirr as requested) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select your network*
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Telebirr</span>
                  <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Active</span>
                </div>
              </div>

              {/* Payer Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name of the Payer (Telebirr Account Holder)*
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="e.g. Desalegn Guta / Abebe Kebede"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Payer Telebirr Account Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your phone number* / Telebirr Account
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telebirr Transaction / Reference ID*
                </label>
                <input
                  type="text"
                  required
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. TB982348912 or 7GH98124"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Screenshot of Payment */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Payment Screenshot / Receipt</span>
                  <span className="text-[11px] text-slate-400 font-normal">Screenshot Proof</span>
                </label>
                
                <label className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {screenshotPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot"
                        className="w-12 h-12 object-cover rounded-lg border border-emerald-300"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-800 truncate max-w-xs">{screenshotFileName || 'Screenshot attached'}</p>
                        <p className="text-[10px] text-slate-500">Click to change file</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold">Attach screenshot of Telebirr payment</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Notification Note Box */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  You should receive a notification about this request when the person write his pin in his Telebirr sim automatically get the package when confirmed.
                </span>
              </div>

              {/* Complete Payment Button */}
              <button
                type="submit"
                disabled={isProcessing || !transactionRef.trim() || !payerPhone.trim() || !payerName.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>Sending to Owner for Verification...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete the payment ({totalAmount.toLocaleString()} ETB)</span>
                  </>
                )}
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
};
