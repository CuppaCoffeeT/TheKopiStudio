/* eslint-disable react-refresh/only-export-components -- canonical React context pattern: useTheme hook co-located with ThemeProvider; splitting breaks the standard import */
/**
 * ThemeProvider — W08 Phase 2 (hoisted app-wide 2026-04-19).
 *
 * Phase 1 scoped the `dark` class to a preview wrapper; Phase 2 promotes
 * the toggle to `document.documentElement` so every page respects it.
 *
 * Persists the user's preference to localStorage `w08:theme:v1` (same key as
 * Phase 1 so earlier picks survive).
 *
 * Initial pick is `system` (follows `prefers-color-scheme`).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'w08:theme:v1';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readSystem(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystem);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* non-critical */
    }
  }, []);

  // Prospect Profiler original aesthetic is always the warm navy/gold dark
  // look (2026-07-07 de-AppBase). The preference API is kept for compatibility
  // but `resolved` is pinned to 'dark' so every surface renders on navy.
  void systemTheme;
  const resolved: ResolvedTheme = 'dark';

  // Keep the `dark` class on <html> permanently.
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, [resolved]);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
