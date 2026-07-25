/**
 * Overlay primitives — shared tokens.
 * Produced from W08 Session 2 (Claude Design handoff, 2026-04-19).
 * Repainted onto The Kopi Studio 2a palette (2026-07-25).
 */
export type OverlayVariant = 'success' | 'error' | 'info' | 'warning';

export const VARIANT_ICON: Record<OverlayVariant, string> = {
  success: '✓',
  error: '!',
  info: 'i',
  warning: '!',
};

/**
 * Accent colour per variant, keyed to the 2a semantic set: sage is positive,
 * terracotta is negative, brown is in-progress, muted ink is neutral.
 *
 * `light` is the only arm because the app is light-pinned — there is no dark
 * theme to switch to. Every accent is the AA-safe step of its hue
 * (`--sage-text` / `--negative-text` / `--brown-text` / `--fg-dim`) rather than
 * the raw brand hue, because these fills carry an 11px cream glyph in
 * Alert/Toaster and raw sage (4.45:1) and raw terracotta (2.95:1) do not clear
 * the AA text floor. `softLight` is the matching wash for tinted variant
 * surfaces; it points at the shared alpha tokens rather than copying their
 * values, because those alphas are a contrast budget that `src/index.css` owns.
 */
export const VARIANT_ACCENT: Record<
  OverlayVariant,
  { light: string; softLight: string }
> = {
  success: {
    light: 'var(--sage-text)',
    softLight: 'var(--delta-positive-bg)',
  },
  error: {
    light: 'var(--negative-text)',
    softLight: 'var(--delta-negative-bg)',
  },
  info: {
    light: 'var(--fg-dim)',
    softLight: 'var(--status-expired-bg)',
  },
  warning: {
    light: 'var(--brown-text)',
    softLight: 'var(--accent-red-soft-bg)',
  },
};

/**
 * Tailwind class stack for a glass surface (backdrop-blur + semi-transparent bg).
 * Floating surfaces are the only 2a surfaces that cast a shadow, and it is warm
 * ink (`--floating-shadow`) rather than black or zinc. The app is light-pinned,
 * so no `dark:` counterpart is declared.
 */
export const GLASS_SURFACE =
  'backdrop-blur-md backdrop-saturate-150 ' +
  'bg-card/75 ' +
  'border border-border/60 ' +
  'shadow-[var(--floating-shadow)]';

/**
 * Tailwind class stack for a glass backdrop behind modals/drawers.
 * Warm ink scrim (`--drawer-overlay`) — the same scrim `ui/dialog.tsx` and
 * `ui/sheet.tsx` paint, so every dimmed surface in the app matches.
 */
export const GLASS_BACKDROP =
  'backdrop-blur-sm backdrop-saturate-125 ' +
  'bg-[color:var(--drawer-overlay)]';
