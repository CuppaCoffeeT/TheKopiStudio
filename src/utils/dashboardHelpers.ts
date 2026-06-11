// Dashboard helpers — module grouping, greeting, localStorage prefs.
// Generic base version: category labels are derived from the module's
// `category` string (no hardcoded business categories). Extend `CATEGORY_META`
// per project if you want custom labels / ordering / icons.

// ---- Types ----

export interface DashboardModule {
  module_id: string;
  name: string;
  description: string;
  icon_name: string;
  path: string;
  category: string;
  sort_order: number;
}

export interface CategoryGroup {
  key: string;
  label: string;
  icon: string;
  order: number;
  modules: DashboardModule[];
}

export type CardDensity = 'large' | 'medium' | 'compact';

// ---- Category Metadata (optional per-project overrides) ----
// Map a module `category` slug → display label / sort order / lucide icon.
// Unknown categories fall back to a title-cased label and alphabetical order.

export const CATEGORY_META: Record<string, { label: string; order: number; icon: string }> = {
  general: { label: 'General', order: 1, icon: 'LayoutGrid' },
};

// ---- Time-Aware Greeting ----

export function getGreeting(): string {
  const hour = new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false });
  const h = parseInt(hour, 10);
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ---- localStorage Keys ----

const STORAGE_KEYS = {
  PINNED_MODULES: 'app_pinned_modules',
  RECENT_MODULES: 'app_recent_modules',
  COLLAPSED_CATEGORIES: 'app_collapsed_cats',
} as const;

const STORAGE_CHANGE_EVENT = 'app-storage-change';

export function dispatchStorageChange(key: string) {
  window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key } }));
}

export const STORAGE_EVENT_NAME = STORAGE_CHANGE_EVENT;

// ---- Pinned Modules ----

export function getPinnedModules(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PINNED_MODULES) || '[]');
  } catch { return []; }
}

export function togglePinModule(path: string): string[] {
  const current = getPinnedModules();
  const updated = current.includes(path)
    ? current.filter(p => p !== path)
    : [...current, path];
  localStorage.setItem(STORAGE_KEYS.PINNED_MODULES, JSON.stringify(updated));
  dispatchStorageChange(STORAGE_KEYS.PINNED_MODULES);
  return updated;
}

export function isPinned(path: string): boolean {
  return getPinnedModules().includes(path);
}

// ---- Recent Modules ----

export function getRecentModules(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_MODULES) || '[]');
  } catch { return []; }
}

export function addRecentModule(path: string): void {
  const current = getRecentModules();
  const updated = [path, ...current.filter(p => p !== path)].slice(0, 5);
  localStorage.setItem(STORAGE_KEYS.RECENT_MODULES, JSON.stringify(updated));
  dispatchStorageChange(STORAGE_KEYS.RECENT_MODULES);
}

// ---- Collapsed Categories ----

export function getCollapsedCategories(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLAPSED_CATEGORIES) || '[]');
  } catch { return []; }
}

export function toggleCategoryCollapsed(key: string): string[] {
  const current = getCollapsedCategories();
  const updated = current.includes(key)
    ? current.filter(k => k !== key)
    : [...current, key];
  localStorage.setItem(STORAGE_KEYS.COLLAPSED_CATEGORIES, JSON.stringify(updated));
  dispatchStorageChange(STORAGE_KEYS.COLLAPSED_CATEGORIES);
  return updated;
}

// ---- Group Modules by Category ----

export function groupModulesByCategory(modules: DashboardModule[]): CategoryGroup[] {
  const grouped: Record<string, DashboardModule[]> = {};

  for (const mod of modules) {
    const cat = mod.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(mod);
  }

  return Object.entries(grouped)
    .map(([key, mods]) => {
      const meta = CATEGORY_META[key] || {
        label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        order: 99,
        icon: 'LayoutGrid',
      };
      return {
        key,
        label: meta.label,
        icon: meta.icon,
        order: meta.order,
        modules: mods.sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name)),
      };
    })
    .sort((a, b) => (a.order - b.order) || a.label.localeCompare(b.label));
}

// ---- Card Density ----

export function getCardDensity(totalModules: number): CardDensity {
  if (totalModules <= 6) return 'large';
  if (totalModules <= 15) return 'medium';
  return 'compact';
}
