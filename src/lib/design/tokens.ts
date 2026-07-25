/**
 * Design tokens — TypeScript mirror of the `:root` custom properties in
 * src/index.css.
 *
 * Usage: type-safe access to CSS custom properties from TypeScript code that
 * needs them at runtime (motion configs, recharts props, inline styles).
 *
 * Per Q-W07-b (deep imports): prefer importing a sub-group directly
 *   import { ctaTokens } from '@/lib/design/tokens';
 * rather than pulling the entire `tokens` object.
 *
 * Source of truth: src/index.css `:root`. Values are NOT duplicated here —
 * every entry below is a `var(--…)` reference, so repointing a colour is a
 * one-file change in index.css. The brand authority behind those values is
 * docs/05-implementation/design-handoffs/2026-07-25-kopi-studio-2a/
 * (brand card = tokens, `KOPI_2A_SPEC.md` = layout). Historical rationale for
 * the var NAMES lives in docs/99-refactor/_system/LOCKED_PICKS.md.
 *
 * 2026-07-25 The Kopi Studio rebrand: the app is LIGHT-pinned and every value
 * below resolves to the cream/brown system (page cream #F0E6D6 · card cream
 * #FAF6EE · raised white #FFFFFF · brown #8B6A47 primary/CTA/focus · sage
 * #5A7A5E positive · terracotta #D97551 negative · ink #3A2E24 text). It
 * replaces the 2026-07-14 Editorial navy/gold dark theme.
 *
 * Var NAMES are frozen for adopter stability, so several read as legacy
 * misnomers — `--brand-red` and the `accentRedSoft*` pair now carry the brand
 * BROWN accent, and `deltaNegative*` is terracotta rather than red.
 *
 * Accessibility: the raw brand hexes are tuned as FILLS and miss 4.5:1 as
 * small type. index.css therefore ships darkened text-only siblings
 * (--brown-text · --sage-text · --negative-text) that any token painting text
 * under 18px must resolve to — which is why `ctaTokens.brandRed`,
 * `ctaTokens.accentRedSoftFg` and the `kpiTileTokens.delta*Fg` pair point at
 * those variants, not at the raw brand hexes.
 */

// ===========================================================================
// v1 — Card · DataTable · KpiTile
// ===========================================================================

export const cardTokens = {
  radius: 'var(--card-radius)',
  border: 'var(--card-border)',
  shadowRest: 'var(--card-shadow-rest)',
  shadowHover: 'var(--card-shadow-hover)',
  padding: 'var(--card-padding)',
} as const;

export const dataTableTokens = {
  rowHoverBg: 'var(--row-hover-bg)',
  rowEnterDurationMs: 180,
  sortIconOpacityRest: 0.4,
} as const;

export const kpiTileTokens = {
  radius: 'var(--kpi-radius)',
  deltaPositiveBg: 'var(--delta-positive-bg)',
  deltaPositiveFg: 'var(--delta-positive-fg)',
  deltaNegativeBg: 'var(--delta-negative-bg)',
  deltaNegativeFg: 'var(--delta-negative-fg)',
  tickerSpring: {
    stiffness: 100,
    damping: 60,
  },
} as const;

// ===========================================================================
// v2 — Drawer · Stepper · Timeline · Charts
// ===========================================================================

export const drawerTokens = {
  radius: 'var(--drawer-radius)',
  handleWidth: 'var(--drawer-handle-w)',
  handleHeight: 'var(--drawer-handle-h)',
  overlay: 'var(--drawer-overlay)',
  handlePulseDurationMs: 1600,
} as const;

export const stepperTokens = {
  chipSize: 'var(--chip-size)',
  chipSizeCompact: 'var(--chip-size-compact)',
  chipActive: 'var(--chip-active)',
  chipDone: 'var(--chip-done)',
  chipSpring: {
    stiffness: 320,
    damping: 24,
  },
} as const;

export const timelineTokens = {
  railColor: 'var(--timeline-rail-color)',
  beam: 'var(--timeline-beam)',
  dotSize: 'var(--timeline-dot-size)',
  stepGap: 'var(--timeline-step-gap)',
} as const;

/** v2 — Charts. 2a keeps the viz quiet: one brown ramp, assigned by series
 *  order. `pipeline`/`accepted` are ramp steps 1 and 2 (the gold + dim-cream
 *  series pair was retired 2026-07-25). Steps past the anchor are decorative
 *  contrast only — always label the series and restate any encoded figure. */
export const chartTokens = {
  pipeline: 'var(--chart-pipeline)',
  accepted: 'var(--chart-accepted)',
  gridDasharray: 'var(--chart-grid-dasharray)',
  animDurationMs: 800,
  animStaggerMs: 200,
} as const;

// ===========================================================================
// v3 — cross-cutting patterns
// ===========================================================================

/** v3.1 — CTA pattern. Primary = brown fill with a cream label; the only solid
 *  terracotta is destructive. Key names are legacy (`brandRed`,
 *  `accentRedSoft*`) — values resolve to the brand BROWN accent, in its
 *  AA-safe text variant wherever the consumer paints small type. */
export const ctaTokens = {
  primaryBg: 'var(--cta-primary-bg)',
  primaryBgHover: 'var(--cta-primary-bg-hover)',
  primaryFg: 'var(--cta-primary-fg)',
  destructiveBg: 'var(--cta-destructive-bg)',
  brandRed: 'var(--brand-red)',
  accentRedSoftBg: 'var(--accent-red-soft-bg)',
  accentRedSoftFg: 'var(--accent-red-soft-fg)',
} as const;

/** v3.2 — Glass surface pattern (sticky headers, marketing cards). Cream glass
 *  since 2026-07-25. The page backdrop is a FLAT cream canvas now, so
 *  `pageGradientLight`/`pageGradientDark` are same-value back-compat aliases —
 *  neither implies a gradient nor a theme branch. */
export const glassTokens = {
  translucentBg: 'var(--surface-translucent-bg)',
  translucentBlur: 'var(--surface-translucent-blur)',
  translucentBorder: 'var(--surface-translucent-border)',
  pageGradientLight: 'var(--page-gradient-light)',
  pageGradientDark: 'var(--page-gradient-dark)',
} as const;

/** v3.3 — Mobile data-table layout. */
export const mobileTokens = {
  pagePadding: 'var(--mobile-page-padding)',
  rowCardGap: 'var(--row-card-gap)',
  rowCardBorder: 'var(--row-card-border)',
} as const;

// ===========================================================================
// Motion — Q-W08-b RESERVED philosophy
// ===========================================================================

export const motionTokens = {
  durationInstant: 'var(--motion-duration-instant)',
  durationQuick: 'var(--motion-duration-quick)',
  durationSmooth: 'var(--motion-duration-smooth)',
  easeOutExpo: 'var(--motion-ease-out-expo)',
  easeSpring: 'var(--motion-ease-spring)',
  durationInstantMs: 80,
  durationQuickMs: 180,
  durationSmoothMs: 400,
} as const;

// ===========================================================================
// Aggregate
// ===========================================================================

export const tokens = {
  card: cardTokens,
  dataTable: dataTableTokens,
  kpiTile: kpiTileTokens,
  drawer: drawerTokens,
  stepper: stepperTokens,
  timeline: timelineTokens,
  chart: chartTokens,
  cta: ctaTokens,
  glass: glassTokens,
  mobile: mobileTokens,
  motion: motionTokens,
} as const;

export type TokenGroup = keyof typeof tokens;
