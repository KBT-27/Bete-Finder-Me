import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { 
  getAdminCredentials, 
  saveAdminCredentials, 
  getOwnerCredentials, 
  saveOwnerCredentials, 
  getRegisteredUsers, 
  saveRegisteredUser,
  RegisteredAccount,
  StoredCredentials,
  createPasswordResetRequest,
  validatePasswordResetToken,
  markTokenAsUsed,
  updateAccountPasswordByEmail,
  changeAccountPassword,
  isSlashAllowedForEmail,
  extractDestinationEmail,
  verifyRegisteredAccountAndPhone,
  normalizePhoneNumber,
  isSlashAllowedForPassword,
  isRevokedAdminEmail,
  isRevokedAdminPassword,
  isRevokedOwnerEmail,
  isRevokedOwnerPassword
} from '../lib/passwords';
import { authenticateWithGoogle } from '../lib/googleAuth';
import { safeFetchJson } from '../lib/apiHelper';
import { getAdminControllerConfig } from '../lib/adminController';

export type AuthModalMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'change';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  signup: (data: { name: string; email: string; phone: string; password: string; role?: UserRole }) => { success: boolean; message?: string };
  loginWithGoogle: (role?: UserRole, customProfile?: { name?: string; email?: string; avatar?: string; phone?: string }) => Promise<{ success: boolean; message?: string }>;
  isEmailRegistered: (email: string) => boolean;
  requestPasswordReset: (email: string, phone?: string) => Promise<{ success: boolean; message: string; resetToken?: string; resetCode?: string; resetUrl?: string; delivered?: boolean }>;
  verifyResetToken: (token: string) => { valid: boolean; email?: string; error?: string };
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (data: { email: string; phone: string; currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  adminCredentials: StoredCredentials;
  ownerCredentials: StoredCredentials;
  updateAdminSecurity: (newEmail: string, newPass: string, name?: string, phone?: string, avatar?: string, bio?: string) => boolean;
  updateOwnerSecurity: (newEmail: string, newPass: string, name?: string, phone?: string, avatar?: string, bio?: string) => boolean;
  registeredUsers: RegisteredAccount[];
  registeredUsersCount: number;
  refreshRegisteredUsers: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialMode: AuthModalMode;
  setAuthModalInitialMode: (mode: AuthModalMode) => void;
  activeResetToken: string | null;
  setActiveResetToken: (token: string | null) => void;
  syncAuthWithDatabase: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminCreds, setAdminCreds] = useState<StoredCredentials>(getAdminCredentials);
  const [ownerCreds, setOwnerCreds] = useState<StoredCredentials>(getOwnerCredentials);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>(getRegisteredUsers);

  const refreshRegisteredUsers = useCallback(() => {
    setRegisteredUsers(getRegisteredUsers());
  }, []);

  useEffect(() => {
    const handleAccountsChanged = () => {
      setRegisteredUsers(getRegisteredUsers());
    };
    window.addEventListener('bete_accounts_changed', handleAccountsChanged);
    window.addEventListener('storage', handleAccountsChanged);
    return () => {
      window.removeEventListener('bete_accounts_changed', handleAccountsChanged);
      window.removeEventListener('storage', handleAccountsChanged);
    };
  }, []);

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('bete_finder_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        if (parsed.planExpiresAt && new Date(parsed.planExpiresAt).getTime() <= Date.now()) {
          parsed.activePlan = 'free';
          parsed.planExpiresAt = undefined;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialMode, setAuthModalInitialMode] = useState<AuthModalMode>('signin');
  const [activeResetToken, setActiveResetToken] = useState<string | null>(null);

  // Sync auth state and registered accounts with server database
  const syncAuthWithDatabase = useCallback(async () => {
    try {
      const result = await safeFetchJson<any>('/api/db/sync');
      if (result.isJson && result.data && result.data.success && result.data.data) {
        const d = result.data.data;
        if (d.users && Array.isArray(d.users)) {
          localStorage.setItem('bete_finder_registered_accounts', JSON.stringify(d.users));
          setRegisteredUsers(d.users);
        }
        if (d.adminCredentials) {
          setAdminCreds(d.adminCredentials);
          localStorage.setItem('bete_finder_admin_creds', JSON.stringify(d.adminCredentials));
        }
        if (d.ownerCredentials) {
          setOwnerCreds(d.ownerCredentials);
          localStorage.setItem('bete_finder_owner_creds', JSON.stringify(d.ownerCredentials));
        }
      }
    } catch {
      // Offline fallback to localStorage
    }
  }, []);

  // Sync on mount, visibility change, and periodically across devices
  useEffect(() => {
    syncAuthWithDatabase();

    const handleSyncTrigger = () => {
      syncAuthWithDatabase();
    };

    window.addEventListener('focus', handleSyncTrigger);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncAuthWithDatabase();
      }
    });

    const interval = setInterval(syncAuthWithDatabase, 4000);
    return () => {
      window.removeEventListener('focus', handleSyncTrigger);
      clearInterval(interval);
    };
  }, [syncAuthWithDatabase]);

  // Check URL query parameters for reset token or code
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || params.get('reset_token') || params.get('code');
      if (token) {
        setActiveResetToken(token);
        setAuthModalInitialMode('reset');
        setIsAuthModalOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save active user to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('bete_finder_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bete_finder_user');
    }
  }, [user]);

  // Listen for admin/owner credentials updates
  useEffect(() => {
    const handleStorageChange = () => {
      setAdminCreds(getAdminCredentials());
      setOwnerCreds(getOwnerCredentials());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const role: UserRole = user ? user.role : 'guest';
  const isAuthenticated = !!user;

  // Helper to check if an email is already registered in local / cached database
  const isEmailRegistered = (testEmail: string): boolean => {
    if (!testEmail) return false;
    const clean = testEmail.trim().toLowerCase();
    
    // Check owner / admin emails
    const currentOwner = getOwnerCredentials();
    const cleanOwnerEmail = (currentOwner.email || '').split('/')[0].toLowerCase();
    if (
      clean === cleanOwnerEmail ||
      clean === currentOwner.email.toLowerCase() ||
      clean === 'kalebbereket49@gmail.com' ||
      clean === 'kalebbereker49@gmail.com'
    ) {
      return true;
    }

    const currentAdmin = getAdminCredentials();
    const cleanAdminEmail = (currentAdmin.email || '').split('/')[0].toLowerCase();
    if (
      clean === cleanAdminEmail ||
      clean === currentAdmin.email.toLowerCase() ||
      clean === 'kalebbereket49@gmail.com/admin'
    ) {
      return true;
    }

    const registered = getRegisteredUsers();
    return registered.some(u => u.email.toLowerCase() === clean);
  };

  // Login handler
  const login = (email: string, password?: string): { success: boolean; message?: string } => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Check slash symbol constraint
    if (cleanEmail.includes('/')) {
      const isAllowedSlash = 
        cleanEmail === 'kalebbereket49@gmail.com/admin' || 
        cleanEmail === 'kalebbereket49@gmail.com/owner' || 
        cleanEmail.endsWith('/admin') || 
        cleanEmail.endsWith('/owner');
      if (!isAllowedSlash) {
        return {
          success: false,
          message: 'The "/" symbol in email/username is reserved for Admin and Owner accounts only.'
        };
      }
    }

    if (password && password.includes('/')) {
      if (!isSlashAllowedForPassword(cleanEmail, password)) {
        return {
          success: false,
          message: 'The "/" symbol in passwords is reserved for Admin and Owner accounts only.'
        };
      }
    }

    // 1. Owner Login Check with Invalidation Enforced
    if (isRevokedOwnerEmail(cleanEmail)) {
      return { 
        success: false, 
        message: 'This previous Owner email address was changed and can no longer access the system. Access with the old email is permanently invalidated. Please sign in using the updated Owner email address.' 
      };
    }

    const currentOwner = getOwnerCredentials();
    const cleanOwnerEmail = (currentOwner.email || '').split('/')[0].toLowerCase();
    const isOwnerEmailMatch =
      cleanEmail === currentOwner.email.toLowerCase() ||
      cleanEmail === cleanOwnerEmail ||
      cleanEmail === `${cleanOwnerEmail}/owner`;

    if (isOwnerEmailMatch) {
      if (password && cleanPass !== currentOwner.password) {
        if (isRevokedOwnerPassword(cleanPass)) {
          return {
            success: false,
            message: 'Incorrect password. Your Owner password was changed and the previous password can no longer access this account. Please use your new Owner password.'
          };
        }
        return { success: false, message: 'Invalid password for Owner account.' };
      }
      const ownerUser: UserProfile = {
        id: 'owner-kaleb',
        name: currentOwner.name || 'Kaleb Bereket',
        email: currentOwner.email,
        phone: currentOwner.phone || '0995406697',
        role: 'owner',
        avatar: currentOwner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        bio: currentOwner.bio || 'Platform Owner & Administrator',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };
      setUser(ownerUser);
      return { success: true };
    }

    // 2. Admin Login Check with Credential Invalidation Enforced
    if (isRevokedAdminEmail(cleanEmail)) {
      return { 
        success: false, 
        message: 'This previous Admin email address was changed and can no longer access the system. Access with the old email is permanently invalidated. Please sign in using the updated Admin email address.' 
      };
    }

    const currentAdmin = getAdminCredentials();
    const cleanAdminEmail = (currentAdmin.email || '').split('/')[0].toLowerCase();
    const isAdminEmailMatch =
      cleanEmail === currentAdmin.email.toLowerCase() ||
      cleanEmail === cleanAdminEmail ||
      cleanEmail === `${cleanAdminEmail}/admin`;

    if (isAdminEmailMatch) {
      if (password && cleanPass !== currentAdmin.password) {
        if (isRevokedAdminPassword(cleanPass)) {
          return {
            success: false,
            message: 'Incorrect password. Your Admin password was changed and the previous password can no longer access this account. Please use your new Admin password.'
          };
        }
        return { success: false, message: 'Invalid password for Admin account.' };
      }
      const adminUser: UserProfile = {
        id: 'admin-kaleb',
        name: currentAdmin.name || 'Kaleb Bereket (Admin)',
        email: currentAdmin.email,
        phone: currentAdmin.phone || '+251995406697',
        role: 'admin',
        avatar: currentAdmin.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        bio: currentAdmin.bio || 'System Administrator',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };
      setUser(adminUser);
      return { success: true };
    }

    // 2b. Secondary Admin / Sub-Admin Login Check
    const controllerConfig = getAdminControllerConfig();
    const matchedSubAdmin = (controllerConfig.subAdmins || []).find(s => {
      const sEmail = (s.email || '').trim().toLowerCase();
      const sClean = sEmail.split('/')[0];
      return cleanEmail === sEmail || cleanEmail === sClean || cleanEmail === `${sClean}/admin`;
    });

    if (matchedSubAdmin) {
      if (password && cleanPass !== matchedSubAdmin.password) {
        return { success: false, message: 'Invalid password for Secondary Admin account.' };
      }
      const subAdminUser: UserProfile = {
        id: matchedSubAdmin.id,
        name: matchedSubAdmin.name,
        email: matchedSubAdmin.email,
        phone: matchedSubAdmin.phone,
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        bio: `Secondary Admin (${matchedSubAdmin.role.replace(/_/g, ' ')}) - ${matchedSubAdmin.assignedSubcity}`,
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };
      setUser(subAdminUser);
      return { success: true };
    }

    // 3. Registered User Check
    const registered = getRegisteredUsers();
    const foundUser = registered.find(u => u.email.toLowerCase() === cleanEmail);

    if (foundUser) {
      if (password && foundUser.password && cleanPass !== foundUser.password) {
        return { success: false, message: 'Incorrect password. Please try again or use Forgot Password to reset.' };
      }
      const updatedUser: RegisteredAccount = {
        ...foundUser,
        lastLogin: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      saveRegisteredUser(updatedUser);
      // Synchronize sign-in event immediately to Master Database for Owner Dashboard visibility
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
      }).catch(() => {});

      const { password: _, ...profile } = updatedUser;
      setUser(profile);
      return { success: true };
    }

    // Strict security rule: Any person CANNOT register in the Sign In part. Must register first.
    return {
      success: false,
      message: 'Account not found with this email. You must register first in the "Sign Up" tab before signing in. (መለያ አልተገኘም፤ እባክዎ መጀመሪያ ይመዝገቡ)'
    };
  };

  // Sign up handler - Enforces: 1 account can only register 1
  const signup = (data: { name: string; email: string; phone: string; password: string; role?: UserRole }): { success: boolean; message?: string } => {
    const email = data.email.trim().toLowerCase();
    const cleanPhone = (data.phone || '').trim();

    // Check slash symbol constraint
    if (email.includes('/')) {
      return { 
        success: false, 
        message: 'The "/" symbol is reserved for Admin and Owner accounts only and cannot be used in registration.' 
      };
    }

    if (!isSlashAllowedForPassword(email, data.password)) {
      return {
        success: false,
        message: "The '/' symbol in passwords is reserved for Admin and Owner accounts only."
      };
    }

    const registered = getRegisteredUsers();
    const existingEmail = registered.find(u => u.email.toLowerCase() === email);

    // Rule: 1 account can only register only 1. Disallow duplicate email registrations.
    if (existingEmail) {
      return {
        success: false,
        message: 'This email is already registered. 1 account can only register 1. Please sign in with your password.'
      };
    }

    // Rule: Check if phone number is already registered to another account
    if (cleanPhone) {
      const existingPhone = registered.find(u => u.phone && u.phone.trim() === cleanPhone);
      if (existingPhone) {
        return {
          success: false,
          message: 'This phone number is already registered to an account. 1 account can only register 1.'
        };
      }
    }

    const nowIso = new Date().toISOString();
    const newAccount: RegisteredAccount = {
      id: `user-${Date.now()}`,
      name: data.name.trim() || email.split('@')[0],
      email: data.email.trim(),
      phone: cleanPhone || '+251995406697',
      role: data.role || 'tenant',
      password: data.password.trim(),
      provider: 'local',
      registeredAt: nowIso,
      lastLogin: nowIso,
      lastActiveAt: nowIso,
      activePlan: 'free',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      savedPropertyIds: [],
      postedPropertyIds: [],
      toursBooked: []
    };

    saveRegisteredUser(newAccount);
    window.dispatchEvent(new Event('bete_accounts_changed'));
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount)
    }).then(() => {
      syncAuthWithDatabase().catch(() => {});
    }).catch(() => {});

    const { password: _, ...profile } = newAccount;
    setUser(profile);
    return { success: true };
  };

  // Google OAuth Login
  const loginWithGoogle = async (
    userRole: UserRole = 'tenant', 
    customProfile?: { name?: string; email?: string; avatar?: string; phone?: string }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      let googleEmail = customProfile?.email?.toLowerCase();
      let googleName = customProfile?.name;
      let googleAvatar = customProfile?.avatar;

      // If no custom profile provided, trigger Google OAuth popup / Token verification flow
      if (!googleEmail) {
        const authRes = await authenticateWithGoogle();
        if (!authRes.success || !authRes.profile) {
          return {
            success: false,
            message: authRes.error || 'Google Sign-In failed or was cancelled.'
          };
        }
        googleEmail = authRes.profile.email.toLowerCase();
        googleName = authRes.profile.name;
        googleAvatar = authRes.profile.avatar;
      }

      // Check Owner Google match first
      const currentOwner = getOwnerCredentials();
      const cleanOwnerEmail = (currentOwner.email || '').split('/')[0].toLowerCase();
      if (
        googleEmail === cleanOwnerEmail ||
        googleEmail === currentOwner.email.toLowerCase() ||
        googleEmail === 'kalebbereket49@gmail.com' ||
        googleEmail === 'kalebbereker49@gmail.com'
      ) {
        const ownerUser: UserProfile = {
          id: 'owner-kaleb',
          name: googleName || currentOwner.name || 'Kaleb Bereket',
          email: currentOwner.email,
          phone: currentOwner.phone || '0995406697',
          role: 'owner',
          avatar: googleAvatar || currentOwner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          bio: currentOwner.bio || 'Platform Owner & Administrator',
          savedPropertyIds: [],
          postedPropertyIds: [],
          toursBooked: []
        };
        setUser(ownerUser);
        return { success: true };
      }

      // Check Admin Google match
      const currentAdmin = getAdminCredentials();
      const cleanAdminEmail = (currentAdmin.email || '').split('/')[0].toLowerCase();
      if (
        googleEmail === cleanAdminEmail ||
        googleEmail === currentAdmin.email.toLowerCase() ||
        googleEmail === 'kalebbereket49@gmail.com/admin'
      ) {
        const adminUser: UserProfile = {
          id: 'admin-kaleb',
          name: googleName || currentAdmin.name || 'Kaleb Bereket (Admin)',
          email: currentAdmin.email,
          phone: currentAdmin.phone || '+251995406697',
          role: 'admin',
          avatar: googleAvatar || currentAdmin.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
          bio: currentAdmin.bio || 'System Administrator',
          savedPropertyIds: [],
          postedPropertyIds: [],
          toursBooked: []
        };
        setUser(adminUser);
        return { success: true };
      }

      const registered = getRegisteredUsers();
      const existing = registered.find(u => u.email.toLowerCase() === googleEmail);

      if (existing) {
        const nowIso = new Date().toISOString();
        const updatedExisting: RegisteredAccount = {
          ...existing,
          lastLogin: nowIso,
          lastActiveAt: nowIso
        };
        saveRegisteredUser(updatedExisting);
        fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedExisting)
        }).catch(() => {});
        const { password: _, ...profile } = updatedExisting;
        setUser(profile);
        return { success: true };
      }

      const nowIso = new Date().toISOString();
      const newGoogleAccount: RegisteredAccount = {
        id: `google-${Date.now()}`,
        name: googleName || 'Google User',
        email: googleEmail || 'user@gmail.com',
        phone: customProfile?.phone || '+251995406697',
        role: userRole,
        password: 'google-oauth-auth',
        provider: 'google',
        registeredAt: nowIso,
        lastLogin: nowIso,
        lastActiveAt: nowIso,
        activePlan: 'free',
        avatar: googleAvatar || 'https://lh3.googleusercontent.com/a/ACg8ocIS8YgD1xYpUaN7c4l6WjZg8M8yBqH3q4y9wR=s96-c',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };

      saveRegisteredUser(newGoogleAccount);
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoogleAccount)
      }).then(() => {
        syncAuthWithDatabase().catch(() => {});
      }).catch(() => {});

      const { password: _, ...profile } = newGoogleAccount;
      setUser(profile);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Google authentication error.' };
    }
  };

  // Request Password Reset with Email AND Phone number verification
  const requestPasswordReset = async (
    email: string,
    phone?: string
  ): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
    resetCode?: string;
    resetUrl?: string;
    delivered?: boolean;
  }> => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid Gmail / Email address.' };
    }

    const inputEmail = email.trim().toLowerCase();
    const inputPhone = (phone || '').trim();

    // Check slash symbol constraint
    if (inputEmail.includes('/')) {
      const isAllowedSlash = inputEmail.endsWith('/admin') || inputEmail.endsWith('/owner');
      if (!isAllowedSlash) {
        return {
          success: false,
          message: 'The "/" symbol in email/username is reserved for Admin and Owner accounts only.'
        };
      }
    }

    // Client-side verification against registered accounts & phone numbers (phone optional)
    const localVerification = verifyRegisteredAccountAndPhone(inputEmail, inputPhone);
    if (!localVerification.matched) {
      return {
        success: false,
        message: localVerification.error || 'The entered Gmail address could not be verified in the database.'
      };
    }

    // Create 6-digit verification code
    const resetReq = createPasswordResetRequest(inputEmail);
    const destinationEmail = extractDestinationEmail(inputEmail);
    const resetUrl = `${window.location.origin}${window.location.pathname}?token=${resetReq.code}`;

    try {
      const result = await safeFetchJson<any>('/api/auth/send-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputEmail,
          phone: inputPhone,
          code: resetReq.code,
          resetUrl
        }),
      });

      if (result.isJson && result.data && result.success) {
        return {
          success: true,
          message: result.data.message || `6-digit verification code sent to ${destinationEmail} (Gmail Primary Inbox).`,
          resetToken: resetReq.token,
          resetCode: resetReq.code,
          resetUrl,
          delivered: result.data.delivered
        };
      }

      if (result.isJson && result.data && !result.success) {
        return {
          success: false,
          message: result.data.message || 'Failed to dispatch verification email.'
        };
      }

      return {
        success: true,
        message: `6-digit verification code generated for ${destinationEmail}.`,
        resetToken: resetReq.token,
        resetCode: resetReq.code,
        resetUrl,
        delivered: false
      };
    } catch {
      return {
        success: true,
        message: `6-digit verification code generated for ${destinationEmail}.`,
        resetToken: resetReq.token,
        resetCode: resetReq.code,
        resetUrl,
        delivered: false
      };
    }
  };

  // Verify Reset Token / Code
  const verifyResetToken = useCallback((token: string) => {
    return validatePasswordResetToken(token);
  }, []);

  // Complete Password Reset
  const resetPasswordWithToken = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const cleanToken = token.trim();
    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    // Call server API for global synchronization
    try {
      const result = await safeFetchJson<any>('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanToken,
          token: cleanToken,
          newPassword: newPassword.trim()
        })
      });
      if (result.isJson && result.data && result.data.success) {
        markTokenAsUsed(cleanToken);
        setActiveResetToken(null);
        syncAuthWithDatabase();
        return { success: true, message: result.data.message || 'Password reset successfully!' };
      }
    } catch {
      // fallback
    }

    // Local validation fallback
    const validation = validatePasswordResetToken(cleanToken);
    if (!validation.valid || !validation.email) {
      return { success: false, message: validation.error || 'Invalid or expired 6-digit verification code.' };
    }

    try {
      const result = updateAccountPasswordByEmail(validation.email, newPassword.trim());
      markTokenAsUsed(cleanToken);
      setActiveResetToken(null);
      return { success: true, message: result.message || 'Your password has been successfully reset!' };
    } catch (error: any) {
      return { success: false, message: error?.message || 'Error updating password.' };
    }
  };

  // Change Password flow (Requires: Gmail, Phone, Current Password, New Password)
  const changePassword = async (data: {
    email: string;
    phone: string;
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> => {
    const { email, phone, currentPassword, newPassword } = data;

    if (!email || !currentPassword || !newPassword) {
      return { success: false, message: 'Please provide Gmail address, current password, and new password.' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check slash constraint
    if (cleanEmail.includes('/')) {
      const isAllowed = cleanEmail.endsWith('/admin') || cleanEmail.endsWith('/owner');
      if (!isAllowed) {
        return {
          success: false,
          message: 'The "/" symbol in email/username is reserved for Admin and Owner accounts only.'
        };
      }
    }

    if (newPassword.trim().length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    // 1. Send change request to Server DB
    try {
      const result = await safeFetchJson<any>('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          phone: (phone || '').trim(),
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim()
        })
      });
      if (result.isJson && result.data && result.data.success) {
        // Also update local storage and state
        changeAccountPassword(cleanEmail, phone || '', currentPassword, newPassword);
        syncAuthWithDatabase();
        return { success: true, message: result.data.message || 'Password changed successfully in the database!' };
      } else if (result.isJson && result.data && !result.data.success) {
        return { success: false, message: result.data.message || 'Failed to change password.' };
      }
    } catch {
      // Local fallback
    }

    // Local fallback
    const localResult = changeAccountPassword(cleanEmail, phone || '', currentPassword, newPassword);
    return localResult;
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...data };
        const registered = getRegisteredUsers();
        const prevEmail = (prev.email || '').trim().toLowerCase();
        const existing = registered.find(u => {
          const uEmail = (u.email || '').trim().toLowerCase();
          return (u.id && prev.id && u.id === prev.id) || (uEmail && prevEmail && uEmail === prevEmail);
        });
        if (existing) {
          const updatedAcc = { ...existing, ...data };
          saveRegisteredUser(updatedAcc);
          fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAcc)
          }).catch(() => {});
        }
        return updated;
      });
    }
  };

  const updateAdminSecurity = (newEmail: string, newPass: string, name?: string, phone?: string, avatar?: string, bio?: string): boolean => {
    const updated = saveAdminCredentials({
      email: newEmail.trim(),
      password: newPass.trim(),
      name: name?.trim() || adminCreds.name,
      phone: phone?.trim() || adminCreds.phone,
      avatar: avatar?.trim() || adminCreds.avatar,
      bio: bio?.trim() || adminCreds.bio,
    });
    setAdminCreds(updated);
    if (user && user.role === 'admin') {
      setUser(prev => prev ? {
        ...prev,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        avatar: updated.avatar || prev.avatar,
        bio: updated.bio
      } : null);
    }
    // Push update to server
    fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminCredentials: updated })
    }).catch(() => {});
    return true;
  };

  const updateOwnerSecurity = (newEmail: string, newPass: string, name?: string, phone?: string, avatar?: string, bio?: string): boolean => {
    const updated = saveOwnerCredentials({
      email: newEmail.trim(),
      password: newPass.trim(),
      name: name?.trim() || ownerCreds.name,
      phone: phone?.trim() || ownerCreds.phone,
      avatar: avatar?.trim() || ownerCreds.avatar,
      bio: bio?.trim() || ownerCreds.bio,
    });
    setOwnerCreds(updated);
    if (user && user.role === 'owner') {
      setUser(prev => prev ? {
        ...prev,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        avatar: updated.avatar || prev.avatar,
        bio: updated.bio
      } : null);
    }
    // Push update to server
    fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerCredentials: updated })
    }).catch(() => {});
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        signup,
        loginWithGoogle,
        isEmailRegistered,
        requestPasswordReset,
        verifyResetToken,
        resetPasswordWithToken,
        changePassword,
        logout,
        updateUser,
        adminCredentials: adminCreds,
        ownerCredentials: ownerCreds,
        updateAdminSecurity,
        updateOwnerSecurity,
        registeredUsers,
        registeredUsersCount: registeredUsers.length,
        refreshRegisteredUsers,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalInitialMode,
        setAuthModalInitialMode,
        activeResetToken,
        setActiveResetToken,
        syncAuthWithDatabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
