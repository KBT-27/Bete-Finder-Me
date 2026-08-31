import { UserProfile, PasswordResetRequest } from '../types';

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
  password: 'Kaleb5873',
  name: 'Admin (Kaleb Bereket)',
  phone: '+251995406697'
};

const DEFAULT_OWNER_CREDENTIALS: StoredCredentials = {
  email: 'kalebbereket49@gmail.com/owner',
  password: 'Kaleb5873',
  name: 'Owner (Kaleb Bereket)',
  phone: '+251995406697'
};

// Check if "/" is allowed for this email/username (allowed ONLY for Admin and Owner)
export const isSlashAllowedForEmail = (email: string): boolean => {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized.includes('/')) return true; // No slash: standard email
  // Slash is strictly restricted to Admin and Owner
  return (
    normalized === 'kalebbereket49@gmail.com/admin' ||
    normalized === 'kalebbereket49@gmail.com/owner' ||
    normalized.endsWith('/admin') ||
    normalized.endsWith('/owner')
  );
};

// Check if "/" is allowed in password (allowed ONLY for Admin and Owner)
export const isSlashAllowedForPassword = (emailOrRole: string, password: string): boolean => {
  if (!password || !password.includes('/')) return true; // No slash: allowed for everyone
  const normalized = (emailOrRole || '').trim().toLowerCase();
  // Allowed if email is admin/owner or role is admin/owner
  return (
    normalized === 'owner' ||
    normalized === 'admin' ||
    normalized === 'kalebbereket49@gmail.com/owner' ||
    normalized === 'kalebbereket49@gmail.com/admin' ||
    normalized.endsWith('/admin') ||
    normalized.endsWith('/owner') ||
    normalized === 'kalebbereket49@gmail.com'
  );
};

// Extract real destination email for SMTP sending (e.g. kalebbereket49@gmail.com/owner -> kalebbereket49@gmail.com)
export const extractDestinationEmail = (email: string): string => {
  const normalized = (email || '').trim().toLowerCase();
  if (normalized.includes('/')) {
    return normalized.split('/')[0].trim();
  }
  return normalized;
};

// Normalize Ethiopian & international phone numbers for robust matching (e.g. +251995406697, 0995406697, 995406697)
export const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length >= 9) {
    return digitsOnly.slice(-9); // Compare the core 9 digits
  }
  return digitsOnly;
};

// Verify that the requested Gmail and Phone Number are both registered and belong to the same account
export const verifyRegisteredAccountAndPhone = (
  email: string,
  phone: string
): { 
  matched: boolean; 
  accountType?: 'owner' | 'admin' | 'user'; 
  accountName?: string; 
  registeredPhone?: string; 
  error?: string 
} => {
  const normEmail = (email || '').trim().toLowerCase();
  const normPhone = normalizePhoneNumber(phone);

  if (!normEmail) {
    return { matched: false, error: 'Registered Gmail / Email is required.' };
  }
  if (!normPhone) {
    return { matched: false, error: 'Registered Phone Number is required.' };
  }

  // 1. Check Owner Account
  const owner = getOwnerCredentials();
  if (
    normEmail === owner.email.toLowerCase() ||
    normEmail === 'kalebbereket49@gmail.com/owner' ||
    normEmail === 'kalebbereket49@gmail.com'
  ) {
    const ownerPhoneNorm = normalizePhoneNumber(owner.phone || '+251995406697');
    if (ownerPhoneNorm === normPhone) {
      return { 
        matched: true, 
        accountType: 'owner', 
        accountName: owner.name, 
        registeredPhone: owner.phone 
      };
    } else {
      return { 
        matched: false, 
        error: 'The provided Phone Number does not match the registered Owner account phone number (+251995406697).' 
      };
    }
  }

  // 2. Check Admin Account
  const admin = getAdminCredentials();
  if (
    normEmail === admin.email.toLowerCase() ||
    normEmail === 'kalebbereket49@gmail.com/admin'
  ) {
    const adminPhoneNorm = normalizePhoneNumber(admin.phone || '+251995406697');
    if (adminPhoneNorm === normPhone) {
      return { 
        matched: true, 
        accountType: 'admin', 
        accountName: admin.name, 
        registeredPhone: admin.phone 
      };
    } else {
      return { 
        matched: false, 
        error: 'The provided Phone Number does not match the registered Admin account phone number.' 
      };
    }
  }

  // 3. Check Registered Users
  const registered = getRegisteredUsers();
  const foundUser = registered.find(u => u.email.toLowerCase() === normEmail);

  if (foundUser) {
    const userPhoneNorm = normalizePhoneNumber(foundUser.phone || '');
    if (userPhoneNorm && userPhoneNorm === normPhone) {
      return { 
        matched: true, 
        accountType: 'user', 
        accountName: foundUser.name, 
        registeredPhone: foundUser.phone 
      };
    } else {
      return { 
        matched: false, 
        error: `The provided Phone Number does not match the registered phone number for ${normEmail}.` 
      };
    }
  }

  return { 
    matched: false, 
    error: 'No registered account found with this Gmail / Email address. You must have a registered account in Bete Finder.' 
  };
};

export const getAdminCredentials = (): StoredCredentials => {
  try {
    const saved = localStorage.getItem('bete_finder_admin_creds');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old default password if still set to placeholder
      if (parsed.password === '1234567890admin' || !parsed.password) {
        parsed.password = 'Kaleb5873';
        localStorage.setItem('bete_finder_admin_creds', JSON.stringify(parsed));
      }
      return parsed;
    }
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
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old default password if still set to placeholder
      if (parsed.password === '1234567890owner') {
        parsed.password = 'Kaleb5873';
        localStorage.setItem('bete_finder_owner_creds', JSON.stringify(parsed));
      }
      return parsed;
    }
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

export const deleteRegisteredAccount = (emailOrId: string): RegisteredAccount[] => {
  const accounts = getRegisteredUsers();
  const target = emailOrId.trim().toLowerCase();
  const updated = accounts.filter(a => a.id !== emailOrId && a.email.toLowerCase() !== target);
  localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(updated));
  // Call server deletion
  fetch(`/api/users/${encodeURIComponent(emailOrId)}`, { method: 'DELETE' }).catch(() => {});
  return updated;
};

export const stopRegisteredUserPlan = (email: string): RegisteredAccount[] => {
  const accounts = getRegisteredUsers();
  const target = email.trim().toLowerCase();
  const updated = accounts.map(a => {
    if (a.email.toLowerCase() === target) {
      return {
        ...a,
        activePlan: 'free' as any,
        planExpiresAt: undefined,
        planStartedAt: undefined
      };
    }
    return a;
  });
  localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(updated));
  fetch('/api/users/stop-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: target })
  }).catch(() => {});
  return updated;
};

export const updateRegisteredUserPlanTier = (
  email: string, 
  plan: 'free' | 'basic' | 'premium' | 'vip', 
  durationMonths: number = 1
): RegisteredAccount[] => {
  const accounts = getRegisteredUsers();
  const target = email.trim().toLowerCase();
  const durationDays = plan === 'vip' || plan === 'premium' ? durationMonths * 30 : 0;
  const expiresAt = durationDays > 0 ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString() : undefined;
  
  const updated = accounts.map(a => {
    if (a.email.toLowerCase() === target) {
      return {
        ...a,
        activePlan: plan,
        planExpiresAt: expiresAt,
        planStartedAt: expiresAt ? new Date().toISOString() : undefined
      };
    }
    return a;
  });
  localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(updated));
  fetch('/api/users/set-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail: target, plan, durationMonths })
  }).catch(() => {});
  return updated;
};

export const getPasswordResetTokens = (): PasswordResetRequest[] => {
  try {
    const saved = localStorage.getItem('bete_finder_reset_tokens');
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return [];
};

export const savePasswordResetToken = (request: PasswordResetRequest): PasswordResetRequest => {
  const all = getPasswordResetTokens();
  const filtered = all.filter(r => r.id !== request.id);
  const updated = [request, ...filtered];
  localStorage.setItem('bete_finder_reset_tokens', JSON.stringify(updated));
  return request;
};

export const generateSecureToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'rst_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createPasswordResetRequest = (email: string): PasswordResetRequest => {
  const token = generateSecureToken();
  const code = generateVerificationCode();
  const now = Date.now();
  const request: PasswordResetRequest = {
    id: `reset-req-${now}`,
    email: email.trim().toLowerCase(),
    token,
    code,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 1000 * 60 * 60 * 2).toISOString(), // 2 hours validity
    used: false
  };
  savePasswordResetToken(request);
  return request;
};

export const validatePasswordResetToken = (tokenOrCode: string): { valid: boolean; email?: string; error?: string; request?: PasswordResetRequest } => {
  if (!tokenOrCode || !tokenOrCode.trim()) {
    return { valid: false, error: 'Invalid or missing reset token / verification code.' };
  }

  const clean = tokenOrCode.trim();
  const all = getPasswordResetTokens();
  const match = all.find(r => r.token === clean || r.code === clean);

  if (!match) {
    return { valid: false, error: 'Verification code / reset link is invalid or has expired.' };
  }

  if (match.used) {
    return { valid: false, error: 'This verification code / reset link has already been used.' };
  }

  const expiryTime = new Date(match.expiresAt).getTime();
  if (expiryTime <= Date.now()) {
    return { valid: false, error: 'This verification code / reset link has expired (valid for 2 hours).' };
  }

  return { valid: true, email: match.email, request: match };
};

export const markTokenAsUsed = (tokenOrCode: string) => {
  const clean = tokenOrCode.trim();
  const all = getPasswordResetTokens();
  const updated = all.map(r => (r.token === clean || r.code === clean) ? { ...r, used: true } : r);
  localStorage.setItem('bete_finder_reset_tokens', JSON.stringify(updated));
};

export const updateAccountPasswordByEmail = (email: string, newPass: string): { success: boolean; message: string } => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanPass = newPass.trim();

  // Validate slash symbol in password
  if (!isSlashAllowedForPassword(normalizedEmail, cleanPass)) {
    return { 
      success: false, 
      message: "The '/' symbol in passwords is reserved for Admin and Owner accounts only." 
    };
  }

  // 1. Check Owner account
  const owner = getOwnerCredentials();
  if (owner.email.toLowerCase() === normalizedEmail || normalizedEmail === 'kalebbereket49@gmail.com' || normalizedEmail === 'kalebbereket49@gmail.com/owner') {
    saveOwnerCredentials({ password: cleanPass });
    return { success: true, message: 'Owner password updated successfully!' };
  }

  // 2. Check Admin account
  const admin = getAdminCredentials();
  if (admin.email.toLowerCase() === normalizedEmail || normalizedEmail === 'kalebbereket49@gmail.com/admin') {
    saveAdminCredentials({ password: cleanPass });
    return { success: true, message: 'Admin password updated successfully!' };
  }

  // 3. Check Registered users
  const registered = getRegisteredUsers();
  const foundIndex = registered.findIndex(u => u.email.toLowerCase() === normalizedEmail);

  if (foundIndex >= 0) {
    registered[foundIndex].password = cleanPass;
    localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(registered));
    return { success: true, message: 'Password updated successfully!' };
  }

  // If user wasn't registered before, create account with new password
  const newAccount: RegisteredAccount = {
    id: `user-${Date.now()}`,
    name: email.split('@')[0] || 'User',
    email: normalizedEmail,
    phone: '+251995406697',
    role: 'tenant',
    password: cleanPass,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    savedPropertyIds: [],
    postedPropertyIds: [],
    toursBooked: []
  };
  saveRegisteredUser(newAccount);

  return { success: true, message: 'Password updated successfully!' };
};

export const changeAccountPassword = (
  email: string,
  phone: string,
  currentPass: string,
  newPass: string
): { success: boolean; message: string } => {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();
  const cleanCurrent = currentPass.trim();
  const cleanNew = newPass.trim();

  if (!normalizedEmail) {
    return { success: false, message: 'Registered Gmail / Email is required.' };
  }
  if (!cleanPhone) {
    return { success: false, message: 'Registered Phone Number is required.' };
  }
  if (!cleanCurrent) {
    return { success: false, message: 'Current Password is required.' };
  }
  if (!cleanNew || cleanNew.length < 6) {
    return { success: false, message: 'New password must be at least 6 characters.' };
  }

  // Validate slash symbol in password
  if (!isSlashAllowedForPassword(normalizedEmail, cleanNew)) {
    return { 
      success: false, 
      message: "The '/' symbol in passwords is reserved for Admin and Owner accounts only." 
    };
  }

  const inputPhoneNorm = normalizePhoneNumber(cleanPhone);

  // 1. Check Owner account
  const owner = getOwnerCredentials();
  if (owner.email.toLowerCase() === normalizedEmail || normalizedEmail === 'kalebbereket49@gmail.com/owner' || normalizedEmail === 'kalebbereket49@gmail.com') {
    const ownerPhoneNorm = normalizePhoneNumber(owner.phone || '+251995406697');
    if (ownerPhoneNorm !== inputPhoneNorm) {
      return { success: false, message: 'Provided phone number does not match registered Owner phone number.' };
    }
    if (owner.password !== cleanCurrent) {
      return { success: false, message: 'Current password is incorrect for Owner account.' };
    }
    saveOwnerCredentials({
      password: cleanNew,
      phone: cleanPhone || owner.phone
    });
    return { success: true, message: 'Owner password changed successfully!' };
  }

  // 2. Check Admin account
  const admin = getAdminCredentials();
  if (admin.email.toLowerCase() === normalizedEmail || normalizedEmail === 'kalebbereket49@gmail.com/admin') {
    const adminPhoneNorm = normalizePhoneNumber(admin.phone || '+251995406697');
    if (adminPhoneNorm !== inputPhoneNorm) {
      return { success: false, message: 'Provided phone number does not match registered Admin phone number.' };
    }
    if (admin.password !== cleanCurrent) {
      return { success: false, message: 'Current password is incorrect for Admin account.' };
    }
    saveAdminCredentials({
      password: cleanNew,
      phone: cleanPhone || admin.phone
    });
    return { success: true, message: 'Admin password changed successfully!' };
  }

  // 3. Check Registered accounts
  const registered = getRegisteredUsers();
  const foundIndex = registered.findIndex(u => u.email.toLowerCase() === normalizedEmail);

  if (foundIndex >= 0) {
    const userAcc = registered[foundIndex];
    const userPhoneNorm = normalizePhoneNumber(userAcc.phone || '');
    if (userPhoneNorm && userPhoneNorm !== inputPhoneNorm) {
      return { success: false, message: `The provided Phone Number does not match the registered phone number for ${normalizedEmail}.` };
    }
    if (userAcc.password && userAcc.password !== cleanCurrent) {
      return { success: false, message: 'Current password is incorrect. Please check and try again.' };
    }
    registered[foundIndex] = {
      ...userAcc,
      password: cleanNew,
      phone: cleanPhone || userAcc.phone
    };
    localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(registered));
    return { success: true, message: 'Password changed successfully in database!' };
  }

  return { 
    success: false, 
    message: 'No registered account found with this Gmail / Email. Please register an account first.' 
  };
};

/**
 * Owner updates the entire Admin profile (Name, Username/Email, Phone, Password)
 */
export const updateAdminProfileByOwner = (
  name: string,
  email: string,
  phone: string,
  password: string
): { success: boolean; message: string } => {
  try {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail.endsWith('/admin')) {
      return { success: false, message: 'Admin email/username must end with "/admin" (e.g. kalebbereket49@gmail.com/admin)' };
    }

    if (!cleanPassword) {
      return { success: false, message: 'Admin password cannot be empty.' };
    }

    saveAdminCredentials({
      email: cleanEmail,
      password: cleanPassword,
      name: cleanName || 'Admin (Kaleb Bereket)',
      phone: cleanPhone || '+251995406697'
    });

    // Send to server
    fetch('/api/admin/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPassword,
        name: cleanName,
        phone: cleanPhone
      })
    }).catch(err => console.error('Server admin profile update error:', err));

    return { success: true, message: 'Admin profile & credentials updated successfully by Owner!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update Admin profile.' };
  }
};



