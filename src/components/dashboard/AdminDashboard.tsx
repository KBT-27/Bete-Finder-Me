import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Crown,
  Building2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Eye,
  EyeOff,
  Camera,
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
  Sliders,
  RefreshCw,
  Database,
  Users,
  HardDrive,
  Search,
  UserX,
  StopCircle,
  ShieldAlert,
  BadgePercent,
  Layers,
  ChevronDown,
  Download,
  Copy,
  BarChart3,
  Activity,
  Server,
  Globe,
  MapPin,
  CheckCheck,
  TrendingUp,
  FileText,
  Key,
  Upload,
  Wrench,
  Cpu,
  Terminal,
  Radio,
  Share2,
  HelpCircle,
  Send,
  Bot
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { 
  getRegisteredUsers, 
  deleteRegisteredAccount, 
  stopRegisteredUserPlan, 
  updateRegisteredUserPlanTier, 
  updateAdminProfileByOwner,
  getAdminCredentials,
  getOwnerCredentials
} from '../../lib/passwords';
import { PaymentRequest, Property } from '../../types';
import { AdminControllerTab } from './AdminControllerTab';
import { TelegramHubTab } from './TelegramHubTab';
import { TelegramChannelTab } from './TelegramChannelTab';
import { TelegramBotTab } from './TelegramBotTab';
import { getAdminControllerConfig, logAdminActivity } from '../../lib/adminController';
import { safeFetchJson } from '../../lib/apiHelper';

export const AdminDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { 
    properties, 
    deleteProperty, 
    clearAllProperties,
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
    updateTelebirrSettings,
    syncWithDatabase,
    isDatabaseSyncing,
    isNeonConnected,
    lastDbSyncTimestamp
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

  // Controller config for live permissions, suspension check and owner broadcast notice
  const [controllerConfig, setControllerConfig] = useState(getAdminControllerConfig());

  useEffect(() => {
    setControllerConfig(getAdminControllerConfig());
  }, [lastDbSyncTimestamp]);

  // Navigation tab state
  const [activeAdminTab, setActiveAdminTab] = useState<
    'payments' | 'properties' | 'paid_subscribers' | 'database_users' | 'admin_controller' | 'pricing_settings' | 'security' | 'sync' | 'telegram_hub' | 'telegram_channel' | 'telegram_bot'
  >('payments');

  // Search states for all modules
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [propertySearchQuery, setPropertySearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [paidUsersSearchQuery, setPaidUsersSearchQuery] = useState('');

  // Filter states
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'unverified' | 'verified' | 'vip' | 'premium'>('all');
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Real-time ticking for live countdowns (updates every 1s)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Registered users state with local reload capability
  const [usersList, setUsersList] = useState(getRegisteredUsers());
  const reloadUsers = () => {
    setUsersList(getRegisteredUsers());
  };

  // Reject dialog state
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // User delete confirmation modal state
  const [userToDelete, setUserToDelete] = useState<{ email: string; name: string } | null>(null);

  // Erase All Properties Modal State (Owner/Admin)
  const [showEraseAllModal, setShowEraseAllModal] = useState<boolean>(false);
  const [eraseConfirmText, setEraseConfirmText] = useState<string>('');
  const [isErasingAll, setIsErasingAll] = useState<boolean>(false);

  // Security profile form state for Owner / Admin themselves
  const [securityEmail, setSecurityEmail] = useState(
    isOwner ? ownerCredentials.email : adminCredentials.email
  );
  const [securityPassword, setSecurityPassword] = useState(
    isOwner ? ownerCredentials.password : adminCredentials.password
  );
  const [securityName, setSecurityName] = useState(
    user?.name || (isOwner ? (ownerCredentials.name || 'Kaleb Bereket') : (adminCredentials.name || 'Admin (Kaleb Bereket)'))
  );
  const [securityPhone, setSecurityPhone] = useState(
    user?.phone || (isOwner ? (ownerCredentials.phone || '0995406697') : (adminCredentials.phone || '+251995406697'))
  );
  const [securityAvatar, setSecurityAvatar] = useState(
    user?.avatar || (isOwner ? (ownerCredentials.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80') : (adminCredentials.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'))
  );
  const [securityBio, setSecurityBio] = useState(
    user?.bio || (isOwner ? (ownerCredentials.bio || 'Platform Founder & Master Executive') : (adminCredentials.bio || 'System Administrator'))
  );
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);
  const [syncTelebirrWithProfile, setSyncTelebirrWithProfile] = useState(true);
  const [securitySaveSuccess, setSecuritySaveSuccess] = useState(false);

  // Admin Profile Management by Owner state (Owner only)
  const [adminMgmtName, setAdminMgmtName] = useState(adminCredentials.name || 'Admin (Kaleb Bereket)');
  const [adminMgmtEmail, setAdminMgmtEmail] = useState(adminCredentials.email || 'kalebbereket49@gmail.com/admin');
  const [adminMgmtPhone, setAdminMgmtPhone] = useState(adminCredentials.phone || '+251995406697');
  const [adminMgmtPassword, setAdminMgmtPassword] = useState(adminCredentials.password || 'Kaleb5873');
  const [adminMgmtSuccess, setAdminMgmtSuccess] = useState<string | null>(null);
  const [adminMgmtError, setAdminMgmtError] = useState<string | null>(null);

  // Telebirr & Pricing state for Owner
  const [telebirrAccountNum, setTelebirrAccountNum] = useState(telebirrSettings.accountNumber);
  const [telebirrAccountName, setTelebirrAccountName] = useState(telebirrSettings.accountName);
  const [basicPrice, setBasicPrice] = useState(plans.find(p => p.id === 'basic')?.price ?? 299);
  const [premiumPrice, setPremiumPrice] = useState(plans.find(p => p.id === 'premium')?.price ?? 599);
  const [vipPrice, setVipPrice] = useState(plans.find(p => p.id === 'vip')?.price ?? 999);
  const [pricingSaveSuccess, setPricingSaveSuccess] = useState(false);

  // Database Connection String & Advanced Management State
  const [copiedHealthReport, setCopiedHealthReport] = useState(false);
  const [connectionStringInput, setConnectionStringInput] = useState('');
  const [showConnInputPassword, setShowConnInputPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; pgVersion?: string } | null>(null);
  const [isUpdatingConnection, setIsUpdatingConnection] = useState(false);
  const [activeDbInfo, setActiveDbInfo] = useState<{
    isConnected: boolean;
    maskedUrl: string;
    rawUrl?: string;
    engineType: string;
    storageLocation: string;
  } | null>(null);

  // Database Benchmark & Diagnostics State
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    totalRoundTripMs: number;
    readLatencyMs: number;
    writeLatencyMs: number;
    status: string;
    engine: string;
  } | null>(null);

  // Database Self-Healing Repair State
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState<{
    message: string;
    fixedItemsCount: number;
    repairLog: string[];
    timestamp: number;
  } | null>(null);

  // Table Records Inspector State
  const [selectedInspectTable, setSelectedInspectTable] = useState<string>('properties');
  const [inspectRecords, setInspectRecords] = useState<any[]>([]);
  const [isLoadingInspectRecords, setIsLoadingInspectRecords] = useState(false);
  const [inspectSearchQuery, setInspectSearchQuery] = useState('');

  // Backup Import State
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [importBackupError, setImportBackupError] = useState<string | null>(null);
  const [importBackupSuccess, setImportBackupSuccess] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionSuccessToast(msg);
    setTimeout(() => setActionSuccessToast(null), 4500);
  };

  const handleEraseAllPropertiesAdmin = async () => {
    const confirmation = eraseConfirmText.trim().toUpperCase();
    if (confirmation !== 'ERASE' && confirmation !== 'DELETE') {
      showToast('⚠️ Please type ERASE or DELETE to confirm.');
      return;
    }
    setIsErasingAll(true);
    try {
      const ok = await clearAllProperties();
      if (ok) {
        showToast('🗑️ All property listings have been permanently erased from the database.');
        setShowEraseAllModal(false);
        setEraseConfirmText('');
      } else {
        showToast('❌ Failed to erase all properties. Please check database connection.');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setIsErasingAll(false);
    }
  };

  // Fetch live connection info on mount / tab visit
  const loadConnectionInfo = async () => {
    try {
      const result = await safeFetchJson<any>('/api/db/connection-info');
      if (result.isJson && result.data && result.data.success) {
        setActiveDbInfo(result.data);
        if (result.data.rawUrl && !connectionStringInput) {
          setConnectionStringInput(result.data.rawUrl);
        }
      }
    } catch (e) {
      console.error('Failed to load DB connection info', e);
    }
  };

  useEffect(() => {
    loadConnectionInfo();
  }, []);

  const handleTestConnection = async () => {
    if (!connectionStringInput.trim()) {
      setConnectionTestResult({
        success: false,
        message: 'Please type or paste a valid PostgreSQL / Neon connection string.'
      });
      return;
    }
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const result = await safeFetchJson<any>('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionStringInput.trim() })
      });
      if (result.isJson && result.data) {
        setConnectionTestResult(result.data);
        if (result.data.success) {
          showToast(`Connection Verified! Latency: ${result.data.latencyMs}ms`);
        }
      } else {
        setConnectionTestResult({
          success: false,
          message: result.message || 'Connection test could not reach database server.'
        });
      }
    } catch (err: any) {
      setConnectionTestResult({
        success: false,
        message: err?.message || 'Connection test timed out or failed.'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleApplyConnectionString = async () => {
    if (!connectionStringInput.trim()) {
      showToast('Please enter a PostgreSQL connection string.');
      return;
    }
    setIsUpdatingConnection(true);
    try {
      const result = await safeFetchJson<any>('/api/db/update-connection-string', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: connectionStringInput.trim() })
      });
      if (result.isJson && result.data && result.data.success) {
        showToast('Database connection string updated and dataset migrated successfully!');
        loadConnectionInfo();
        handleManualSync();
      } else {
        showToast(result.data?.message || result.message || 'Failed to update database connection string.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error updating connection string.');
    } finally {
      setIsUpdatingConnection(false);
    }
  };

  const handleResetConnectionString = async () => {
    if (!window.confirm('Reset database connection to internal persistent storage?')) return;
    try {
      const result = await safeFetchJson<any>('/api/db/reset-connection', { method: 'POST' });
      if (result.isJson && result.data && result.data.success) {
        setConnectionStringInput('');
        loadConnectionInfo();
        handleManualSync();
        showToast('Database reset to internal persistent storage.');
      } else {
        showToast(result.data?.message || result.message || 'Reset complete.');
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to reset connection.');
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const result = await safeFetchJson<any>('/api/db/benchmark', { method: 'POST' });
      if (result.isJson && result.data && result.data.success) {
        setBenchmarkResult(result.data);
        showToast(`Benchmark completed: ${result.data.totalRoundTripMs}ms roundtrip`);
      } else {
        showToast(result.data?.message || result.message || 'Benchmark standby.');
      }
    } catch (e: any) {
      showToast(e?.message || 'Benchmark test failed.');
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleRunDbRepair = async () => {
    setIsRepairing(true);
    try {
      const result = await safeFetchJson<any>('/api/db/repair', { method: 'POST' });
      if (result.isJson && result.data && result.data.success) {
        setRepairResult(result.data);
        showToast(result.data.message);
        handleManualSync();
      } else {
        showToast(result.data?.message || result.message || 'Repair completed.');
      }
    } catch (e: any) {
      showToast(e?.message || 'Database repair failed.');
    } finally {
      setIsRepairing(false);
    }
  };

  const handleLoadInspectRecords = async (tableName: string) => {
    setSelectedInspectTable(tableName);
    setIsLoadingInspectRecords(true);
    try {
      const result = await safeFetchJson<any>(`/api/db/table-records/${tableName}`);
      if (result.isJson && result.data && result.data.success) {
        setInspectRecords(result.data.records || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInspectRecords(false);
    }
  };

  const handleImportBackupFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportBackupError(null);
    setImportBackupSuccess(null);
    setIsImportingBackup(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        const result = await safeFetchJson<any>('/api/db/import-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backupData: parsed })
        });
        if (result.isJson && result.data && result.data.success) {
          setImportBackupSuccess(result.data.message);
          showToast('Database backup successfully restored!');
          handleManualSync();
        } else {
          setImportBackupError(result.data?.message || result.message || 'Failed to restore backup file.');
        }
      } catch (err: any) {
        setImportBackupError('Invalid JSON file format. Please upload a valid Bete Finder backup.');
      } finally {
        setIsImportingBackup(false);
      }
    };
    reader.readAsText(file);
  };

  const handleManualSync = async () => {
    setSyncToastMessage('Synchronizing with Database...');
    const res = await syncWithDatabase();
    reloadUsers();
    setSyncToastMessage(res.message);
    setTimeout(() => {
      setSyncToastMessage(null);
    }, 4000);
  };

  const handleExportDatabaseBackup = () => {
    const backupData = {
      application: "Bete Finder Ethiopia Real Estate",
      version: "2.5.0",
      exportTimestamp: new Date().toISOString(),
      exportedBy: user?.email || 'owner',
      databaseEngine: isNeonConnected ? 'Neon PostgreSQL (Serverless Cloud)' : 'Server Persistent Store',
      totalRecordsSummary: {
        propertiesCount: properties.length,
        usersCount: usersList.length,
        paymentRequestsCount: paymentRequests.length,
        totalRevenueETB: paymentRequests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.totalAmount || 0), 0)
      },
      databaseTables: {
        properties: properties,
        registered_users: usersList,
        payment_requests: paymentRequests,
        telebirr_settings: telebirrSettings,
        plans_configuration: plans,
        admin_credentials: {
          adminEmail: adminCredentials.email,
          ownerEmail: ownerCredentials.email
        }
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bete_finder_full_db_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Master Database Backup (.JSON) downloaded successfully!');
  };

  const handleCopyDiagnostics = () => {
    const diagnostics = [
      `=== BETE FINDER SYSTEM & DATABASE DIAGNOSTICS ===`,
      `Timestamp: ${new Date().toISOString()}`,
      `Database Engine: ${isNeonConnected ? 'Neon PostgreSQL (Production Live)' : 'Server Persistent Storage'}`,
      `Connection Target: ${activeDbInfo?.maskedUrl || 'Server Persistent Storage'}`,
      `Sync Status: Active & Operational`,
      `Last Sync Time: ${new Date(lastDbSyncTimestamp).toLocaleTimeString()}`,
      `Total Properties: ${properties.length} (${properties.filter(p => p.isVerified).length} Verified, ${properties.filter(p => !p.isVerified).length} Pending)`,
      `VIP/Premium Properties: ${properties.filter(p => p.tier === 'vip' || p.tier === 'premium').length}`,
      `Total Registered Users: ${usersList.length} (${usersList.filter(u => u.role === 'landlord').length} Landlords, ${usersList.filter(u => u.role === 'tenant').length} Tenants, ${usersList.filter(u => u.role === 'admin' || u.role === 'owner').length} Admins)`,
      `Total Payment Requests: ${paymentRequests.length} (${paymentRequests.filter(r => r.status === 'approved').length} Approved, ${paymentRequests.filter(r => r.status === 'pending').length} Pending)`,
      `Total Approved Revenue: ${paymentRequests.filter(r => r.status === 'approved').reduce((acc, r) => acc + (r.totalAmount || 0), 0).toLocaleString()} ETB`,
      `Telebirr Gateway Account: ${telebirrSettings.accountNumber} (${telebirrSettings.accountName})`,
      `=================================================`
    ].join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(diagnostics);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = diagnostics;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard write fallback', e);
    }

    setCopiedHealthReport(true);
    showToast('Copied! System and Database Diagnostics copied to clipboard.');
    setTimeout(() => {
      setCopiedHealthReport(false);
    }, 3000);
  };

  // -------------------------------------------------------------
  // Filtered Payments (with Live Search)
  // -------------------------------------------------------------
  const pendingPayments = paymentRequests.filter(p => p.status === 'pending');
  const filteredPayments = paymentRequests.filter(p => {
    if (paymentFilter !== 'all' && p.status !== paymentFilter) return false;
    if (paymentSearchQuery.trim()) {
      const q = paymentSearchQuery.toLowerCase().trim();
      const matchName = (p.userName || '').toLowerCase().includes(q);
      const matchEmail = (p.userEmail || '').toLowerCase().includes(q);
      const matchPhone = (p.userPhone || '').toLowerCase().includes(q);
      const matchRef = (p.transactionRef || '').toLowerCase().includes(q);
      const matchPlan = (p.planName || '').toLowerCase().includes(q);
      const matchAmount = p.totalAmount.toString().includes(q);
      return matchName || matchEmail || matchPhone || matchRef || matchPlan || matchAmount;
    }
    return true;
  });

  // -------------------------------------------------------------
  // Filtered Properties (with Live Search & Status)
  // -------------------------------------------------------------
  const unverifiedProperties = properties.filter(p => !p.isVerified);
  const verifiedProperties = properties.filter(p => p.isVerified);

  const filteredProperties = properties.filter(p => {
    if (propertyFilter === 'unverified' && p.isVerified) return false;
    if (propertyFilter === 'verified' && !p.isVerified) return false;
    if (propertyFilter === 'vip' && p.payPlan !== 'vip') return false;
    if (propertyFilter === 'premium' && p.payPlan !== 'premium') return false;

    if (propertySearchQuery.trim()) {
      const q = propertySearchQuery.toLowerCase().trim();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchType = (p.propertyType || '').toLowerCase().includes(q);
      const matchNeigh = (p.neighborhood || '').toLowerCase().includes(q);
      const matchSubcity = (p.subcity || '').toLowerCase().includes(q);
      const matchOwnerName = (p.owner?.name || '').toLowerCase().includes(q);
      const matchOwnerEmail = (p.owner?.email || '').toLowerCase().includes(q);
      const matchOwnerPhone = (p.owner?.phone || '').toLowerCase().includes(q);
      const matchPlan = (p.payPlan || 'free').toLowerCase().includes(q);
      const matchPrice = (p.price || 0).toString().includes(q);
      return matchTitle || matchType || matchNeigh || matchSubcity || matchOwnerName || matchOwnerEmail || matchOwnerPhone || matchPlan || matchPrice;
    }
    return true;
  });

  // -------------------------------------------------------------
  // Filtered Database Users (Owner only, with Live Search)
  // -------------------------------------------------------------
  const filteredUsers = usersList.filter(u => {
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase().trim();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      const matchRole = (u.role || '').toLowerCase().includes(q);
      const matchPlan = (u.activePlan || 'free').toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRole || matchPlan;
    }
    return true;
  });

  // -------------------------------------------------------------
  // Paid Subscribers & Active Plans (with Countdown Calculations)
  // -------------------------------------------------------------
  interface PaidSubscriberItem {
    id: string;
    userName: string;
    userEmail: string;
    userPhone: string;
    plan: 'vip' | 'premium' | 'basic' | 'boost';
    planName: string;
    amount: number;
    transactionRef: string;
    startDate: string;
    expiresAt: string;
    status: 'active' | 'expired';
    propertiesCount: number;
  }

  const getPaidSubscribers = (): PaidSubscriberItem[] => {
    const list: PaidSubscriberItem[] = [];

    // From approved payment requests
    paymentRequests.forEach(req => {
      if (req.status === 'approved' && req.expiresAt) {
        const reqEmail = (req.userEmail || '').trim().toLowerCase();
        const userProps = properties.filter(p => {
          const pEmail = (p.owner?.email || '').trim().toLowerCase();
          return pEmail && reqEmail && pEmail === reqEmail;
        });
        list.push({
          id: req.id,
          userName: req.userName || 'Subscriber',
          userEmail: req.userEmail || '',
          userPhone: req.userPhone || '',
          plan: (req.planId === 'vip' ? 'vip' : req.planId === 'premium' ? 'premium' : 'basic'),
          planName: req.planName || 'Plan',
          amount: req.totalAmount || 0,
          transactionRef: req.transactionRef || 'N/A',
          startDate: req.submittedAt || new Date().toISOString(),
          expiresAt: req.expiresAt,
          status: new Date(req.expiresAt).getTime() > currentTime ? 'active' : 'expired',
          propertiesCount: userProps.length
        });
      }
    });

    // Also include registered users who have an activePlan with planExpiresAt not already listed
    usersList.forEach(u => {
      if (u.activePlan && u.activePlan !== 'free' && u.activePlan !== 'basic' && u.planExpiresAt) {
        const uEmail = (u.email || '').trim().toLowerCase();
        const exists = list.some(item => {
          const itemEmail = (item.userEmail || '').trim().toLowerCase();
          return itemEmail && uEmail && itemEmail === uEmail;
        });
        if (!exists) {
          const userProps = properties.filter(p => {
            const pEmail = (p.owner?.email || '').trim().toLowerCase();
            return pEmail && uEmail && pEmail === uEmail;
          });
          list.push({
            id: `usr-plan-${u.id}`,
            userName: u.name || 'User',
            userEmail: u.email || '',
            userPhone: u.phone || '',
            plan: u.activePlan as 'vip' | 'premium' | 'basic',
            planName: u.activePlan === 'vip' ? 'VIP TOP+ Package' : u.activePlan === 'premium' ? 'Premium Package' : 'Basic Package',
            amount: u.activePlan === 'vip' ? vipPrice : u.activePlan === 'premium' ? premiumPrice : 0,
            transactionRef: 'Admin Direct Assigned',
            startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: u.planExpiresAt,
            status: new Date(u.planExpiresAt).getTime() > currentTime ? 'active' : 'expired',
            propertiesCount: userProps.length
          });
        }
      }
    });

    return list;
  };

  const allPaidSubscribers = getPaidSubscribers();
  const filteredPaidSubscribers = allPaidSubscribers.filter(sub => {
    if (paidUsersSearchQuery.trim()) {
      const q = paidUsersSearchQuery.toLowerCase().trim();
      const matchName = (sub.userName || '').toLowerCase().includes(q);
      const matchEmail = (sub.userEmail || '').toLowerCase().includes(q);
      const matchPhone = (sub.userPhone || '').toLowerCase().includes(q);
      const matchRef = (sub.transactionRef || '').toLowerCase().includes(q);
      const matchPlan = (sub.planName || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone || matchRef || matchPlan;
    }
    return true;
  });

  // Calculate detailed countdown format (Days, Hours, Minutes, Seconds)
  const formatCountdown = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - currentTime;
    if (diff <= 0) {
      return { expired: true, text: 'Expired', days: 0, hours: 0, minutes: 0, seconds: 0, percent: 0 };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Approximate percent of a 30-day period
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const percent = Math.min(100, Math.max(0, Math.round((diff / thirtyDaysMs) * 100)));

    return {
      expired: false,
      text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      days,
      hours,
      minutes,
      seconds,
      percent
    };
  };

  // -------------------------------------------------------------
  // Property Actions & Plan Tier Change Handler
  // -------------------------------------------------------------
  const handleToggleVerified = (id: string, current: boolean) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    if (!isOwner && !controllerConfig.adminPermissions.canVerifyProperties) {
      showToast('❌ Permission denied: You do not have authority to verify listings.');
      return;
    }
    verifyProperty(id, !current);
    logAdminActivity(
      isOwner ? 'Owner (Kaleb Bereket)' : 'Admin',
      !current ? 'Listing Verified' : 'Listing Unverified',
      `Property ID ${id} verification status changed to ${!current}`,
      'property',
      'info'
    );
    showToast(!current ? 'Property verified and published!' : 'Property marked as unverified.');
  };

  const handleToggleFeatured = (id: string, current: boolean) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    updateProperty(id, { isFeatured: !current });
    showToast(!current ? 'Property marked as Featured!' : 'Featured status removed.');
  };

  const handleChangePropertyPlanTier = (
    propId: string, 
    newPlan: 'free' | 'basic' | 'premium' | 'vip',
    ownerEmail: string
  ) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    const isVip = newPlan === 'vip';
    const isPremium = newPlan === 'premium';
    const isBasic = newPlan === 'basic';
    const isFree = newPlan === 'free';

    // Update Property with the selected plan and special VIP features
    updateProperty(propId, {
      payPlan: isFree ? undefined : newPlan,
      isVerified: isVip || isPremium || isBasic, // Auto verify paid plans
      isFeatured: isVip || isPremium,           // Auto feature VIP & Premium
    });

    // Also update publisher's registered user active plan in DB & local store
    if (ownerEmail) {
      updateRegisteredUserPlanTier(ownerEmail, newPlan, 1);
      reloadUsers();
    }

    logAdminActivity(
      isOwner ? 'Owner (Kaleb Bereket)' : 'Admin',
      'Plan Tier Changed',
      `Property ID ${propId} upgraded/modified to ${newPlan.toUpperCase()} tier`,
      'property',
      'success'
    );

    if (isVip) {
      showToast('👑 VIP TOP+ Package assigned! Property received Priority 1 ranking, glowing aura, and Direct Owner Unlock.');
    } else if (isPremium) {
      showToast('⭐ Premium Package assigned with 5x spotlight.');
    } else if (isBasic) {
      showToast('🔹 Basic Package assigned with verified badge.');
    } else {
      showToast('Property set to Free standard plan.');
    }
  };

  // -------------------------------------------------------------
  // Stop/Cancel Paid User Plan Handler
  // -------------------------------------------------------------
  const handleStopUserPlan = async (userEmail: string, userName: string) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    if (window.confirm(`Are you sure you want to stop and cancel the active plan for ${userName} (${userEmail})? This will revert their listings and account to Free.`)) {
      stopRegisteredUserPlan(userEmail);

      // Downgrade properties owned by this user
      const targetEmail = (userEmail || '').trim().toLowerCase();
      properties.forEach(p => {
        const pEmail = (p.owner?.email || '').trim().toLowerCase();
        if (pEmail && targetEmail && pEmail === targetEmail) {
          updateProperty(p.id, {
            payPlan: undefined,
            isFeatured: false
          });
        }
      });

      reloadUsers();
      logAdminActivity(
        isOwner ? 'Owner (Kaleb Bereket)' : 'Admin',
        'Plan Cancelled',
        `Cancelled active subscription plan for ${userName} (${userEmail})`,
        'user',
        'warning'
      );
      showToast(`Active plan for ${userName} has been stopped and cancelled.`);
      handleManualSync();
    }
  };

  // -------------------------------------------------------------
  // Delete User Account Handler (Owner Mode)
  // -------------------------------------------------------------
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const email = userToDelete.email;
    const name = userToDelete.name;

    deleteRegisteredAccount(email);
    setUserToDelete(null);
    reloadUsers();
    logAdminActivity(
      'Owner (Kaleb Bereket)',
      'User Deleted',
      `Permanently deleted registered account ${name} (${email}) from database`,
      'user',
      'danger'
    );
    showToast(`User account "${name}" (${email}) was permanently deleted from the database.`);
    handleManualSync();
  };

  // -------------------------------------------------------------
  // Payment Request Handlers
  // -------------------------------------------------------------
  const handleApprove = (requestId: string) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    if (!isOwner && !controllerConfig.adminPermissions.canApprovePayments) {
      showToast('❌ Permission denied: You do not have authority to approve payments.');
      return;
    }
    approvePaymentRequest(requestId);
    reloadUsers();
    logAdminActivity(
      isOwner ? 'Owner (Kaleb Bereket)' : 'Admin',
      'Payment Approved',
      `Approved Telebirr payment transaction for request ID ${requestId}`,
      'payment',
      'success'
    );
    showToast('Payment approved and subscription activated!');
  };

  const handleDeletePayment = (requestId: string) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      deletePaymentRequest(requestId);
      logAdminActivity(
        isOwner ? 'Owner (Kaleb Bereket)' : 'Admin',
        'Payment Record Deleted',
        `Deleted payment record ID ${requestId}`,
        'payment',
        'warning'
      );
      showToast('Payment record deleted.');
    }
  };

  const handleOpenRejectModal = (requestId: string) => {
    if (!isOwner && controllerConfig.adminPermissions.isSuspended) {
      showToast('❌ Action blocked: Administrative access is suspended by Owner.');
      return;
    }
    if (!isOwner && !controllerConfig.adminPermissions.canApprovePayments) {
      showToast('❌ Permission denied: You do not have authority to reject payments.');
      return;
    }
    setRejectingRequestId(requestId);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    const reasonText = rejectionReasonInput.trim() || `Telebirr transaction ID could not be confirmed on account ${telebirrSettings.accountNumber}.`;
    rejectPaymentRequest(rejectingRequestId, reasonText);
    logAdminActivity(
      isOwner ? 'Owner (Kaleb Bereket)' : 'Admin',
      'Payment Rejected',
      `Rejected payment request ID ${rejectingRequestId}. Reason: "${reasonText}"`,
      'payment',
      'warning'
    );
    setRejectingRequestId(null);
    setRejectionReasonInput('');
    showToast('Payment rejected and reason logged.');
  };

  // -------------------------------------------------------------
  // Security Form Submissions
  // -------------------------------------------------------------
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityEmail.trim() || !securityPassword.trim() || !securityName.trim() || !securityPhone.trim()) {
      showToast('All fields (Name, Email, Phone, Password) are required.');
      return;
    }

    if (isOwner) {
      updateOwnerSecurity(
        securityEmail.trim(),
        securityPassword.trim(),
        securityName.trim(),
        securityPhone.trim(),
        securityAvatar.trim(),
        securityBio.trim()
      );
      if (syncTelebirrWithProfile) {
        updateTelebirrSettings(securityPhone.trim(), `${securityName.trim()} (Owner)`);
        setTelebirrAccountNum(securityPhone.trim());
        setTelebirrAccountName(`${securityName.trim()} (Owner)`);
      }
    } else {
      updateAdminSecurity(
        securityEmail.trim(),
        securityPassword.trim(),
        securityName.trim(),
        securityPhone.trim(),
        securityAvatar.trim(),
        securityBio.trim()
      );
    }

    setSecuritySaveSuccess(true);
    setTimeout(() => setSecuritySaveSuccess(false), 5000);
    showToast(isOwner ? '👑 Owner Profile & Security settings updated and synced!' : 'Admin Profile & Security updated successfully!');
  };

  const handleSaveAdminProfileByOwner = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMgmtSuccess(null);
    setAdminMgmtError(null);

    const result = updateAdminProfileByOwner(
      adminMgmtName,
      adminMgmtEmail,
      adminMgmtPhone,
      adminMgmtPassword
    );

    if (result.success) {
      setAdminMgmtSuccess(result.message);
      showToast('Admin Profile updated by Owner successfully!');
      setTimeout(() => setAdminMgmtSuccess(null), 5000);
    } else {
      setAdminMgmtError(result.message);
    }
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    updateTelebirrSettings(telebirrAccountNum.trim(), telebirrAccountName.trim());
    updatePlanPrice('basic', Number(basicPrice));
    updatePlanPrice('premium', Number(premiumPrice));
    updatePlanPrice('vip', Number(vipPrice));

    setPricingSaveSuccess(true);
    setTimeout(() => setPricingSaveSuccess(false), 4000);
    showToast('Pricing and Telebirr account updated successfully.');
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
                  isOwner ? 'bg-amber-400 text-slate-950 font-black' : 'bg-purple-500 text-white'
                }`}>
                  {isOwner ? '👑 Owner Mode' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Connected as <strong className="text-white font-mono">{user?.email}</strong> • Telebirr Merchant: <strong className="text-emerald-400 font-mono">{telebirrSettings.accountNumber} ({telebirrSettings.accountName})</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveAdminTab('security')}
              id="admin-edit-profile-btn"
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="Edit Name, Phone, Email, Password, and Avatar"
            >
              <User className="w-4 h-4 text-amber-300" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={handleManualSync}
              disabled={isDatabaseSyncing}
              id="admin-sync-db-btn"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
              <span>{isDatabaseSyncing ? 'Syncing...' : 'Sync with Database'}</span>
            </button>
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

        {/* Global Toast Notification */}
        {actionSuccessToast && (
          <div className="mb-6 p-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-between gap-3 font-bold text-xs shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
              <span>{actionSuccessToast}</span>
            </div>
            <button onClick={() => setActionSuccessToast(null)} className="text-white/80 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sync Toast Notification */}
        {syncToastMessage && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-amber-950 font-bold text-xs shadow-md animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{syncToastMessage}</span>
            </div>
            <span className="text-[11px] text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md font-mono">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Secondary Admin Suspension Emergency Alert (Visible to Admin when suspended by Owner) */}
        {!isOwner && controllerConfig.adminPermissions.isSuspended && (
          <div className="mb-8 p-5 bg-rose-500 text-white rounded-3xl shadow-xl flex items-start gap-4 animate-in slide-in-from-top-4 border-2 border-rose-600">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm sm:text-base">Administrative Access Temporarily Suspended by Owner</h3>
              <p className="text-xs text-rose-100 leading-relaxed">
                Owner Kaleb Bereket has engaged the emergency administrative lock. Operational privileges (Approvals, Property Deletion, Verification modifications) are suspended until re-authorized.
              </p>
            </div>
          </div>
        )}

        {/* Owner Broadcast Directive Banner */}
        {controllerConfig.adminBroadcastNotice && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 rounded-3xl shadow-md flex items-center gap-3 border border-amber-600/30 animate-in fade-in">
            <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs font-black">
              📢
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md">
                  Owner Directive
                </span>
                <span className="text-[11px] font-bold text-slate-900 font-mono">From: Kaleb Bereket</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-950 mt-1">
                "{controllerConfig.adminBroadcastNotice}"
              </p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
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
            <p className="text-xs text-slate-500 font-bold uppercase">Active Paid Users</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
              {allPaidSubscribers.filter(s => s.status === 'active').length}
            </p>
            <span className="text-[11px] text-emerald-700 font-bold">VIP & Premium Subscribers</span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs text-slate-500 font-bold uppercase">Database Registered</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">{usersList.length}</p>
            <span className="text-[11px] text-slate-400">Registered user accounts</span>
          </div>
        </div>

        {/* Professional Executive Tab Navigation Menu */}
        <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs mb-8 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {/* Tab 1: Payments */}
          <button
            id="admin-tab-payments"
            onClick={() => setActiveAdminTab('payments')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'payments'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Payments</span>
            {pendingPayments.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {pendingPayments.length}
              </span>
            )}
          </button>

          {/* Tab 2: Property Verification & Management */}
          <button
            id="admin-tab-properties"
            onClick={() => setActiveAdminTab('properties')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'properties'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Properties</span>
            {unverifiedProperties.length > 0 && (
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                {unverifiedProperties.length}
              </span>
            )}
          </button>

          {/* Tab 3: Paid Subscribers */}
          <button
            id="admin-tab-subscribers"
            onClick={() => setActiveAdminTab('paid_subscribers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'paid_subscribers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Subscribers ({allPaidSubscribers.length})</span>
          </button>

          {/* Tab 4: Database Users (Owner only) */}
          {isOwner && (
            <button
              id="admin-tab-database-users"
              onClick={() => setActiveAdminTab('database_users')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeAdminTab === 'database_users'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Database className="w-4 h-4 text-purple-400" />
              <span>Registered Users ({usersList.length})</span>
            </button>
          )}

          {/* Tab 5: Admin Controller Suite (Owner only) */}
          {isOwner && (
            <button
              id="admin-tab-controller"
              onClick={() => setActiveAdminTab('admin_controller')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeAdminTab === 'admin_controller'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Controller Suite</span>
            </button>
          )}

          {/* Tab 6: Pricing & Telebirr Settings (Owner only) */}
          {isOwner && (
            <button
              id="admin-tab-pricing"
              onClick={() => setActiveAdminTab('pricing_settings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeAdminTab === 'pricing_settings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Pricing & Telebirr</span>
            </button>
          )}

          {/* SEPARATED TAB 7: Telegram Channel (Owner only) */}
          {isOwner && (
            <button
              id="admin-tab-telegram-channel"
              onClick={() => setActiveAdminTab('telegram_channel')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeAdminTab === 'telegram_channel' || activeAdminTab === 'telegram_hub'
                  ? 'bg-slate-900 text-white shadow-xs ring-1 ring-cyan-500/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Telegram Channel</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            </button>
          )}

          {/* SEPARATED TAB 8: Telegram Bot (Owner only) */}
          {isOwner && (
            <button
              id="admin-tab-telegram-bot"
              onClick={() => setActiveAdminTab('telegram_bot')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeAdminTab === 'telegram_bot'
                  ? 'bg-slate-900 text-white shadow-xs ring-1 ring-purple-500/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Bot className="w-4 h-4 text-purple-400" />
              <span>Telegram Bot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            </button>
          )}

          {/* Tab 9: Security & Profile Settings */}
          <button
            id="admin-tab-security"
            onClick={() => setActiveAdminTab('security')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'security'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Security & Profile</span>
          </button>

          {/* Tab 10: Cross-Device Database Sync */}
          <button
            id="admin-tab-sync"
            onClick={() => setActiveAdminTab('sync')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'sync'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Database Sync</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: Payment Approvals & Requests (with Search Bar) */}
        {/* ============================================================== */}
        {activeAdminTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Search Bar and Filter Pills */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={paymentSearchQuery}
                    onChange={(e) => setPaymentSearchQuery(e.target.value)}
                    placeholder="Search payments by Payer Name, Email, Phone, Transaction Ref, or Plan..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                  {paymentSearchQuery && (
                    <button 
                      onClick={() => setPaymentSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
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
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                <p>Showing <strong>{filteredPayments.length}</strong> of {paymentRequests.length} payment requests</p>
                {paymentSearchQuery && <p className="italic">Filtered by: "{paymentSearchQuery}"</p>}
              </div>
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
                              ? 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border-rose-200'
                          }`}>
                            {req.status === 'pending' ? '⏳ Pending Telebirr Approval' : req.status === 'approved' ? '✓ Approved & Active' : '✕ Rejected'}
                          </span>

                          <span className={`text-xs font-black px-2.5 py-0.5 rounded-md ${
                            req.planId === 'vip' 
                              ? 'bg-amber-400 text-slate-950' 
                              : req.planId === 'premium' 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-slate-900 text-white'
                          }`}>
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
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Active Plan valid until {new Date(req.expiresAt).toLocaleDateString()}</span>
                            <span className="ml-auto font-mono bg-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
                              {formatCountdown(req.expiresAt).text} remaining
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Action buttons */}
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

                        <button
                          onClick={() => handleDeletePayment(req.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title="Delete payment record"
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
                <h3 className="font-bold text-slate-900 mb-1">No Payment Requests Found</h3>
                <p className="text-xs text-slate-500">
                  {paymentSearchQuery ? `No payments match "${paymentSearchQuery}"` : 'There are currently no payment submissions matching this filter.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: Owner Property Verification & Pay Plan Tier Management */}
        {/* ============================================================== */}
        {activeAdminTab === 'properties' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden animate-in fade-in space-y-4 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  <span>Owner Property Verification & Pay Plan Management</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify user properties, switch Pay Plan Tiers (Free, Basic, Premium, VIP Package), and activate VIP TOP+ exclusive features.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
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
                  Pending ({unverifiedProperties.length})
                </button>
                <button
                  onClick={() => setPropertyFilter('vip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    propertyFilter === 'vip' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  👑 VIP ({properties.filter(p => p.payPlan === 'vip').length})
                </button>
                <button
                  onClick={() => setPropertyFilter('premium')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    propertyFilter === 'premium' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ⭐ Premium ({properties.filter(p => p.payPlan === 'premium').length})
                </button>
                <button
                  onClick={() => setPropertyFilter('verified')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    propertyFilter === 'verified' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Verified ({verifiedProperties.length})
                </button>

                {/* Erase All Properties Button */}
                <button
                  id="admin-erase-all-properties-btn"
                  onClick={() => {
                    setEraseConfirmText('');
                    setShowEraseAllModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer ml-auto"
                  title="Permanently erase all property listings from database"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Erase All Properties ({properties.length})</span>
                </button>
              </div>
            </div>

            {/* Search Bar for Properties */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={propertySearchQuery}
                onChange={(e) => setPropertySearchQuery(e.target.value)}
                placeholder="Search properties by Title, Location, Owner Name, Phone, Email, Price, or Plan Tier..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
              />
              {propertySearchQuery && (
                <button 
                  onClick={() => setPropertySearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Property Details</th>
                    <th className="px-4 py-3.5">Publisher & Contacts</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Pay Plan Tier Selector</th>
                    <th className="px-4 py-3.5">VIP Features</th>
                    <th className="px-4 py-3.5">Verification</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProperties.map(prop => {
                    const isVip = prop.payPlan === 'vip';
                    return (
                      <tr 
                        key={prop.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isVip ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Property preview */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <img
                                src={prop.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                                alt={prop.title}
                                referrerPolicy="no-referrer"
                                className={`w-14 h-14 rounded-xl object-cover border ${
                                  isVip ? 'border-2 border-amber-400 shadow-md ring-2 ring-amber-400/30' : 'border-slate-200'
                                }`}
                              />
                              {isVip && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 p-0.5 rounded-full shadow-xs">
                                  <Crown className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate max-w-xs">{prop.title}</p>
                              <p className="text-[11px] text-slate-500 font-semibold">{prop.propertyType} • {prop.neighborhood}, {prop.subcity}</p>
                              <span className="text-[10px] text-slate-400">ID: {prop.id}</span>
                            </div>
                          </div>
                        </td>

                        {/* Publisher */}
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-800">{prop.owner.name}</p>
                          <p className="text-slate-500 font-mono text-[11px]">{prop.owner.phone}</p>
                          <p className="text-slate-400 text-[10px] truncate max-w-[140px]">{prop.owner.email}</p>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4 font-black text-slate-900 whitespace-nowrap">
                          {prop.price.toLocaleString()} ETB
                        </td>

                        {/* Pay Plan Tier Choose Selector */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <select
                              value={prop.payPlan || 'free'}
                              onChange={(e) => {
                                const val = e.target.value as 'free' | 'basic' | 'premium' | 'vip';
                                handleChangePropertyPlanTier(prop.id, val, prop.owner.email);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition-all shadow-xs ${
                                prop.payPlan === 'vip'
                                  ? 'bg-amber-400 text-slate-950 border-amber-500 ring-2 ring-amber-400/30'
                                  : prop.payPlan === 'premium'
                                  ? 'bg-purple-600 text-white border-purple-700'
                                  : prop.payPlan === 'basic'
                                  ? 'bg-slate-900 text-white border-slate-950'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="free">🆓 Free Plan</option>
                              <option value="basic">🔹 Basic Package</option>
                              <option value="premium">⭐ Premium Package</option>
                              <option value="vip">👑 VIP Package</option>
                            </select>
                            <p className="text-[10px] text-slate-400">
                              {prop.payPlan === 'vip' 
                                ? '👑 Top #1 Ranking & Gold Aura' 
                                : prop.payPlan === 'premium' 
                                ? '⭐ 5x Spotlight Boost' 
                                : prop.payPlan === 'basic' 
                                ? '🔹 Verified Basic' 
                                : 'Standard Free'}
                            </p>
                          </div>
                        </td>

                        {/* VIP Package Features Column */}
                        <td className="px-4 py-4">
                          {isVip ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs">
                                <Crown className="w-3 h-3" /> VIP TOP+
                              </span>
                              <div className="text-[10px] text-amber-900 font-bold space-y-0.5">
                                <p className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> 0% Broker Fee Badge</p>
                                <p className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Direct Contact Priority</p>
                                <p className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> 10 HD Photos</p>
                              </div>
                            </div>
                          ) : prop.payPlan === 'premium' ? (
                            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-200">
                              ⭐ 5x More Clients
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Upgrade to VIP for gold spotlight
                            </span>
                          )}
                        </td>

                        {/* Verification & Featured switches */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => handleToggleVerified(prop.id, prop.isVerified)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                                prop.isVerified
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-emerald-600 hover:text-white animate-pulse'
                              }`}
                            >
                              {prop.isVerified ? '✓ Verified' : '⚠️ Click to Verify'}
                            </button>
                            
                            <button
                              onClick={() => handleToggleFeatured(prop.id, prop.isFeatured)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                prop.isFeatured
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              {prop.isFeatured ? '★ Featured Spotlight' : 'Standard'}
                            </button>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProperty(prop);
                                setCurrentView('details');
                              }}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                              title="View Property"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete listing "${prop.title}" permanently?`)) {
                                  deleteProperty(prop.id);
                                  showToast('Listing removed.');
                                }
                              }}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer transition-colors"
                              title="Delete Listing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredProperties.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No properties found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: NEW Paid Users & Plan Control (with Realtime Countdown & Stop Plan) */}
        {/* ============================================================== */}
        {activeAdminTab === 'paid_subscribers' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header and Search */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    <span>Paid Users, Subscription Countdown & Plan Control</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitor active VIP and Premium subscribers in real-time, view live countdown timers, and stop or cancel user plans instantly.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-emerald-800 text-xs font-bold shrink-0">
                  <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Real-time Live Clock Active</span>
                </div>
              </div>

              {/* Search Bar for Paid Users */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={paidUsersSearchQuery}
                  onChange={(e) => setPaidUsersSearchQuery(e.target.value)}
                  placeholder="Search paid users by Name, Email, Phone, Plan Tier, or Transaction Ref..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                {paidUsersSearchQuery && (
                  <button 
                    onClick={() => setPaidUsersSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of Paid Users */}
            {filteredPaidSubscribers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPaidSubscribers.map(sub => {
                  const countdown = formatCountdown(sub.expiresAt);
                  const isVip = sub.plan === 'vip';

                  return (
                    <div 
                      key={sub.id} 
                      className={`bg-white rounded-3xl p-6 border shadow-xs transition-all relative overflow-hidden ${
                        isVip 
                          ? 'border-amber-300 ring-2 ring-amber-400/20' 
                          : 'border-slate-200'
                      }`}
                    >
                      {/* Top banner */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                            isVip ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'
                          }`}>
                            {isVip ? <Crown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900">{sub.userName}</h4>
                            <p className="text-slate-500 text-xs font-mono">{sub.userEmail}</p>
                            <p className="text-slate-400 text-[11px] font-mono">{sub.userPhone}</p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          isVip 
                            ? 'bg-amber-400 text-slate-950 shadow-xs' 
                            : 'bg-purple-100 text-purple-900 border border-purple-200'
                        }`}>
                          {sub.planName}
                        </span>
                      </div>

                      {/* Live Real-time Countdown Box */}
                      <div className="p-4 bg-slate-900 text-white rounded-2xl mb-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Subscription Countdown Timer</span>
                          </span>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                            countdown.expired ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
                          }`}>
                            {countdown.expired ? 'EXPIRED' : 'ACTIVE'}
                          </span>
                        </div>

                        {/* Big Countdown Digits */}
                        <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                          {countdown.text}
                        </div>

                        {/* Progress Bar */}
                        {!countdown.expired && (
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                isVip ? 'bg-amber-400' : 'bg-purple-500'
                              }`} 
                              style={{ width: `${countdown.percent}%` }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Expires: {new Date(sub.expiresAt).toLocaleDateString()}</span>
                          <span>{sub.propertiesCount} Listing(s) Active</span>
                        </div>
                      </div>

                      {/* Payment details */}
                      <div className="grid grid-cols-2 gap-2 text-xs mb-4 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Amount Paid</p>
                          <p className="font-bold text-slate-900">{sub.amount.toLocaleString()} ETB</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Transaction Ref</p>
                          <p className="font-mono text-slate-800 truncate">{sub.transactionRef}</p>
                        </div>
                      </div>

                      {/* Action buttons: Stop Plan */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleStopUserPlan(sub.userEmail, sub.userName)}
                          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <StopCircle className="w-4 h-4 text-rose-600" />
                          <span>Stop & Cancel User Plan</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">No Active Paid Users</h3>
                <p className="text-xs text-slate-500">
                  {paidUsersSearchQuery 
                    ? `No paid subscribers match "${paidUsersSearchQuery}"` 
                    : 'When users subscribe to VIP or Premium packages, their live countdown timers will appear here.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: Database Registered Users (Owner Mode Only with Delete & Search) */}
        {/* ============================================================== */}
        {activeAdminTab === 'database_users' && isOwner && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-600" />
                    <span>Database Registered Users Management (Owner Access Only)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    View all registered user identities, search database records, manage plans, and delete user accounts.
                  </p>
                </div>
                <div className="bg-amber-100 text-amber-900 px-3 py-1.5 rounded-xl font-bold text-xs">
                  {usersList.length} Total Users Registered
                </div>
              </div>

              {/* Search Bar for Database Users */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search registered users by Name, Email, Phone, Role, Plan, or Provider..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                  {userSearchQuery && (
                    <button 
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    fetch('/api/users')
                      .then(res => res.json())
                      .then(d => {
                        if (d.users) setUsersList(d.users);
                        showToast('Database registered users refreshed successfully!');
                      })
                      .catch(() => showToast('Refreshed from live state.'));
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Refresh DB</span>
                </button>
              </div>

              {/* Mobile Card List View (Visible on Mobile & Tablet) */}
              <div className="block md:hidden space-y-3">
                {filteredUsers.map((u) => {
                  const uEmail = (u.email || '').trim().toLowerCase();
                  const userProps = properties.filter(p => {
                    const pEmail = (p.owner?.email || '').trim().toLowerCase();
                    return pEmail && uEmail && pEmail === uEmail;
                  });
                  const isOwnerUser = (uEmail && uEmail === (ownerCredentials.email || '').trim().toLowerCase()) || u.role === 'owner';
                  const isGoogleUser = u.provider === 'google' || uEmail.includes('@gmail.com');

                  return (
                    <div key={u.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-black text-sm shrink-0">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-900">{u.name || 'Registered User'}</p>
                            <p className="font-mono text-xs text-slate-600 break-all">{u.email}</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full font-black uppercase text-[10px] shrink-0 ${
                          u.role === 'owner' 
                            ? 'bg-amber-400 text-slate-950' 
                            : u.role === 'admin' 
                            ? 'bg-purple-600 text-white' 
                            : u.role === 'landlord' 
                            ? 'bg-blue-100 text-blue-900' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 text-slate-600">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Phone</p>
                          <p className="font-mono font-medium text-slate-800">{u.phone || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Registered Via</p>
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-slate-700">
                            {isGoogleUser ? '🔵 Google Auth' : '🔑 Email / Pass'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Active Plan</p>
                          <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] inline-block ${
                            u.activePlan === 'vip' 
                              ? 'bg-amber-400 text-slate-950' 
                              : u.activePlan === 'premium' 
                              ? 'bg-purple-600 text-white' 
                              : u.activePlan === 'basic'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.activePlan || 'free'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Listings</p>
                          <p className="font-bold text-slate-800">{userProps.length} property</p>
                        </div>
                      </div>

                      {u.registeredAt && (
                        <p className="text-[10px] text-slate-400 font-medium">
                          Registered: {new Date(u.registeredAt).toLocaleDateString()} at {new Date(u.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}

                      <div className="pt-1">
                        {isOwnerUser ? (
                          <span className="text-xs text-slate-400 italic">Owner Protected</span>
                        ) : (
                          <button
                            onClick={() => setUserToDelete({ email: u.email, name: u.name || u.email })}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete User Account</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop / Laptop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">User Identity</th>
                      <th className="px-4 py-3.5">Gmail / Email</th>
                      <th className="px-4 py-3.5">Phone</th>
                      <th className="px-4 py-3.5">Provider</th>
                      <th className="px-4 py-3.5">Role</th>
                      <th className="px-4 py-3.5">Active Plan</th>
                      <th className="px-4 py-3.5">Listings</th>
                      <th className="px-4 py-3.5 text-right">Delete Account</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredUsers.map((u) => {
                      const uEmail = (u.email || '').trim().toLowerCase();
                      const userProps = properties.filter(p => {
                        const pEmail = (p.owner?.email || '').trim().toLowerCase();
                        return pEmail && uEmail && pEmail === uEmail;
                      });
                      const isOwnerUser = (uEmail && uEmail === (ownerCredentials.email || '').trim().toLowerCase()) || u.role === 'owner';
                      const isGoogleUser = u.provider === 'google' || uEmail.includes('@gmail.com');

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-black text-xs shrink-0">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{u.name || 'Registered User'}</p>
                                {u.registeredAt ? (
                                  <p className="text-[10px] text-slate-400">
                                    {new Date(u.registeredAt).toLocaleDateString()}
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-slate-400">ID: {u.id.substring(0, 10)}...</p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 font-mono font-medium text-slate-800">
                            {u.email}
                          </td>

                          <td className="px-4 py-4 font-mono text-slate-700">
                            {u.phone || '—'}
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isGoogleUser ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isGoogleUser ? 'Google Sign-In' : 'Email/Password'}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-0.5 rounded-md font-extrabold uppercase text-[10px] ${
                              u.role === 'owner' 
                                ? 'bg-amber-400 text-slate-950' 
                                : u.role === 'admin' 
                                ? 'bg-purple-600 text-white' 
                                : u.role === 'landlord' 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-0.5 rounded-md font-black uppercase text-[10px] ${
                              u.activePlan === 'vip' 
                                ? 'bg-amber-400 text-slate-950' 
                                : u.activePlan === 'premium' 
                                ? 'bg-purple-600 text-white' 
                                : u.activePlan === 'basic'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {u.activePlan || 'free'}
                            </span>
                          </td>

                          <td className="px-4 py-4 font-bold text-slate-800">
                            {userProps.length} property
                          </td>

                          <td className="px-4 py-4 text-right">
                            {isOwnerUser ? (
                              <span className="text-[11px] text-slate-400 italic">Owner Protected</span>
                            ) : (
                              <button
                                onClick={() => setUserToDelete({ email: u.email, name: u.name || u.email })}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                                title="Delete user from database"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete User</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No database users match "{userSearchQuery}".
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: Owner Pricing & Telebirr Plans Settings */}
        {/* ============================================================== */}
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
                <span>Pricing & Telebirr details updated successfully! These changes reflect immediately.</span>
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

        {/* ============================================================== */}
        {/* TAB 6: Security, Profile Settings & Admin Profile Management by Owner */}
        {/* ============================================================== */}
        {activeAdminTab === 'security' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
            
            {/* Section A: Owner / Current User's Own Profile & Credentials */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isOwner 
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-600' 
                      : 'bg-purple-500/10 border border-purple-500/20 text-purple-600'
                  }`}>
                    {isOwner ? <Crown className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>{isOwner ? '👑 Master Owner Profile & Security Suite' : 'Admin Profile & Security Settings'}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Full control to edit your display name, phone number, login email, password, avatar, and bio
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                  isOwner ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-purple-100 text-purple-900 border border-purple-300'
                }`}>
                  {isOwner ? '👑 Master Identity' : '🛡️ Administrator'}
                </span>
              </div>

              {securitySaveSuccess && (
                <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-black text-emerald-900">Profile & Credentials Successfully Synchronized!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Updated identity ({securityName}, {securityPhone}, {securityEmail}) is active in your session, local store, and synced across database devices.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveSecurity} className="space-y-6">
                
                {/* 1. Avatar Selection & Preview */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
                    Profile Picture / Avatar
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={securityAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={securityName}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                      {isOwner && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md border border-white">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="relative">
                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="url"
                          placeholder="Paste custom avatar image URL..."
                          value={securityAvatar}
                          onChange={(e) => setSecurityAvatar(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      {/* Fast Preset Avatars */}
                      <div className="flex items-center gap-2 pt-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                        {[
                          { label: 'Executive 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
                          { label: 'Corporate', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
                          { label: 'Tech Leader', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
                          { label: 'Director', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' }
                        ].map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSecurityAvatar(preset.url)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              securityAvatar === preset.url
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Full Name and Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name / Display Title*
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kaleb Bereket"
                        value={securityName}
                        onChange={(e) => setSecurityName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Phone Number*
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0995406697 or +251995406697"
                        value={securityPhone}
                        onChange={(e) => setSecurityPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Used for SMS/Call verifications and Password Reset lookups
                    </p>
                  </div>
                </div>

                {/* 3. Login Email and Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Login Email / Account Identifier*
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder={isOwner ? 'kalebbereket49@gmail.com/owner' : 'admin@betefinder.et'}
                        value={securityEmail}
                        onChange={(e) => setSecurityEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Supports direct Gmail login or custom <code className="text-amber-700">/owner</code> username
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Login Password*
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecurityPassword(!showSecurityPassword)}
                        className="text-[11px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showSecurityPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecurityPassword ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showSecurityPassword ? 'text' : 'password'}
                        required
                        value={securityPassword}
                        onChange={(e) => setSecurityPassword(e.target.value)}
                        className="w-full pl-9 pr-16 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(securityPassword);
                          showToast('Password copied to clipboard!');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 rounded-md transition-colors cursor-pointer"
                        title="Copy password"
                      >
                        Copy
                      </button>
                    </div>
                    {/* Password strength indicator */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={`h-1 flex-1 rounded-full ${
                        securityPassword.length >= 8 ? 'bg-emerald-500' : securityPassword.length >= 5 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span className="text-[10px] font-bold text-slate-500">
                        {securityPassword.length >= 8 ? 'Strong' : securityPassword.length >= 5 ? 'Medium' : 'Short'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Professional Title / Bio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role Title / Platform Bio
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Platform Founder & Real Estate Director"
                      value={securityBio}
                      onChange={(e) => setSecurityBio(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* 5. Telebirr Payment Receiver Auto-Sync Toggle (Owner only) */}
                {isOwner && (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={syncTelebirrWithProfile}
                        onChange={(e) => setSyncTelebirrWithProfile(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-emerald-600 rounded-sm border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <span>Auto-sync Telebirr Merchant Account to this Name & Phone</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-md font-bold">Recommended</span>
                        </p>
                        <p className="text-[11px] text-emerald-800 mt-0.5">
                          When checked, tenant and landlord VIP/Premium plan subscription payments will automatically be directed to <strong className="font-mono">{securityPhone || '0995406697'}</strong> under <strong className="font-mono">{securityName || 'Kaleb Bereket'} (Owner)</strong>.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* 6. Save Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    id="save-owner-credentials-btn"
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Save {isOwner ? 'Owner Profile & Security' : 'My Credentials'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Section B: OWNER MANAGEMENT OF ADMIN FULL PROFILE (Name, User/Email, Phone, Password) */}
            {isOwner && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-200 shadow-md">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-100">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-purple-950 flex items-center gap-2">
                      <span>Admin Profile & Credentials Management</span>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold uppercase">
                        Owner Privilege
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      As the Owner, you have direct authorization to change the Admin's full name, login email/user, phone, and password.
                    </p>
                  </div>
                </div>

                {adminMgmtSuccess && (
                  <div className="p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{adminMgmtSuccess}</span>
                  </div>
                )}

                {adminMgmtError && (
                  <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>{adminMgmtError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAdminProfileByOwner} className="space-y-4">
                  {/* Admin Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input
                        type="text"
                        required
                        value={adminMgmtName}
                        onChange={(e) => setAdminMgmtName(e.target.value)}
                        placeholder="Admin (Kaleb Bereket)"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Admin User / Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Login Email / Username (Must end with /admin) *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input
                        type="text"
                        required
                        value={adminMgmtEmail}
                        onChange={(e) => setAdminMgmtEmail(e.target.value)}
                        placeholder="kalebbereket49@gmail.com/admin"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-purple-800 font-medium mt-1">
                      Security rule: Admin accounts must contain "/" and end in <code className="font-mono font-bold">/admin</code>.
                    </p>
                  </div>

                  {/* Admin Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Phone Number *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input
                        type="text"
                        required
                        value={adminMgmtPhone}
                        onChange={(e) => setAdminMgmtPhone(e.target.value)}
                        placeholder="+251995406697"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Admin Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Admin Password (የይለፍ ቃል) *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
                      <input
                        type="text"
                        required
                        value={adminMgmtPassword}
                        onChange={(e) => setAdminMgmtPassword(e.target.value)}
                        placeholder="Kaleb5873"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-purple-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4 text-purple-200" />
                      <span>Save & Apply Admin Profile Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB: Owner Admin Controller Suite (Sub-Admins, Authorities, Audits) */}
        {/* ============================================================== */}
        {activeAdminTab === 'admin_controller' && isOwner && (
          <AdminControllerTab
            onShowToast={showToast}
            adminCredentials={adminCredentials}
            onAdminCredentialsUpdated={(newCreds) => {
              updateAdminSecurity(newCreds.email, newCreds.password || '', newCreds.name, newCreds.phone);
              setAdminMgmtEmail(newCreds.email);
              setAdminMgmtName(newCreds.name);
              setAdminMgmtPhone(newCreds.phone);
              if (newCreds.password) setAdminMgmtPassword(newCreds.password);
            }}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 7: Database & Multi-Device Cross Sync (Master Analytics & Details) */}
        {/* ============================================================== */}
        {activeAdminTab === 'sync' && (() => {
          // Compute all deep statistics across Database entities
          const totalProperties = properties.length;
          const verifiedProps = properties.filter(p => p.isVerified).length;
          const pendingProps = properties.filter(p => !p.isVerified).length;
          const vipProps = properties.filter(p => p.payPlan === 'vip' || p.tier === 'vip').length;
          const premiumProps = properties.filter(p => p.payPlan === 'premium' || p.tier === 'premium').length;
          const basicProps = properties.filter(p => p.payPlan === 'basic' || p.tier === 'basic').length;
          const freeProps = totalProperties - (vipProps + premiumProps + basicProps);

          const rentProps = properties.filter(p => p.listingType === 'rent');
          const saleProps = properties.filter(p => p.listingType === 'sale');
          const avgRentPrice = rentProps.length > 0 
            ? Math.round(rentProps.reduce((sum, p) => sum + (p.price || 0), 0) / rentProps.length) 
            : 0;
          const avgSalePrice = saleProps.length > 0 
            ? Math.round(saleProps.reduce((sum, p) => sum + (p.price || 0), 0) / saleProps.length) 
            : 0;
          const totalDbAssetValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);

          const houseCount = properties.filter(p => p.propertyType === 'house' || p.type === 'house').length;
          const aptCount = properties.filter(p => p.propertyType === 'apartment' || p.type === 'apartment').length;
          const commCount = properties.filter(p => p.propertyType === 'commercial' || p.type === 'commercial').length;
          const landCount = properties.filter(p => p.propertyType === 'land' || p.type === 'land').length;
          const guestCount = properties.filter(p => p.propertyType === 'guesthouse' || p.type === 'guesthouse').length;

          // User demographics
          const totalUsers = usersList.length;
          const landlordCount = usersList.filter(u => u.role === 'landlord').length;
          const tenantCount = usersList.filter(u => u.role === 'tenant').length;
          const adminCount = usersList.filter(u => u.role === 'admin' || u.role === 'owner').length;
          const vipUsers = usersList.filter(u => u.activePlan === 'vip').length;
          const premiumUsers = usersList.filter(u => u.activePlan === 'premium').length;
          const basicUsers = usersList.filter(u => u.activePlan === 'basic').length;
          const postersCount = usersList.filter(u => {
            const uEmail = (u.email || '').trim().toLowerCase();
            return uEmail && properties.some(p => {
              const pEmail = (p.owner?.email || '').trim().toLowerCase();
              return pEmail === uEmail;
            });
          }).length;

          // Financial stats
          const approvedPayments = paymentRequests.filter(p => p.status === 'approved');
          const pendingPaymentsList = paymentRequests.filter(p => p.status === 'pending');
          const rejectedPaymentsList = paymentRequests.filter(p => p.status === 'rejected');
          const totalApprovedETB = approvedPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
          const totalPendingETB = pendingPaymentsList.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
          const totalRejectedETB = rejectedPaymentsList.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

          // Subcity aggregation
          const subcityMap: Record<string, number> = {};
          properties.forEach(p => {
            const sc = p.neighborhood || p.location?.subcity || 'Bole';
            subcityMap[sc] = (subcityMap[sc] || 0) + 1;
          });
          const topSubcities = Object.entries(subcityMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          // Payload size calculation
          const samplePayload = JSON.stringify({ properties, users: usersList, paymentRequests, telebirrSettings, plans });
          const payloadSizeKB = (new Blob([samplePayload]).size / 1024).toFixed(1);

          return (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Header & Quick Action Hub */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                          Master Database Sync & Intelligence
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">
                          Cloud Database Management Console
                        </h2>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                      Real-time live multi-device cross synchronization powered by <strong>Neon PostgreSQL & Persistent Edge Store</strong>. All CRUD mutations across properties, user accounts, and Telebirr payments are instantaneously replicated.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-slate-300">
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Status: Active & Live Connected
                      </span>
                      <span className="flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-lg text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Last Sync: <strong>{new Date(lastDbSyncTimestamp).toLocaleTimeString()}</strong>
                      </span>
                      <span className="flex items-center gap-1 px-3 py-1 bg-slate-800 rounded-lg text-slate-300">
                        <Server className="w-3.5 h-3.5 text-slate-400" />
                        Latency: <strong>~32ms (Edge)</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={isDatabaseSyncing}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isDatabaseSyncing ? 'animate-spin' : ''}`} />
                      <span>{isDatabaseSyncing ? 'Synchronizing...' : 'Force Sync to Database Now'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportDatabaseBackup}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Export Database Backup (.JSON)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyDiagnostics}
                      className={`px-5 py-2 font-bold text-xs rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        copiedHealthReport
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/80'
                      }`}
                    >
                      {copiedHealthReport ? (
                        <>
                          <CheckCheck className="w-4 h-4 text-slate-950 font-bold animate-bounce" />
                          <span className="font-black text-slate-950">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Health Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* Advanced Database Connection & Engine Configuration Panel */}
              {/* ============================================================== */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900">PostgreSQL / Neon Connection String Manager</h3>
                      <p className="text-xs text-slate-500">Configure or switch the live cloud database connection string across all devices</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${
                      activeDbInfo?.isConnected 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${activeDbInfo?.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                      <span>{activeDbInfo?.engineType || 'Server Persistent Storage'}</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        PostgreSQL Connection String (URI):
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Format: postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showConnInputPassword ? 'text' : 'password'}
                          value={connectionStringInput}
                          onChange={(e) => setConnectionStringInput(e.target.value)}
                          placeholder="postgresql://username:password@ep-example-123.eu-central-1.aws.neon.tech/neondb?sslmode=require"
                          className="w-full pl-3 pr-24 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConnInputPassword(!showConnInputPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-md cursor-pointer transition-colors"
                        >
                          {showConnInputPassword ? 'Hide' : 'Reveal'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={isTestingConnection || !connectionStringInput.trim()}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <Radio className={`w-3.5 h-3.5 text-slate-600 ${isTestingConnection ? 'animate-spin' : ''}`} />
                          <span>{isTestingConnection ? 'Testing...' : 'Test Connection'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApplyConnectionString}
                          disabled={isUpdatingConnection || !connectionStringInput.trim()}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                        >
                          <Save className={`w-3.5 h-3.5 ${isUpdatingConnection ? 'animate-spin' : ''}`} />
                          <span>{isUpdatingConnection ? 'Connecting...' : 'Save & Connect'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResetConnectionString}
                          className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-colors"
                          title="Reset to local internal storage"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Test Connection Output Feedback */}
                  {connectionTestResult && (
                    <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                      connectionTestResult.success 
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                        : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}>
                      {connectionTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-bold">{connectionTestResult.message}</p>
                        {connectionTestResult.pgVersion && (
                          <p className="text-[11px] text-slate-600 mt-0.5 font-mono">
                            Engine: {connectionTestResult.pgVersion}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Active Target Banner */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-500 font-medium">Active Database Target:</span>
                      <code className="bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                        {activeDbInfo?.maskedUrl || 'Internal Server JSON Engine'}
                      </code>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Storage: {activeDbInfo?.storageLocation || 'Persistent Server Storage'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* Database Self-Healing, Benchmarks, & Backup Restoration Suite */}
              {/* ============================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Tool 1: Real-Time Latency Benchmark */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-black text-sm text-slate-900">Live Latency Benchmark</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Measures roundtrip edge query execution, write replication speed, and network latency.
                    </p>

                    {benchmarkResult && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Roundtrip Latency:</span>
                          <strong className="text-emerald-700 font-mono font-bold">{benchmarkResult.totalRoundTripMs} ms</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Read SELECT:</span>
                          <span className="font-mono text-slate-800">{benchmarkResult.readLatencyMs} ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Write UPSERT:</span>
                          <span className="font-mono text-slate-800">{benchmarkResult.writeLatencyMs} ms</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px]">
                          <span className="text-slate-500">Rating:</span>
                          <span className="font-black text-emerald-600">{benchmarkResult.status}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRunBenchmark}
                    disabled={isBenchmarking}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Activity className={`w-3.5 h-3.5 text-emerald-400 ${isBenchmarking ? 'animate-spin' : ''}`} />
                    <span>{isBenchmarking ? 'Running Tests...' : 'Run Latency Benchmark'}</span>
                  </button>
                </div>

                {/* Tool 2: Database Self-Healing & Schema Audit */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="w-4 h-4 text-purple-600" />
                      <h4 className="font-black text-sm text-slate-900">Self-Healing & Auto-Repair</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Scans tables, cleans duplicate IDs, ensures Owner security credentials, and repairs integrity.
                    </p>

                    {repairResult && (
                      <div className="mt-3 p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs space-y-1">
                        <p className="font-bold text-purple-950">{repairResult.message}</p>
                        {repairResult.repairLog.length > 0 && (
                          <ul className="text-[11px] text-purple-800 list-disc list-inside mt-1">
                            {repairResult.repairLog.map((log, idx) => (
                              <li key={idx} className="truncate">{log}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRunDbRepair}
                    disabled={isRepairing}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                    <span>{isRepairing ? 'Repairing Database...' : 'Run Auto-Repair & Schema Audit'}</span>
                  </button>
                </div>

                {/* Tool 3: Restore Backup (.JSON) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <h4 className="font-black text-sm text-slate-900">Restore Backup File (.JSON)</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload a previously exported Bete Finder master JSON backup to restore all tables.
                    </p>

                    {importBackupSuccess && (
                      <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                        {importBackupSuccess}
                      </div>
                    )}

                    {importBackupError && (
                      <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 font-bold">
                        {importBackupError}
                      </div>
                    )}
                  </div>

                  <label className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                    <Upload className={`w-3.5 h-3.5 ${isImportingBackup ? 'animate-spin' : ''}`} />
                    <span>{isImportingBackup ? 'Restoring Backup...' : 'Upload & Restore Backup'}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackupFile}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>

              {/* ============================================================== */}
              {/* Live Database Table Records Inspector */}
              {/* ============================================================== */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-slate-900" />
                    <div>
                      <h3 className="font-black text-base text-slate-900">Live Database Table Records Inspector</h3>
                      <p className="text-xs text-slate-500">Query and inspect live JSON and relational records in real-time</p>
                    </div>
                  </div>

                  {/* Table Selectors */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: 'properties', label: 'Properties' },
                      { id: 'registered_users', label: 'Users' },
                      { id: 'payment_requests', label: 'Payments' },
                      { id: 'telebirr_settings', label: 'Telebirr' },
                      { id: 'plans_config', label: 'Plans' },
                      { id: 'admin_security', label: 'Security' }
                    ].map((tItem) => (
                      <button
                        key={tItem.id}
                        type="button"
                        onClick={() => handleLoadInspectRecords(tItem.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          selectedInspectTable === tItem.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tItem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search and Records Viewer */}
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={inspectSearchQuery}
                        onChange={(e) => setInspectSearchQuery(e.target.value)}
                        placeholder={`Filter ${selectedInspectTable} records...`}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-bold">
                      {inspectRecords.length > 0 ? `${inspectRecords.length} records loaded` : 'Click table button to inspect records'}
                    </span>
                  </div>

                  <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs max-h-72 overflow-y-auto border border-slate-800">
                    {isLoadingInspectRecords ? (
                      <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Fetching records from database...</span>
                      </div>
                    ) : inspectRecords.length > 0 ? (
                      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(
                          inspectRecords.filter(r => {
                            if (!inspectSearchQuery.trim()) return true;
                            return JSON.stringify(r).toLowerCase().includes(inspectSearchQuery.toLowerCase().trim());
                          }),
                          null,
                          2
                        )}
                      </pre>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <p>Select any table above (e.g. Properties, Users, Payments) to load live records.</p>
                        <button
                          type="button"
                          onClick={() => handleLoadInspectRecords(selectedInspectTable)}
                          className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-sans font-bold cursor-pointer"
                        >
                          Load {selectedInspectTable} Records
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Master KPI Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Database Properties</span>
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalProperties}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <strong className="text-emerald-700 font-bold">{verifiedProps}</strong> verified • <strong className="text-amber-700 font-bold">{pendingProps}</strong> pending
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Registered Accounts</span>
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalUsers}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <strong className="text-slate-800 font-bold">{landlordCount}</strong> Landlords • <strong className="text-slate-800 font-bold">{tenantCount}</strong> Tenants
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Processed Telebirr Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {totalApprovedETB.toLocaleString()} <span className="text-xs font-bold text-slate-500">ETB</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {approvedPayments.length} approved • {pendingPaymentsList.length} in queue ({totalPendingETB.toLocaleString()} ETB)
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">VIP & Premium Spotlight</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600">{vipProps + premiumProps}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    <strong className="text-amber-700">{vipProps}</strong> VIP Packages • <strong className="text-purple-700">{premiumProps}</strong> Premium
                  </p>
                </div>
              </div>

              {/* Deep Details Section: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Property Inventory Breakdown */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-black text-base text-slate-900">Property Inventory Analytics</h3>
                    </div>
                    <span className="text-xs font-extrabold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      {totalProperties} Total
                    </span>
                  </div>

                  {/* Categories Breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Property Types Distribution</h4>
                    <div className="space-y-2.5">
                      {[
                        { label: 'Houses & Villas', count: houseCount, color: 'bg-emerald-500' },
                        { label: 'Apartments & Condos', count: aptCount, color: 'bg-blue-500' },
                        { label: 'Commercial & Offices', count: commCount, color: 'bg-purple-500' },
                        { label: 'Land & Plots', count: landCount, color: 'bg-amber-500' },
                        { label: 'Guest Houses / Short-Stay', count: guestCount, color: 'bg-rose-500' }
                      ].map((item, idx) => {
                        const pct = totalProperties > 0 ? Math.round((item.count / totalProperties) * 100) : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-slate-700">
                              <span>{item.label}</span>
                              <span>{item.count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Financial Values in DB */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Financial Valuation in Database</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <p className="text-[11px] text-slate-500 font-bold">Avg Rental Listing</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">{avgRentPrice.toLocaleString()} ETB/mo</p>
                        <span className="text-[10px] text-slate-400">{rentProps.length} active rental listings</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <p className="text-[11px] text-slate-500 font-bold">Avg Sale Listing</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">{avgSalePrice.toLocaleString()} ETB</p>
                        <span className="text-[10px] text-slate-400">{saleProps.length} active sale listings</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Subcities */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Top Neighborhoods in DB</h4>
                    <div className="flex flex-wrap gap-2">
                      {topSubcities.map(([subcity, count], idx) => (
                        <span key={idx} className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-800 rounded-lg flex items-center gap-1.5 border border-slate-200">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span>{subcity}: <strong>{count}</strong></span>
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Column 2: User Demographics & Financial Audits */}
                <div className="space-y-6">
                  
                  {/* User Demographics Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <h3 className="font-black text-base text-slate-900">User Demographics & Identity</h3>
                      </div>
                      <span className="text-xs font-extrabold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        {totalUsers} Accounts
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-center">
                        <p className="text-[11px] font-bold text-purple-900 uppercase">Landlords</p>
                        <p className="text-xl font-black text-purple-950 mt-1">{landlordCount}</p>
                        <span className="text-[10px] text-purple-700 font-semibold">{totalUsers > 0 ? Math.round((landlordCount/totalUsers)*100) : 0}% of accounts</span>
                      </div>

                      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                        <p className="text-[11px] font-bold text-blue-900 uppercase">Tenants</p>
                        <p className="text-xl font-black text-blue-950 mt-1">{tenantCount}</p>
                        <span className="text-[10px] text-blue-700 font-semibold">{totalUsers > 0 ? Math.round((tenantCount/totalUsers)*100) : 0}% of accounts</span>
                      </div>

                      <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
                        <p className="text-[11px] font-bold text-amber-900 uppercase">Staff / Admins</p>
                        <p className="text-xl font-black text-amber-950 mt-1">{adminCount}</p>
                        <span className="text-[10px] text-amber-700 font-semibold">Owner & Admin</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>Active Property Posters (Landlords with ≥1 listing):</span>
                      </div>
                      <strong className="text-slate-900 font-black">{postersCount} Users</strong>
                    </div>
                  </div>

                  {/* Financial & Telebirr Audit Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-black text-base text-slate-900">Telebirr Financial Ledger</h3>
                      </div>
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {paymentRequests.length} Transactions
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                        <p className="text-[11px] font-bold text-emerald-800 uppercase">Approved</p>
                        <p className="text-base font-black text-emerald-950 mt-0.5">{totalApprovedETB.toLocaleString()} ETB</p>
                        <span className="text-[10px] text-emerald-700">{approvedPayments.length} txns</span>
                      </div>

                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                        <p className="text-[11px] font-bold text-amber-800 uppercase">In Review</p>
                        <p className="text-base font-black text-amber-950 mt-0.5">{totalPendingETB.toLocaleString()} ETB</p>
                        <span className="text-[10px] text-amber-700">{pendingPaymentsList.length} txns</span>
                      </div>

                      <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                        <p className="text-[11px] font-bold text-rose-800 uppercase">Rejected</p>
                        <p className="text-base font-black text-rose-950 mt-0.5">{totalRejectedETB.toLocaleString()} ETB</p>
                        <span className="text-[10px] text-rose-700">{rejectedPaymentsList.length} txns</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                      <span className="text-slate-600 font-bold">Telebirr Merchant Gateway:</span>
                      <span className="font-mono text-emerald-700 font-black">{telebirrSettings.accountNumber} ({telebirrSettings.accountName})</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Database Schema & Table Registry Inspector */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-slate-800" />
                    <div>
                      <h3 className="font-black text-base text-slate-900">Database Schema & Master Table Registry</h3>
                      <p className="text-xs text-slate-500">Live operational status and indexing across all 6 core relational tables</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400">Estimated Schema Size</span>
                    <p className="text-sm font-black text-slate-900">{payloadSizeKB} KB</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                        <th className="pb-3 pl-2">Table Name</th>
                        <th className="pb-3">Record Count</th>
                        <th className="pb-3">Primary Key</th>
                        <th className="pb-3">Description & Indexes</th>
                        <th className="pb-3 text-right pr-2">Replication Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          name: 'properties',
                          count: totalProperties,
                          pk: 'id (UUID)',
                          desc: 'Real estate listings, pricing, subcities, verification status, media, and VIP aura',
                          status: 'SYNCHRONIZED'
                        },
                        {
                          name: 'registered_users',
                          count: totalUsers,
                          pk: 'email (Unique)',
                          desc: 'User accounts, role classification (Landlord/Tenant), phone, hashed credentials, and active plans',
                          status: 'SYNCHRONIZED'
                        },
                        {
                          name: 'payment_requests',
                          count: paymentRequests.length,
                          pk: 'id (UUID)',
                          desc: 'Telebirr transaction references, payment receipts, plan duration, review statuses',
                          status: 'SYNCHRONIZED'
                        },
                        {
                          name: 'telebirr_settings',
                          count: 1,
                          pk: 'accountNumber',
                          desc: 'Active Telebirr gateway phone number, recipient name, instructions in Amharic and English',
                          status: 'SYNCHRONIZED'
                        },
                        {
                          name: 'plans_config',
                          count: plans.length,
                          pk: 'id (String)',
                          desc: 'Price tiers (Free, Basic, Premium, VIP), duration intervals, feature allocations',
                          status: 'SYNCHRONIZED'
                        },
                        {
                          name: 'admin_security',
                          count: 2,
                          pk: 'role (admin/owner)',
                          desc: 'Owner master credentials, secondary Admin credentials, permissions and secure hash',
                          status: 'SYNCHRONIZED'
                        }
                      ].map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 pl-2 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.name}</span>
                          </td>
                          <td className="py-3 font-bold text-slate-900">{t.count} rows</td>
                          <td className="py-3 font-mono text-slate-500">{t.pk}</td>
                          <td className="py-3 text-slate-600 max-w-md">{t.desc}</td>
                          <td className="py-3 text-right pr-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.status}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          );
        })()}

        {/* ============================================================== */}
        {/* TAB: Telegram Channel Broadcaster (Owner only) */}
        {/* ============================================================== */}
        {isOwner && (activeAdminTab === 'telegram_channel' || activeAdminTab === 'telegram_hub') && (
          <TelegramChannelTab
            properties={properties}
            showToast={showToast}
            onSwitchToBot={() => setActiveAdminTab('telegram_bot')}
          />
        )}

        {/* ============================================================== */}
        {/* TAB: Telegram Bot Management Console (Owner only) */}
        {/* ============================================================== */}
        {isOwner && activeAdminTab === 'telegram_bot' && (
          <TelegramBotTab
            properties={properties}
            showToast={showToast}
            onSwitchToChannel={() => setActiveAdminTab('telegram_channel')}
          />
        )}

      </div>

      {/* ============================================================== */}
      {/* Delete User Confirmation Modal (Owner only) */}
      {/* ============================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <UserX className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Delete User Account</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete user <strong className="text-slate-900 font-bold">{userToDelete.name}</strong> ({userToDelete.email}) from the database?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 mb-4">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Permanent Action</span>
              </p>
              <p className="mt-0.5">This action will remove the user's account credentials and database profile immediately.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Erase All Properties Confirmation Modal */}
      {showEraseAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-red-200 relative animate-in zoom-in-95 duration-200 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl border border-red-200">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-600">
                    Erase All Property Listings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical database action for System Owner / Admin
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEraseAllModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Body */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Permanent Database Purge</span>
              </div>
              <p className="leading-relaxed text-red-700">
                You are about to permanently delete all <strong className="underline font-black">{properties.length} property listings</strong> from the Bete Finder database and cloud storage.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-600 font-medium">
                <li>All active listing records, uploaded pictures, and amenities will be erased.</li>
                <li>Users visiting the site will find no properties until new ones are posted.</li>
                <li>This operation is irreversible.</li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Type <span className="font-mono text-red-600 font-black bg-red-50 px-1 py-0.5 rounded border border-red-200">ERASE</span> or <span className="font-mono text-red-600 font-black bg-red-50 px-1 py-0.5 rounded border border-red-200">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={eraseConfirmText}
                onChange={(e) => setEraseConfirmText(e.target.value)}
                placeholder="Type ERASE or DELETE"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono font-bold uppercase focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-hidden transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEraseAllModal(false)}
                disabled={isErasingAll}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEraseAllPropertiesAdmin}
                disabled={
                  isErasingAll ||
                  (eraseConfirmText.trim().toUpperCase() !== 'ERASE' &&
                    eraseConfirmText.trim().toUpperCase() !== 'DELETE')
                }
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:cursor-not-allowed"
              >
                <Trash2 className={`w-4 h-4 ${isErasingAll ? 'animate-spin' : ''}`} />
                <span>
                  {isErasingAll
                    ? 'Erasing...'
                    : `Permanently Erase (${properties.length}) Properties`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
