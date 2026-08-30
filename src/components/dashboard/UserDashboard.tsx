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
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { PropertyCard } from '../common/PropertyCard';
import { AdminDashboard } from './AdminDashboard';

export const UserDashboard: React.FC = () => {
  const { t } = useLanguage();
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
  const { user, role, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'favorites' | 'tours' | 'myListings' | 'payments' | 'analytics'>('favorites');

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
                    {user.activePlan || 'Free Plan'}
                  </span>

                  {daysRemaining !== null && daysRemaining > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{daysRemaining} day{daysRemaining > 1 ? 's' : ''} left</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {!user.activePlan && (
                <button
                  onClick={() => setCurrentView('pricing')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Upgrade Plan</span>
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

      </div>
    </div>
  );
};
