/**
 * Health-snapshot band logic — EXACT ports of legacy `HealthSnapshot.jsx` and
 * the adequacy check `ClientReportModal.jsx` computed inline (git c09c549).
 * Split out of `financeReport.ts` (200-LOC ratchet) and re-exported there —
 * import from `financeReport`; imports are strictly one-way:
 * this file → finance.ts.
 *
 * Oracle-locked: `__tests__/financeReportExtension.test.ts` compares every
 * function against expressions copied verbatim from the legacy JSX.
 */
import type { ClientSummary } from './finance';

/** Adequacy inputs — the three income-multiple ratios off `summariseClient`. */
export type CoverageRatios = Pick<
  ClientSummary,
  'coverageRatio' | 'ciCoverageRatio' | 'eciCoverageRatio'
>;

/**
 * ClientReportModal.jsx:138-142 — adequately covered iff death ≥5×, CI ≥5×
 * AND early-CI ≥1.5× income. Literals preserved (legacy wrote them inline;
 * income ≤ 0 makes all ratios 0 → never adequate). Note the 5× death multiple
 * here vs the 10× used by gap math — preserved legacy inconsistency.
 */
export function isAdequatelyCovered(summary: CoverageRatios): boolean {
  return (
    summary.coverageRatio >= 5 && summary.ciCoverageRatio >= 5 && summary.eciCoverageRatio >= 1.5
  );
}

export interface BandThresholds {
  good: number;
  review: number;
}

/** Card status triple exactly as the legacy `band()` helper returned it. */
export interface BandStatus {
  tone: string;
  bg: string;
  label: string;
}

/**
 * HealthSnapshot.jsx:23-25 — benchmark thresholds per snapshot card. The
 * insurance-premiums card does NOT band — see `premiumCardStatus`.
 */
export const HEALTH_BANDS = {
  /** Invested premiums as % of income — guideline 20–30%. */
  investedPremiumsPct: { good: 20, review: 14 },
  /** Death coverage as a multiple of income — guideline 5–10×. */
  coverageMultiple: { good: 5, review: 3.5 },
  /** Projected RA as % of cohort FRS — target 100%+. */
  cpfFrsTrackPct: { good: 100, review: 70 },
} as const satisfies Record<string, BandThresholds>;

/** HealthSnapshot.jsx:3-7 — ≥good → Good; ≥review → Review; else Action needed. */
export function bandFor(value: number, benchmarks: BandThresholds): BandStatus {
  if (value >= benchmarks.good) return { tone: '#059669', bg: '#d1fae5', label: 'Good' };
  if (value >= benchmarks.review) return { tone: '#f59e0b', bg: '#fef3c7', label: 'Review' };
  return { tone: '#dc2626', bg: '#fee2e2', label: 'Action needed' };
}

/**
 * HealthSnapshot.jsx:16-21 — SPECIAL status logic for the insurance-premiums
 * card: 'Good' only when adequately covered AND premiums ≤10% of income; ANY
 * under-insurance is 'Underinsured' (red) even at low premium %; adequately
 * covered but >10% is 'Review cost' (amber).
 */
export function premiumCardStatus(
  summary: CoverageRatios,
  insurancePremiumsPct: number,
): BandStatus {
  const adequate = isAdequatelyCovered(summary);
  if (adequate && insurancePremiumsPct <= 10) {
    return { tone: '#059669', bg: '#d1fae5', label: 'Good' };
  }
  if (!adequate) return { tone: '#dc2626', bg: '#fee2e2', label: 'Underinsured' };
  return { tone: '#f59e0b', bg: '#fef3c7', label: 'Review cost' };
}
