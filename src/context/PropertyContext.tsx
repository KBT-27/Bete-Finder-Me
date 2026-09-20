import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { Property, PropertyFilterState, ListingPlan, PaymentRequest, TelebirrSettings } from '../types';
import { INITIAL_PROPERTIES, LISTING_PLANS } from '../data/initialProperties';
import { useAuth } from './AuthContext';
import { safeFetchJson } from '../lib/apiHelper';
import { pushAllLocalStorageToDatabase, queueDatabaseSync } from '../lib/masterDatabaseSync';

const DEFAULT_FILTER: PropertyFilterState = {
  searchQuery: '',
  listingType: 'all',
  propertyType: 'all',
  city: 'all',
  subcity: 'all',
  minPrice: 0,
  maxPrice: 2000000,
  minBedrooms: 'all',
  minBathrooms: 'all',
  isFurnished: undefined,
  finishingStatus: 'all',
  verifiedOnly: false,
  sortBy: 'newest',
  selectedAmenities: []
};

const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [];

interface PropertyContextType {
  properties: Property[];
  filters: PropertyFilterState;
  setFilters: React.Dispatch<React.SetStateAction<PropertyFilterState>>;
  updateFilter: <K extends keyof PropertyFilterState>(key: K, value: PropertyFilterState[K]) => void;
  resetFilters: () => void;
  filteredProperties: Property[];
  featuredProperties: Property[];
  latestProperties: Property[];
  selectedProperty: Property | null;
  setSelectedProperty: (prop: Property | null) => void;
  currentView: 'home' | 'properties' | 'details' | 'post' | 'pricing' | 'dashboard' | 'reset-password';
  setCurrentView: (view: 'home' | 'properties' | 'details' | 'post' | 'pricing' | 'dashboard' | 'reset-password') => void;
  activeListingType: 'all' | 'rent' | 'sale';
  setActiveListingType: (type: 'all' | 'rent' | 'sale') => void;
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  savedProperties: Property[];
  userPostedProperties: Property[];
  addProperty: (propertyData: Omit<Property, 'id' | 'postedDate' | 'viewsCount' | 'favoritesCount'>) => Property;
  deleteProperty: (propertyId: string) => void;
  clearAllProperties: () => Promise<boolean>;
  updateProperty: (propertyId: string, updates: Partial<Property>) => void;
  verifyProperty: (propertyId: string, isVerified: boolean) => void;
  bookTour: (propertyId: string, date: string, time: string, notes?: string) => boolean;
  plans: ListingPlan[];
  updatePlanPrice: (planId: string, newPrice: number) => void;
  updatePlan: (planId: string, updates: Partial<ListingPlan>) => void;
  telebirrSettings: TelebirrSettings;
  updateTelebirrSettings: (accountNumber: string, accountName: string) => void;
  selectedPlan: ListingPlan | null;
  setSelectedPlan: (plan: ListingPlan | null) => void;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  pendingPaymentPurpose: 'plan' | 'boost' | null;
  setPendingPaymentPurpose: (purpose: 'plan' | 'boost' | null) => void;
  boostProperty: (propertyId: string) => void;
  paymentRequests: PaymentRequest[];
  submitPaymentRequest: (data: {
    userName: string;
    userPhone: string;
    transactionRef: string;
    screenshotUrl?: string;
    plan: ListingPlan | null;
    durationMonths: number;
    totalAmount: number;
  }) => PaymentRequest;
  approvePaymentRequest: (requestId: string) => void;
  rejectPaymentRequest: (requestId: string, reason: string) => void;
  deletePaymentRequest: (requestId: string) => void;
  verifyPaymentWithLinksEt: (params: {
    url?: string;
    reference?: string;
    userName?: string;
    userPhone?: string;
    plan?: ListingPlan | null;
    durationMonths?: number;
    totalAmount?: number;
    autoActivate?: boolean;
    requestId?: string;
  }) => Promise<{ success: boolean; verified: boolean; message: string; receipt?: any; raw?: any }>;
  userPaymentRequests: PaymentRequest[];
  syncWithDatabase: () => Promise<{ success: boolean; message: string; connectedNeon: boolean }>;
  isDatabaseSyncing: boolean;
  isNeonConnected: boolean;
  lastDbSyncTimestamp: number;
  syncIntervalSeconds: number;
  setSyncIntervalSeconds: (seconds: number) => void;
  isAIChatOpen: boolean;
  setIsAIChatOpen: (open: boolean) => void;
  aiInitialPrompt: string;
  setAiInitialPrompt: (prompt: string) => void;
  openAIChatWithPrompt: (prompt?: string) => void;
  isFeedbackOpen: boolean;
  setIsFeedbackOpen: (open: boolean) => void;
  feedbackInitialLocation: string;
  setFeedbackInitialLocation: (loc: string) => void;
  openFeedbackModal: (initialLocation?: string) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuth();

  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('bete_finder_properties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PROPERTIES;
      }
    }
    return INITIAL_PROPERTIES;
  });

  const [plans, setPlans] = useState<ListingPlan[]>(() => {
    const saved = localStorage.getItem('bete_finder_plans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) && 
          parsed.some(p => p.id === 'free') &&
          parsed.some(p => p.id === 'basic' && p.price === 299) &&
          parsed.some(p => p.id === 'vip' && p.price === 999)
        ) {
          return parsed;
        }
        return LISTING_PLANS;
      } catch {
        return LISTING_PLANS;
      }
    }
    return LISTING_PLANS;
  });

  const [telebirrSettings, setTelebirrSettings] = useState<TelebirrSettings>(() => {
    const saved = localStorage.getItem('bete_finder_telebirr_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          accountNumber: '0995406697',
          accountName: 'Kaleb Bereket (Bete Finder Owner)'
        };
      }
    }
    return {
      accountNumber: '0995406697',
      accountName: 'Kaleb Bereket (Bete Finder Owner)'
    };
  });

  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(() => {
    const saved = localStorage.getItem('bete_finder_payment_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PAYMENT_REQUESTS;
      }
    }
    return INITIAL_PAYMENT_REQUESTS;
  });

  const [filters, setFilters] = useState<PropertyFilterState>(DEFAULT_FILTER);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'properties' | 'details' | 'post' | 'pricing' | 'dashboard' | 'reset-password'>('home');
  const [activeListingType, setActiveListingType] = useState<'all' | 'rent' | 'sale'>('all');

  const [selectedPlan, setSelectedPlan] = useState<ListingPlan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPaymentPurpose, setPendingPaymentPurpose] = useState<'plan' | 'boost' | null>(null);

  const [isDatabaseSyncing, setIsDatabaseSyncing] = useState(false);
  const [isNeonConnected, setIsNeonConnected] = useState(false);
  const [lastDbSyncTimestamp, setLastDbSyncTimestamp] = useState(Date.now());
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackInitialLocation, setFeedbackInitialLocation] = useState('');

  const openAIChatWithPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      setAiInitialPrompt(prompt);
    }
    setIsAIChatOpen(true);
  }, []);

  const openFeedbackModal = useCallback((initialLocation?: string) => {
    if (initialLocation) {
      setFeedbackInitialLocation(initialLocation);
    } else {
      setFeedbackInitialLocation('');
    }
    setIsFeedbackOpen(true);
  }, []);

  const [syncIntervalSeconds, setSyncIntervalSecondsState] = useState<number>(() => {
    const saved = localStorage.getItem('bete_finder_sync_interval');
    if (saved) {
      const val = parseInt(saved, 10);
      if (!isNaN(val) && val >= 1 && val <= 300) return val;
    }
    return 3;
  });

  const setSyncIntervalSeconds = useCallback((sec: number) => {
    const validSec = Math.max(1, Math.min(300, sec));
    setSyncIntervalSecondsState(validSec);
    localStorage.setItem('bete_finder_sync_interval', validSec.toString());
  }, []);

  // Database Synchronization Function - sends all local storage to DB and updates state
  const syncWithDatabase = useCallback(async (): Promise<{ success: boolean; message: string; connectedNeon: boolean }> => {
    setIsDatabaseSyncing(true);
    try {
      const syncRes = await pushAllLocalStorageToDatabase();

      if (syncRes.success && syncRes.data) {
        const remote = syncRes.data;
        setIsNeonConnected(Boolean(syncRes.connectedNeon));
        setLastDbSyncTimestamp(Date.now());

        // Update properties
        if (Array.isArray(remote.properties)) {
          setProperties(remote.properties);
        }

        // Update payment requests
        if (Array.isArray(remote.paymentRequests)) {
          setPaymentRequests(remote.paymentRequests);
        }

        // Update settings
        if (remote.telebirrSettings) {
          setTelebirrSettings(remote.telebirrSettings);
        }

        if (Array.isArray(remote.plans) && remote.plans.length > 0) {
          setPlans(remote.plans);
        }

        setIsDatabaseSyncing(false);
        return {
          success: true,
          message: syncRes.connectedNeon 
            ? 'All local data safely sent and synchronized with Neon Database & Server Store.' 
            : 'All local data safely sent and synchronized with Persistent Server Database.',
          connectedNeon: Boolean(syncRes.connectedNeon)
        };
      }

      setIsDatabaseSyncing(false);
      return {
        success: false,
        message: syncRes.message || 'Database sync standby.',
        connectedNeon: false
      };
    } catch (err: any) {
      setIsDatabaseSyncing(false);
      return { success: false, message: err?.message || 'Database connection error.', connectedNeon: false };
    }
  }, []);

  // Initial Sync and Real-Time Multi-Device Periodic Poll (based on user configured interval and on window focus/visibility)
  useEffect(() => {
    syncWithDatabase();

    const handleSyncTrigger = () => {
      syncWithDatabase();
    };

    window.addEventListener('focus', handleSyncTrigger);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncWithDatabase();
      }
    });
    window.addEventListener('online', handleSyncTrigger);

    const interval = setInterval(syncWithDatabase, syncIntervalSeconds * 1000);

    return () => {
      window.removeEventListener('focus', handleSyncTrigger);
      window.removeEventListener('online', handleSyncTrigger);
      clearInterval(interval);
    };
  }, [syncWithDatabase, syncIntervalSeconds]);

  // Persist properties locally
  useEffect(() => {
    localStorage.setItem('bete_finder_properties', JSON.stringify(properties));
  }, [properties]);

  // Persist plans locally
  useEffect(() => {
    localStorage.setItem('bete_finder_plans', JSON.stringify(plans));
  }, [plans]);

  // Persist telebirr settings locally
  useEffect(() => {
    localStorage.setItem('bete_finder_telebirr_settings', JSON.stringify(telebirrSettings));
  }, [telebirrSettings]);

  // Persist payment requests locally
  useEffect(() => {
    localStorage.setItem('bete_finder_payment_requests', JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  const updateFilter = <K extends keyof PropertyFilterState>(key: K, value: PropertyFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTER);
  };

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      if (activeListingType !== 'all' && prop.listingType !== activeListingType) return false;
      if (filters.listingType !== 'all' && prop.listingType !== filters.listingType) return false;
      if (filters.propertyType !== 'all' && prop.propertyType !== filters.propertyType) return false;
      if (filters.city !== 'all' && (prop.city || '').toLowerCase() !== (filters.city || '').toLowerCase()) return false;
      if (filters.subcity !== 'all' && (prop.subcity || '').toLowerCase() !== (filters.subcity || '').toLowerCase()) return false;
      if (prop.price < filters.minPrice || prop.price > filters.maxPrice) return false;

      if (filters.minBedrooms !== 'all') {
        const minBeds = typeof filters.minBedrooms === 'number' ? filters.minBedrooms : parseInt(filters.minBedrooms);
        if (prop.bedrooms < minBeds) return false;
      }

      if (filters.minBathrooms !== 'all') {
        const minBaths = typeof filters.minBathrooms === 'number' ? filters.minBathrooms : parseInt(filters.minBathrooms);
        if (prop.bathrooms < minBaths) return false;
      }

      if (filters.isFurnished !== undefined && prop.isFurnished !== filters.isFurnished) return false;
      if (filters.finishingStatus && filters.finishingStatus !== 'all' && prop.finishingStatus !== filters.finishingStatus) return false;
      if (filters.verifiedOnly && !prop.isVerified) return false;

      if (filters.selectedAmenities.length > 0) {
        const hasAllAmenities = filters.selectedAmenities.every(a => prop.amenities.includes(a));
        if (!hasAllAmenities) return false;
      }

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = (prop.title || '').toLowerCase().includes(q) || (prop.titleAm || '').toLowerCase().includes(q);
        const matchDesc = (prop.description || '').toLowerCase().includes(q) || (prop.descriptionAm || '').toLowerCase().includes(q);
        const matchLoc = (prop.city || '').toLowerCase().includes(q) || (prop.subcity || '').toLowerCase().includes(q) || (prop.neighborhood || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. Plan Priority Boost (VIP = 3, Premium = 2, Basic = 1, Free = 0)
      const aPlanScore = a.payPlan === 'vip' ? 3 : a.payPlan === 'premium' ? 2 : a.payPlan === 'basic' ? 1 : 0;
      const bPlanScore = b.payPlan === 'vip' ? 3 : b.payPlan === 'premium' ? 2 : b.payPlan === 'basic' ? 1 : 0;
      if (aPlanScore !== bPlanScore) {
        return bPlanScore - aPlanScore;
      }

      // 2. Featured spots
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'popular':
          return b.viewsCount - a.viewsCount;
        case 'area':
          return b.areaSqm - a.areaSqm;
        default:
          return 0;
      }
    });
  }, [properties, filters, activeListingType]);

  const featuredProperties = useMemo(() => {
    return properties.filter(p => p.isFeatured);
  }, [properties]);

  const latestProperties = useMemo(() => {
    return [...properties].sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()).slice(0, 6);
  }, [properties]);

  const toggleFavorite = (propertyId: string) => {
    if (!user) return;
    const isFav = (user.savedPropertyIds || []).includes(propertyId);
    const newSaved = isFav 
      ? (user.savedPropertyIds || []).filter(id => id !== propertyId)
      : [...(user.savedPropertyIds || []), propertyId];

    updateUser({ savedPropertyIds: newSaved });

    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        return {
          ...p,
          favoritesCount: isFav ? Math.max(0, p.favoritesCount - 1) : p.favoritesCount + 1
        };
      }
      return p;
    }));
  };

  const isFavorite = (propertyId: string): boolean => {
    if (!user) return false;
    return (user.savedPropertyIds || []).includes(propertyId);
  };

  const savedProperties = useMemo(() => {
    if (!user) return [];
    return properties.filter(p => (user.savedPropertyIds || []).includes(p.id));
  }, [properties, user]);

  const userPostedProperties = useMemo(() => {
    if (!user) return [];
    return properties.filter(p => {
      const pEmail = (p.owner?.email || '').trim().toLowerCase();
      const uEmail = (user.email || '').trim().toLowerCase();
      return (p.owner?.id && user.id && p.owner.id === user.id) || (pEmail && uEmail && pEmail === uEmail);
    });
  }, [properties, user]);

  // Add Property (Syncs to DB)
  const addProperty = (propertyData: Omit<Property, 'id' | 'postedDate' | 'viewsCount' | 'favoritesCount'>): Property => {
    const isVipOrPremium = user?.activePlan === 'vip' || user?.activePlan === 'premium';
    const planName = user?.activePlan === 'vip' 
      ? 'VIP Spotlight Plan' 
      : user?.activePlan === 'premium' 
      ? 'Premium 24hr Auto-Renew' 
      : user?.activePlan === 'basic' 
      ? 'Basic Listing' 
      : 'Free Plan';

    const newProperty: Property = {
      ...propertyData,
      id: `prop-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      favoritesCount: 0,
      isVerified: user?.role === 'owner' || user?.role === 'admin' || isVipOrPremium,
      isFeatured: isVipOrPremium || propertyData.isFeatured || false,
      payPlan: (user?.activePlan as any) || 'free',
      payPlanName: planName
    };

    setProperties(prev => [newProperty, ...prev]);

    // Push to backend database
    fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProperty)
    }).catch(console.error);

    queueDatabaseSync(200);

    if (user) {
      updateUser({
        postedPropertyIds: [...(user.postedPropertyIds || []), newProperty.id]
      });
    }

    return newProperty;
  };

  // Delete Property (Syncs to DB)
  const deleteProperty = (propertyId: string) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(null);
    }
    fetch(`/api/properties/${propertyId}`, { method: 'DELETE' }).catch(console.error);
    queueDatabaseSync(200);
  };

  // Erase / Clear All Properties (Syncs to DB)
  const clearAllProperties = async (): Promise<boolean> => {
    setProperties([]);
    setSelectedProperty(null);
    try {
      localStorage.setItem('bete_finder_properties', JSON.stringify([]));
    } catch {}

    try {
      const res = await fetch('/api/properties', { method: 'DELETE' });
      const data = await res.json();
      await pushAllLocalStorageToDatabase(true);
      return Boolean(data && data.success);
    } catch (err) {
      console.error('[Properties] Error clearing all properties:', err);
      // Fallback try clear-all POST
      try {
        const fallbackRes = await fetch('/api/properties/clear-all', { method: 'POST' });
        const fallbackData = await fallbackRes.json();
        await pushAllLocalStorageToDatabase(true);
        return Boolean(fallbackData && fallbackData.success);
      } catch {
        return true;
      }
    }
  };

  // Update Property (Syncs to DB)
  const updateProperty = (propertyId: string, updates: Partial<Property>) => {
    let updatedObj: Property | null = null;
    setProperties(prev => prev.map(p => {
      if (p.id === propertyId) {
        updatedObj = { ...p, ...updates };
        return updatedObj;
      }
      return p;
    }));

    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? { ...prev, ...updates } : null);
    }

    if (updatedObj) {
      fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObj)
      }).catch(console.error);
      queueDatabaseSync(300);
    }
  };

  const verifyProperty = (propertyId: string, isVerified: boolean) => {
    updateProperty(propertyId, { isVerified });
  };

  const updatePlanPrice = (planId: string, newPrice: number) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return { ...p, price: newPrice };
      }
      return p;
    }));
  };

  const updatePlan = (planId: string, updates: Partial<ListingPlan>) => {
    setPlans(prev => prev.map(p => {
      if (p.id === planId) {
        return { ...p, ...updates };
      }
      return p;
    }));
  };

  const updateTelebirrSettings = (accountNumber: string, accountName: string) => {
    const updated = {
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim()
    };
    setTelebirrSettings(updated);
    fetch('/api/db/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telebirrSettings: updated })
    }).catch(console.error);
  };

  const boostProperty = (propertyId: string) => {
    updateProperty(propertyId, { isFeatured: true });
  };

  const bookTour = (propertyId: string, date: string, time: string, notes?: string): boolean => {
    if (!user) return false;
    const targetProp = properties.find(p => p.id === propertyId);
    if (!targetProp) return false;

    const newBooking = {
      id: `tour-${Date.now()}`,
      propertyId,
      propertyTitle: targetProp.title,
      propertyImage: targetProp.images[0] || '',
      date,
      time,
      status: 'pending' as const,
      notes
    };

    updateUser({
      toursBooked: [newBooking, ...(user.toursBooked || [])]
    });

    return true;
  };

  // Submit payment request (Syncs to DB)
  const submitPaymentRequest = (data: {
    userName: string;
    userPhone: string;
    transactionRef: string;
    screenshotUrl?: string;
    plan: ListingPlan | null;
    durationMonths: number;
    totalAmount: number;
  }): PaymentRequest => {
    const newReq: PaymentRequest = {
      id: `pay-req-${Date.now()}`,
      userId: user?.id || `user-guest-${Date.now()}`,
      userName: data.userName,
      userEmail: user?.email || `${data.userName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      userPhone: data.userPhone,
      planId: (data.plan?.id as any) || (pendingPaymentPurpose === 'boost' ? 'boost' : 'premium'),
      planName: data.plan?.name || (pendingPaymentPurpose === 'boost' ? 'Featured Boost' : 'Premium Package'),
      durationMonths: data.durationMonths,
      totalAmount: data.totalAmount,
      transactionRef: data.transactionRef,
      screenshotUrl: data.screenshotUrl,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    setPaymentRequests(prev => [newReq, ...prev]);

    fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReq)
    }).catch(console.error);

    return newReq;
  };

  // Approve payment request (Syncs to DB)
  const approvePaymentRequest = (requestId: string) => {
    const req = paymentRequests.find(r => r.id === requestId);
    if (!req) return;

    const durationDays = req.durationMonths * 30;
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    setPaymentRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Owner (Kaleb Bereket)',
          expiresAt
        };
      }
      return r;
    }));

    const resolvedPlanId = req.planId === 'boost' ? 'premium' : req.planId;
    const isVip = resolvedPlanId === 'vip';
    const isPremium = resolvedPlanId === 'premium';
    const isBasic = resolvedPlanId === 'basic';

    const reqUserEmail = (req.userEmail || '').trim().toLowerCase();
    const currUserEmail = (user?.email || '').trim().toLowerCase();

    if (user && (user.id === req.userId || (reqUserEmail && currUserEmail && reqUserEmail === currUserEmail))) {
      updateUser({
        activePlan: (isVip ? 'vip' : isPremium ? 'premium' : 'basic') as any,
        planExpiresAt: expiresAt,
        planStartedAt: new Date().toISOString()
      });
    }

    setProperties(prev => prev.map(p => {
      const ownerEmail = (p.owner?.email || '').trim().toLowerCase();
      if ((ownerEmail && reqUserEmail && ownerEmail === reqUserEmail) || (user && p.owner?.id === req.userId)) {
        return {
          ...p,
          isVerified: true,
          isFeatured: isVip || isPremium,
          payPlan: (isVip ? 'vip' : isPremium ? 'premium' : 'basic') as any,
          payPlanName: req.planName || (isVip ? 'VIP TOP+ Package' : isPremium ? 'Premium Package' : 'Basic Package')
        };
      }
      return p;
    }));

    fetch('/api/payments/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId,
        durationMonths: req.durationMonths,
        planId: req.planId,
        planName: req.planName,
        userEmail: req.userEmail
      })
    }).catch(console.error);
  };

  // Reject payment request (Syncs to DB)
  const rejectPaymentRequest = (requestId: string, reason: string) => {
    setPaymentRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'rejected',
          rejectionReason: reason.trim() || 'Payment details could not be verified on Telebirr account.',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Owner (Kaleb Bereket)'
        };
      }
      return r;
    }));

    fetch('/api/payments/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, reason })
    }).catch(console.error);
  };

  // Delete payment request (Syncs to DB)
  const deletePaymentRequest = (requestId: string) => {
    setPaymentRequests(prev => prev.filter(r => r.id !== requestId));
    fetch(`/api/payments/${requestId}`, { method: 'DELETE' }).catch(console.error);
  };

  // Automated Verification with links.et
  const verifyPaymentWithLinksEt = async (params: {
    url?: string;
    reference?: string;
    userName?: string;
    userPhone?: string;
    plan?: ListingPlan | null;
    durationMonths?: number;
    totalAmount?: number;
    autoActivate?: boolean;
    requestId?: string;
  }): Promise<{ success: boolean; verified: boolean; message: string; receipt?: any; raw?: any }> => {
    try {
      const duration = params.durationMonths || 1;
      const targetPlan = params.plan || selectedPlan;
      const planPrice = targetPlan ? targetPlan.price * duration : (params.totalAmount || 299);

      const response = await fetch('/api/links-et/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: params.url,
          reference: params.reference,
          userEmail: user?.email,
          userName: params.userName || user?.name,
          userPhone: params.userPhone || user?.phone,
          planId: targetPlan?.id || (pendingPaymentPurpose === 'boost' ? 'premium' : 'basic'),
          planName: targetPlan?.name || (pendingPaymentPurpose === 'boost' ? 'Featured Boost' : 'Basic Package'),
          durationMonths: duration,
          totalAmount: params.totalAmount || planPrice,
          autoActivate: params.autoActivate ?? true
        })
      });

      const data = await response.json();

      if (data.success && data.verified) {
        if (params.autoActivate ?? true) {
          const rawPlanId = targetPlan?.id as string | undefined;
          const resolvedPlanId = (rawPlanId === 'boost' ? 'premium' : rawPlanId) || 'basic';
          const isVip = resolvedPlanId === 'vip';
          const isPremium = resolvedPlanId === 'premium';
          const durationDays = duration * 30;
          const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

          if (user) {
            updateUser({
              role: user.role === 'tenant' ? 'landlord' : user.role,
              activePlan: (isVip ? 'vip' : isPremium ? 'premium' : 'basic') as any,
              planExpiresAt: expiresAt,
              planStartedAt: new Date().toISOString()
            });
          }

          setProperties(prev => prev.map(p => {
            if (user && p.owner?.email?.toLowerCase() === user.email?.toLowerCase()) {
              return {
                ...p,
                isVerified: true,
                isFeatured: isVip || isPremium,
                payPlan: (isVip ? 'vip' : isPremium ? 'premium' : 'basic') as any,
                payPlanName: targetPlan?.name || (isVip ? 'VIP TOP+ Package' : isPremium ? 'Premium Package' : 'Basic Package')
              };
            }
            return p;
          }));

          // Add or update payment request in state as verified
          const newVerifiedReq: PaymentRequest = {
            id: `links-et-${Date.now()}`,
            userId: user?.id || `user-${Date.now()}`,
            userName: data.receipt?.payerName || params.userName || user?.name || 'Customer',
            userEmail: user?.email || '',
            userPhone: params.userPhone || user?.phone || '',
            planId: (targetPlan?.id as any) || 'premium',
            planName: targetPlan?.name || 'Premium Package',
            durationMonths: duration,
            totalAmount: params.totalAmount || planPrice,
            transactionRef: data.receipt?.receiptNo || params.reference || 'VERIFIED',
            submittedAt: new Date().toISOString(),
            status: 'approved',
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'links.et Automated Verifier',
            expiresAt,
            linksEtVerified: true,
            linksEtData: data.receipt
          };

          setPaymentRequests(prev => [
            newVerifiedReq, 
            ...prev.filter(r => r.transactionRef !== newVerifiedReq.transactionRef && (!params.requestId || r.id !== params.requestId))
          ]);
        }
      }

      return data;
    } catch (err: any) {
      return { 
        success: false, 
        verified: false, 
        message: err.message || 'Failed to connect to links.et verification service.' 
      };
    }
  };

  const userPaymentRequests = useMemo(() => {
    if (!user) return [];
    return paymentRequests.filter(r => {
      const rEmail = (r.userEmail || '').trim().toLowerCase();
      const uEmail = (user.email || '').trim().toLowerCase();
      return r.userId === user.id || (rEmail && uEmail && rEmail === uEmail);
    });
  }, [paymentRequests, user]);

  return (
    <PropertyContext.Provider
      value={{
        properties,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        filteredProperties,
        featuredProperties,
        latestProperties,
        selectedProperty,
        setSelectedProperty,
        currentView,
        setCurrentView,
        activeListingType,
        setActiveListingType,
        toggleFavorite,
        isFavorite,
        savedProperties,
        userPostedProperties,
        addProperty,
        deleteProperty,
        clearAllProperties,
        updateProperty,
        verifyProperty,
        bookTour,
        plans,
        updatePlanPrice,
        updatePlan,
        telebirrSettings,
        updateTelebirrSettings,
        selectedPlan,
        setSelectedPlan,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        pendingPaymentPurpose,
        setPendingPaymentPurpose,
        boostProperty,
        paymentRequests,
        submitPaymentRequest,
        approvePaymentRequest,
        rejectPaymentRequest,
        deletePaymentRequest,
        verifyPaymentWithLinksEt,
        userPaymentRequests,
        syncWithDatabase,
        isDatabaseSyncing,
        isNeonConnected,
        lastDbSyncTimestamp,
        syncIntervalSeconds,
        setSyncIntervalSeconds,
        isAIChatOpen,
        setIsAIChatOpen,
        aiInitialPrompt,
        setAiInitialPrompt,
        openAIChatWithPrompt,
        isFeedbackOpen,
        setIsFeedbackOpen,
        feedbackInitialLocation,
        setFeedbackInitialLocation,
        openFeedbackModal
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
};
