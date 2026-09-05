import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  UserPlus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Send, 
  RefreshCw, 
  FileText, 
  Sliders, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Crown,
  Search,
  Activity,
  Download,
  Copy,
  KeyRound,
  Check,
  Building2,
  DollarSign,
  Database
} from 'lucide-react';
import { AdminPermissions, SubAdmin, AdminAuditLog, AdminControllerConfig } from '../../types';
import { 
  getAdminControllerConfig, 
  saveAdminControllerConfig, 
  toggleAdminSuspension, 
  updateAdminPermissions, 
  setAdminBroadcastNotice, 
  addSubAdmin, 
  updateSubAdmin, 
  deleteSubAdmin, 
  resetAdminPasswordToDefault, 
  clearAuditLogs,
  logAdminActivity
} from '../../lib/adminController';

interface AdminControllerTabProps {
  onShowToast: (msg: string) => void;
  adminCredentials: { email: string; name: string; phone: string; password?: string };
}

export const AdminControllerTab: React.FC<AdminControllerTabProps> = ({
  onShowToast,
  adminCredentials
}) => {
  const [config, setConfig] = useState<AdminControllerConfig>(getAdminControllerConfig());
  const [noticeInput, setNoticeInput] = useState(config.adminBroadcastNotice || '');
  const [auditFilter, setAuditFilter] = useState<'all' | 'payment' | 'property' | 'user' | 'security' | 'system'>('all');
  const [auditSearch, setAuditSearch] = useState('');
  
  // Add SubAdmin Modal/Form state
  const [isAddSubAdminOpen, setIsAddSubAdminOpen] = useState(false);
  const [subAdminName, setSubAdminName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPhone, setSubAdminPhone] = useState('');
  const [subAdminRole, setSubAdminRole] = useState<SubAdmin['role']>('regional_inspector');
  const [subAdminSubcity, setSubAdminSubcity] = useState('Bole');
  const [subAdminPassword, setSubAdminPassword] = useState('Admin2025!');
  const [copiedKey, setCopiedKey] = useState(false);

  const refreshConfig = () => {
    setConfig(getAdminControllerConfig());
  };

  const handleToggleSuspension = () => {
    const nextState = !config.adminPermissions.isSuspended;
    const updated = toggleAdminSuspension(nextState);
    setConfig(updated);
    onShowToast(nextState ? '🚨 Secondary Admin Access Suspended.' : '✅ Secondary Admin Access Restored.');
  };

  const handlePermissionToggle = (key: keyof AdminPermissions) => {
    const updatedVal = !config.adminPermissions[key];
    const updated = updateAdminPermissions({ [key]: updatedVal });
    setConfig(updated);
    onShowToast(`Permission "${key}" updated.`);
  };

  const handleSaveBroadcastNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = setAdminBroadcastNotice(noticeInput.trim());
    setConfig(updated);
    onShowToast('📢 Owner Directive broadcasted to all Admin dashboards.');
  };

  const handleResetAdminPassword = () => {
    if (window.confirm('Reset primary admin password to default "Kaleb5873"?')) {
      resetAdminPasswordToDefault();
      refreshConfig();
      onShowToast('🔑 Admin password reset to default "Kaleb5873".');
    }
  };

  const handleCreateSubAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subAdminName.trim() || !subAdminEmail.trim()) return;

    let cleanEmail = subAdminEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('/admin')) {
      cleanEmail = `${cleanEmail.split('@')[0]}@betefinder.com/admin`;
    }

    const defaultPerms: AdminPermissions = {
      isSuspended: false,
      canApprovePayments: subAdminRole === 'full_admin' || subAdminRole === 'payment_officer',
      canDeleteProperties: subAdminRole === 'full_admin',
      canVerifyProperties: subAdminRole === 'full_admin' || subAdminRole === 'listing_moderator' || subAdminRole === 'regional_inspector',
      canViewUserDatabase: subAdminRole === 'full_admin',
      canExportBackups: subAdminRole === 'full_admin',
      canBroadcastNotices: false,
    };

    addSubAdmin({
      name: subAdminName.trim(),
      email: cleanEmail,
      phone: subAdminPhone.trim() || '+251911000000',
      password: subAdminPassword.trim() || 'Admin2025!',
      role: subAdminRole,
      assignedSubcity: subAdminSubcity,
      permissions: defaultPerms,
      status: 'active',
      lastLogin: new Date().toISOString()
    });

    refreshConfig();
    setIsAddSubAdminOpen(false);
    setSubAdminName('');
    setSubAdminEmail('');
    setSubAdminPhone('');
    onShowToast(`🎉 Sub-Admin "${subAdminName}" added successfully.`);
  };

  const handleToggleSubAdminStatus = (id: string, currentStatus: 'active' | 'suspended') => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    updateSubAdmin(id, { status: nextStatus });
    refreshConfig();
    onShowToast(`Sub-Admin status changed to ${nextStatus}.`);
  };

  const handleDeleteSubAdmin = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove Sub-Admin "${name}"?`)) {
      deleteSubAdmin(id);
      refreshConfig();
      onShowToast(`Sub-Admin "${name}" removed.`);
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear the audit history?')) {
      clearAuditLogs();
      refreshConfig();
      onShowToast('Audit history cleared.');
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(config.auditLogs, null, 2));
    onShowToast('📋 Audit logs copied to clipboard.');
  };

  const filteredLogs = config.auditLogs.filter(log => {
    if (auditFilter !== 'all' && log.category !== auditFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        (log.actor || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      
      {/* 1. Header Banner & Master Killswitch */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Crown className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Owner Admin Controller Suite</h2>
              <span className="bg-purple-400/20 text-purple-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-purple-400/30">
                Super-Admin Authority
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Govern secondary Admin permissions, suspend staff access in emergency scenarios, reset access credentials, assign regional inspectors, and inspect live administrative audit logs.
            </p>
          </div>

          {/* Master Killswitch Button */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.adminPermissions.isSuspended ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                <p className="text-xs font-black text-white">Secondary Admin Status</p>
              </div>
              <p className={`text-xs font-bold mt-0.5 ${config.adminPermissions.isSuspended ? 'text-rose-400' : 'text-emerald-400'}`}>
                {config.adminPermissions.isSuspended ? '🔒 SUSPENDED / LOCKED' : '🟢 ACTIVE & AUTHORIZED'}
              </p>
            </div>

            <button
              onClick={handleToggleSuspension}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
                config.adminPermissions.isSuspended
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {config.adminPermissions.isSuspended ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Restore Admin Access</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Suspend Admin Access</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Admin Quick Credentials & Reset */}
        <div className="mt-6 pt-6 border-t border-purple-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 text-[11px] font-medium block">Assigned Admin Account</span>
            <span className="text-white font-mono font-bold truncate block">{adminCredentials.email || 'kalebbereket49@gmail.com/admin'}</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Default Primary Password</span>
              <span className="text-amber-400 font-mono font-bold">Kaleb5873</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('Kaleb5873');
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="text-slate-400 hover:text-white p-1"
              title="Copy password"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Credentials Recovery</span>
              <span className="text-slate-200 font-bold">Quick Reset</span>
            </div>
            <button
              onClick={handleResetAdminPassword}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[11px] cursor-pointer"
            >
              Reset to Default
            </button>
          </div>
        </div>
      </div>

      {/* 2. Owner Directive / Broadcast System */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">Broadcast Owner Directive & Notice</h3>
            <p className="text-xs text-slate-500">
              Live announcement banner pinned across all Admin and Sub-Admin dashboards.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveBroadcastNotice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Active Directive Message
            </label>
            <div className="relative">
              <input
                type="text"
                value={noticeInput}
                onChange={(e) => setNoticeInput(e.target.value)}
                placeholder="e.g., System Notice: Prioritize vetting VIP listing requests submitted within 24 hours."
                className="w-full pl-4 pr-24 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Broadcast</span>
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 items-center text-xs">
            <span className="text-[11px] text-slate-400 font-bold">Quick Presets:</span>
            <button
              type="button"
              onClick={() => setNoticeInput('⚡ Urgent: Review and approve pending Bole luxury apartments immediately.')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
            >
              Review Bole listings
            </button>
            <button
              type="button"
              onClick={() => setNoticeInput('📱 Telebirr Notice: Cross-reference merchant 0995406697 before approving VIP plans.')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
            >
              Telebirr merchant reminder
            </button>
            <button
              type="button"
              onClick={() => setNoticeInput('🔔 Normal Operations: System running smoothly across all sub-cities.')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
            >
              Normal operations
            </button>
          </div>
        </form>
      </div>

      {/* 3. Granular Authority Matrix */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Secondary Admin Permissions Matrix</h3>
              <p className="text-xs text-slate-500">
                Grant or revoke specific functional capabilities for secondary admin accounts.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full font-bold">
            Real-Time Edge Enforcement
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Permission 1: Payments */}
          <div 
            onClick={() => handlePermissionToggle('canApprovePayments')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canApprovePayments 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className={`w-4 h-4 ${config.adminPermissions.canApprovePayments ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-black text-slate-900">Approve Telebirr Payments</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow secondary admins to verify transaction references and activate VIP plans.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canApprovePayments ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 2: Property Deletion */}
          <div 
            onClick={() => handlePermissionToggle('canDeleteProperties')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canDeleteProperties 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className={`w-4 h-4 ${config.adminPermissions.canDeleteProperties ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-black text-slate-900">Delete Property Listings</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow secondary admins to permanently remove properties from the database.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canDeleteProperties ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 3: Property Verification */}
          <div 
            onClick={() => handlePermissionToggle('canVerifyProperties')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canVerifyProperties 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${config.adminPermissions.canVerifyProperties ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-black text-slate-900">Verify Properties</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow secondary admins to grant official green verification badges to listings.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canVerifyProperties ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 4: User Database Access */}
          <div 
            onClick={() => handlePermissionToggle('canViewUserDatabase')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canViewUserDatabase 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${config.adminPermissions.canViewUserDatabase ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-black text-slate-900">View Registered Users</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Grant view and inspection access to landlord and tenant database rosters.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canViewUserDatabase ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 5: Export Master Backups */}
          <div 
            onClick={() => handlePermissionToggle('canExportBackups')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canExportBackups 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Download className={`w-4 h-4 ${config.adminPermissions.canExportBackups ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-black text-slate-900">Export Database Backups</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow secondary admins to export full JSON snapshots of the database.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canExportBackups ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 6: Broadcast System Directives */}
          <div 
            onClick={() => handlePermissionToggle('canBroadcastNotices')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canBroadcastNotices 
                ? 'bg-emerald-50/60 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${config.adminPermissions.canBroadcastNotices ? 'text-emerald-600' : 'text-slate-400'}`} />
                <p className="text-xs font-black text-slate-900">Post System Notices</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow secondary admins to edit or update the live system directive notice.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canBroadcastNotices ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

        </div>
      </div>

      {/* 4. Sub-Admin & Regional Inspector Delegate Management */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Delegated Sub-Admins & Regional Officers</h3>
              <p className="text-xs text-slate-500">
                Manage assigned inspectors for Addis Ababa sub-cities and dedicated payment officers.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddSubAdminOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Sub-Admin Officer</span>
          </button>
        </div>

        {/* Sub-Admins List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {config.subAdmins.map(sub => (
            <div key={sub.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-sm">
                    {sub.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{sub.name}</h4>
                    <p className="text-[11px] font-mono text-slate-500">{sub.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  sub.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {sub.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Assigned Zone</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span>{sub.assignedSubcity}</span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Delegated Role</span>
                  <span className="font-bold text-purple-700 capitalize mt-0.5 block truncate">
                    {sub.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                <span className="text-[11px] text-slate-400">
                  Tel: <strong className="text-slate-700 font-mono">{sub.phone}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSubAdminStatus(sub.id, sub.status)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                      sub.status === 'active'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {sub.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteSubAdmin(sub.id, sub.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                    title="Delete sub-admin"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Live Master Audit & Security Activity Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Admin Audit & Security Activity Stream</h3>
              <p className="text-xs text-slate-500">
                Continuous real-time tracking of approvals, edits, role changes, and database operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleCopyLogs}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Log</span>
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-5 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit actions or actor..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'payment', 'property', 'user', 'security', 'system'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setAuditFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-colors whitespace-nowrap cursor-pointer ${
                  auditFilter === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                    No activity logs match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {log.actor}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        log.severity === 'danger' ? 'bg-rose-100 text-rose-800' :
                        log.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                        log.severity === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add SubAdmin Modal */}
      {isAddSubAdminOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Add Sub-Admin Officer</span>
              </h3>
              <button onClick={() => setIsAddSubAdminOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={subAdminName}
                  onChange={(e) => setSubAdminName(e.target.value)}
                  placeholder="e.g., Bole Regional Inspector"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Email / Username (ends with /admin) *</label>
                <input
                  type="text"
                  required
                  value={subAdminEmail}
                  onChange={(e) => setSubAdminEmail(e.target.value)}
                  placeholder="bole.inspector@betefinder.com/admin"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={subAdminPhone}
                    onChange={(e) => setSubAdminPhone(e.target.value)}
                    placeholder="+251911..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Sub-City</label>
                  <select
                    value={subAdminSubcity}
                    onChange={(e) => setSubAdminSubcity(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Bole">Bole</option>
                    <option value="Yeka">Yeka</option>
                    <option value="Kirkos">Kirkos (Kazanchis)</option>
                    <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
                    <option value="Arada">Arada (Piazza)</option>
                    <option value="Lideta">Lideta</option>
                    <option value="Kolfe Keranio">Kolfe Keranio</option>
                    <option value="Akaky Kaliti">Akaky Kaliti</option>
                    <option value="Gulele">Gulele</option>
                    <option value="All Addis Ababa">All Addis Ababa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Permission Preset</label>
                <select
                  value={subAdminRole}
                  onChange={(e) => setSubAdminRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regional_inspector">Regional Property Inspector (Verify Listings Only)</option>
                  <option value="payment_officer">Payment Review Officer (Telebirr Approvals)</option>
                  <option value="listing_moderator">Listing Moderator (Verify & Edit Listings)</option>
                  <option value="full_admin">Full Sub-Admin (All Operations)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
                <input
                  type="text"
                  required
                  value={subAdminPassword}
                  onChange={(e) => setSubAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubAdminOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md cursor-pointer"
                >
                  Save Sub-Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
