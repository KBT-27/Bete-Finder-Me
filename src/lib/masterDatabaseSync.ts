import { safeFetchJson } from './apiHelper';

export interface SyncPayload {
  properties?: any[];
  users?: any[];
  paymentRequests?: any[];
  ownerFeedbacks?: any[];
  telebirrSettings?: any;
  adminCredentials?: any;
  ownerCredentials?: any;
  adminControllerConfig?: any;
  menuConfig?: any;
  plans?: any[];
  explicitPropertyOverwrite?: boolean;
}

let syncTimeout: any = null;
let isSyncing = false;

// Collect all current state saved in web local storage
export function collectAllLocalStorageState(): SyncPayload {
  const payload: SyncPayload = {};

  try {
    const rawProps = localStorage.getItem('bete_finder_properties');
    if (rawProps) {
      const parsed = JSON.parse(rawProps);
      if (Array.isArray(parsed)) payload.properties = parsed;
    }
  } catch {}

  try {
    const rawUsers = localStorage.getItem('bete_finder_registered_accounts');
    if (rawUsers) {
      const parsed = JSON.parse(rawUsers);
      if (Array.isArray(parsed)) payload.users = parsed;
    }
  } catch {}

  try {
    const rawPayments = localStorage.getItem('bete_finder_payment_requests');
    if (rawPayments) {
      const parsed = JSON.parse(rawPayments);
      if (Array.isArray(parsed)) payload.paymentRequests = parsed;
    }
  } catch {}

  try {
    const rawFeedbacks = localStorage.getItem('bete_finder_owner_feedbacks');
    if (rawFeedbacks) {
      const parsed = JSON.parse(rawFeedbacks);
      if (Array.isArray(parsed)) payload.ownerFeedbacks = parsed;
    }
  } catch {}

  try {
    const rawTelebirr = localStorage.getItem('bete_finder_telebirr_settings');
    if (rawTelebirr) {
      const parsed = JSON.parse(rawTelebirr);
      if (parsed && typeof parsed === 'object') payload.telebirrSettings = parsed;
    }
  } catch {}

  try {
    const rawAdmin = localStorage.getItem('bete_finder_admin_creds');
    if (rawAdmin) {
      const parsed = JSON.parse(rawAdmin);
      if (parsed && typeof parsed === 'object') payload.adminCredentials = parsed;
    }
  } catch {}

  try {
    const rawOwner = localStorage.getItem('bete_finder_owner_creds');
    if (rawOwner) {
      const parsed = JSON.parse(rawOwner);
      if (parsed && typeof parsed === 'object') payload.ownerCredentials = parsed;
    }
  } catch {}

  try {
    const rawConfig = localStorage.getItem('bete_finder_admin_controller_config');
    if (rawConfig) {
      const parsed = JSON.parse(rawConfig);
      if (parsed && typeof parsed === 'object') payload.adminControllerConfig = parsed;
    }
  } catch {}

  try {
    const rawMenu = localStorage.getItem('bete_finder_menu_config');
    if (rawMenu) {
      const parsed = JSON.parse(rawMenu);
      if (parsed && typeof parsed === 'object') payload.menuConfig = parsed;
    }
  } catch {}

  try {
    const rawPlans = localStorage.getItem('bete_finder_plans');
    if (rawPlans) {
      const parsed = JSON.parse(rawPlans);
      if (Array.isArray(parsed)) payload.plans = parsed;
    }
  } catch {}

  return payload;
}

// Push all web and local storage state to the master database
export async function pushAllLocalStorageToDatabase(explicitPropertyOverwrite = false): Promise<{
  success: boolean;
  connectedNeon?: boolean;
  data?: any;
  message?: string;
}> {
  if (isSyncing) {
    return { success: true, message: 'Sync already in progress.' };
  }

  isSyncing = true;
  try {
    const payload = collectAllLocalStorageState();
    if (explicitPropertyOverwrite) {
      payload.explicitPropertyOverwrite = true;
    }

    const result = await safeFetchJson<any>('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (result.isJson && result.data && result.data.success && result.data.data) {
      const canonical = result.data.data;

      // Update local storage with canonical server database state
      if (Array.isArray(canonical.properties)) {
        localStorage.setItem('bete_finder_properties', JSON.stringify(canonical.properties));
      }
      if (Array.isArray(canonical.users)) {
        localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(canonical.users));
      }
      if (canonical.ownerCredentials) {
        localStorage.setItem('bete_finder_owner_creds', JSON.stringify(canonical.ownerCredentials));
      }
      if (canonical.adminCredentials) {
        localStorage.setItem('bete_finder_admin_creds', JSON.stringify(canonical.adminCredentials));
      }
      if (Array.isArray(canonical.paymentRequests)) {
        localStorage.setItem('bete_finder_payment_requests', JSON.stringify(canonical.paymentRequests));
      }
      if (Array.isArray(canonical.ownerFeedbacks)) {
        localStorage.setItem('bete_finder_owner_feedbacks', JSON.stringify(canonical.ownerFeedbacks));
      }
      if (canonical.telebirrSettings) {
        localStorage.setItem('bete_finder_telebirr_settings', JSON.stringify(canonical.telebirrSettings));
      }
      if (canonical.adminControllerConfig) {
        localStorage.setItem('bete_finder_admin_controller_config', JSON.stringify(canonical.adminControllerConfig));
      }
      if (canonical.menuConfig) {
        localStorage.setItem('bete_finder_menu_config', JSON.stringify(canonical.menuConfig));
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bete_db_synced', { detail: canonical }));
        window.dispatchEvent(new CustomEvent('bete_accounts_changed'));
      }

      isSyncing = false;
      return {
        success: true,
        connectedNeon: Boolean(result.data.connectedNeon),
        data: canonical,
        message: 'All local data safely sent and synchronized with database.'
      };
    }

    isSyncing = false;
    return {
      success: false,
      message: result.message || 'Database synchronization returned incomplete payload.'
    };
  } catch (err: any) {
    isSyncing = false;
    return {
      success: false,
      message: err?.message || 'Database connection error during sync.'
    };
  }
}

// Debounced synchronization trigger for web changes
export function queueDatabaseSync(delayMs = 1500) {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(() => {
    pushAllLocalStorageToDatabase().catch((err) => {
      console.warn('[Sync Engine] Background push failed:', err);
    });
  }, delayMs);
}

// Auto-initialize browser storage event listener to capture any localStorage changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key && event.key.startsWith('bete_finder_')) {
      queueDatabaseSync(2000);
    }
  });

  // Also push when coming back online
  window.addEventListener('online', () => {
    pushAllLocalStorageToDatabase().catch(() => {});
  });
}
