/* eslint-disable react-refresh/only-export-components -- canonical React context pattern: useTheme hook co-located with ThemeProvider; splitting breaks the standard import */
/**
 * ThemeProvider — W08 Phase 2 (hoisted app-wide 2026-04-19).
 *
 * Phase 1 scoped the `dark` class to a preview wrapper; Phase 2 promotes
 * the class to `document.documentElement` so every page respects it.
 *
 * 2026-07-25 (The Kopi Studio rebrand): `resolved` is pinned to 'light'.
 * The brand is a light one — cream page, cream cards, brown punctuation — and
 * `src/index.css` carries a single `:root` token block with no `.dark`
 * counterpart, so there is nothing to flip to. This provider now guarantees
 * the `dark` class stays OFF <html>.
 *
 * Everything else is deliberately left intact so a future toggle is cheap:
 * the `ThemePreference` / `ResolvedTheme` types, the `prefers-color-scheme`
 * listener, and the localStorage key `w08:theme:v1` (same key since Phase 1,
 * so earlier picks survive). Stored preference still defaults to `system`;
 * it just doesn't drive `resolved` today.
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

  // The Kopi Studio is a light brand — warm cream canvas, brown punctuation,
  // sage/terracotta semantics (2026-07-25 rebrand). There is no dark
  // counterpart: `src/index.css` ships a single `:root` token block and no
  // `.dark` overrides. So `resolved` is pinned to 'light' and every surface
  // renders on cream. The preference API (type, storage key, system listener)
  // is kept intact so re-enabling a real toggle stays a one-line change.
  void systemTheme;
  const resolved: ResolvedTheme = 'light';

  // Keep the `dark` class OFF <html> permanently — the legacy `dark:` variant
  // is still declared in index.css, so a stray class would repaint the brand.
  useEffect(() => {
    document.documentElement.classList.remove('dark');
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
