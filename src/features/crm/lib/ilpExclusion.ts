/**
 * ILP premium exclusion — the reason an annual-premium figure can look wrong.
 *
 * THE DEFECT, found 2026-08-18 while tracing every CRM Dashboard number back to
 * its source. `summariseClient` scales an investment-linked policy's premium by
 * `ilpPremiumInclusionPercent` before adding it to `totalAnnualPremium` — the
 * documented, correct rule: only the protection slice of an ILP premium is
 * "premium", the rest is investment. But BOTH the column
 * (`policies.ilp_premium_inclusion_percent`) and the form model default that
 * percent to **0**. An ILP policy whose percent nobody filled in therefore
 * contributes exactly nothing, silently.
 *
 * In prod today that is 4 of the 9 live policies and $12,936 a year of real
 * premium missing from a tile that offers no hint it dropped anything. The
 * advisor sees a number they can tell is too small and cannot see why.
 *
 * WHY THIS DOES NOT "FIX" THE MATH. A 0 percent is genuinely ambiguous: on one
 * of these customers a sibling ILP carries a deliberate 50, so somebody has
 * used the field on purpose. Re-including zero-percent ILPs at 100% would
 * inflate every book that has used the field correctly, and quietly changing a
 * money figure is exactly what the audit asked us not to do. So the math is
 * untouched and the OMISSION is surfaced instead: the figure stays defensible
 * and the missing money becomes visible and fixable, one policy at a time.
 *
 * Pure — no React, no queries.
 */

import { annualisePremium } from './finance';

/** What a premium total left out, and what it would have been worth. */
export interface IlpExclusion {
  /** ILP policies contributing $0 because their inclusion percent is 0/unset. */
  count: number;
  /** What those policies WOULD add at 100% — the size of the blind spot. */
  annualPremium: number;
}

/** The policy fields the check needs — same shape both services already map. */
export interface IlpExclusionInput {
  premium?: string | number | null;
  frequency?: string | null;
  isInvestmentLinked?: boolean | null;
  ilpPremiumInclusionPercent?: string | number | null;
}

/**
 * How much annual premium the ILP rule dropped.
 *
 * A policy counts only when it is investment-linked, has a real premium, AND
 * its inclusion percent is zero or unset — an ILP with a premium of 0 is not a
 * blind spot, it is a policy with no premium.
 */
export function ilpExclusion(policies: readonly IlpExclusionInput[]): IlpExclusion {
  let count = 0;
  let annualPremium = 0;

  for (const policy of policies) {
    if (!policy.isInvestmentLinked) continue;
    const pct = Number(policy.ilpPremiumInclusionPercent ?? 0);
    if (Number.isFinite(pct) && pct > 0) continue;
    const annual = annualisePremium(policy);
    if (annual <= 0) continue;
    count += 1;
    annualPremium += annual;
  }

  return { count, annualPremium };
}

/** The sentence a tile or report prints under a premium total. Empty when
 *  nothing was excluded, so callers can render it unconditionally. */
export function describeIlpExclusion(exclusion: IlpExclusion): string {
  if (exclusion.count === 0) return '';
  const policies = exclusion.count === 1 ? 'policy' : 'policies';
  return `Excludes ${exclusion.count} investment-linked ${policies} with no premium-inclusion percent set.`;
}
