import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Property, PropertyFilterState, ListingPlan, PaymentRequest, TelebirrSettings } from '../types';
import { INITIAL_PROPERTIES, LISTING_PLANS } from '../data/initialProperties';
import { useAuth } from './AuthContext';

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
  verifiedOnly: false,
  sortBy: 'newest',
  selectedAmenities: []
};

const INITIAL_PAYMENT_REQUESTS: PaymentRequest[] = [
  {
    id: 'pay-req-101',
    userId: 'user-sample-1',
    userName: 'Kassahun Bekele',
    userEmail: 'kassahun.b@gmail.com',
    userPhone: '0911223344',
    planId: 'vip',
    planName: 'VIP Package (30 Days Spotlight)',
    durationMonths: 1,
    totalAmount: 999,
    transactionRef: 'TB9834219082',
    screenshotUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'pending'
  },
  {
    id: 'pay-req-102',
    userId: 'user-sample-2',
    userName: 'Genet Assefa',
    userEmail: 'genet.assefa@gmail.com',
    userPhone: '0922446688',
    planId: 'premium',
    planName: 'Premium Package (24hr Auto-Renew)',
    durationMonths: 2,
    totalAmount: 1198,
    transactionRef: 'TB7712390441',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'approved',
    reviewedAt: new Date(Date.now() - 80000000).toISOString(),
    reviewedBy: 'Owner (Kaleb Bereket)',
    expiresAt: new Date(Date.now() + 86400000 * 59).toISOString()
  }
];

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
  currentView: 'home' | 'properties' | 'details' | 'post' | 'pricing' | 'dashboard';
  setCurrentView: (view: 'home' | 'properties' | 'details' | 'post' | 'pricing' | 'dashboard') => void;
  activeListingType: 'all' | 'rent' | 'sale';
  setActiveListingType: (type: 'all' | 'rent' | 'sale') => void;
  toggleFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  savedProperties: Property[];
  userPostedProperties: Property[];
  addProperty: (propertyData: Omit<Property, 'id' | 'postedDate' | 'viewsCount' | 'favoritesCount'>) => Property;
  deleteProperty: (propertyId: string) => void;
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
  userPaymentRequests: PaymentRequest[];
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
        return JSON.parse(saved);
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
        return { accountNumber: '0995406697', accountName: 'Desalegn Guta' };
      }
    }
    return { accountNumber: '0995406697', accountName: 'Desalegn Guta' };
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
  const [currentView, setCurrentView] = useState<'home' | 'properties' | 'details' | 'post' | 'pricing' | 'dashboard'>('home');
  const [activeListingType, setActiveListingType] = useState<'all' | 'rent' | 'sale'>('all');
  const [selectedPlan, setSelectedPlan] = useState<ListingPlan | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPaymentPurpose, setPendingPaymentPurpose] = useState<'plan' | 'boost' | null>(null);

  useEffect(() => {
    localStorage.setItem('bete_finder_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('bete_finder_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('bete_finder_telebirr_settings', JSON.stringify(telebirrSettings));
  }, [telebirrSettings]);

  useEffect(() => {
    localStorage.setItem('bete_finder_payment_requests', JSON.stringify(paymentRequests));
  }, [paymentRequests]);

  const updateTelebirrSettings = (accountNumber: string, accountName: string) => {
    setTelebirrSettings({
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim()
    });
  };

  const updatePlanPrice = (planId: string, newPrice: number) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, price: Number(newPrice) } : p));
  };

  const updatePlan = (planId: string, updates: Partial<ListingPlan>) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...updates } : p));
  };

  const updateFilter = <K extends keyof PropertyFilterState>(key: K, value: PropertyFilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTER);
  };

  const isStaff = user?.role === 'admin' || user?.role === 'owner';

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      // If not staff, only show verified properties OR the properties owned by this user
      if (!isStaff) {
        const isOwnerOfProp = user && (prop.owner.id === user.id || prop.owner.email.toLowerCase() === user.email.toLowerCase());
        if (!prop.isVerified && !isOwnerOfProp) {
          return false;
        }
      }

      // Search query in title, desc, neighborhood, subcity, city
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesTitle = prop.title.toLowerCase().includes(query);
        const matchesTitleAm = prop.titleAm.toLowerCase().includes(query);
        const matchesDesc = prop.description.toLowerCase().includes(query);
        const matchesNeighbor = prop.neighborhood.toLowerCase().includes(query);
        const matchesSubcity = prop.subcity.toLowerCase().includes(query);
        const matchesCity = prop.city.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTitleAm && !matchesDesc && !matchesNeighbor && !matchesSubcity && !matchesCity) {
          return false;
        }
      }

      // Listing Type (Rent vs Sale)
      const effectiveType = filters.listingType !== 'all' ? filters.listingType : activeListingType !== 'all' ? activeListingType : 'all';
      if (effectiveType !== 'all' && prop.listingType !== effectiveType) {
        return false;
      }

      // Property Type
      if (filters.propertyType !== 'all' && prop.propertyType !== filters.propertyType) {
        return false;
      }

      // City
      if (filters.city !== 'all' && prop.city !== filters.city) {
        return false;
      }

      // Subcity
      if (filters.subcity !== 'all' && prop.subcity !== filters.subcity) {
        return false;
      }

      // Price Range
      if (filters.minPrice > 0 && prop.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice < 2000000 && prop.price > filters.maxPrice) {
        return false;
      }

      // Bedrooms
      if (filters.minBedrooms !== 'all') {
        const minBeds = Number(filters.minBedrooms);
        if (prop.bedrooms < minBeds) {
          return false;
        }
      }

      // Bathrooms
      if (filters.minBathrooms !== 'all') {
        const minBaths = Number(filters.minBathrooms);
        if (prop.bathrooms < minBaths) {
          return false;
        }
      }

      // Verified only
      if (filters.verifiedOnly && !prop.isVerified) {
        return false;
      }

      // Amenities filter
      if (filters.selectedAmenities.length > 0) {
        const hasAllSelected = filters.selectedAmenities.every(amenityId => 
          prop.amenities.includes(amenityId)
        );
        if (!hasAllSelected) return false;
      }

      return true;
    }).sort((a, b) => {
      // VIP / Premium boosted properties prioritize on top
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'popular') return b.viewsCount - a.viewsCount;
      if (filters.sortBy === 'area') return b.areaSqm - a.areaSqm;
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });
  }, [properties, filters, activeListingType, isStaff, user]);

  const featuredProperties = useMemo(() => {
    return properties.filter(p => p.isFeatured && (p.isVerified || isStaff));
  }, [properties, isStaff]);

  const latestProperties = useMemo(() => {
    return properties
      .filter(p => p.isVerified || isStaff)
      .sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime())
      .slice(0, 4);
  }, [properties, isStaff]);

  const toggleFavorite = (propertyId: string) => {
    if (!user) return;
    const isFav = user.savedPropertyIds.includes(propertyId);
    const updatedIds = isFav
      ? user.savedPropertyIds.filter(id => id !== propertyId)
      : [...user.savedPropertyIds, propertyId];

    updateUser({ savedPropertyIds: updatedIds });

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

  const isFavorite = (propertyId: string) => {
    return user ? user.savedPropertyIds.includes(propertyId) : false;
  };

  const savedProperties = useMemo(() => {
    if (!user) return [];
    return properties.filter(p => user.savedPropertyIds.includes(p.id));
  }, [properties, user]);

  const userPostedProperties = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'owner') return properties;
    return properties.filter(p => p.owner.id === user.id || user.postedPropertyIds.includes(p.id) || p.owner.email.toLowerCase() === user.email.toLowerCase());
  }, [properties, user]);

  const addProperty = (data: Omit<Property, 'id' | 'postedDate' | 'viewsCount' | 'favoritesCount'>) => {
    // When a regular person posts a house, isVerified will be false until verified by the owner!
    const isUserStaff = user?.role === 'admin' || user?.role === 'owner';
    const activePlan = user?.activePlan;
    const activePlanObj = plans.find(p => p.id === activePlan);

    const newProp: Property = {
      ...data,
      id: `prop-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      viewsCount: 1,
      favoritesCount: 0,
      isVerified: isUserStaff ? (data.isVerified ?? true) : false,
      isFeatured: isUserStaff ? (data.isFeatured ?? false) : (activePlan === 'vip' || activePlan === 'premium'),
      payPlan: activePlan === 'basic' || activePlan === 'premium' || activePlan === 'vip' ? activePlan : undefined,
      payPlanName: activePlanObj?.name || (activePlan ? `${activePlan.toUpperCase()} Plan` : undefined)
    };

    setProperties(prev => [newProp, ...prev]);

    if (user) {
      updateUser({
        postedPropertyIds: [...user.postedPropertyIds, newProp.id]
      });
    }

    return newProp;
  };

  const deleteProperty = (propertyId: string) => {
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(null);
      setCurrentView('properties');
    }
  };

  const updateProperty = (propertyId: string, updates: Partial<Property>) => {
    setProperties(prev => prev.map(p => p.id === propertyId ? { ...p, ...updates } : p));
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const verifyProperty = (propertyId: string, isVerified: boolean) => {
    updateProperty(propertyId, { isVerified });
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
      toursBooked: [newBooking, ...user.toursBooked]
    });

    return true;
  };

  // Submit payment request (Sends directly to Owner)
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
    return newReq;
  };

  // Approve payment request (Owner accepts -> user gets package + instruction)
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

    // If target user is the active logged in user, activate their plan
    if (user && (user.id === req.userId || user.email.toLowerCase() === req.userEmail.toLowerCase())) {
      updateUser({
        activePlan: resolvedPlanId as any,
        planExpiresAt: expiresAt,
        planStartedAt: new Date().toISOString()
      });
    }

    // Attach pay plan to the properties posted by this user and auto-verify + boost!
    setProperties(prev => prev.map(p => {
      if (p.owner.email.toLowerCase() === req.userEmail.toLowerCase() || (user && p.owner.id === req.userId)) {
        return {
          ...p,
          isVerified: true,
          isFeatured: req.planId === 'vip' || req.planId === 'premium' || req.planId === 'boost',
          payPlan: (resolvedPlanId === 'basic' || resolvedPlanId === 'premium' || resolvedPlanId === 'vip') ? resolvedPlanId : 'premium',
          payPlanName: req.planName
        };
      }
      return p;
    }));
  };

  // Reject payment request (Owner writes reason)
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
  };

  // Delete payment request/approval
  const deletePaymentRequest = (requestId: string) => {
    setPaymentRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const userPaymentRequests = useMemo(() => {
    if (!user) return [];
    return paymentRequests.filter(r => r.userId === user.id || r.userEmail.toLowerCase() === user.email.toLowerCase());
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
        userPaymentRequests
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
