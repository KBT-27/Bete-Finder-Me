export type PropertyType = 
  | 'Apartment'
  | 'Villa'
  | 'Condominium'
  | 'Floor House'
  | 'Studio'
  | 'Commercial'
  | 'Townhouse'
  | 'Guest House'
  | 'Land';

export type ListingType = 'rent' | 'sale';

export type UserRole = 'guest' | 'tenant' | 'landlord' | 'admin' | 'owner';

export interface PropertyAmenity {
  id: string;
  name: string;
  amName: string;
  icon: string;
}

export type PropertyAvailabilityStatus = 'available' | 'rented' | 'sold';

export interface Property {
  id: string;
  title: string;
  titleAm: string;
  description: string;
  descriptionAm: string;
  price: number;
  pricePeriod?: 'month' | 'year' | 'total';
  currency: 'ETB' | 'USD';
  listingType: ListingType;
  propertyType: PropertyType;
  availabilityStatus?: PropertyAvailabilityStatus; // 'available' | 'rented' | 'sold'
  floorSize?: string; // e.g. G+1, G+2, G+3, G+4, G+5, G+6+
  finishingStatus?: 'finished' | 'unfinished'; // Finished or Unfinished
  city: string;
  subcity: string;
  neighborhood: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: number;
  floor?: number;
  totalFloors?: number;
  isFurnished: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  payPlan?: 'free' | 'basic' | 'premium' | 'vip' | 'standard';
  payPlanName?: string;
  images: string[];
  amenities: string[];
  postedDate: string;
  viewsCount: number;
  favoritesCount: number;
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
    role: 'landlord' | 'broker' | 'agency';
    isVerified: boolean;
    rating: number;
    avatar: string;
    telegram?: string;
    whatsapp?: string;
  };
  hasBackupGenerator?: boolean;
  hasWaterTank?: boolean;
  hasSecurity?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BeteAISearchContext {
  targetLocation?: string;
  nearbyLandmarks?: string;
  propertyType?: PropertyType | 'all' | string;
  listingIntent?: ListingType | 'all' | string;
  maxPriceLimit?: number | null;
  minPriceLimit?: number | null;
  bedroomCount?: number | 'all' | null;
  city?: string;
  subcity?: string;
  neighborhood?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface BeteAIMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  userResponsePart?: string;
  mapContextPart?: string;
  searchContext?: BeteAISearchContext;
  timestamp: number;
  feedback?: 'up' | 'down';
  feedbackTimestamp?: number;
}

export interface TelebirrSettings {
  accountNumber: string;
  accountName: string;
}

export interface PropertyFilterState {
  searchQuery: string;
  listingType: ListingType | 'all';
  propertyType: PropertyType | 'all';
  city: string;
  subcity: string;
  minPrice: number;
  maxPrice: number;
  minBedrooms: number | 'all';
  minBathrooms: number | 'all';
  isFurnished?: boolean;
  finishingStatus?: 'finished' | 'unfinished' | 'all';
  verifiedOnly: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'area';
  selectedAmenities: string[];
}

export interface PasswordResetRequest {
  id: string;
  email: string;
  token: string;
  code?: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  provider?: 'local' | 'google';
  savedPropertyIds: string[];
  postedPropertyIds: string[];
  toursBooked: TourBooking[];
  activePlan?: 'basic' | 'premium' | 'vip' | 'free' | 'standard';
  planExpiresAt?: string;
  planStartedAt?: string;
  registeredAt?: string;
  lastLogin?: string;
  lastActiveAt?: string;
  bio?: string;
}

export interface TourBooking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyImage: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface EthiopianLocation {
  city: string;
  cityAm?: string;
  region: string;
  regionAm?: string;
  tagline?: string;
  taglineAm?: string;
  subcities: string[];
  popularNeighborhoods: string[];
  image: string;
  propertyCount: number;
  isMajorHub?: boolean;
}

export interface ListingPlan {
  id: 'basic' | 'premium' | 'vip' | 'free' | 'standard';
  name: string;
  nameAm: string;
  price: number; // in ETB
  durationDays: number;
  features: string[];
  featuresAm: string[];
  isPopular?: boolean;
  multiplierText?: string;
  multiplierTextAm?: string;
  renewInterval?: string;
  renewIntervalAm?: string;
  topBadgeCount?: string;
  topBadgeCountAm?: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  planId: 'basic' | 'premium' | 'vip' | 'free' | 'standard' | 'boost';
  planName: string;
  durationMonths: number;
  totalAmount: number;
  transactionRef: string;
  screenshotUrl?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  expiresAt?: string;
}

export interface AdminPermissions {
  isSuspended: boolean;
  canApprovePayments: boolean;
  canDeleteProperties: boolean;
  canVerifyProperties: boolean;
  canViewUserDatabase: boolean;
  canExportBackups: boolean;
  canBroadcastNotices: boolean;
}

export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'full_admin' | 'payment_officer' | 'listing_moderator' | 'regional_inspector';
  assignedSubcity: string;
  permissions: AdminPermissions;
  status: 'active' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  category: 'payment' | 'property' | 'user' | 'security' | 'system';
  severity: 'info' | 'warning' | 'success' | 'danger';
}

export interface AdminControllerConfig {
  firstAdminPermissions?: AdminPermissions;
  adminPermissions: AdminPermissions;
  adminBroadcastNotice: string;
  subAdmins: SubAdmin[];
  auditLogs: AdminAuditLog[];
}

export interface OwnerFeedback {
  id: string;
  name: string;
  email: string;
  phone?: string;
  category: 'rental' | 'sale' | 'general' | 'platform' | 'bug' | 'support' | 'other';
  rating?: number; // 1-5
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  replyNotes?: string;
  createdAt: string;
  userAgent?: string;
}

export interface AdminTabVisibility {
  payments: boolean;
  properties: boolean;
  paid_subscribers: boolean;
  database_users: boolean;
  admin_controller: boolean;
  pricing_settings: boolean;
  telegram_channel: boolean;
  telegram_bot: boolean;
  feedback: boolean;
  security: boolean;
  sync: boolean;
}

export interface PublicMenuVisibility {
  home: boolean;
  rent: boolean;
  sale: boolean;
  pricing: boolean;
  post: boolean;
  ai_assistant: boolean;
  feedback_button: boolean;
  favorites: boolean;
}

export interface MenuVisibilityConfig {
  adminTabs: AdminTabVisibility;
  publicMenus: PublicMenuVisibility;
  lastUpdated?: string;
}
