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
  StoredCredentials 
} from '../lib/passwords';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; message?: string };
  signup: (data: { name: string; email: string; phone: string; password: string; role?: UserRole }) => { success: boolean; message?: string };
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  adminCredentials: StoredCredentials;
  ownerCredentials: StoredCredentials;
  updateAdminSecurity: (newEmail: string, newPass: string, name?: string, phone?: string) => boolean;
  updateOwnerSecurity: (newEmail: string, newPass: string, name?: string, phone?: string) => boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalInitialMode: 'signin' | 'signup';
  setAuthModalInitialMode: (mode: 'signin' | 'signup') => void;
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
        // Check if plan has expired
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
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'signin' | 'signup'>('signin');

  // Check plan expiry periodically
  useEffect(() => {
    if (user?.planExpiresAt) {
      const expiry = new Date(user.planExpiresAt).getTime();
      if (expiry <= Date.now() && user.activePlan) {
        setUser(prev => prev ? { ...prev, activePlan: undefined, planExpiresAt: undefined } : null);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bete_finder_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('bete_finder_user');
    }
  }, [user]);

  const login = (rawEmail: string, rawPassword = ''): { success: boolean; message?: string } => {
    const inputEmail = rawEmail.trim().toLowerCase();
    const inputPassword = rawPassword.trim();

    // 1. Check Owner login credentials
    const currentOwner = getOwnerCredentials();
    const ownerEmailMatch = inputEmail === currentOwner.email.toLowerCase() || 
                            inputEmail === 'kalebbereket49@gmail.com/owner' ||
                            inputEmail === 'kalebbereket49@gmail.com' && inputPassword === currentOwner.password;
    if (ownerEmailMatch && inputPassword === currentOwner.password) {
      const ownerUser: UserProfile = {
        id: 'user-owner-kaleb',
        name: currentOwner.name || 'Owner (Kaleb Bereket)',
        email: currentOwner.email,
        phone: currentOwner.phone || '+251995406697',
        role: 'owner',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        savedPropertyIds: [],
        postedPropertyIds: ['prop-1', 'prop-2', 'prop-3', 'prop-4', 'prop-5', 'prop-6', 'prop-7', 'prop-8'],
        toursBooked: [],
        activePlan: 'vip'
      };
      setUser(ownerUser);
      return { success: true };
    }

    // 2. Check Admin login credentials
    const currentAdmin = getAdminCredentials();
    const adminEmailMatch = inputEmail === currentAdmin.email.toLowerCase() || 
                            inputEmail === 'kalebbereket49@gmail.com/admin' ||
                            inputEmail === 'kalebbereket49@gmail.com' && inputPassword === currentAdmin.password;
    if (adminEmailMatch && inputPassword === currentAdmin.password) {
      const adminUser: UserProfile = {
        id: 'user-admin-kaleb',
        name: currentAdmin.name || 'Admin (Kaleb Bereket)',
        email: currentAdmin.email,
        phone: currentAdmin.phone || '+251995406697',
        role: 'admin',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        savedPropertyIds: [],
        postedPropertyIds: ['prop-1', 'prop-2', 'prop-3', 'prop-4', 'prop-5', 'prop-6', 'prop-7', 'prop-8'],
        toursBooked: [],
        activePlan: 'premium'
      };
      setUser(adminUser);
      return { success: true };
    }

    // 3. Check registered users list
    const registered = getRegisteredUsers();
    const foundUser = registered.find(u => u.email.toLowerCase() === inputEmail);

    if (foundUser) {
      if (foundUser.password === inputPassword || !inputPassword) {
        // Extract user profile without password
        const { password: _, ...profile } = foundUser;
        // Check if plan expired
        if (profile.planExpiresAt && new Date(profile.planExpiresAt).getTime() <= Date.now()) {
          profile.activePlan = undefined;
          profile.planExpiresAt = undefined;
        }
        setUser(profile);
        return { success: true };
      } else {
        return { success: false, message: 'Incorrect password. Please try again.' };
      }
    }

    // 4. If user not previously registered, register them automatically with their email & password!
    const newAccount: RegisteredAccount = {
      id: `user-${Date.now()}`,
      name: rawEmail.split('@')[0] || 'User',
      email: rawEmail.trim(),
      phone: '+251995406697',
      role: 'tenant',
      password: inputPassword,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      savedPropertyIds: ['prop-1'],
      postedPropertyIds: [],
      toursBooked: []
    };

    saveRegisteredUser(newAccount);
    const { password: _, ...newProfile } = newAccount;
    setUser(newProfile);
    return { success: true };
  };

  const signup = (data: { name: string; email: string; phone: string; password: string; role?: UserRole }): { success: boolean; message?: string } => {
    const email = data.email.trim().toLowerCase();
    const registered = getRegisteredUsers();
    
    // Check if already registered
    const existing = registered.find(u => u.email.toLowerCase() === email);
    if (existing) {
      // Update password & details
      const updatedAccount: RegisteredAccount = {
        ...existing,
        name: data.name.trim() || existing.name,
        phone: data.phone.trim() || existing.phone,
        password: data.password.trim(),
        role: data.role || existing.role
      };
      saveRegisteredUser(updatedAccount);
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
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      savedPropertyIds: ['prop-1'],
      postedPropertyIds: [],
      toursBooked: []
    };

    saveRegisteredUser(newAccount);
    const { password: _, ...profile } = newAccount;
    setUser(profile);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (user) {
      setUser(prev => {
        if (!prev) return null;
        const updated = { ...prev, ...data };
        
        // Also update in registered list if applicable
        const registered = getRegisteredUsers();
        const existing = registered.find(u => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase());
        if (existing) {
          saveRegisteredUser({
            ...existing,
            ...data
          });
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
    return true;
  };

  const role: UserRole = user ? user.role : 'guest';
  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        signup,
        logout,
        updateUser,
        adminCredentials: adminCreds,
        ownerCredentials: ownerCreds,
        updateAdminSecurity,
        updateOwnerSecurity,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalInitialMode,
        setAuthModalInitialMode
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
