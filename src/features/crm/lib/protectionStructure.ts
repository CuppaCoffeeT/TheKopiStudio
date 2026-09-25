/**
 * v42 (2026-09-25) — how a portfolio's covers actually interact, and what it
 * could pay out today. Ported from `insurance_crm_v42.html` (ClientReport,
 * lines ~2709-2749); every expression below is the reference's, named.
 *
 * Three corrections the reference made to "add every figure up":
 *
 * 1. PERSONAL ACCIDENT pays only on accidental death/injury, never on death
 *    from illness (the likelier event). It is tracked on its own and left OUT
 *    of the death-cover total — counting it would show protection the client
 *    does not have.
 * 2. ACCELERATED CI draws down the death benefit instead of stacking on it, so
 *    for such a policy death and CI share one pot: the most it can ever pay is
 *    max(death, CI), not death + CI. Unanswered ⇒ accelerated (the common SG
 *    structure; `ciAccelerated !== false`).
 * 3. SURRENDER VALUE is what cashing out would actually return, after charges.
 *
 * Pure, and a no-op for a book with no PA policies: `deathCoverPolicies`
 * returns the same objects, so `summariseClient` (golden-locked) sees exactly
 * what it saw before and every vector still replays.
 */

import { toFloat } from './finance';

type Num = string | number | null | undefined;

export interface ProtectionPolicyInput {
  type?: string | null;
  provider?: string | null;
  coverageAmount?: Num;
  criticalIllnessCoverage?: Num;
  earlyCriticalIllnessCoverage?: Num;
  ciAccelerated?: boolean | null;
  surrenderValue?: Num;
  currentAccountValue?: Num;
  currentCashValue?: Num;
}

/** v42 `isPA` — a type-substring match, like every other type rule in the CRM. */
export function isPersonalAccident(p: { type?: string | null }): boolean {
  return (p.type || '').toLowerCase().includes('personal accident');
}

/**
 * The policies to total for DEATH cover: PA policies keep everything but their
 * death benefit (v42 filters them out of `totalCoverage` only — CI/ECI still
 * sum over every policy). Non-PA policies are returned as-is.
 */
export function deathCoverPolicies<T extends ProtectionPolicyInput>(policies: readonly T[]): T[] {
  return policies.map((p) => (isPersonalAccident(p) ? { ...p, coverageAmount: 0 } : p));
}

/** Total PA sum assured, shown separately (0 ⇒ the callout is not rendered). */
export function personalAccidentCover(policies: readonly ProtectionPolicyInput[]): number {
  return policies.filter(isPersonalAccident).reduce((s, p) => s + toFloat(p.coverageAmount), 0);
}

export interface CiStructure {
  ciPoliciesCount: number;
  acceleratedCICount: number;
  standaloneCICount: number;
  /** Most the portfolio can ever pay (death + CI, accelerated pots merged; PA excluded). */
  maxClaimableTotal: number;
  /** How far the naive (death total + CI total) figure overstates it. */
  acceleratedOverlap: number;
  /** The naive figure itself (death total ex-PA + CI total). */
  naiveTotal: number;
}

export function ciStructure(policies: readonly ProtectionPolicyInput[]): CiStructure {
  const hasCI = (p: ProtectionPolicyInput) => toFloat(p.criticalIllnessCoverage) > 0;
  const accelerated = (p: ProtectionPolicyInput) => hasCI(p) && p.ciAccelerated !== false;
  const ciPoliciesCount = policies.filter(hasCI).length;
  const acceleratedCICount = policies.filter(accelerated).length;

  const nonPA = policies.filter((p) => !isPersonalAccident(p));
  const maxClaimableTotal = nonPA.reduce((sum, p) => {
    const death = toFloat(p.coverageAmount);
    const ci = toFloat(p.criticalIllnessCoverage);
    return sum + (accelerated(p) ? Math.max(death, ci) : death + ci);
  }, 0);
  const naiveTotal =
    nonPA.reduce((s, p) => s + toFloat(p.coverageAmount), 0) +
    policies.reduce((s, p) => s + toFloat(p.criticalIllnessCoverage), 0);

  return {
    ciPoliciesCount,
    acceleratedCICount,
    standaloneCICount: ciPoliciesCount - acceleratedCICount,
    maxClaimableTotal,
    acceleratedOverlap: naiveTotal - maxClaimableTotal,
    naiveTotal,
  };
}

/** v42 "Policies providing this protection": any death OR CI cover recorded. */
export function protectionContributors<T extends ProtectionPolicyInput>(policies: readonly T[]): T[] {
  return policies.filter(
    (p) => toFloat(p.coverageAmount) > 0 || toFloat(p.criticalIllnessCoverage) > 0,
  );
}

export interface LiquidityLine<T> {
  policy: T;
  /** Account value (ILP) or cash value — 0 when neither is recorded. */
  built: number;
  surrender: number;
  /** built − surrender (positive = what surrendering now forfeits). */
  difference: number;
}

/** v42 "What you can access today" — policies with a surrender value > 0. */
export function liquidity<T extends ProtectionPolicyInput>(
  policies: readonly T[],
): { total: number; lines: LiquidityLine<T>[] } {
  const lines = policies
    .filter((p) => toFloat(p.surrenderValue) > 0)
    .map((policy) => {
      // v42 `parseFloat(p.currentAccountValue || p.currentCashValue || 0)`, on
      // NUMBERS: our policy numerics store blank as 0, so the string '0' would
      // be truthy and hide a real cash value behind an unset account value.
      const built = toFloat(policy.currentAccountValue) || toFloat(policy.currentCashValue);
      const surrender = toFloat(policy.surrenderValue);
      return { policy, built, surrender, difference: built - surrender };
    });
  return { total: lines.reduce((s, l) => s + l.surrender, 0), lines };
}
