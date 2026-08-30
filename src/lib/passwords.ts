import { UserProfile } from '../types';

export interface StoredCredentials {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface RegisteredAccount extends UserProfile {
  password: string;
}

const DEFAULT_ADMIN_CREDENTIALS: StoredCredentials = {
  email: 'kalebbereket49@gmail.com/admin',
  password: '1234567890admin',
  name: 'Admin (Kaleb Bereket)',
  phone: '+251995406697'
};

const DEFAULT_OWNER_CREDENTIALS: StoredCredentials = {
  email: 'kalebbereket49@gmail.com/owner',
  password: '1234567890owner',
  name: 'Owner (Kaleb Bereket)',
  phone: '+251995406697'
};

export const getAdminCredentials = (): StoredCredentials => {
  try {
    const saved = localStorage.getItem('bete_finder_admin_creds');
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return DEFAULT_ADMIN_CREDENTIALS;
};

export const saveAdminCredentials = (creds: Partial<StoredCredentials>) => {
  const current = getAdminCredentials();
  const updated = { ...current, ...creds };
  localStorage.setItem('bete_finder_admin_creds', JSON.stringify(updated));
  return updated;
};

export const getOwnerCredentials = (): StoredCredentials => {
  try {
    const saved = localStorage.getItem('bete_finder_owner_creds');
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return DEFAULT_OWNER_CREDENTIALS;
};

export const saveOwnerCredentials = (creds: Partial<StoredCredentials>) => {
  const current = getOwnerCredentials();
  const updated = { ...current, ...creds };
  localStorage.setItem('bete_finder_owner_creds', JSON.stringify(updated));
  return updated;
};

export const getRegisteredUsers = (): RegisteredAccount[] => {
  try {
    const saved = localStorage.getItem('bete_finder_registered_accounts');
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return [];
};

export const saveRegisteredUser = (account: RegisteredAccount) => {
  const accounts = getRegisteredUsers();
  const existingIndex = accounts.findIndex(a => a.email.toLowerCase() === account.email.toLowerCase());
  let updated: RegisteredAccount[];
  if (existingIndex >= 0) {
    updated = [...accounts];
    updated[existingIndex] = { ...updated[existingIndex], ...account };
  } else {
    updated = [account, ...accounts];
  }
  localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(updated));
  return updated;
};
