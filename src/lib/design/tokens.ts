/**
 * Design tokens — TypeScript mirror of LOCKED_PICKS.md + index.css @theme block.
 *
 * Usage: type-safe access to CSS custom properties from TypeScript code that
 * needs them at runtime (motion configs, recharts props, inline styles).
 *
 * Per Q-W07-b (deep imports): prefer importing a sub-group directly
 *   import { ctaTokens } from '@/lib/design/tokens';
 * rather than pulling the entire `tokens` object.
 *
 * Source of truth: docs/99-refactor/_system/LOCKED_PICKS.md + src/index.css.
 * If you change a token value, change BOTH files in the same commit.
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

/** v3.1 — CTA pattern. Primary = strong grey near-black; red is ACCENT ONLY. */
export const ctaTokens = {
  primaryBg: 'var(--cta-primary-bg)',
  primaryBgHover: 'var(--cta-primary-bg-hover)',
  primaryFg: 'var(--cta-primary-fg)',
  destructiveBg: 'var(--cta-destructive-bg)',
  brandRed: 'var(--brand-red)',
  accentRedSoftBg: 'var(--accent-red-soft-bg)',
  accentRedSoftFg: 'var(--accent-red-soft-fg)',
} as const;

/** v3.2 — Glass surface pattern (sticky headers, marketing cards). */
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
