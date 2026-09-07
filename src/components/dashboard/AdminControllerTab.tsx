import React, { useState, useEffect } from 'react';
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
  Database,
  Bot,
  ArrowUpRight,
  ExternalLink,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Zap,
  Globe,
  RefreshCcw,
  SlidersHorizontal,
  MessageSquare
} from 'lucide-react';
import { AdminPermissions, SubAdmin, AdminAuditLog, AdminControllerConfig, MenuVisibilityConfig, AdminTabVisibility, PublicMenuVisibility } from '../../types';
import { 
  getAdminControllerConfig, 
  saveAdminControllerConfig, 
  toggleAdminSuspension, 
  updateAdminPermissions, 
  toggleFirstAdminSuspension,
  updateFirstAdminPermissions,
  setAdminBroadcastNotice, 
  addSubAdmin, 
  updateSubAdmin, 
  deleteSubAdmin, 
  resetAdminPasswordToDefault, 
  clearAuditLogs,
  logAdminActivity
} from '../../lib/adminController';
import { updateAdminProfileByOwner, getAdminCredentials } from '../../lib/passwords';
import { 
  getMenuConfig, 
  saveMenuConfig, 
  toggleAdminTabMenu, 
  togglePublicMenu, 
  setAllAdminTabsVisibility, 
  setAllPublicMenusVisibility, 
  resetMenuConfigToDefaults,
  syncMenuConfigFromServer
} from '../../lib/menuConfig';

interface AdminControllerTabProps {
  onShowToast: (msg: string) => void;
  adminCredentials: { email: string; name?: string; phone?: string; password?: string; avatar?: string; bio?: string };
  onAdminCredentialsUpdated?: (newCreds: { email: string; name: string; phone: string; password?: string }) => void;
  onNavigateTab?: (tab: 'telegram_channel' | 'telegram_bot' | 'properties') => void;
  onOpenEraseAllModal?: () => void;
  onOpenMenuControllerModal?: () => void;
  totalPropertiesCount?: number;
}

export const AdminControllerTab: React.FC<AdminControllerTabProps> = ({
  onShowToast,
  adminCredentials,
  onAdminCredentialsUpdated,
  onNavigateTab,
  onOpenEraseAllModal,
  onOpenMenuControllerModal,
  totalPropertiesCount = 0
}) => {
  const [config, setConfig] = useState<AdminControllerConfig>(getAdminControllerConfig());
  const [noticeInput, setNoticeInput] = useState(config.adminBroadcastNotice || '');
  const [auditFilter, setAuditFilter] = useState<'all' | 'payment' | 'property' | 'user' | 'security' | 'system'>('all');
  const [auditSearch, setAuditSearch] = useState('');
  
  // Primary Admin Credentials Form State (Owner Privilege)
  const [adminName, setAdminName] = useState(adminCredentials.name || 'Admin (Kaleb Bereket)');
  const [adminEmail, setAdminEmail] = useState(adminCredentials.email || 'kalebbereket49@gmail.com/admin');
  const [adminPhone, setAdminPhone] = useState(adminCredentials.phone || '+251995406697');
  const [adminPassword, setAdminPassword] = useState(adminCredentials.password || 'Kaleb5873');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isSavingAdminCreds, setIsSavingAdminCreds] = useState(false);
  const [adminSaveSuccessMessage, setAdminSaveSuccessMessage] = useState<string | null>(null);
  const [copiedAdminPassword, setCopiedAdminPassword] = useState(false);
  const [copiedAdminUsername, setCopiedAdminUsername] = useState(false);

  // Sync internal state when parent props change
  useEffect(() => {
    if (adminCredentials) {
      if (adminCredentials.name) setAdminName(adminCredentials.name);
      if (adminCredentials.email) setAdminEmail(adminCredentials.email);
      if (adminCredentials.phone) setAdminPhone(adminCredentials.phone);
      if (adminCredentials.password) setAdminPassword(adminCredentials.password);
    }
  }, [adminCredentials]);

  // Telegram Integration Monitor State (Owner Special Menu)
  const [telegramStatus, setTelegramStatus] = useState<any>(null);
  const [loadingTelegram, setLoadingTelegram] = useState<boolean>(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  
  // Telegram Usernames Quick Edit State
  const [quickChannelUsername, setQuickChannelUsername] = useState<string>('@Bete_Finder');
  const [quickBotUsername, setQuickBotUsername] = useState<string>('BeteFinder_bot');
  const [isSavingTelegramUsernames, setIsSavingTelegramUsernames] = useState<boolean>(false);
  const [telegramSaveSuccess, setTelegramSaveSuccess] = useState<string | null>(null);

  // Dynamic Menu Visibility State (Owner Select / Deselect to Come or Erase)
  const [menuConfig, setMenuConfig] = useState<MenuVisibilityConfig>(getMenuConfig());

  useEffect(() => {
    const handleConfigChange = (e: any) => {
      if (e.detail) setMenuConfig(e.detail);
      else setMenuConfig(getMenuConfig());
    };
    window.addEventListener('bete_menu_config_changed', handleConfigChange);
    syncMenuConfigFromServer().then((cfg) => cfg && setMenuConfig(cfg));
    return () => {
      window.removeEventListener('bete_menu_config_changed', handleConfigChange);
    };
  }, []);

  const handleToggleAdminTab = (tabKey: keyof AdminTabVisibility) => {
    const updated = toggleAdminTabMenu(tabKey);
    setMenuConfig({ ...updated });
    onShowToast(`Admin Tab "${tabKey}" is now ${updated.adminTabs[tabKey] ? 'Visible (Come)' : 'Erased (Hidden)'}`);
  };

  const handleTogglePublicMenu = (menuKey: keyof PublicMenuVisibility) => {
    const updated = togglePublicMenu(menuKey);
    setMenuConfig({ ...updated });
    onShowToast(`Public Menu "${menuKey}" is now ${updated.publicMenus[menuKey] ? 'Visible (Come)' : 'Erased (Hidden)'}`);
  };

  const handleSelectAllMenus = () => {
    setAllAdminTabsVisibility(true);
    const updated = setAllPublicMenusVisibility(true);
    setMenuConfig({ ...updated });
    onShowToast('✅ All Menus Selected (All Come)!');
  };

  const handleResetMenus = () => {
    const updated = resetMenuConfigToDefaults();
    setMenuConfig({ ...updated });
    onShowToast('🔄 Menu configurations restored to defaults.');
  };

  // Add SubAdmin Modal/Form state
  const [isAddSubAdminOpen, setIsAddSubAdminOpen] = useState(false);
  const [subAdminName, setSubAdminName] = useState('');
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPhone, setSubAdminPhone] = useState('');
  const [subAdminRole, setSubAdminRole] = useState<SubAdmin['role']>('regional_inspector');
  const [subAdminSubcity, setSubAdminSubcity] = useState('Bole');
  const [subAdminPassword, setSubAdminPassword] = useState('Admin2025!');
  const [copiedKey, setCopiedKey] = useState(false);

  // Fetch Telegram Live Telemetry for Owner
  const fetchTelegramLiveStatus = async () => {
    setLoadingTelegram(true);
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setTelegramStatus(data);
      if (data.config) {
        if (data.config.channelUsername) {
          setQuickChannelUsername(
            data.config.channelUsername.startsWith('@') 
              ? data.config.channelUsername 
              : `@${data.config.channelUsername}`
          );
        } else if (data.config.channelId) {
          setQuickChannelUsername(data.config.channelId);
        }
        if (data.config.botUsername) {
          setQuickBotUsername(data.config.botUsername.replace(/^@/, ''));
        }
      }
    } catch (err) {
      console.error('Error fetching Telegram status in controller:', err);
    } finally {
      setLoadingTelegram(false);
    }
  };

  useEffect(() => {
    fetchTelegramLiveStatus();
  }, []);

  const refreshConfig = () => {
    setConfig(getAdminControllerConfig());
  };

  // Ping Telegram Bot API
  const handlePingBotInController = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/telegram/bot-ping', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPingLatency(data.latencyMs);
        onShowToast(`⚡ Bot Ping: @${data.bot?.username || 'BeteFinder_bot'} responded in ${data.latencyMs}ms!`);
      } else {
        onShowToast(`⚠️ Ping failed: ${data.error || 'Check bot API connection'}`);
      }
    } catch (err: any) {
      onShowToast(`❌ Network error pinging Telegram Bot: ${err?.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  // Save Telegram Usernames from Owner Controller
  const handleSaveTelegramUsernames = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickChannelUsername.trim() || !quickBotUsername.trim()) {
      onShowToast('⚠️ Both Channel Username and Bot Username are required.');
      return;
    }
    setIsSavingTelegramUsernames(true);
    setTelegramSaveSuccess(null);
    try {
      const res = await fetch('/api/telegram/update-usernames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelUsername: quickChannelUsername.trim(),
          botUsername: quickBotUsername.trim(),
          autoPublishProperties: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setTelegramSaveSuccess(`Saved: Channel ${quickChannelUsername}, Bot @${quickBotUsername.replace(/^@/, '')}`);
        onShowToast('✅ Telegram usernames updated & synced to master database!');
        setTimeout(() => setTelegramSaveSuccess(null), 4000);
        await fetchTelegramLiveStatus();
      } else {
        onShowToast(`⚠️ ${data.error || 'Failed to update usernames'}`);
      }
    } catch (err: any) {
      onShowToast(`❌ Error: ${err?.message}`);
    } finally {
      setIsSavingTelegramUsernames(false);
    }
  };

  // Save Primary Admin User & Password Credentials (Owner Privilege)
  const handleSaveAdminCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      onShowToast('⚠️ Admin display name is required.');
      return;
    }
    if (!adminEmail.trim()) {
      onShowToast('⚠️ Admin email/username is required.');
      return;
    }
    if (!adminPassword.trim()) {
      onShowToast('⚠️ Admin password cannot be empty.');
      return;
    }

    setIsSavingAdminCreds(true);
    setAdminSaveSuccessMessage(null);

    try {
      // Ensure clean format
      let formattedEmail = adminEmail.trim();
      if (!formattedEmail.endsWith('/admin')) {
        formattedEmail = `${formattedEmail}/admin`;
        setAdminEmail(formattedEmail);
      }

      const result = updateAdminProfileByOwner(
        adminName.trim(),
        formattedEmail,
        adminPhone.trim() || '+251995406697',
        adminPassword.trim()
      );

      if (result.success) {
        const newCreds = result.updatedCreds || {
          email: formattedEmail,
          name: adminName.trim(),
          phone: adminPhone.trim(),
          password: adminPassword.trim()
        };

        if (onAdminCredentialsUpdated) {
          onAdminCredentialsUpdated(newCreds);
        }

        setAdminSaveSuccessMessage(`Admin user credentials updated! Sign-in handle: "${formattedEmail}"`);
        onShowToast('✅ Primary Admin login credentials updated and synced to database!');
        setTimeout(() => setAdminSaveSuccessMessage(null), 5000);
      } else {
        onShowToast(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      onShowToast(`❌ Failed to update admin credentials: ${err?.message}`);
    } finally {
      setIsSavingAdminCreds(false);
    }
  };

  // Generate strong random password for admin
  const handleGenerateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Admin';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminPassword(generated);
    setShowAdminPassword(true);
    onShowToast(`🔑 Generated new secure password: "${generated}"`);
  };

  // Factory reset admin credentials to defaults
  const handleFactoryResetAdmin = () => {
    if (window.confirm('Reset primary admin user to factory default: "kalebbereket49@gmail.com/admin" & "Kaleb5873"?')) {
      const defaultEmail = 'kalebbereket49@gmail.com/admin';
      const defaultPass = 'Kaleb5873';
      const defaultName = 'Admin (Kaleb Bereket)';
      const defaultPhone = '+251995406697';

      setAdminName(defaultName);
      setAdminEmail(defaultEmail);
      setAdminPhone(defaultPhone);
      setAdminPassword(defaultPass);

      const res = updateAdminProfileByOwner(defaultName, defaultEmail, defaultPhone, defaultPass);
      if (res.success && onAdminCredentialsUpdated) {
        onAdminCredentialsUpdated({
          email: defaultEmail,
          name: defaultName,
          phone: defaultPhone,
          password: defaultPass
        });
      }
      resetAdminPasswordToDefault();
      refreshConfig();
      onShowToast('🔄 Primary Admin reset to default credentials ("kalebbereket49@gmail.com/admin" / "Kaleb5873").');
    }
  };

  const handleToggleFirstAdminSuspension = () => {
    const isCurrentlySuspended = !!config.firstAdminPermissions?.isSuspended;
    const nextState = !isCurrentlySuspended;
    const updated = toggleFirstAdminSuspension(nextState);
    setConfig(updated);
    onShowToast(nextState ? '🚨 First Admin (Primary) Access Suspended.' : '✅ First Admin Access Restored.');
  };

  const handleFirstAdminPermissionToggle = (key: keyof AdminPermissions) => {
    const currentPerms = config.firstAdminPermissions || {
      isSuspended: false,
      canApprovePayments: true,
      canDeleteProperties: true,
      canVerifyProperties: true,
      canViewUserDatabase: true,
      canExportBackups: true,
      canBroadcastNotices: true,
    };
    const updatedVal = !currentPerms[key];
    const updated = updateFirstAdminPermissions({ [key]: updatedVal });
    setConfig(updated);
    onShowToast(`First Admin permission "${key}" updated.`);
  };

  const handleApplyFirstAdminPreset = (preset: 'all' | 'moderation' | 'finance' | 'lock') => {
    let newPerms: AdminPermissions;
    if (preset === 'all') {
      newPerms = {
        isSuspended: false,
        canApprovePayments: true,
        canDeleteProperties: true,
        canVerifyProperties: true,
        canViewUserDatabase: true,
        canExportBackups: true,
        canBroadcastNotices: true,
      };
      onShowToast('🌟 First Admin granted Full Executive Privileges.');
    } else if (preset === 'moderation') {
      newPerms = {
        isSuspended: false,
        canApprovePayments: false,
        canDeleteProperties: true,
        canVerifyProperties: true,
        canViewUserDatabase: true,
        canExportBackups: false,
        canBroadcastNotices: false,
      };
      onShowToast('🛡️ First Admin set to Moderation Authority.');
    } else if (preset === 'finance') {
      newPerms = {
        isSuspended: false,
        canApprovePayments: true,
        canDeleteProperties: false,
        canVerifyProperties: false,
        canViewUserDatabase: false,
        canExportBackups: false,
        canBroadcastNotices: false,
      };
      onShowToast('💳 First Admin set to Finance & Payments Authority.');
    } else {
      newPerms = {
        ...(config.firstAdminPermissions || {
          isSuspended: false,
          canApprovePayments: true,
          canDeleteProperties: true,
          canVerifyProperties: true,
          canViewUserDatabase: true,
          canExportBackups: true,
          canBroadcastNotices: true,
        }),
        isSuspended: true,
      };
      onShowToast('🔒 First Admin Account Suspended.');
    }
    const updated = updateFirstAdminPermissions(newPerms);
    setConfig(updated);
  };

  const handleToggleSuspension = () => {
    const nextState = !config.adminPermissions.isSuspended;
    const updated = toggleAdminSuspension(nextState);
    setConfig(updated);
    onShowToast(nextState ? '🚨 Secondary Admin Access Suspended.' : '✅ Secondary Admin Access Restored.');
  };

  const handleApplySecondaryPreset = (preset: 'all' | 'moderation' | 'finance' | 'lock') => {
    let newPerms: Partial<AdminPermissions> = {};
    if (preset === 'all') {
      newPerms = {
        isSuspended: false,
        canApprovePayments: true,
        canDeleteProperties: true,
        canVerifyProperties: true,
        canViewUserDatabase: true,
        canExportBackups: true,
        canBroadcastNotices: true,
      };
      onShowToast('🚀 All Secondary Admin permissions enabled (All ON).');
    } else if (preset === 'moderation') {
      newPerms = {
        isSuspended: false,
        canApprovePayments: false,
        canDeleteProperties: true,
        canVerifyProperties: true,
        canViewUserDatabase: false,
        canExportBackups: false,
        canBroadcastNotices: false,
      };
      onShowToast('🛡️ Secondary Admin set to Moderation Only.');
    } else if (preset === 'finance') {
      newPerms = {
        isSuspended: false,
        canApprovePayments: true,
        canDeleteProperties: false,
        canVerifyProperties: false,
        canViewUserDatabase: false,
        canExportBackups: false,
        canBroadcastNotices: false,
      };
      onShowToast('💰 Secondary Admin set to Finance & Payments Only.');
    } else if (preset === 'lock') {
      newPerms = {
        isSuspended: true,
      };
      onShowToast('🔒 Secondary Admin Access Locked.');
    }
    const updated = updateAdminPermissions(newPerms);
    setConfig(updated);
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
      
      {/* ========================================================================= */}
      {/* 1. MASTER HEADER & KILLSWITCH BANNER                                     */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border-2 border-purple-500/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Crown className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Owner Admin Controller Suite</h2>
              <span className="bg-purple-400/20 text-purple-300 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-purple-400/30">
                Master Executive Authority
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Full administrative governance: manage primary admin login credentials (username, email, password), inspect Telegram bot and channel connections, update integration handles, and supervise system authority.
            </p>
          </div>

          {/* Master Killswitch Button */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.adminPermissions.isSuspended ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                <p className="text-xs font-black text-white">Secondary Admin Access</p>
              </div>
              <p className={`text-xs font-bold mt-0.5 ${config.adminPermissions.isSuspended ? 'text-rose-400' : 'text-emerald-400'}`}>
                {config.adminPermissions.isSuspended ? '🔒 SUSPENDED / LOCKED' : '🟢 ACTIVE & AUTHORIZED'}
              </p>
            </div>

            <button
              id="admin-controller-toggle-suspension-btn"
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
                  <span>Emergency Suspend Access</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Credentials Indicator */}
        <div className="mt-6 pt-6 border-t border-purple-800/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs relative z-10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 text-[11px] font-medium block">Current Admin Login Email</span>
            <span className="text-white font-mono font-bold truncate block mt-0.5">
              {adminEmail || 'kalebbereket49@gmail.com/admin'}
            </span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Admin Password</span>
              <span className="text-amber-400 font-mono font-bold">
                {showAdminPassword ? adminPassword : '••••••••••••'}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(adminPassword);
                setCopiedKey(true);
                setTimeout(() => setCopiedKey(false), 2000);
              }}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
              title="Copy password"
            >
              {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-slate-400 text-[11px] font-medium block">Credentials Reset</span>
              <span className="text-slate-200 font-bold">Default Recovery</span>
            </div>
            <button
              onClick={handleFactoryResetAdmin}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-[11px] cursor-pointer transition-colors"
            >
              Factory Reset
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHANGE ADMIN USER, EMAIL & PASSWORD (USER REQUEST #1)                   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Change Admin User, Email & Sign-In Password</span>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Owner Exclusive
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Update the primary Admin account's username, login email, phone number, and password used to sign in to this controller.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFactoryResetAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto"
            title="Reset Admin to default Kaleb Bereket credentials"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Factory Default</span>
          </button>
        </div>

        {/* Success Alert */}
        {adminSaveSuccessMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-bold animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{adminSaveSuccessMessage}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSaveAdminCredentials} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Admin Display Name / User Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin User Display Name / Title</span>
              </label>
              <input
                id="owner-admin-name-input"
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Admin (Kaleb Bereket)"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Display name displayed across the system for the primary administrator.
              </p>
            </div>

            {/* Admin Login Email / Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin Sign-In Email / Username</span>
                </span>
                <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                  Must end with /admin
                </span>
              </label>
              <div className="relative">
                <input
                  id="owner-admin-email-input"
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="kalebbereket49@gmail.com/admin"
                  className="w-full pl-4 pr-16 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(adminEmail);
                    setCopiedAdminUsername(true);
                    setTimeout(() => setCopiedAdminUsername(false), 2000);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  {copiedAdminUsername ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                The exact identifier the admin types on the login screen to enter the controller.
              </p>
            </div>

            {/* Admin Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin Phone Number (for 2FA & Verification)</span>
              </label>
              <input
                id="owner-admin-phone-input"
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="+251995406697"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used for account verification and password reset matching.
              </p>
            </div>

            {/* Admin Sign-In Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin Sign-In Password</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateStrongPassword}
                  className="text-[11px] text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>Generate Password</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="owner-admin-password-input"
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full pl-4 pr-24 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-purple-500 focus:bg-white outline-hidden"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(adminPassword);
                      setCopiedAdminPassword(true);
                      setTimeout(() => setCopiedAdminPassword(false), 2000);
                    }}
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    {copiedAdminPassword ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Password must be provided to the admin to log in to the system.
              </p>
            </div>
          </div>

          {/* Live Sign-In Preview Card */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-purple-700 tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                Live Sign-In Card for Secondary Admin
              </span>
              <p className="text-xs text-slate-700 font-medium">
                Admin can log in using Email <code className="px-1.5 py-0.5 bg-white border border-purple-200 rounded font-mono text-purple-800 font-bold">{adminEmail.endsWith('/admin') ? adminEmail : `${adminEmail}/admin`}</code> and Password <code className="px-1.5 py-0.5 bg-white border border-purple-200 rounded font-mono text-purple-800 font-bold">{adminPassword}</code>.
              </p>
            </div>

            <button
              id="owner-save-admin-credentials-btn"
              type="submit"
              disabled={isSavingAdminCreds}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingAdminCreds ? 'Saving to Database...' : 'Save & Apply Admin Credentials'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC MENU VISIBILITY CONTROLLER (USER REQUEST #1: ERASE OR COME)   */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Dynamic Menu Visibility Controller (Erase / Come Menus)</span>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Owner Exclusive
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                When you select a menu it comes (shows); when you deselect it, it erases (hides) from navigation and admin views immediately.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSelectAllMenus}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              ✅ Select All (Come)
            </button>
            <button
              type="button"
              onClick={handleResetMenus}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              🔄 Defaults
            </button>
            {onOpenMenuControllerModal && (
              <button
                type="button"
                onClick={onOpenMenuControllerModal}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Modal View</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column A: Admin Dashboard Tabs */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Admin Dashboard Tabs</span>
                </h4>
                <p className="text-[11px] text-slate-500">Toggle tabs displayed in the owner/admin dashboard navigation bar</p>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {Object.values(menuConfig.adminTabs).filter(Boolean).length} / {Object.keys(menuConfig.adminTabs).length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'payments', label: 'Payments', desc: 'Telebirr payment slips' },
                { key: 'properties', label: 'Properties', desc: 'Listing verification' },
                { key: 'paid_subscribers', label: 'Paid Subscribers', desc: 'VIP & active plans' },
                { key: 'database_users', label: 'Database Users', desc: 'User accounts database' },
                { key: 'pricing_settings', label: 'Pricing & Telebirr', desc: 'Plans pricing matrix' },
                { key: 'telegram_channel', label: 'Telegram Channel', desc: 'Broadcaster tool' },
                { key: 'telegram_bot', label: 'Telegram Bot', desc: 'Bot status inspector' },
                { key: 'feedback', label: 'Owner Feedbacks', desc: 'Inbox for suggestions' },
                { key: 'security', label: 'Security & Profile', desc: 'Profile and password' },
                { key: 'sync', label: 'Database Sync', desc: 'Cross-device sync' },
              ].map((item) => {
                const isSelected = menuConfig.adminTabs[item.key as keyof AdminTabVisibility];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleAdminTab(item.key as keyof AdminTabVisibility)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-white border-indigo-300 shadow-2xs text-slate-900 ring-1 ring-indigo-200'
                        : 'bg-slate-100/80 border-slate-200 text-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isSelected ? 'Come' : 'Erased'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column B: Public Navigation Menus */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Public Navigation Menus</span>
                </h4>
                <p className="text-[11px] text-slate-500">Toggle public header links visible to tenants and landlords</p>
              </div>
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {Object.values(menuConfig.publicMenus).filter(Boolean).length} / {Object.keys(menuConfig.publicMenus).length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'home', label: 'Home Page', desc: 'Main landing view' },
                { key: 'rent', label: 'For Rent', desc: 'Rental properties' },
                { key: 'sale', label: 'For Sale', desc: 'Sale properties' },
                { key: 'pricing', label: 'Pricing Plans', desc: 'VIP and tiers page' },
                { key: 'dashboard', label: 'User Dashboard', desc: 'Profile and favorites' },
                { key: 'post_property', label: 'Post Property', desc: 'Property listing button' },
                { key: 'ai_assistant', label: 'Bete Assistance (Gemini)', desc: 'AI property search' },
                { key: 'feedback', label: 'Send Feedback to Owner', desc: 'Direct owner contact' },
              ].map((item) => {
                const isSelected = menuConfig.publicMenus[item.key as keyof PublicMenuVisibility];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTogglePublicMenu(item.key as keyof PublicMenuVisibility)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-white border-emerald-300 shadow-2xs text-slate-900 ring-1 ring-emerald-200'
                        : 'bg-slate-100/80 border-slate-200 text-slate-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{item.label}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isSelected ? 'Come' : 'Erased'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TELEGRAM CONNECTED HUB & STATUS INSPECTOR (USER REQUEST #2 & #4)       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Telegram Connected Status & Integration Hub</span>
                <span className="bg-cyan-100 text-cyan-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Live Telegram Monitor
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Supervise active connection to official Telegram Bot and Channel, test latency ping, and update official handles.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePingBotInController}
              disabled={isPinging}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-purple-600 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'Pinging...' : '⚡ Ping Bot API'}</span>
            </button>

            <button
              type="button"
              onClick={fetchTelegramLiveStatus}
              disabled={loadingTelegram}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Refresh Telegram status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTelegram ? 'animate-spin text-cyan-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telegram Save Feedback */}
        {telegramSaveSuccess && (
          <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-2xl flex items-center gap-2 text-xs text-cyan-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            <span>{telegramSaveSuccess}</span>
          </div>
        )}

        {/* Status Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Official Channel Status */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-50/50 to-slate-50 border border-cyan-100 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500 text-white flex items-center justify-center shadow-sm">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Official Telegram Channel</h4>
                  <p className="text-xs font-mono font-bold text-cyan-700">
                    {telegramStatus?.channel?.username ? `@${telegramStatus.channel.username}` : quickChannelUsername}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Active & Verified</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Channel Title</span>
                <span className="font-bold text-slate-800 truncate block mt-0.5">
                  {telegramStatus?.channel?.title || 'Bete Finder Ethiopia'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Auto-Publish</span>
                <span className="font-bold text-emerald-700 block mt-0.5">
                  ENABLED (Live)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-cyan-100/80">
              <a
                href={telegramStatus?.channel?.invite_link || `https://t.me/${quickChannelUsername.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1"
              >
                <span>View Channel in Telegram</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              {onNavigateTab && (
                <button
                  id="owner-goto-telegram-channel-tab-btn"
                  onClick={() => onNavigateTab('telegram_channel')}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Open Channel Suite →
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Official Bot Status */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/50 to-slate-50 border border-purple-100 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Official Telegram Bot</h4>
                  <p className="text-xs font-mono font-bold text-purple-700">
                    @{telegramStatus?.bot?.username || quickBotUsername}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Responsive</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Bot ID</span>
                <span className="font-mono font-bold text-slate-800 truncate block mt-0.5">
                  {telegramStatus?.bot?.id || '8716860236'}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Latency Check</span>
                <span className="font-bold text-purple-700 block mt-0.5">
                  {pingLatency !== null ? `${pingLatency}ms` : 'Ready to Ping'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-purple-100/80">
              <a
                href={telegramStatus?.bot?.link || `https://t.me/${quickBotUsername.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-700 hover:text-purple-800 font-bold flex items-center gap-1"
              >
                <span>Chat with Bot</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              {onNavigateTab && (
                <button
                  id="owner-goto-telegram-bot-tab-btn"
                  onClick={() => onNavigateTab('telegram_bot')}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Open Bot Console →
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Change Username of Channel and Bot directly (User Request #3) */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
                <span>Update Channel & Bot Usernames</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Change the public handle for the channel (@Bete_Finder) and bot (@BeteFinder_bot) directly.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveTelegramUsernames} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telegram Channel Username / Handle
              </label>
              <div className="relative">
                <input
                  id="owner-change-channel-username-input"
                  type="text"
                  required
                  value={quickChannelUsername}
                  onChange={(e) => setQuickChannelUsername(e.target.value)}
                  placeholder="@Bete_Finder"
                  className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telegram Bot Username
              </label>
              <div className="relative">
                <input
                  id="owner-change-bot-username-input"
                  type="text"
                  required
                  value={quickBotUsername}
                  onChange={(e) => setQuickBotUsername(e.target.value)}
                  placeholder="BeteFinder_bot"
                  className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                id="owner-save-telegram-usernames-btn"
                type="submit"
                disabled={isSavingTelegramUsernames}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isSavingTelegramUsernames ? 'Saving...' : 'Save Telegram Usernames'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LISTING PROPERTIES DANGER ZONE: ERASE ALL (USER REQUEST #3)            */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-rose-600 flex items-center gap-2">
                <span>Database Danger Zone: Erase All Listing Properties</span>
                <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Critical Action
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Purge all currently published real estate listing properties from the master database and multi-device cloud storage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="controller-erase-all-properties-trigger-btn"
              type="button"
              onClick={onOpenEraseAllModal}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Erase All Properties ({totalPropertiesCount})</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-rose-800">
          <div className="space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-rose-700">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Active Inventory: {totalPropertiesCount} Property Listings</span>
            </p>
            <p className="text-[11px] text-rose-600">
              Clicking "Erase All Properties" triggers a high-security confirmation modal where you must type ERASE or DELETE to confirm before deleting.
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('properties')}
              className="px-3.5 py-1.5 bg-white hover:bg-rose-100/50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-colors self-start sm:self-auto shrink-0"
            >
              Review Properties First →
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. OWNER DIRECTIVE / BROADCAST SYSTEM                                     */}
      {/* ========================================================================= */}
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
                className="w-full pl-4 pr-24 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-hidden"
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

      {/* ========================================================================= */}
      {/* 5B. FIRST ADMIN (PRIMARY ADMIN) PERMISSIONS MATRIX                       */}
      {/* ========================================================================= */}
      {(() => {
        const firstPerms = config.firstAdminPermissions || {
          isSuspended: false,
          canApprovePayments: true,
          canDeleteProperties: true,
          canVerifyProperties: true,
          canViewUserDatabase: true,
          canExportBackups: true,
          canBroadcastNotices: true,
        };
        const isFirstAdminSuspended = !!firstPerms.isSuspended;

        return (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-slate-900">First Admin (Primary Admin) Permissions Matrix</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                      Primary Admin Suite
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure real-time privileges and operational boundaries for the First Admin account ({adminCredentials.email || 'Admin'}).
                  </p>
                </div>
              </div>

              {/* Status and Master Lock Button */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                  isFirstAdminSuspended 
                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isFirstAdminSuspended ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                  <span>{isFirstAdminSuspended ? 'First Admin: LOCKED / SUSPENDED' : 'First Admin: ACTIVE & AUTHORIZED'}</span>
                </div>

                <button
                  type="button"
                  onClick={handleToggleFirstAdminSuspension}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    isFirstAdminSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isFirstAdminSuspended ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{isFirstAdminSuspended ? 'Restore First Admin' : 'Suspend First Admin'}</span>
                </button>
              </div>
            </div>

            {/* Quick Authority Preset Buttons */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-black text-slate-800">Quick Authority Presets for First Admin</p>
                <p className="text-[11px] text-slate-500">Apply standard privilege bundles to the Primary Admin in one click.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleApplyFirstAdminPreset('all')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Full Executive (All ON)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFirstAdminPreset('moderation')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Moderation Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFirstAdminPreset('finance')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Finance Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyFirstAdminPreset('lock')}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock First Admin</span>
                </button>
              </div>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Permission 1: Payments */}
              <div 
                onClick={() => handleFirstAdminPermissionToggle('canApprovePayments')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  firstPerms.canApprovePayments 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs font-black text-slate-900">Approve Payments</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Allow Primary Admin to verify Telebirr transaction screenshots and activate VIP tiers.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  firstPerms.canApprovePayments ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Permission 2: Delete Properties */}
              <div 
                onClick={() => handleFirstAdminPermissionToggle('canDeleteProperties')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  firstPerms.canDeleteProperties 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <p className="text-xs font-black text-slate-900">Delete Properties</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Grant Primary Admin authority to delete fraudulent or outdated listing records.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  firstPerms.canDeleteProperties ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Permission 3: Verify Properties */}
              <div 
                onClick={() => handleFirstAdminPermissionToggle('canVerifyProperties')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  firstPerms.canVerifyProperties 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-black text-slate-900">Verify Properties</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Allow Primary Admin to grant the official green verified badge to listings.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  firstPerms.canVerifyProperties ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Permission 4: User Database */}
              <div 
                onClick={() => handleFirstAdminPermissionToggle('canViewUserDatabase')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  firstPerms.canViewUserDatabase 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-black text-slate-900">View Registered Users</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Allow Primary Admin to inspect registered landlords and tenants community database.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  firstPerms.canViewUserDatabase ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Permission 5: Export Backups */}
              <div 
                onClick={() => handleFirstAdminPermissionToggle('canExportBackups')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  firstPerms.canExportBackups 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-black text-slate-900">Export Database Backups</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Grant Primary Admin authority to download full database JSON snapshots.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  firstPerms.canExportBackups ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Permission 6: Broadcast System Notice */}
              <div 
                onClick={() => handleFirstAdminPermissionToggle('canBroadcastNotices')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  firstPerms.canBroadcastNotices 
                    ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/30' 
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-black text-slate-900">Post System Notices</p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Allow Primary Admin to broadcast operational directives to other moderators.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  firstPerms.canBroadcastNotices ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 6. GRANULAR AUTHORITY MATRIX                                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">Secondary Admin Permissions Matrix</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                  Secondary Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Turn specific capabilities on or off for all secondary Admin accounts in real-time.
              </p>
            </div>
          </div>

          {/* Status and Master Lock Button for Secondary Admins */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              config.adminPermissions.isSuspended 
                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${config.adminPermissions.isSuspended ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              <span>{config.adminPermissions.isSuspended ? 'Secondary Admins: LOCKED' : 'Secondary Admins: ACTIVE'}</span>
            </div>

            <button
              type="button"
              onClick={handleToggleSuspension}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                config.adminPermissions.isSuspended
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {config.adminPermissions.isSuspended ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Restore Access</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Secondary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Authority Presets for Secondary Admin */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-black text-slate-800">Quick Authority Presets for Secondary Admin</p>
            <p className="text-[11px] text-slate-500">Enable all permissions or apply standard privilege bundles in one click.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleApplySecondaryPreset('all')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active All (All ON)</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplySecondaryPreset('moderation')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Moderation Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplySecondaryPreset('finance')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Finance Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplySecondaryPreset('lock')}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Secondary</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Permission 1 */}
          <div 
            onClick={() => handlePermissionToggle('canApprovePayments')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canApprovePayments 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-black text-slate-900">Approve Payments</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Permit verifying Telebirr screenshots and activating VIP tiers.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canApprovePayments ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 2 */}
          <div 
            onClick={() => handlePermissionToggle('canDeleteProperties')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canDeleteProperties 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <p className="text-xs font-black text-slate-900">Delete Properties</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow deleting fraudulent or expired listing records.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canDeleteProperties ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 3 */}
          <div 
            onClick={() => handlePermissionToggle('canVerifyProperties')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canVerifyProperties 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-black text-slate-900">Verify Properties</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Grant authority to mark properties with the green verified badge.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canVerifyProperties ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 4 */}
          <div 
            onClick={() => handlePermissionToggle('canViewUserDatabase')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canViewUserDatabase 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <p className="text-xs font-black text-slate-900">View Registered Users</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow inspecting registered landlords and tenants list.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canViewUserDatabase ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 5 */}
          <div 
            onClick={() => handlePermissionToggle('canExportBackups')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canExportBackups 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-black text-slate-900">Export Backups</p>
              </div>
              <p className="text-[11px] text-slate-500">
                Allow downloading complete database JSON snapshot.
              </p>
            </div>
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              config.adminPermissions.canExportBackups ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
            }`}>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>

          {/* Permission 6 */}
          <div 
            onClick={() => handlePermissionToggle('canBroadcastNotices')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              config.adminPermissions.canBroadcastNotices 
                ? 'bg-emerald-50/50 border-emerald-200' 
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-600" />
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

      {/* ========================================================================= */}
      {/* 7. DELEGATED SUB-ADMINS & REGIONAL INSPECTORS                             */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 8. LIVE AUDIT TRAIL & ACCOUNTABILITY LOG                                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">Administrative Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Chronological security log tracking all actions taken by Owner, Admins, and regional staff.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit trail by actor, action or details..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-purple-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'payment', 'property', 'user', 'security', 'system'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setAuditFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap cursor-pointer transition-colors ${
                  auditFilter === cat 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Log Records Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {filteredLogs.length > 0 ? (
              filteredLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                        log.category === 'payment' ? 'bg-emerald-100 text-emerald-800' :
                        log.category === 'property' ? 'bg-amber-100 text-amber-800' :
                        log.category === 'security' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.category}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="font-mono text-[11px] text-slate-700 block font-bold">{log.actor}</span>
                    <span className="text-[10px] text-slate-400 block">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No audit logs found matching your filter criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add SubAdmin Modal */}
      {isAddSubAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <span>Add Sub-Admin Officer</span>
              </h4>
              <button
                onClick={() => setIsAddSubAdminOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name*</label>
                <input
                  type="text"
                  required
                  value={subAdminName}
                  onChange={(e) => setSubAdminName(e.target.value)}
                  placeholder="e.g. Dawit Tadesse"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email / Username*</label>
                  <input
                    type="text"
                    required
                    value={subAdminEmail}
                    onChange={(e) => setSubAdminEmail(e.target.value)}
                    placeholder="dawit@betefinder.com/admin"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number*</label>
                  <input
                    type="text"
                    required
                    value={subAdminPhone}
                    onChange={(e) => setSubAdminPhone(e.target.value)}
                    placeholder="+251911223344"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Sub-City</label>
                  <select
                    value={subAdminSubcity}
                    onChange={(e) => setSubAdminSubcity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {['Bole', 'Kirkos', 'Yeka', 'Arada', 'Lideta', 'Nifas Silk-Lafto', 'Kolfe Keranio', 'Gulele', 'Akaky Kaliti', 'Addis Ketema', 'Lemi Kura'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Officer Role</label>
                  <select
                    value={subAdminRole}
                    onChange={(e) => setSubAdminRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="regional_inspector">Regional Inspector</option>
                    <option value="payment_officer">Payment Officer</option>
                    <option value="listing_moderator">Listing Moderator</option>
                    <option value="full_admin">Full Sub-Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Password</label>
                <input
                  type="text"
                  required
                  value={subAdminPassword}
                  onChange={(e) => setSubAdminPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSubAdminOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm & Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
