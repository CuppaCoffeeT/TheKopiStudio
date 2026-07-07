/**
 * Overlay primitives — shared tokens.
 * Produced from W08 Session 2 (Claude Design handoff, 2026-04-19).
 */
export type OverlayVariant = 'success' | 'error' | 'info' | 'warning';

export const VARIANT_ICON: Record<OverlayVariant, string> = {
  success: '✓',
  error: '!',
  info: 'i',
  warning: '!',
};

/**
 * Accent colours per variant. Light + dark values.
 * Mirrors v4 status-badge palette in `src/index.css`.
 */
export const VARIANT_ACCENT: Record<
  OverlayVariant,
  { light: string; dark: string; softLight: string; softDark: string }
> = {
  success: {
    light: '#16a34a',
    dark: '#4ade80',
    softLight: 'rgba(22,163,74,0.08)',
    softDark: 'rgba(74,222,128,0.12)',
  },
  error: {
    light: '#b91c1c',
    dark: '#f87171',
    softLight: 'rgba(185,28,28,0.08)',
    softDark: 'rgba(248,113,113,0.14)',
  },
  info: {
    light: '#2563eb',
    dark: '#60a5fa',
    softLight: 'rgba(37,99,235,0.08)',
    softDark: 'rgba(96,165,250,0.12)',
  },
  warning: {
    light: '#d97706',
    dark: '#fbbf24',
    softLight: 'rgba(217,119,6,0.08)',
    softDark: 'rgba(251,191,36,0.12)',
  },
};

/** Tailwind class stack for a glass surface (backdrop-blur + semi-transparent bg). */
export const GLASS_SURFACE =
  'backdrop-blur-md backdrop-saturate-150 ' +
  'bg-card/75 ' +
  'border border-border/60 ' +
  'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_rgba(24,24,27,0.08)] ' +
  'dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_12px_32px_rgba(0,0,0,0.35)]';

/** Tailwind class stack for a glass backdrop behind modals/drawers. */
export const GLASS_BACKDROP =
  'backdrop-blur-sm backdrop-saturate-125 ' +
  'bg-white/45 dark:bg-zinc-950/55';
