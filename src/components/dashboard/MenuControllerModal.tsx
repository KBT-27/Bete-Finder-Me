import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  X, 
  Check, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Globe, 
  Sliders, 
  CheckCircle2, 
  Smartphone, 
  Building2, 
  Crown, 
  Database, 
  DollarSign, 
  Radio, 
  Bot, 
  MessageSquare, 
  Lock, 
  RefreshCw, 
  Home, 
  KeyRound, 
  Tag, 
  CreditCard, 
  PlusCircle, 
  Heart,
  HelpCircle
} from 'lucide-react';
import { 
  getMenuConfig, 
  saveMenuConfig, 
  toggleAdminTabMenu, 
  togglePublicMenu, 
  setAllAdminTabsVisibility, 
  setAllPublicMenusVisibility, 
  resetMenuConfigToDefaults 
} from '../../lib/menuConfig';
import { MenuVisibilityConfig, AdminTabVisibility, PublicMenuVisibility } from '../../types';

interface MenuControllerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const MenuControllerModal: React.FC<MenuControllerModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [menuConfig, setMenuConfig] = useState<MenuVisibilityConfig>(getMenuConfig());
  const [activeSection, setActiveSection] = useState<'admin' | 'public'>('admin');

  useEffect(() => {
    if (isOpen) {
      setMenuConfig(getMenuConfig());
    }

    const handleConfigChanged = (e: any) => {
      if (e.detail) setMenuConfig(e.detail);
    };

    window.addEventListener('bete_menu_config_changed', handleConfigChanged);
    return () => {
      window.removeEventListener('bete_menu_config_changed', handleConfigChanged);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAdminTab = (key: keyof AdminTabVisibility) => {
    const updated = toggleAdminTabMenu(key);
    setMenuConfig(updated);
    const isNowVisible = updated.adminTabs[key];
    onShowToast(
      isNowVisible 
        ? `✅ Menu "${key}" selected (Came back to navigation)` 
        : `🗑️ Menu "${key}" deselected (Erased from navigation)`
    );
  };

  const handleTogglePublicMenu = (key: keyof PublicMenuVisibility) => {
    const updated = togglePublicMenu(key);
    setMenuConfig(updated);
    const isNowVisible = updated.publicMenus[key];
    onShowToast(
      isNowVisible 
        ? `✅ Public menu "${key}" selected (Came back to navbar)` 
        : `🗑️ Public menu "${key}" deselected (Erased from navbar)`
    );
  };

  const handleSelectAllAdmin = () => {
    const updated = setAllAdminTabsVisibility(true);
    setMenuConfig(updated);
    onShowToast('🌟 All Admin menus selected (All came back to navigation)!');
  };

  const handleSelectAllPublic = () => {
    const updated = setAllPublicMenusVisibility(true);
    setMenuConfig(updated);
    onShowToast('🌟 All Public website menus selected (All came back to navbar)!');
  };

  const handleResetDefaults = () => {
    const updated = resetMenuConfigToDefaults();
    setMenuConfig(updated);
    onShowToast('🔄 All menus restored to factory default settings.');
  };

  // Count active vs erased
  const activeAdminCount = Object.values(menuConfig.adminTabs).filter(Boolean).length;
  const totalAdminCount = Object.keys(menuConfig.adminTabs).length;
  const activePublicCount = Object.values(menuConfig.publicMenus).filter(Boolean).length;
  const totalPublicCount = Object.keys(menuConfig.publicMenus).length;

  const adminMenuDefinitions: Array<{
    key: keyof AdminTabVisibility;
    label: string;
    description: string;
    icon: any;
    color: string;
    locked?: boolean;
  }> = [
    {
      key: 'payments',
      label: 'Payments & Telebirr Verification',
      description: 'Review payment transactions, approve subscriptions and activate VIP tiers.',
      icon: Smartphone,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      key: 'properties',
      label: 'Properties & Listings Management',
      description: 'Review unverified properties, moderate listings, edit details or delete.',
      icon: Building2,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      key: 'paid_subscribers',
      label: 'Paid VIP & Premium Subscribers',
      description: 'Live monitor active VIP/Premium memberships, plan durations, and expiry timers.',
      icon: Crown,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      key: 'database_users',
      label: 'Registered Users Database',
      description: 'View real database users, landlord and tenant accounts, manage or delete accounts.',
      icon: Database,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      key: 'feedback',
      label: 'Owner Direct Feedbacks Inbox',
      description: 'View customer inquiries, rental/sales ratings, reply notes, and user messages.',
      icon: MessageSquare,
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      key: 'admin_controller',
      label: 'Owner Controller Suite',
      description: 'First & Secondary Admin permission matrices, sub-admin management, and audit logs.',
      icon: Sliders,
      color: 'text-indigo-500 bg-indigo-500/10',
      locked: true // Owner always keeps controller
    },
    {
      key: 'pricing_settings',
      label: 'Pricing & Telebirr Configuration',
      description: 'Configure VIP/Premium package prices and receiver Telebirr account credentials.',
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      key: 'telegram_channel',
      label: 'Telegram Channel Integration',
      description: 'Manage @Bete_Finder channel alerts, test broadcast and sync settings.',
      icon: Radio,
      color: 'text-cyan-500 bg-cyan-500/10'
    },
    {
      key: 'telegram_bot',
      label: 'Telegram Bot Telemetry',
      description: 'Monitor BeteFinder_bot status, webhook connectivity, and token settings.',
      icon: Bot,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      key: 'security',
      label: 'Security & Profile Settings',
      description: 'Manage administrative login passwords, display name, email, and credentials.',
      icon: Lock,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      key: 'sync',
      label: 'Multi-Device Cross Database Sync',
      description: 'Deep analytics, multi-device backup exports, master payload inspections.',
      icon: RefreshCw,
      color: 'text-blue-500 bg-blue-500/10'
    }
  ];

  const publicMenuDefinitions: Array<{
    key: keyof PublicMenuVisibility;
    label: string;
    description: string;
    icon: any;
    color: string;
    locked?: boolean;
  }> = [
    {
      key: 'home',
      label: 'Home Page Menu',
      description: 'Directs users to the landing hero, featured properties, and Addis Ababa map search.',
      icon: Home,
      color: 'text-emerald-500 bg-emerald-500/10',
      locked: true
    },
    {
      key: 'rent',
      label: 'For Rent Properties Menu',
      description: 'Filters catalog exclusively to rental apartments, villas, and floor houses.',
      icon: KeyRound,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      key: 'sale',
      label: 'For Sale Properties Menu',
      description: 'Filters catalog exclusively to sale properties, condominiums, and lands.',
      icon: Tag,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      key: 'pricing',
      label: 'Pricing & VIP Plans Menu',
      description: 'Displays the Telebirr pricing packages (VIP, Premium, Basic) for property posters.',
      icon: CreditCard,
      color: 'text-purple-500 bg-purple-500/10'
    },
    {
      key: 'post',
      label: 'Post Property (+ Listing) Button',
      description: 'Enables landlords and owners to add property listings with photo uploads.',
      icon: PlusCircle,
      color: 'text-emerald-500 bg-emerald-500/10'
    },
    {
      key: 'ai_assistant',
      label: 'Bete Assistance (Gemini AI) Launcher',
      description: 'Header button launching the intelligent real estate AI assistant modal.',
      icon: Sparkles,
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      key: 'feedback_button',
      label: 'Send Feedback to Owner Button',
      description: 'Direct header link allowing users and visitors to send feedback to the Owner.',
      icon: MessageSquare,
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      key: 'favorites',
      label: 'Saved Properties (Favorites) Counter',
      description: 'Heart icon in header showing saved listings and fast bookmark access.',
      icon: Heart,
      color: 'text-rose-500 bg-rose-500/10'
    }
  ];

  return (
    <div 
      id="menu-controller-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-indigo-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Menu Controller & Visibility Suite
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Owner Exclusive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Select to bring a menu into view (Come), or deselect to hide it completely (Erase).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs & Quick Presets */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 flex-wrap shrink-0">
          
          {/* Sub-section Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSection('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'admin'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Tabs ({activeAdminCount}/{totalAdminCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('public')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'public'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>Public Menus ({activePublicCount}/{totalPublicCount})</span>
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={activeSection === 'admin' ? handleSelectAllAdmin : handleSelectAllPublic}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Select All (All Come)</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>
          </div>

        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">How Menu Erase & Come Works:</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Click any menu card or toggle button below. When checked (<strong className="text-emerald-700 font-bold">Selected</strong>), the menu is immediately made visible in real-time. When unchecked (<strong className="text-rose-700 font-bold">Deselected</strong>), the menu is erased from the navigation bars across all screens.
              </p>
            </div>
          </div>

          {/* Section: Admin Dashboard Navigation Menus */}
          {activeSection === 'admin' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Admin Dashboard Tabs ({activeAdminCount} Visible · {totalAdminCount - activeAdminCount} Erased)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {adminMenuDefinitions.map((item) => {
                  const isVisible = menuConfig.adminTabs[item.key];
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.key}
                      onClick={() => !item.locked && handleToggleAdminTab(item.key)}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        item.locked 
                          ? 'bg-slate-50/70 border-slate-200 cursor-not-allowed opacity-90' 
                          : 'cursor-pointer hover:shadow-xs'
                      } ${
                        isVisible
                          ? 'bg-white border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-slate-900">{item.label}</p>
                            {item.locked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-600">
                                Protected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* State Indicator */}
                      <div className="shrink-0 flex items-center gap-2 mt-0.5">
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                          isVisible
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isVisible ? 'Come' : 'Erased'}</span>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isVisible ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {isVisible ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Public Navigation Menus */}
          {activeSection === 'public' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Public Website Menus ({activePublicCount} Visible · {totalPublicCount - activePublicCount} Erased)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {publicMenuDefinitions.map((item) => {
                  const isVisible = menuConfig.publicMenus[item.key];
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.key}
                      onClick={() => !item.locked && handleTogglePublicMenu(item.key)}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        item.locked 
                          ? 'bg-slate-50/70 border-slate-200 cursor-not-allowed opacity-90' 
                          : 'cursor-pointer hover:shadow-xs'
                      } ${
                        isVisible
                          ? 'bg-white border-emerald-300 ring-1 ring-emerald-500/20 shadow-2xs'
                          : 'bg-slate-50/80 border-slate-200/80 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-black text-slate-900">{item.label}</p>
                            {item.locked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-200 text-slate-600">
                                Protected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* State Indicator */}
                      <div className="shrink-0 flex items-center gap-2 mt-0.5">
                        <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                          isVisible
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{isVisible ? 'Come' : 'Erased'}</span>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isVisible ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          {isVisible ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            <span>Settings saved automatically to local store and synced to master database.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
