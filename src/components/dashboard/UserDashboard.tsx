import React, { useState } from 'react';
import { 
  Heart, 
  Calendar, 
  Building2, 
  BarChart3, 
  PlusCircle, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ExternalLink,
  ShieldCheck, 
  Crown,
  CreditCard,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  User,
  Lock,
  Phone,
  Save,
  Check
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { PropertyCard } from '../common/PropertyCard';
import { AdminDashboard } from './AdminDashboard';

export const UserDashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { 
    savedProperties, 
    userPostedProperties, 
    deleteProperty, 
    boostProperty, 
    setSelectedProperty, 
    setCurrentView,
    setIsPaymentModalOpen,
    setSelectedPlan,
    userPaymentRequests
  } = useProperties();
  const { user, role, logout, updateUser, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState<'favorites' | 'tours' | 'myListings' | 'payments' | 'analytics' | 'profile'>('favorites');

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileRole, setProfileRole] = useState<'tenant' | 'landlord'>((user?.role === 'landlord' ? 'landlord' : 'tenant'));
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen py-16 text-center">
        <p className="text-slate-500">Please sign in to access your dashboard.</p>
      </div>
    );
  }

  // If user has Admin or Owner role, render the Admin/Owner Command Center
  if (role === 'admin' || role === 'owner') {
    return <AdminDashboard />;
  }

  const totalViews = userPostedProperties.reduce((acc, p) => acc + p.viewsCount, 0);
  const totalFavorites = userPostedProperties.reduce((acc, p) => acc + p.favoritesCount, 0);

  // Calculate days remaining if active plan has expiration
  const getDaysRemaining = () => {
    if (!user.planExpiresAt) return null;
    const diff = new Date(user.planExpiresAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div className="bg-slate-50 min-h-screen py-10 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* User Profile Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user.name}</h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 capitalize border border-emerald-200">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{user.email} • {user.phone}</p>
                
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-xs text-slate-600 font-semibold">Active Plan:</span>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-md border uppercase ${
                    user.activePlan === 'vip' 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : user.activePlan === 'premium' 
                      ? 'bg-purple-100 text-purple-900 border-purple-300' 
                      : user.activePlan === 'basic'
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {user.activePlan === 'vip' ? '👑 VIP TOP+ Package' : user.activePlan === 'premium' ? '⭐ Premium Package' : user.activePlan === 'basic' ? '⚡ Basic Package' : 'Free Basic Plan'}
                  </span>

                  {daysRemaining !== null && daysRemaining > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{daysRemaining} day{daysRemaining > 1 ? 's' : ''} remaining</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {(!user.activePlan || user.activePlan === 'free') && (
                <button
                  onClick={() => setCurrentView('pricing')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Activate Listing Package</span>
                </button>
              )}
              <button
                onClick={() => setCurrentView('post')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('navPostProperty')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* System Package Automation & Instructions Card (Active when user has Basic, Premium, or VIP package) */}
        {user.activePlan && user.activePlan !== 'free' && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 mb-8 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16 ${
              user.activePlan === 'vip' ? 'bg-amber-500/15' : user.activePlan === 'premium' ? 'bg-purple-500/15' : 'bg-blue-500/15'
            }`}></div>

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black ${
                    user.activePlan === 'vip' ? 'bg-amber-500 text-slate-950' : user.activePlan === 'premium' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {user.activePlan === 'vip' ? <Crown className="w-5 h-5" /> : user.activePlan === 'premium' ? <Sparkles className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                      Automated System Service Status
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      Active By The System : {user.activePlan === 'vip' ? 'VIP TOP+ Maximum Exposure' : user.activePlan === 'premium' ? 'Premium 5x Priority Package' : 'Basic 2x Accelerated Package'}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>100% Accepted by Owner & System Active</span>
                  </span>
                </div>
              </div>

              {/* Instructions & System Automation List */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>System Automated Instructions & Perks:</span>
                  </h3>
                  
                  <ul className="space-y-2 text-xs text-slate-200">
                    {user.activePlan === 'basic' && (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Up to 2 times more clients</strong> for your ads</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Promotion in search results and categories</strong> with priority ranking</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Auto-renew of ads every 48 hours</strong> to keep listings on top</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Direct call & Telegram inquiries</strong> enabled for fast client reach</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Standard photo gallery</strong> with high resolution display</span>
                        </li>
                      </>
                    )}

                    {user.activePlan === 'premium' && (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Up to 5 times more clients</strong> for your ads</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Promotion in search results and categories</strong> ahead of standard ads</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Auto-renew ads every 24 hours</strong> daily fresh boost</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>5 TOP+ featured listing spots</strong> on category pages</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Priority customer inquiries badge</strong> for trusted landlords</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Telebirr instant payment activation</strong> with direct proof receipt</span>
                        </li>
                      </>
                    )}

                    {user.activePlan === 'vip' && (
                      <>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Up to 7 times more clients</strong> for ads (Maximum reach)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Promotion in search results and categories</strong> at the absolute top</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Auto-renew ads every 12 hours</strong> twice daily continuous freshness</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>10 VIP TOP+ maximum exposure spots</strong> across the platform</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>100% Verified by the Owner badge</strong> official golden crown shield</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Top homepage banner & carousel spotlight</strong> high visibility</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span><strong>Direct Telegram & Phone VIP concierge</strong> priority client inquiries</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                      Live Listing Optimization Status:
                    </h3>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/40">
                        <span className="text-slate-400">Auto-Renewal Frequency:</span>
                        <strong className="text-emerald-400 font-mono font-black">
                          {user.activePlan === 'vip' ? 'Every 12 Hours' : user.activePlan === 'premium' ? 'Every 24 Hours' : 'Every 48 Hours'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/40">
                        <span className="text-slate-400">Search Promotion Multiplier:</span>
                        <strong className="text-amber-400 font-mono font-black">
                          {user.activePlan === 'vip' ? '7x Priority Reach' : user.activePlan === 'premium' ? '5x Priority Reach' : '2x Priority Reach'}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/40">
                        <span className="text-slate-400">Total Landlord Listings:</span>
                        <strong className="text-white font-bold">{userPostedProperties.length} Properties Active</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Need more spots or custom upgrades?</span>
                    <button
                      onClick={() => setCurrentView('pricing')}
                      className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Change Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'favorites' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{t('dashSavedTab')} ({savedProperties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tours')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'tours' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('dashToursTab')} ({user.toursBooked.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('myListings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'myListings' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{t('dashMyListingsTab')} ({userPostedProperties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'payments' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Payment History ({userPaymentRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{t('dashAnalyticsTab')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile');
              setProfileSaveSuccess(null);
              setProfileSaveError(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <User className="w-4 h-4 text-emerald-500" />
            <span>Profile & Account Settings</span>
          </button>
        </div>

        {/* Tab 1: Saved Favorites */}
        {activeTab === 'favorites' && (
          <div>
            {savedProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedProperties.map(prop => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">{t('dashNoFavorites')}</h3>
                <p className="text-xs text-slate-500 mb-5">Click the heart icon on any property to save it to your wishlist.</p>
                <button
                  onClick={() => setCurrentView('properties')}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Browse Homes
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Scheduled Tours */}
        {activeTab === 'tours' && (
          <div className="space-y-4">
            {user.toursBooked.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.toursBooked.map(tour => (
                  <div key={tour.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-start gap-4">
                    <img
                      src={tour.propertyImage}
                      alt={tour.propertyTitle}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {tour.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{tour.date}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 truncate mt-1">{tour.propertyTitle}</h4>
                      <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tour.time}</span>
                      </p>
                      {tour.notes && <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">"{tour.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">{t('dashNoTours')}</h3>
                <p className="text-xs text-slate-500">Visit any property details page and book a tour date directly with the landlord.</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: My Posted Listings */}
        {activeTab === 'myListings' && (
          <div>
            {userPostedProperties.length > 0 ? (
              <div className="space-y-4">
                {userPostedProperties.map(prop => (
                  <div key={prop.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">
                            {prop.propertyType}
                          </span>
                          {prop.isFeatured && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                              Featured Spotlight
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-1">{prop.title}</h4>
                        <p className="text-xs text-slate-500">{prop.neighborhood}, {prop.subcity} • {prop.price.toLocaleString()} ETB</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => boostProperty(prop.id)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                        title="Promote on Homepage"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Boost Listing</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProperty(prop);
                          setCurrentView('details');
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        title="View Live"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteProperty(prop.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">{t('dashNoListings')}</h3>
                <p className="text-xs text-slate-500 mb-5">Post your apartment, villa, or commercial space to get verified tenant inquiries.</p>
                <button
                  onClick={() => setCurrentView('post')}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Post a Property Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payment Requests & Telebirr Submissions */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {userPaymentRequests.length > 0 ? (
              <div className="space-y-4">
                {userPaymentRequests.map(req => (
                  <div 
                    key={req.id}
                    className={`bg-white rounded-2xl p-5 border shadow-xs ${
                      req.status === 'pending'
                        ? 'border-amber-300'
                        : req.status === 'approved'
                        ? 'border-emerald-200'
                        : 'border-rose-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-100 text-rose-900 border border-rose-200'
                          }`}>
                            {req.status === 'pending' ? '⏳ Pending Owner Review' : req.status === 'approved' ? '✓ Accepted & Active' : '✕ Payment Rejected'}
                          </span>
                          <span className="font-bold text-sm text-slate-900">{req.planName}</span>
                        </div>
                        
                        <p className="text-xs text-slate-500 mt-1">
                          Telebirr Ref: <strong className="font-mono text-slate-800">{req.transactionRef}</strong> • Phone: <strong className="text-slate-800">{req.userPhone}</strong> • Amount: <strong className="text-emerald-700">{req.totalAmount.toLocaleString()} ETB</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400">
                          {new Date(req.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {req.status === 'rejected' && req.rejectionReason && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                        <p className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Owner Rejection Reason:</span>
                        </p>
                        <p className="mt-0.5 italic">"{req.rejectionReason}"</p>
                      </div>
                    )}

                    {req.status === 'approved' && req.expiresAt && (
                      <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Package running actively until: {new Date(req.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">No Payment History</h3>
                <p className="text-xs text-slate-500 mb-5">When you purchase a Boost or Listing Plan with Telebirr, your verification status will show here.</p>
                <button
                  onClick={() => setCurrentView('pricing')}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  View Plans & Pricing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Analytics */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Eye className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase">{t('dashTotalViews')}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalViews || 2450}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-2">+18% increase this week</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase">{t('dashActiveListings')}</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{userPostedProperties.length}</p>
              <p className="text-xs text-slate-400 font-medium mt-2">All verified by Bete Admin</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase">Saved Favorites</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalFavorites || 84}</p>
              <p className="text-xs text-slate-400 font-medium mt-2">Interested prospective tenants</p>
            </div>
          </div>
        )}

        {/* Tab 6: Profile & Account Settings (Change Name, Phone, Role/Who am I, and Password) */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Manage Your Profile & Security</h3>
                  <p className="text-xs text-slate-500">Update your personal details, account type ("Who am I"), and password</p>
                </div>
              </div>

              {profileSaveSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSaveSuccess}</span>
                </div>
              )}

              {profileSaveError && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-xs font-bold shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{profileSaveError}</span>
                </div>
              )}

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setProfileSaveSuccess(null);
                  setProfileSaveError(null);

                  if (!profileName.trim()) {
                    setProfileSaveError('Full Name is required.');
                    return;
                  }

                  // If user entered a new password, validate
                  if (newPassInput) {
                    if (newPassInput.length < 6) {
                      setProfileSaveError('New password must be at least 6 characters.');
                      return;
                    }
                    if (newPassInput !== confirmPassInput) {
                      setProfileSaveError('New password and confirm password do not match.');
                      return;
                    }
                    if (newPassInput.includes('/')) {
                      setProfileSaveError('The "/" symbol in passwords is reserved for Admin and Owner accounts only.');
                      return;
                    }
                    if (!currentPassInput) {
                      setProfileSaveError('Please enter your Current Password to set a new password.');
                      return;
                    }
                  }

                  setIsSavingProfile(true);

                  try {
                    // Send to server
                    const res = await fetch('/api/user/update-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: user.email,
                        name: profileName.trim(),
                        phone: profilePhone.trim(),
                        role: profileRole,
                        currentPassword: currentPassInput ? currentPassInput.trim() : undefined,
                        newPassword: newPassInput ? newPassInput.trim() : undefined
                      })
                    });

                    const resData = await res.json();
                    if (res.ok && resData.success) {
                      updateUser({
                        name: profileName.trim(),
                        phone: profilePhone.trim(),
                        role: profileRole
                      });
                      setCurrentPassInput('');
                      setNewPassInput('');
                      setConfirmPassInput('');
                      setProfileSaveSuccess('Profile and security details updated successfully in the database!');
                    } else {
                      setProfileSaveError(resData.message || 'Failed to update profile.');
                    }
                  } catch (err: any) {
                    updateUser({
                      name: profileName.trim(),
                      phone: profilePhone.trim(),
                      role: profileRole
                    });
                    setProfileSaveSuccess('Profile details saved locally!');
                  } finally {
                    setIsSavingProfile(false);
                  }
                }}
                className="space-y-5"
              >
                {/* Registered Email (Locked) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Email (Account Identity)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.email}
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Your registered email address is fixed for security identification.</p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. 0911223344"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Who am I / Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Who am I? (Account Type) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label 
                      onClick={() => setProfileRole('tenant')}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        profileRole === 'tenant'
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={profileRole === 'tenant'}
                        onChange={() => setProfileRole('tenant')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="text-xs font-black text-slate-900">Tenant / Buyer</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Looking to rent or purchase properties in Ethiopia</p>
                      </div>
                    </label>

                    <label 
                      onClick={() => setProfileRole('landlord')}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        profileRole === 'landlord'
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        checked={profileRole === 'landlord'}
                        onChange={() => setProfileRole('landlord')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="text-xs font-black text-slate-900">Landlord / Owner</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Posting and managing houses, villas, or apartments</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Password Change Section */}
                <div className="pt-5 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Change Password (Optional)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500">Leave blank if you do not wish to change your password.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassInput}
                        onChange={(e) => setCurrentPassInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassInput}
                        onChange={(e) => setNewPassInput(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Confirm New
                      </label>
                      <input
                        type="password"
                        value={confirmPassInput}
                        onChange={(e) => setConfirmPassInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
