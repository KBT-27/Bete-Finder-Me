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
  isSlashAllowedForPassword
} from '../lib/passwords';
import { authenticateWithGoogle } from '../lib/googleAuth';
import { safeFetchJson } from '../lib/apiHelper';

export type AuthModalMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'change';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  signup: (data: { name: string; email: string; phone: string; password: string; role?: UserRole }) => { success: boolean; message?: string };
  loginWithGoogle: (role?: UserRole, customProfile?: { name?: string; email?: string; avatar?: string }) => Promise<{ success: boolean; message?: string }>;
  requestPasswordReset: (email: string, phone: string) => Promise<{ success: boolean; message: string; resetToken?: string; resetCode?: string; resetUrl?: string; delivered?: boolean }>;
  verifyResetToken: (token: string) => { valid: boolean; email?: string; error?: string };
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (data: { email: string; phone: string; currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  adminCredentials: StoredCredentials;
  ownerCredentials: StoredCredentials;
  updateAdminSecurity: (newEmail: string, newPass: string, name?: string, phone?: string) => boolean;
  updateOwnerSecurity: (newEmail: string, newPass: string, name?: string, phone?: string) => boolean;
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

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('bete_finder_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        if (parsed.planExpiresAt && new Date(parsed.planExpiresAt).getTime() <= Date.now()) {
          parsed.activePlan = undefined;
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

    // 1. Owner Login Check
    const currentOwner = getOwnerCredentials();
    if (
      cleanEmail === currentOwner.email.toLowerCase() ||
      cleanEmail === 'kalebbereket49@gmail.com/owner'
    ) {
      if (password && cleanPass !== currentOwner.password) {
        return { success: false, message: 'Invalid password for Owner account.' };
      }
      const ownerUser: UserProfile = {
        id: 'owner-kaleb',
        name: currentOwner.name || 'Kaleb Bereket (Owner)',
        email: currentOwner.email,
        phone: currentOwner.phone || '+251995406697',
        role: 'owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };
      setUser(ownerUser);
      return { success: true };
    }

    // 2. Admin Login Check
    const currentAdmin = getAdminCredentials();
    if (
      cleanEmail === currentAdmin.email.toLowerCase() ||
      cleanEmail === 'kalebbereket49@gmail.com/admin'
    ) {
      if (password && cleanPass !== currentAdmin.password) {
        return { success: false, message: 'Invalid password for Admin account.' };
      }
      const adminUser: UserProfile = {
        id: 'admin-kaleb',
        name: currentAdmin.name || 'Kaleb Bereket (Admin)',
        email: currentAdmin.email,
        phone: currentAdmin.phone || '+251995406697',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        savedPropertyIds: [],
        postedPropertyIds: [],
        toursBooked: []
      };
      setUser(adminUser);
      return { success: true };
    }

    // 3. Registered User Check
    const registered = getRegisteredUsers();
    const foundUser = registered.find(u => u.email.toLowerCase() === cleanEmail);

    if (foundUser) {
      if (password && foundUser.password && cleanPass !== foundUser.password) {
        return { success: false, message: 'Incorrect password. Please try again or use Forgot/Change Password.' };
      }
      const { password: _, ...profile } = foundUser;
      setUser(profile);
      return { success: true };
    }

    // 4. Default Mock/New local user
    const inputPassword = password || 'password123';
    const newAccount: RegisteredAccount = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0],
      email: email.trim(),
      phone: '+251995406697',
      role: 'tenant',
      password: inputPassword,
      provider: 'local',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      savedPropertyIds: [],
      postedPropertyIds: [],
      toursBooked: []
    };

    saveRegisteredUser(newAccount);
    // Push to server database asynchronously
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount)
    }).catch(() => {});

    const { password: _, ...newProfile } = newAccount;
    setUser(newProfile);
    return { success: true };
  };

  // Sign up handler
  const signup = (data: { name: string; email: string; phone: string; password: string; role?: UserRole }): { success: boolean; message?: string } => {
    const email = data.email.trim().toLowerCase();

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
    const existing = registered.find(u => u.email.toLowerCase() === email);

    if (existing) {
      const updatedAccount: RegisteredAccount = {
        ...existing,
        name: data.name.trim() || existing.name,
        phone: data.phone.trim() || existing.phone,
        password: data.password.trim(),
        role: data.role || existing.role,
        provider: 'local'
      };
      saveRegisteredUser(updatedAccount);
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAccount)
      }).catch(() => {});

      const { password: _, ...profile } = updatedAccount;
      setUser(profile);
      return { success: true };
    }

    const newAccount: RegisteredAccount = {
      id: `user-${Date.now()}`,
      name: data.name.trim() || email.split('@')[0],
      email: data.email.trim(),
      phone: data.phone.trim() || '+251995406697',
      role: data.role || 'tenant',
      password: data.password.trim(),
      provider: 'local',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      savedPropertyIds: [],
      postedPropertyIds: [],
      toursBooked: []
    };

    saveRegisteredUser(newAccount);
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAccount)
    }).catch(() => {});

    const { password: _, ...profile } = newAccount;
    setUser(profile);
    return { success: true };
  };

  // Google OAuth Login
  const loginWithGoogle = async (
    userRole: UserRole = 'tenant', 
    customProfile?: { name?: string; email?: string; avatar?: string }
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

      const registered = getRegisteredUsers();
      const existing = registered.find(u => u.email.toLowerCase() === googleEmail);

      if (existing) {
        const { password: _, ...profile } = existing;
        setUser(profile);
        return { success: true };
      }

      const newGoogleAccount: RegisteredAccount = {
        id: `google-${Date.now()}`,
        name: googleName || 'Google User',
        email: googleEmail || 'kalebbereket49@gmail.com',
        phone: '+251995406697',
        role: userRole,
        password: 'google-oauth-auth',
        provider: 'google',
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
    phone: string
  ): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
    resetCode?: string;
    resetUrl?: string;
    delivered?: boolean;
  }> => {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Please enter a valid registered Gmail / Email address.' };
    }
    if (!phone || !phone.trim()) {
      return { success: false, message: 'Please enter your registered phone number.' };
    }

    const inputEmail = email.trim().toLowerCase();
    const inputPhone = phone.trim();

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

    // Client-side verification against registered accounts & phone numbers
    const localVerification = verifyRegisteredAccountAndPhone(inputEmail, inputPhone);
    if (!localVerification.matched) {
      return {
        success: false,
        message: localVerification.error || 'The entered Gmail and Phone Number do not match any registered account in the database.'
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
        const existing = registered.find(u => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase());
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

  const updateAdminSecurity = (newEmail: string, newPass: string, name?: string, phone?: string): boolean => {
    const updated = saveAdminCredentials({
      email: newEmail.trim(),
      password: newPass.trim(),
      name: name?.trim() || adminCreds.name,
      phone: phone?.trim() || adminCreds.phone
    });
    setAdminCreds(updated);
    if (user && user.role === 'admin') {
      setUser(prev => prev ? {
        ...prev,
        email: updated.email,
        name: updated.name,
        phone: updated.phone
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

  const updateOwnerSecurity = (newEmail: string, newPass: string, name?: string, phone?: string): boolean => {
    const updated = saveOwnerCredentials({
      email: newEmail.trim(),
      password: newPass.trim(),
      name: name?.trim() || ownerCreds.name,
      phone: phone?.trim() || ownerCreds.phone
    });
    setOwnerCreds(updated);
    if (user && user.role === 'owner') {
      setUser(prev => prev ? {
        ...prev,
        email: updated.email,
        name: updated.name,
        phone: updated.phone
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
