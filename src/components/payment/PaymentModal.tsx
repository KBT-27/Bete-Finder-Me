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
  ArrowRight,
  Zap,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserX, 
  Building2, 
  PlusCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export const PaymentModal: React.FC = () => {
  const { t, isAmharic } = useLanguage();
  const { 
    isPaymentModalOpen, 
    setIsPaymentModalOpen, 
    selectedPlan, 
    pendingPaymentPurpose,
    submitPaymentRequest,
    verifyPaymentWithLinksEt,
    setCurrentView,
    telebirrSettings,
    userPostedProperties
  } = useProperties();
  const { user, updateUser } = useAuth();

  const isTenant = user?.role === 'tenant';
  const hasPostedProperties = userPostedProperties.length > 0;

  // Verification mode: 'links_et' (instant automated) vs 'manual' (traditional review)
  const [verificationMode, setVerificationMode] = useState<'links_et' | 'manual'>('links_et');

  const [selectedNetwork, setSelectedNetwork] = useState('Telebirr');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [payerName, setPayerName] = useState(user?.name || telebirrSettings.accountName);
  const [payerPhone, setPayerPhone] = useState(user?.phone || telebirrSettings.accountNumber);
  
  // links.et specific state
  const [receiptInput, setReceiptInput] = useState('');
  const [isVerifyingLinksEt, setIsVerifyingLinksEt] = useState(false);
  const [linksEtReceipt, setLinksEtReceipt] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isInstantVerified, setIsInstantVerified] = useState(false);

  // Manual review state
  const [transactionRef, setTransactionRef] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState(false);

  if (!isPaymentModalOpen) return null;

  const isBlocked = false; // Allow all users and first-time posters to acquire listing packages

  const basePrice = selectedPlan?.price || (pendingPaymentPurpose === 'boost' ? 399 : 599);
  const totalAmount = basePrice * durationMonths;
  const planTitle = selectedPlan 
    ? (isAmharic ? selectedPlan.nameAm : selectedPlan.name) 
    : 'Boost Premium Others';

  const handleCopyNumber = () => {
    navigator.clipboard?.writeText(telebirrSettings.accountNumber);
    setCopiedNumber(true);
    toast.success(isAmharic ? 'የስልክ ቁጥር ተገልብጧል' : 'Phone number copied to clipboard');
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

  // Instant Verification using links.et API
  const handleVerifyWithLinksEt = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputVal = receiptInput.trim();
    if (!inputVal && !screenshotPreview) {
      toast.error(isAmharic 
        ? 'እባክዎ የክፍያ ማረጋገጫ ሊንክ ወይም የትራንዛክሽን ቁጥር ያስገቡ' 
        : 'Please enter a receipt URL or transaction reference number');
      return;
    }

    setIsVerifyingLinksEt(true);
    setVerificationError(null);

    try {
      const isUrl = inputVal.startsWith('http://') || inputVal.startsWith('https://');

      // If user provided a screenshot without text, we can try image OCR endpoint
      if (!inputVal && screenshotPreview) {
        const ocrRes = await fetch('/api/links-et/verify-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: screenshotPreview,
            userEmail: user?.email,
            userName: payerName.trim() || user?.name,
            userPhone: payerPhone.trim() || user?.phone,
            planId: selectedPlan?.id || 'premium',
            planName: planTitle,
            durationMonths,
            totalAmount,
            autoActivate: true
          })
        });
        const ocrData = await ocrRes.json();
        if (ocrData.success && ocrData.verified) {
          setLinksEtReceipt(ocrData.receipt);
          setIsInstantVerified(true);
          toast.success(isAmharic 
            ? 'ክፍያዎ በ links.et ተረጋግጧል! ፓኬጅዎ ወዲያውኑ ተከፍቷል!' 
            : 'Payment verified by links.et! Plan activated instantly!'
          );
          return;
        } else {
          setVerificationError(ocrData.message || (isAmharic ? 'የስክሪንሾት ክፍያ በ links.et አልተረጋገጠም። እባክዎ የትራንዛክሽን ቁጥሩን ጽፈው ይሞክሩ።' : 'Screenshot could not be verified by links.et. Please enter the transaction reference text.'));
          return;
        }
      }

      // Standard links.et verification via URL or Reference
      const res = await verifyPaymentWithLinksEt({
        url: isUrl ? inputVal : undefined,
        reference: !isUrl ? inputVal : undefined,
        userName: payerName.trim() || user?.name,
        userPhone: payerPhone.trim() || user?.phone,
        plan: selectedPlan,
        durationMonths,
        totalAmount,
        autoActivate: true
      });

      if (res.success && res.verified) {
        setLinksEtReceipt(res.receipt);
        setIsInstantVerified(true);
        toast.success(isAmharic 
          ? `ክፍያዎ በ links.et ተረጋግጧል! ${planTitle} ወዲያውኑ ተከፍቷል!` 
          : `Payment verified by links.et! ${planTitle} activated instantly!`
        );
      } else {
        const errMsg = res.message || (isAmharic 
          ? 'ክፍያው በ links.et ሊረጋገጥ አልቻለም። እባክዎ ትክክለኛውን ቁጥር ያስገቡ ወይም በማኑዋል ይላኩ።' 
          : 'Receipt could not be verified by links.et. Please ensure the reference number or receipt URL is correct.');
        setVerificationError(errMsg);
        toast.error(errMsg);
      }
    } catch (err: any) {
      const msg = err.message || 'Error communicating with links.et service';
      setVerificationError(msg);
      toast.error(msg);
    } finally {
      setIsVerifyingLinksEt(false);
    }
  };

  const handleCompletePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim() || !payerPhone.trim() || !transactionRef.trim() || !screenshotPreview) {
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      // If user was tenant, upgrade role to landlord
      if (user && user.role === 'tenant') {
        updateUser({ role: 'landlord' });
      }

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
      toast.success(isAmharic ? 'የክፍያ ማረጋገጫ ጥያቄዎ ለባለቤቱ ተልኳል!' : 'Payment sent to owner for verification!');
    }, 1200);
  };

  const handleDone = () => {
    setIsSuccess(false);
    setIsInstantVerified(false);
    setIsPaymentModalOpen(false);
    setTransactionRef('');
    setReceiptInput('');
    setScreenshotPreview(null);
    setLinksEtReceipt(null);
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

        {isInstantVerified ? (
          <div className="text-center py-6 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <Zap className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>links.et Automated Gateway Verified</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                Plan Activated Instantly!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ክፍያዎ በ links.et በኩል ወዲያውኑ ተረጋግጦ ፓኬጅዎ ተከፍቷል!
              </p>
            </div>

            <div className="bg-emerald-50 text-emerald-950 p-5 rounded-2xl border border-emerald-200 text-xs text-left space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                <span className="font-bold text-emerald-900">Active Package:</span>
                <span className="font-black text-emerald-950 text-sm">{planTitle}</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                <span className="text-emerald-800 font-medium">Validity Period:</span>
                <span className="font-bold text-emerald-950">{durationMonths} Month{durationMonths > 1 ? 's' : ''} (30 Days/mo)</span>
              </div>
              {linksEtReceipt?.receiptNo && (
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                  <span className="text-emerald-800 font-medium">Receipt No / Ref:</span>
                  <span className="font-mono font-bold text-emerald-950">{linksEtReceipt.receiptNo}</span>
                </div>
              )}
              {linksEtReceipt?.payerName && (
                <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                  <span className="text-emerald-800 font-medium">Verified Payer:</span>
                  <span className="font-bold text-emerald-950">{linksEtReceipt.payerName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-emerald-800 font-medium">Amount Verified:</span>
                <span className="font-black text-emerald-900 text-sm">{(linksEtReceipt?.amount || totalAmount).toLocaleString()} ETB</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Your listings are now marked with <strong className="text-slate-900">Featured & Verified Badges</strong> and have top priority ranking in search results.
            </p>

            <button
              onClick={handleDone}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Go to Dashboard & Manage Listings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : isSuccess ? (
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
        ) : isBlocked ? (
          <div className="text-center py-4 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              {isTenant ? <UserX className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                {isTenant 
                  ? (isAmharic ? 'ተከራይ/ገዢ ፓኬጅ መግዛት አይችልም' : 'Tenant / Buyer Accounts Cannot Get Packages')
                  : (isAmharic ? 'መጀመሪያ ንብረትዎን ይለጥፉ' : 'Post a Property First')
                }
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isTenant
                  ? (isAmharic 
                      ? 'የማስተዋወቂያ ፓኬጆች ለንብረት አከራይና ሻጮች ብቻ ናቸው። መለያዎን ወደ አከራይ (Landlord) በመቀየር ንብረትዎን መለጠፍ ይችላሉ።'
                      : 'Listing packages are exclusively for Landlords with property listings. Switch your account to Landlord to proceed.')
                  : (isAmharic
                      ? 'ፓኬጅ ከመግዛትዎ በፊት ቢያንስ አንድ ቤት መለጠፍ ያስፈልግዎታል። ንብረትዎን ከለጠፉ በኋላ ፓኬጁ በቀጥታ ይተገበራል።'
                      : 'You must post at least one property listing before acquiring a package. Once posted, VIP/Premium spotlight can be activated.')
                }
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-left space-y-2">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Eligibility Requirement:</span>
              </p>
              <p className="text-slate-600 text-[11px]">
                {isTenant 
                  ? 'Switch your profile role to "Landlord / Owner" in your account dashboard and post your property.'
                  : 'Go to the Post Property tab, fill in the details of your apartment, villa, or house, and publish it first.'
                }
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  if (isTenant) updateUser({ role: 'landlord' });
                  setCurrentView('post');
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isTenant ? 'Switch to Landlord & Post Property' : 'Post Property Listing Now'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
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

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 rounded-2xl mb-5 border border-slate-200">
              <button
                type="button"
                onClick={() => setVerificationMode('links_et')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  verificationMode === 'links_et'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Instant links.et</span>
              </button>

              <button
                type="button"
                onClick={() => setVerificationMode('manual')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  verificationMode === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Manual Review</span>
              </button>
            </div>

            {/* Official Recipient Account Info Box */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 mb-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-950 font-bold">Official Network / Gateway:</span>
                <span className="text-xs font-black text-emerald-800 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <span>Telebirr & CBE via links.et</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-950 font-bold">Recipient Account Name:</span>
                <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                  {telebirrSettings.accountName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-950 font-bold">Send to (Telebirr / Mobile):</span>
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

            {verificationMode === 'links_et' ? (
              /* Automated Verification with links.et */
              <form onSubmit={handleVerifyWithLinksEt} className="space-y-4">
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-emerald-900">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Instant Automated Verification</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Pay <strong className="text-emerald-950 font-bold">{totalAmount.toLocaleString()} ETB</strong> via Telebirr or any bank app. Then paste the <strong>Receipt Link</strong> or <strong>Transaction ID</strong> below. links.et connects to the official provider and verifies your payment in seconds.
                  </p>
                </div>

                {/* Receipt Link or Transaction Reference */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receipt Link or Transaction Reference ID*
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={receiptInput}
                      onChange={(e) => setReceiptInput(e.target.value)}
                      placeholder="e.g. https://transactioninfo.ethiotelecom.et/receipt/... or DE73NC383J"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports Telebirr receipt links, CBE Birr references, and 17+ Ethiopian bank codes.
                  </p>
                </div>

                {/* Optional Screenshot for AI OCR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Payment Screenshot (Optional / OCR)</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Auto-scanned</span>
                  </label>
                  <label className={`border-2 rounded-xl p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    screenshotPreview 
                      ? 'border-emerald-400 bg-emerald-50/50' 
                      : 'border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50'
                  }`}>
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
                          className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shadow-xs"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-800 truncate max-w-xs">{screenshotFileName || 'Screenshot attached'}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">Attached • Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-medium">Attach receipt screenshot for links.et visual verification</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Error Banner */}
                {verificationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Verification Notice</p>
                      <p className="text-[11px] mt-0.5">{verificationError}</p>
                      <button
                        type="button"
                        onClick={() => setVerificationMode('manual')}
                        className="mt-1.5 text-[11px] font-bold text-rose-900 underline hover:text-rose-950 block cursor-pointer"
                      >
                        Switch to Manual Review instead →
                      </button>
                    </div>
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifyingLinksEt || (!receiptInput.trim() && !screenshotPreview)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isVerifyingLinksEt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with links.et Ethiopian Gateway...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>⚡ Verify & Activate Instantly ({totalAmount.toLocaleString()} ETB)</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* User Form for Manual Payment Verification */
              <form onSubmit={handleCompletePayment} className="space-y-3.5">
                
                {/* Network selection */}
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

                {/* Screenshot of Payment (Mandatory) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>Payment Screenshot / Receipt</span>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                        Mandatory *
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">Screenshot Proof</span>
                  </label>
                  
                  <label className={`border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    screenshotPreview 
                      ? 'border-emerald-400 bg-emerald-50/50' 
                      : 'border-dashed border-rose-300 hover:border-emerald-500 bg-rose-50/30 hover:bg-emerald-50/40'
                  }`}>
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
                          className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-xs"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-emerald-800 truncate max-w-xs">{screenshotFileName || 'Screenshot attached'}</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">Attached • Click to change file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-rose-700">
                        <Upload className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-bold">Attach screenshot of Telebirr payment (Mandatory *)</span>
                      </div>
                    )}
                  </label>
                </div>

                {/* Notification Note Box */}
                <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    The owner will verify your Telebirr SIM PIN payment and your package will be automatically activated.
                  </span>
                </div>

                {/* Complete Payment Button */}
                <button
                  type="submit"
                  disabled={isProcessing || !transactionRef.trim() || !payerPhone.trim() || !payerName.trim() || !screenshotPreview}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span>Sending to Owner for Verification...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Submit for Manual Review ({totalAmount.toLocaleString()} ETB)</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
