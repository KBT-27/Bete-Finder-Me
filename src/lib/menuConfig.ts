import { MenuVisibilityConfig, AdminTabVisibility, PublicMenuVisibility } from '../types';

export const DEFAULT_ADMIN_TABS: AdminTabVisibility = {
  payments: true,
  properties: true,
  paid_subscribers: true,
  database_users: true,
  admin_controller: true,
  pricing_settings: true,
  telegram_channel: true,
  telegram_bot: true,
  feedback: true,
  security: true,
  sync: true,
};

export const DEFAULT_PUBLIC_MENUS: PublicMenuVisibility = {
  home: true,
  rent: true,
  sale: true,
  pricing: true,
  post: true,
  ai_assistant: true,
  feedback_button: true,
  favorites: true,
};

export const DEFAULT_MENU_CONFIG: MenuVisibilityConfig = {
  adminTabs: DEFAULT_ADMIN_TABS,
  publicMenus: DEFAULT_PUBLIC_MENUS,
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'bete_finder_menu_visibility';

/**
 * Retrieve active menu visibility configuration
 */
export const getMenuConfig = (): MenuVisibilityConfig => {
  if (typeof window === 'undefined') return DEFAULT_MENU_CONFIG;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        adminTabs: { ...DEFAULT_ADMIN_TABS, ...(parsed.adminTabs || {}) },
        publicMenus: { ...DEFAULT_PUBLIC_MENUS, ...(parsed.publicMenus || {}) },
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('[MenuConfig] Failed to parse local menu config:', err);
  }
  return DEFAULT_MENU_CONFIG;
};

/**
 * Save menu configuration and notify all components
 */
export const saveMenuConfig = (config: MenuVisibilityConfig): MenuVisibilityConfig => {
  const updated: MenuVisibilityConfig = {
    adminTabs: { ...DEFAULT_ADMIN_TABS, ...config.adminTabs },
    publicMenus: { ...DEFAULT_PUBLIC_MENUS, ...config.publicMenus },
    lastUpdated: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('bete_menu_config_changed', { detail: updated }));
    } catch (err) {
      console.warn('[MenuConfig] Local storage save error:', err);
    }
  }

  // Background server sync
  fetch('/api/menu-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch(() => {});

  return updated;
};

/**
 * Toggle an individual admin tab menu (Select to Come / Deselect to Erase)
 */
export const toggleAdminTabMenu = (key: keyof AdminTabVisibility): MenuVisibilityConfig => {
  const current = getMenuConfig();
  const nextValue = !current.adminTabs[key];
  const updated: MenuVisibilityConfig = {
    ...current,
    adminTabs: {
      ...current.adminTabs,
      [key]: nextValue,
    },
  };
  return saveMenuConfig(updated);
};

/**
 * Toggle an individual public navigation menu (Select to Come / Deselect to Erase)
 */
export const togglePublicMenu = (key: keyof PublicMenuVisibility): MenuVisibilityConfig => {
  const current = getMenuConfig();
  const nextValue = !current.publicMenus[key];
  const updated: MenuVisibilityConfig = {
    ...current,
    publicMenus: {
      ...current.publicMenus,
      [key]: nextValue,
    },
  };
  return saveMenuConfig(updated);
};

/**
 * Set all admin tabs visibility at once (Show All or Hide All)
 */
export const setAllAdminTabsVisibility = (visible: boolean): MenuVisibilityConfig => {
  const current = getMenuConfig();
  const newTabs: AdminTabVisibility = {
    payments: visible,
    properties: visible,
    paid_subscribers: visible,
    database_users: visible,
    admin_controller: true, // Controller stays available so Owner can re-enable
    pricing_settings: visible,
    telegram_channel: visible,
    telegram_bot: visible,
    feedback: visible,
    security: visible,
    sync: visible,
  };
  return saveMenuConfig({ ...current, adminTabs: newTabs });
};

/**
 * Set all public menus visibility at once
 */
export const setAllPublicMenusVisibility = (visible: boolean): MenuVisibilityConfig => {
  const current = getMenuConfig();
  const newPublic: PublicMenuVisibility = {
    home: true, // Home remains accessible
    rent: visible,
    sale: visible,
    pricing: visible,
    post: visible,
    ai_assistant: visible,
    feedback_button: visible,
    favorites: visible,
  };
  return saveMenuConfig({ ...current, publicMenus: newPublic });
};

/**
 * Reset all menus back to default state (All Come / Active)
 */
export const resetMenuConfigToDefaults = (): MenuVisibilityConfig => {
  return saveMenuConfig(DEFAULT_MENU_CONFIG);
};

/**
 * Fetch latest menu configuration from server
 */
export const syncMenuConfigFromServer = async (): Promise<MenuVisibilityConfig> => {
  try {
    const res = await fetch('/api/menu-config');
    const data = await res.json();
    if (data.success && data.menuConfig) {
      const merged: MenuVisibilityConfig = {
        adminTabs: { ...DEFAULT_ADMIN_TABS, ...(data.menuConfig.adminTabs || {}) },
        publicMenus: { ...DEFAULT_PUBLIC_MENUS, ...(data.menuConfig.publicMenus || {}) },
        lastUpdated: data.menuConfig.lastUpdated || new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('bete_menu_config_changed', { detail: merged }));
      }
      return merged;
    }
  } catch (err) {
    console.warn('[MenuConfig] Sync from server error:', err);
  }
  return getMenuConfig();
};
