import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Crown,
  Building2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  PlusCircle, 
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
  Check,
  X,
  Smartphone,
  Calendar,
  Lock,
  Mail,
  User,
  Phone,
  Save,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Tag,
  FileCheck2,
  Sliders
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { PaymentRequest } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { 
    properties, 
    deleteProperty, 
    updateProperty, 
    setSelectedProperty, 
    setCurrentView,
    paymentRequests,
    approvePaymentRequest,
    rejectPaymentRequest,
    deletePaymentRequest,
    verifyProperty,
    plans,
    updatePlanPrice,
    telebirrSettings,
    updateTelebirrSettings
  } = useProperties();
  
  const { 
    user, 
    role, 
    logout, 
    adminCredentials, 
    ownerCredentials, 
    updateAdminSecurity, 
    updateOwnerSecurity 
  } = useAuth();

  const isOwner = role === 'owner';

  const [activeAdminTab, setActiveAdminTab] = useState<'payments' | 'properties' | 'pricing_settings' | 'security'>('payments');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'unverified' | 'verified'>('all');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Reject dialog state
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Security profile form state
  const [securityEmail, setSecurityEmail] = useState(
    isOwner ? ownerCredentials.email : adminCredentials.email
  );
  const [securityPassword, setSecurityPassword] = useState(
    isOwner ? ownerCredentials.password : adminCredentials.password
  );
  const [securityName, setSecurityName] = useState(user?.name || (isOwner ? 'Owner (Kaleb Bereket)' : 'Admin (Kaleb Bereket)'));
  const [securityPhone, setSecurityPhone] = useState(user?.phone || '+251995406697');
  const [securitySaveSuccess, setSecuritySaveSuccess] = useState(false);

  // Telebirr & Pricing state for Owner
  const [telebirrAccountNum, setTelebirrAccountNum] = useState(telebirrSettings.accountNumber);
  const [telebirrAccountName, setTelebirrAccountName] = useState(telebirrSettings.accountName);
  const [basicPrice, setBasicPrice] = useState(plans.find(p => p.id === 'basic')?.price ?? 0);
  const [premiumPrice, setPremiumPrice] = useState(plans.find(p => p.id === 'premium')?.price ?? 599);
  const [vipPrice, setVipPrice] = useState(plans.find(p => p.id === 'vip')?.price ?? 1199);
  const [pricingSaveSuccess, setPricingSaveSuccess] = useState(false);

  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const filteredPayments = paymentRequests.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  const unverifiedProperties = properties.filter(p => !p.isVerified);
  const verifiedProperties = properties.filter(p => p.isVerified);

  const filteredProperties = properties.filter(p => {
    if (propertyFilter === 'unverified') return !p.isVerified;
    if (propertyFilter === 'verified') return p.isVerified;
    return true;
  });

  const handleToggleVerified = (id: string, current: boolean) => {
    verifyProperty(id, !current);
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    updateProperty(id, { isFeatured: !current });
  };

  const handleApprove = (requestId: string) => {
    approvePaymentRequest(requestId);
  };

  const handleDeletePayment = (requestId: string) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      deletePaymentRequest(requestId);
    }
  };

  const handleOpenRejectModal = (requestId: string) => {
    setRejectingRequestId(requestId);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    rejectPaymentRequest(
      rejectingRequestId, 
      rejectionReasonInput.trim() || `Telebirr transaction ID could not be confirmed on account ${telebirrSettings.accountNumber}.`
    );
    setRejectingRequestId(null);
    setRejectionReasonInput('');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityEmail.trim() || !securityPassword.trim()) return;

    if (isOwner) {
      updateOwnerSecurity(securityEmail.trim(), securityPassword.trim(), securityName.trim(), securityPhone.trim());
    } else {
      updateAdminSecurity(securityEmail.trim(), securityPassword.trim(), securityName.trim(), securityPhone.trim());
    }

    setSecuritySaveSuccess(true);
    setTimeout(() => setSecuritySaveSuccess(false), 4000);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    updateTelebirrSettings(telebirrAccountNum.trim(), telebirrAccountName.trim());
    updatePlanPrice('basic', Number(basicPrice));
    updatePlanPrice('premium', Number(premiumPrice));
    updatePlanPrice('vip', Number(vipPrice));

    setPricingSaveSuccess(true);
    setTimeout(() => setPricingSaveSuccess(false), 4000);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Banner */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white ${
          isOwner 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 border border-amber-500/30' 
            : 'bg-slate-900 border border-slate-800'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
              isOwner 
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20' 
                : 'bg-purple-600 text-white shadow-purple-600/20'
            }`}>
              {isOwner ? <Crown className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">
                  {isOwner ? 'Bete Finder Owner Command Center' : 'Bete Finder Administration'}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isOwner ? 'bg-amber-400 text-slate-950' : 'bg-purple-500 text-white'
                }`}>
                  {isOwner ? 'Owner Mode' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Connected as <strong className="text-white">{user?.email}</strong> • Telebirr Merchant: <strong className="text-emerald-400 font-mono">{telebirrSettings.accountNumber} ({telebirrSettings.accountName})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setCurrentView('post')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Listing</span>
            </button>
            <button
              onClick={logout}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl border border-white/10 cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Key Metrics - (Telebirr Revenue removed per request) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase">Pending Payments</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{pendingPayments.length}</p>
              {pendingPayments.length > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md animate-pulse">
                  Requires Action
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Telebirr verifications</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase">Needs Owner Approval</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={`text-2xl sm:text-3xl font-black ${unverifiedProperties.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {unverifiedProperties.length}
              </p>
              {unverifiedProperties.length > 0 && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  Unverified
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Pending post review</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase">Verified Properties</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">{verifiedProperties.length}</p>
            <span className="text-[11px] text-emerald-700 font-bold">Public on marketplace</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase">Total Listings</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{properties.length}</p>
            <span className="text-[11px] text-slate-400">Catalog inventory</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveAdminTab('payments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'payments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Payment Approvals & Requests ({paymentRequests.length})</span>
            {pendingPayments.length > 0 && (
              <span className="ml-1 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
                {pendingPayments.length} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('properties')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'properties' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Owner Property Verification ({unverifiedProperties.length} pending)</span>
          </button>

          {isOwner && (
            <button
              onClick={() => setActiveAdminTab('pricing_settings')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeAdminTab === 'pricing_settings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Pricing & Telebirr Settings</span>
            </button>
          )}

          <button
            onClick={() => setActiveAdminTab('security')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'security' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Security & Profile Settings</span>
          </button>
        </div>

        {/* TAB 1: Payment Approvals & Telebirr Requests */}
        {activeAdminTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Filter pills */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 mr-1">Filter Requests:</span>
                {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setPaymentFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                      paymentFilter === f 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Showing {filteredPayments.length} of {paymentRequests.length} payments
              </p>
            </div>

            {filteredPayments.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredPayments.map(req => (
                  <div 
                    key={req.id} 
                    className={`bg-white rounded-2xl p-5 sm:p-6 border shadow-xs transition-all ${
                      req.status === 'pending' 
                        ? 'border-amber-300 ring-2 ring-amber-500/10' 
                        : req.status === 'approved' 
                        ? 'border-emerald-200' 
                        : 'border-rose-200 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md border ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border-rose-200'
                          }`}>
                            {req.status === 'pending' ? '⏳ Pending Approval' : req.status === 'approved' ? '✓ Approved & Active' : '✕ Rejected'}
                          </span>

                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                            {req.planName}
                          </span>

                          <span className="text-xs text-slate-400">
                            Submitted: {new Date(req.submittedAt).toLocaleDateString()} at {new Date(req.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px]">Payer Name</p>
                            <p className="font-bold text-slate-900 text-sm mt-0.5">{req.userName}</p>
                            <p className="text-slate-500 text-[11px]">{req.userEmail}</p>
                          </div>

                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px]">Telebirr Phone</p>
                            <p className="font-mono font-bold text-emerald-700 text-sm mt-0.5">{req.userPhone}</p>
                            <p className="text-slate-500 text-[11px]">Duration: {req.durationMonths} Month(s)</p>
                          </div>

                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px]">Transaction Ref</p>
                            <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{req.transactionRef}</p>
                            <p className="text-slate-500 text-[11px]">Telebirr SIM / PIN Confirmed</p>
                          </div>

                          <div>
                            <p className="text-slate-400 font-bold uppercase text-[10px]">Total Amount</p>
                            <p className="font-black text-emerald-700 text-base mt-0.5">{req.totalAmount.toLocaleString()} ETB</p>
                            <p className="text-slate-500 text-[11px]">Recipient: {telebirrSettings.accountName}</p>
                          </div>
                        </div>

                        {/* Screenshot attachment view */}
                        {req.screenshotUrl && (
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedScreenshot(req.screenshotUrl || null)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 p-1.5 px-2.5 bg-emerald-50 rounded-lg border border-emerald-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Payment Screenshot Receipt</span>
                            </button>
                          </div>
                        )}

                        {/* Rejection Reason if rejected */}
                        {req.status === 'rejected' && req.rejectionReason && (
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                            <p className="font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Rejection Reason:</span>
                            </p>
                            <p className="mt-0.5 italic">"{req.rejectionReason}"</p>
                          </div>
                        )}

                        {/* Approved plan expiry info */}
                        {req.status === 'approved' && req.expiresAt && (
                          <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Active Plan valid until: {new Date(req.expiresAt).toLocaleDateString()}</span>
                          </p>
                        )}
                      </div>

                      {/* Right Action buttons for Owner/Admin */}
                      <div className="flex sm:flex-col gap-2 shrink-0 pt-2 lg:pt-0">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Accept & Activate Plan</span>
                            </button>

                            <button
                              onClick={() => handleOpenRejectModal(req.id)}
                              className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {/* Delete Payment Record Button */}
                        <button
                          onClick={() => handleDeletePayment(req.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="Delete payment record from system"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Request</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                <Smartphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">No Payment Requests</h3>
                <p className="text-xs text-slate-500">There are currently no {paymentFilter !== 'all' ? paymentFilter : ''} payment submissions.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Properties Verification & Management Table */}
        {activeAdminTab === 'properties' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Owner Property Verification & Management</h3>
                <p className="text-xs text-slate-500">Review user submitted properties, verify them for public listing, or assign VIP spotlights</p>
              </div>

              {/* Filter by verification status */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPropertyFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    propertyFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({properties.length})
                </button>
                <button
                  onClick={() => setPropertyFilter('unverified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    propertyFilter === 'unverified' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending Verification ({unverifiedProperties.length})
                </button>
                <button
                  onClick={() => setPropertyFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    propertyFilter === 'verified' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Verified ({verifiedProperties.length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Property</th>
                    <th className="px-6 py-3.5">Publisher & Contacts</th>
                    <th className="px-6 py-3.5">Price</th>
                    <th className="px-6 py-3.5">Pay Plan Tier</th>
                    <th className="px-6 py-3.5">Owner Status</th>
                    <th className="px-6 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProperties.map(prop => (
                    <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prop.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                            alt={prop.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">{prop.title}</p>
                            <p className="text-[11px] text-slate-400">{prop.propertyType} • {prop.neighborhood}, {prop.subcity}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{prop.owner.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{prop.owner.phone}</p>
                        {prop.owner.telegram && (
                          <p className="text-sky-600 text-[10px] font-bold">TG: {prop.owner.telegram}</p>
                        )}
                      </td>

                      <td className="px-6 py-4 font-black text-slate-900">
                        {prop.price.toLocaleString()} ETB
                      </td>

                      <td className="px-6 py-4">
                        {prop.payPlan === 'vip' ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-amber-400 text-slate-950">
                            👑 VIP TOP+
                          </span>
                        ) : prop.payPlan === 'premium' ? (
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-black bg-emerald-600 text-white">
                            ⭐ Premium 5x
                          </span>
                        ) : prop.payPlan === 'basic' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-200">
                            Basic 2x
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] text-slate-400 bg-slate-100">
                            Standard
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleToggleVerified(prop.id, prop.isVerified)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                              prop.isVerified
                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-emerald-600 hover:text-white animate-pulse'
                            }`}
                            title={prop.isVerified ? 'Click to unverify' : 'Click to verify and show to users'}
                          >
                            {prop.isVerified ? '✓ Verified by Owner' : '⚠️ Click to Verify'}
                          </button>
                          
                          <button
                            onClick={() => handleToggleFeatured(prop.id, prop.isFeatured)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              prop.isFeatured
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {prop.isFeatured ? '★ Featured' : 'Standard'}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedProperty(prop);
                              setCurrentView('details');
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="View Live Property"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteProperty(prop.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Owner Pricing & Telebirr Plans Settings */}
        {activeAdminTab === 'pricing_settings' && isOwner && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Owner Pricing, Plans & Telebirr Settings
                </h3>
                <p className="text-xs text-slate-500">
                  Configure the Telebirr payment receiver account and set prices for Basic, Premium, and VIP plans
                </p>
              </div>
            </div>

            {pricingSaveSuccess && (
              <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Pricing & Telebirr details updated successfully! These changes will reflect immediately across all user payment screens.</span>
              </div>
            )}

            <form onSubmit={handleSavePricing} className="space-y-6">
              {/* Telebirr Merchant Account Configuration */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Telebirr Receiving Account</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telebirr Phone Number (ቁጥር)*
                    </label>
                    <input
                      type="text"
                      required
                      value={telebirrAccountNum}
                      onChange={(e) => setTelebirrAccountNum(e.target.value)}
                      placeholder="0995406697"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telebirr Account Holder Name (ስም)*
                    </label>
                    <input
                      type="text"
                      required
                      value={telebirrAccountName}
                      onChange={(e) => setTelebirrAccountName(e.target.value)}
                      placeholder="Desalegn Guta"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Plans Pricing Configuration */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Package Prices (ETB / 30 Days)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Basic Package (ETB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={basicPrice}
                      onChange={(e) => setBasicPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Default: 0 ETB (Free)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Premium Package (ETB)*
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">5x more clients & 5 TOP+</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      VIP Package (ETB)*
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">7x more clients & 10 VIP TOP+</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Pricing & Telebirr Account Changes</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: Security & Profile Settings */}
        {activeAdminTab === 'security' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {isOwner ? 'Owner Credentials & Security Settings' : 'Admin Credentials & Security Settings'}
                </h3>
                <p className="text-xs text-slate-500">
                  Update login email, password, and contact profile for the system
                </p>
              </div>
            </div>

            {securitySaveSuccess && (
              <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Credentials updated successfully! You can now use this new Email and Password to log in.</span>
              </div>
            )}

            <form onSubmit={handleSaveSecurity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name / Display Title
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={securityName}
                    onChange={(e) => setSecurityName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login Email Address (የመግቢያ ኢሜይል)*
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={securityEmail}
                    onChange={(e) => setSecurityEmail(e.target.value)}
                    placeholder="e.g. kalebbereket49@gmail.com/owner"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: <code className="text-slate-700 font-mono font-bold">{isOwner ? 'kalebbereket49@gmail.com/owner' : 'kalebbereket49@gmail.com/admin'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login Password (የይለፍ ቃል)*
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={securityPassword}
                    onChange={(e) => setSecurityPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: <code className="text-slate-700 font-mono font-bold">{isOwner ? '1234567890owner' : '1234567890admin'}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={securityPhone}
                    onChange={(e) => setSecurityPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Save Updated Credentials</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Reject Reason Modal */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Reason for Rejecting Payment</h3>
              <p className="text-xs text-slate-500 mt-0.5">Please write the exact reason so the payer understands why</p>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason (ምክንያት)*
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder={`e.g. Telebirr transaction ID does not exist, or amount is incorrect on ${telebirrSettings.accountNumber}...`}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingRequestId(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screenshot Viewer Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedScreenshot(null)}
              className="absolute top-3 right-3 p-2 bg-slate-900/80 text-white rounded-full hover:bg-slate-900 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2">
              <h4 className="font-bold text-sm text-slate-900 mb-2">Telebirr Transaction Proof</h4>
              <img
                src={selectedScreenshot}
                alt="Receipt screenshot"
                className="w-full max-h-[75vh] object-contain rounded-2xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
