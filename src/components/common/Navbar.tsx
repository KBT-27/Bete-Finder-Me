import React, { useState } from 'react';
import { 
  Building2, 
  Home, 
  Search, 
  PlusCircle, 
  CreditCard, 
  User, 
  Menu, 
  X, 
  Globe, 
  Heart, 
  Shield, 
  ChevronDown, 
  LogOut,
  Crown,
  ShieldCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user, role, logout, setIsAuthModalOpen, setAuthModalInitialMode } = useAuth();
  const { currentView, setCurrentView, setActiveListingType, savedProperties, updateFilter, resetFilters } = useProperties();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleNavClick = (view: 'home' | 'properties' | 'post' | 'pricing' | 'dashboard', listingType?: 'all' | 'rent' | 'sale') => {
    if (listingType) {
      setActiveListingType(listingType);
      updateFilter('listingType', listingType);
    } else if (view === 'properties') {
      setActiveListingType('all');
      resetFilters();
    }
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return (
          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-600" />
            <span>Owner (ባለቤት)</span>
          </span>
        );
      case 'admin':
        return (
          <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            <span>Admin (አድሚን)</span>
          </span>
        );
      case 'landlord':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Landlord (አከራይ)</span>;
      case 'tenant':
        return <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200">Tenant (ተከራይ)</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2.5 text-left focus:outline-hidden group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform duration-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">Bete Finder</span>
                  <span className="text-xs bg-amber-500/10 text-amber-700 font-bold px-1.5 py-0.5 rounded-sm border border-amber-500/20">ቤቴ</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium tracking-tight">Ethiopia Real Estate</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <button
              id="nav-home-btn"
              onClick={() => handleNavClick('home')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'home'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {t('navHome')}
            </button>

            <button
              id="nav-rent-btn"
              onClick={() => handleNavClick('properties', 'rent')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'properties'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {t('navRent')}
            </button>

            <button
              id="nav-sale-btn"
              onClick={() => handleNavClick('properties', 'sale')}
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-650 hover:text-slate-900 hover:bg-slate-100/70 transition-colors cursor-pointer"
            >
              {t('navSale')}
            </button>

            <button
              id="nav-pricing-btn"
              onClick={() => handleNavClick('pricing')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'pricing'
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {t('navPricing')}
            </button>

            {user && (
              <button
                id="nav-dashboard-btn"
                onClick={() => handleNavClick('dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                {t('navDashboard')}
              </button>
            )}
          </nav>

          {/* Right Action Tools: Language, Post Property, User Profile */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              title="Switch language between English and Amharic"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? 'አማርኛ' : 'English'}</span>
            </button>

            {/* Saved Favorites counter */}
            {user && (
              <button
                id="header-favorites-btn"
                onClick={() => {
                  setCurrentView('dashboard');
                }}
                className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Saved Properties"
              >
                <Heart className="w-5 h-5" />
                {savedProperties.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {savedProperties.length}
                  </span>
                )}
              </button>
            )}

            {/* Post Property Button */}
            <button
              id="header-post-property-btn"
              onClick={() => handleNavClick('post')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('navPostProperty')}</span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    id="user-menu-btn"
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-slate-300"
                    />
                    <div className="text-left hidden lg:block pr-1">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">{user.name.split(' ')[0]}</p>
                      <div className="scale-90 origin-left">{getRoleBadge(role)}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <div className="mt-2">{getRoleBadge(role)}</div>
                      </div>

                      <div className="py-1 border-b border-slate-100">
                        <button
                          id="dropdown-dashboard-btn"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setCurrentView('dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 font-medium flex items-center gap-2.5 cursor-pointer"
                        >
                          <User className="w-4 h-4" />
                          <span>{t('navDashboard')}</span>
                        </button>
                        <button
                          id="dropdown-post-btn"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setCurrentView('post');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 font-medium flex items-center gap-2.5 cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>{t('navPostProperty')}</span>
                        </button>
                        <button
                          id="dropdown-pricing-btn"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            setCurrentView('pricing');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-emerald-700 font-medium flex items-center gap-2.5 cursor-pointer"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{t('navPricing')}</span>
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          id="dropdown-logout-btn"
                          onClick={() => {
                            setIsUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2.5 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('navSignOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="header-sign-in-btn"
                    onClick={() => {
                      setAuthModalInitialMode('signin');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-800 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    {t('navSignIn')}
                  </button>
                  <button
                    id="header-sign-up-btn"
                    onClick={() => {
                      setAuthModalInitialMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Hamburger & Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-lang-btn"
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg border border-slate-200"
            >
              {language === 'en' ? 'አማ' : 'EN'}
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-3 duration-200">
          <div className="space-y-1">
            <button
              id="mobile-nav-home-btn"
              onClick={() => handleNavClick('home')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold flex items-center gap-3 ${
                currentView === 'home' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>{t('navHome')}</span>
            </button>

            <button
              id="mobile-nav-rent-btn"
              onClick={() => handleNavClick('properties', 'rent')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-emerald-600" />
              <span>{t('navRent')}</span>
            </button>

            <button
              id="mobile-nav-sale-btn"
              onClick={() => handleNavClick('properties', 'sale')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-3"
            >
              <Building2 className="w-5 h-5 text-amber-600" />
              <span>{t('navSale')}</span>
            </button>

            <button
              id="mobile-nav-pricing-btn"
              onClick={() => handleNavClick('pricing')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-3"
            >
              <CreditCard className="w-5 h-5 text-blue-600" />
              <span>{t('navPricing')}</span>
            </button>

            {user && (
              <button
                id="mobile-nav-dashboard-btn"
                onClick={() => handleNavClick('dashboard')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-base font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-3"
              >
                <User className="w-5 h-5 text-purple-600" />
                <span>{t('navDashboard')}</span>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <button
              id="mobile-post-property-btn"
              onClick={() => handleNavClick('post')}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{t('navPostProperty')}</span>
            </button>

            {user ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-slate-300"
                  />
                  <div>
                    <p className="font-bold text-sm text-slate-900">{user.name}</p>
                    <div className="mt-0.5">{getRoleBadge(role)}</div>
                  </div>
                </div>

                <button
                  id="mobile-logout-btn"
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center py-2 text-rose-600 font-semibold text-sm hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  {t('navSignOut')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-sign-in-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalInitialMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 border border-slate-300 bg-white font-bold rounded-xl text-slate-800 cursor-pointer"
                >
                  {t('navSignIn')}
                </button>
                <button
                  id="mobile-sign-up-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setAuthModalInitialMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-slate-900 font-bold rounded-xl text-white cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
