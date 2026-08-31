import { AdminControllerConfig, AdminPermissions, SubAdmin, AdminAuditLog } from '../types';
import { getAdminCredentials, saveAdminCredentials } from './passwords';

const STORAGE_KEY = 'bete_finder_admin_controller_config';

const DEFAULT_PERMISSIONS: AdminPermissions = {
  isSuspended: false,
  canApprovePayments: true,
  canDeleteProperties: true,
  canVerifyProperties: true,
  canViewUserDatabase: true,
  canExportBackups: true,
  canBroadcastNotices: true,
};

const DEFAULT_CONFIG: AdminControllerConfig = {
  adminPermissions: DEFAULT_PERMISSIONS,
  adminBroadcastNotice: 'System Notice: Please prioritize verifying VIP listing requests submitted within 24 hours.',
  subAdmins: [
    {
      id: 'subadmin-1',
      name: 'Bole Sub-City Property Inspector',
      email: 'bole.inspector@betefinder.com/admin',
      phone: '+251911223344',
      password: 'InspectorBole2025',
      role: 'regional_inspector',
      assignedSubcity: 'Bole',
      permissions: {
        isSuspended: false,
        canApprovePayments: false,
        canDeleteProperties: false,
        canVerifyProperties: true,
        canViewUserDatabase: false,
        canExportBackups: false,
        canBroadcastNotices: false,
      },
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      lastLogin: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'subadmin-2',
      name: 'Telebirr Payment Review Officer',
      email: 'telebirr.officer@betefinder.com/admin',
      phone: '+251922334455',
      password: 'TelebirrOfficer2025',
      role: 'payment_officer',
      assignedSubcity: 'All Addis Ababa',
      permissions: {
        isSuspended: false,
        canApprovePayments: true,
        canDeleteProperties: false,
        canVerifyProperties: false,
        canViewUserDatabase: false,
        canExportBackups: false,
        canBroadcastNotices: false,
      },
      status: 'active',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      lastLogin: new Date(Date.now() - 3600000 * 2).toISOString(),
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      actor: 'Owner (Kaleb Bereket)',
      action: 'Synchronized Master DB Schema',
      details: 'Full cross-device sync completed across 6 PostgreSQL entities.',
      category: 'system',
      severity: 'info'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      actor: 'Admin (Kaleb Bereket)',
      action: 'Verified Property Listing',
      details: 'Approved luxury 3-bedroom apartment in Bole Olympia for public display.',
      category: 'property',
      severity: 'success'
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      actor: 'Admin (Kaleb Bereket)',
      action: 'Processed Telebirr Payment',
      details: 'Approved 2,499 ETB VIP Spotlight package for Landlord account.',
      category: 'payment',
      severity: 'success'
    },
    {
      id: 'log-4',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      actor: 'Owner (Kaleb Bereket)',
      action: 'Updated Admin Authority Rules',
      details: 'Permissions matrix saved and broadcasted to edge cache.',
      category: 'security',
      severity: 'warning'
    }
  ]
};

export const getAdminControllerConfig = (): AdminControllerConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        adminPermissions: { ...DEFAULT_PERMISSIONS, ...(parsed.adminPermissions || {}) },
        adminBroadcastNotice: parsed.adminBroadcastNotice || DEFAULT_CONFIG.adminBroadcastNotice,
        subAdmins: Array.isArray(parsed.subAdmins) ? parsed.subAdmins : DEFAULT_CONFIG.subAdmins,
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : DEFAULT_CONFIG.auditLogs,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
};

export const saveAdminControllerConfig = (config: Partial<AdminControllerConfig>): AdminControllerConfig => {
  const current = getAdminControllerConfig();
  const updated: AdminControllerConfig = {
    adminPermissions: config.adminPermissions ? { ...current.adminPermissions, ...config.adminPermissions } : current.adminPermissions,
    adminBroadcastNotice: config.adminBroadcastNotice !== undefined ? config.adminBroadcastNotice : current.adminBroadcastNotice,
    subAdmins: config.subAdmins !== undefined ? config.subAdmins : current.subAdmins,
    auditLogs: config.auditLogs !== undefined ? config.auditLogs : current.auditLogs,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync with server
  fetch('/api/admin/controller-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  }).catch(() => {});

  return updated;
};

export const toggleAdminSuspension = (isSuspended: boolean): AdminControllerConfig => {
  const current = getAdminControllerConfig();
  const updated = saveAdminControllerConfig({
    adminPermissions: {
      ...current.adminPermissions,
      isSuspended
    }
  });

  logAdminActivity(
    'Owner (Kaleb Bereket)',
    isSuspended ? 'Suspended Secondary Admin Access' : 'Re-activated Secondary Admin Access',
    isSuspended ? 'All secondary admin session operations locked.' : 'Secondary admin login privileges restored.',
    'security',
    isSuspended ? 'danger' : 'success'
  );

  return updated;
};

export const updateAdminPermissions = (permissions: Partial<AdminPermissions>): AdminControllerConfig => {
  const current = getAdminControllerConfig();
  const updated = saveAdminControllerConfig({
    adminPermissions: {
      ...current.adminPermissions,
      ...permissions
    }
  });

  logAdminActivity(
    'Owner (Kaleb Bereket)',
    'Modified Admin Authority Matrix',
    `Updated permissions: ${Object.keys(permissions).join(', ')}`,
    'security',
    'warning'
  );

  return updated;
};

export const setAdminBroadcastNotice = (notice: string): AdminControllerConfig => {
  const updated = saveAdminControllerConfig({
    adminBroadcastNotice: notice
  });

  logAdminActivity(
    'Owner (Kaleb Bereket)',
    'Updated Owner Directive Notice',
    `New directive set for all admin dashboards: "${notice.slice(0, 40)}..."`,
    'system',
    'info'
  );

  return updated;
};

export const addSubAdmin = (subAdminData: Omit<SubAdmin, 'id' | 'createdAt'>): SubAdmin => {
  const current = getAdminControllerConfig();
  const newSubAdmin: SubAdmin = {
    ...subAdminData,
    id: `subadmin-${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  saveAdminControllerConfig({
    subAdmins: [newSubAdmin, ...current.subAdmins]
  });

  logAdminActivity(
    'Owner (Kaleb Bereket)',
    'Created Delegated Sub-Admin',
    `Added ${newSubAdmin.name} (${newSubAdmin.email}) for ${newSubAdmin.assignedSubcity}.`,
    'security',
    'success'
  );

  return newSubAdmin;
};

export const updateSubAdmin = (id: string, updates: Partial<SubAdmin>): SubAdmin | null => {
  const current = getAdminControllerConfig();
  const index = current.subAdmins.findIndex(s => s.id === id);
  if (index < 0) return null;

  const updatedSubAdmin: SubAdmin = { ...current.subAdmins[index], ...updates };
  const updatedList = [...current.subAdmins];
  updatedList[index] = updatedSubAdmin;

  saveAdminControllerConfig({
    subAdmins: updatedList
  });

  logAdminActivity(
    'Owner (Kaleb Bereket)',
    'Updated Sub-Admin Profile',
    `Modified parameters for ${updatedSubAdmin.name}.`,
    'security',
    'info'
  );

  return updatedSubAdmin;
};

export const deleteSubAdmin = (id: string): boolean => {
  const current = getAdminControllerConfig();
  const target = current.subAdmins.find(s => s.id === id);
  const updatedList = current.subAdmins.filter(s => s.id !== id);

  saveAdminControllerConfig({
    subAdmins: updatedList
  });

  if (target) {
    logAdminActivity(
      'Owner (Kaleb Bereket)',
      'Revoked Sub-Admin Account',
      `Deleted account credentials for ${target.name} (${target.email}).`,
      'security',
      'danger'
    );
  }

  return true;
};

export const logAdminActivity = (
  actor: string,
  action: string,
  details: string,
  category: AdminAuditLog['category'] = 'system',
  severity: AdminAuditLog['severity'] = 'info'
) => {
  try {
    const current = getAdminControllerConfig();
    const newLog: AdminAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      category,
      severity
    };

    const updatedLogs = [newLog, ...current.auditLogs.slice(0, 99)]; // Keep latest 100 logs
    saveAdminControllerConfig({ auditLogs: updatedLogs });
  } catch {
    // ignore
  }
};

export const clearAuditLogs = () => {
  saveAdminControllerConfig({ auditLogs: [] });
};

export const resetAdminPasswordToDefault = () => {
  saveAdminCredentials({
    password: 'Kaleb5873'
  });

  logAdminActivity(
    'Owner (Kaleb Bereket)',
    'Reset Primary Admin Password',
    'Admin access key reset to default secure password (Kaleb5873).',
    'security',
    'warning'
  );
};
