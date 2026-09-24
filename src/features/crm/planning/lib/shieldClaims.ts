/**
 * Shield claim arithmetic — who pays what on a bill, once the deductible and
 * the co-payment have taken their share.
 *
 * Faithful port of `claim()` / `cancerCalc()` in the advisor's
 * `shield-comparison.html`, including its assumptions: the deductible is spent
 * first, the co-payment is a rate on what is left, capped yearly. The scenario
 * copy is the advisor's and lives in `shieldScenarios.ts`.
 */

/** "No cap" — large enough that no bill in any scenario reaches it. */
export const NO_CAP = 1e12;

/** The rider's yearly co-payment cap on both insurers, on panel. */
export const COPAY_CAP = 6000;

export interface ClaimSplit {
  plan: number;
  client: number;
}

export function claimSplit(
  bill: number,
  deductible: number,
  rate: number,
  cap: number,
  covered: boolean,
): ClaimSplit {
  if (!covered) return { plan: 0, client: bill };
  const left = Math.max(0, bill - deductible);
  const copay = Math.min(left * rate, cap);
  return { plan: left - copay, client: bill - (left - copay) };
}

export interface EverydayScenario {
  title: string;
  bill: number;
  singlifeDeductible: number;
  incomeDeductible: number;
  covered: boolean;
  note: string;
}

/** Both plans: 5% co-payment on panel, capped at $6,000 a year. */
export function everydayClaim(s: EverydayScenario) {
  return {
    singlife: claimSplit(s.bill, s.singlifeDeductible, 0.05, COPAY_CAP, s.covered),
    income: claimSplit(s.bill, s.incomeDeductible, 0.05, COPAY_CAP, s.covered),
  };
}

/**
 * Off panel: Singlife 5% uncapped; Income 8%, capped only on its Extended
 * Panel. The source's deductible pick is kept as written — $3,500 inpatient
 * above $100,000 (an admission), otherwise the day-surgery deductibles.
 */
export function offPanelClaim(bill: number) {
  const admission = bill > 100000;
  const singlifeDeductible = admission ? 3500 : 2000;
  const incomeDeductible = 3500;
  return {
    singlife: claimSplit(bill, singlifeDeductible, 0.05, NO_CAP, true),
    incomeExtended: claimSplit(bill, incomeDeductible, 0.08, COPAY_CAP, true),
    incomeAny: claimSplit(bill, incomeDeductible, 0.08, NO_CAP, true),
  };
}

export interface CancerScenario {
  title: string;
  /** Treatment cost for the year (or the one-off). */
  cost: number;
  months: number;
  /** MediShield Life claim limit per month; 0 off the Cancer Drug List. */
  mshlLimit: number;
  onDrugList: boolean;
  /** Cancer Cover Plus II's own monthly deductible. */
  topUpDeductible: number;
  /** Deductible taken before the plan pays. */
  planDeductible: number;
  incomeCap: number;
  /** Off-list monthly cover per insurer. */
  singlifeCover?: number;
  incomeCover?: number;
  incomeRate?: number;
  singlifeCap?: number;
  note: string;
}

export interface CancerOutcome {
  /** What the plan covers per month. */
  cover: number;
  plan: number;
  /** What Cancer Cover Plus II adds when held, paying AFTER the Shield plan. */
  topUp: number;
  client: number;
  clientWithTopUp: number;
}

export function cancerOutcome(s: CancerScenario, isIncome: boolean): CancerOutcome {
  const cover = s.onDrugList
    ? isIncome
      ? 23 * s.mshlLimit
      : 5 * s.mshlLimit + 10000
    : ((isIncome ? s.incomeCover : s.singlifeCover) ?? 0);
  const rate = isIncome ? (s.incomeRate ?? 0.05) : 0.05;
  const cap = isIncome ? s.incomeCap : (s.singlifeCap ?? COPAY_CAP);
  const takes = Math.min(Math.max(0, s.cost - s.planDeductible), cover * s.months);
  const plan = takes - Math.min(takes * rate, cap);
  const above = Math.max(0, (s.cost - plan) / s.months - s.topUpDeductible);
  const topUp = above * 0.8 * s.months;
  return {
    cover,
    plan,
    topUp,
    client: s.cost - plan,
    clientWithTopUp: s.cost - plan - topUp,
  };
}
