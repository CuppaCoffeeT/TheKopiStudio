/**
 * CPF projection WITH future contributions.
 *
 * Ported from the advisor's reference CRM (`insurance_crm (36).html`), which
 * extends the legacy projection in the one way that actually changes advice:
 * it keeps paying CPF in.
 *
 * WHY THIS IS A SEPARATE FUNCTION and not a change to `projectCPFTo55`:
 * `finance.ts` is golden-locked — `__tests__/finance.test.ts` replays 115
 * vectors FLOAT-EXACT, and its per-year operation order is load-bearing.
 * Touching it to add contributions would break every vector for no reason,
 * because the two projections answer different questions:
 *
 *   projectCPFTo55            "what do today's balances grow to?"
 *   projectCPFTo55WithFutureContributions
 *                             "...and what if they keep earning?"
 *
 * With NO income steps defined the two agree exactly (see the corpus), so the
 * report can call this one unconditionally and a customer with nothing filled
 * in projects precisely as they do today. That equivalence is asserted, not
 * assumed.
 *
 * THE GAP IT CLOSES: without contributions a 35-year-old and a 54-year-old with
 * identical balances project identically — the twenty years of contributions
 * the younger one will actually make simply do not exist. That is wrong by a
 * wide margin and it is the headline reason the reference CRM models income.
 *
 * Rates are the reference's own (official 2026 CPF data). Kept verbatim: a
 * "corrected" rate that disagrees with the advisor's spreadsheet costs more
 * trust than it buys.
 */

import { BHS_2026 } from './finance';
import { cpfAllocation, cpfContributionRate, MONTHLY_SALARY_CAP } from './cpfRates';
import { incomeForAge, type IncomeStep } from './incomeSteps';

const OA_RATE = 0.025;
const SA_RATE = 0.04;
const MA_RATE = 0.04;

export interface CpfWithContributionsInput {
  cpfOA: number;
  cpfSA: number;
  cpfMA: number;
  currentAge: number;
  /** Empty ⇒ identical output to the golden `projectCPFTo55`. */
  incomeSteps: readonly IncomeStep[];
  /**
   * Medisave ceiling. Defaults to the Basic Healthcare Sum; pass `Infinity` to
   * run the no-overflow counterfactual `saBoostFromOverflow` is measured
   * against. Not a knob for callers to tune — it exists so the boost figure is
   * DERIVED rather than guessed.
   */
  bhsCap?: number;
}

export interface CpfWithContributionsProjection {
  oaAt55: number;
  saAt55: number;
  maAt55: number;
  totalCPFAt55: number;
  /** Medisave spill into SA once the Basic Healthcare Sum caps it. */
  totalOverflow: number;
  /**
   * How much larger SA at 55 is BECAUSE of that spill — the projection minus
   * the same projection run with no Medisave ceiling. Derived, not estimated:
   * the overflow compounds after it lands, so it is worth more than
   * `totalOverflow` itself.
   */
  saBoostFromOverflow: number;
  /** Contributions paid in across the projection, before any interest. */
  totalFutureContributions: number;
  /** Of that, the part routed to OA / SA (raw, pre-interest). */
  totalContributedToOA: number;
  totalContributedToSA: number;
  /** Years actually simulated — 0 for someone already 55 or older. */
  yearsProjected: number;
}

/**
 * Grow balances to 55, paying in along the way.
 *
 * Per-year order, matching the reference exactly:
 *   1. add this year's contribution, split by the age's allocation
 *   2. grow OA and MA
 *   3. clip MA at the BHS, spilling the excess into SA
 *   4. grow SA
 *
 * Step 3 sits between the two growth steps on purpose — the same
 * grow → clip → overflow → grow order the golden `projectCPFTo55` uses. Moving
 * the clip changes the answer.
 */
export function projectCPFTo55WithFutureContributions(
  input: CpfWithContributionsInput,
): CpfWithContributionsProjection {
  const yearsTo55 = Math.max(0, 55 - input.currentAge);
  const bhsCap = input.bhsCap ?? BHS_2026;

  let oa = input.cpfOA;
  let sa = input.cpfSA;
  let ma = input.cpfMA;
  let totalOverflow = 0;
  let totalFutureContributions = 0;
  let totalContributedToOA = 0;
  let totalContributedToSA = 0;

  for (let year = 0; year < yearsTo55; year += 1) {
    const age = input.currentAge + year;

    // 1. Contribution for this year, if the customer is still earning.
    const annualIncome = incomeForAge(input.incomeSteps, age);
    if (annualIncome > 0 && age < 55) {
      const monthly = Math.min(annualIncome / 12, MONTHLY_SALARY_CAP);
      const contribution = monthly * cpfContributionRate(age) * 12;
      const allocation = cpfAllocation(age);

      totalFutureContributions += contribution;

      ma += contribution * allocation.ma;

      const toSA = contribution * allocation.sa;
      sa += toSA;
      totalContributedToSA += toSA;

      const toOA = contribution * allocation.oa;
      oa += toOA;
      totalContributedToOA += toOA;
    }

    // 2. Interest on OA and MA.
    oa *= 1 + OA_RATE;
    ma *= 1 + MA_RATE;

    // 3. Medisave is capped at the Basic Healthcare Sum; the excess spills to SA.
    if (ma > bhsCap) {
      const overflow = ma - bhsCap;
      totalOverflow += overflow;
      ma = bhsCap;
      sa += overflow;
    }

    // 4. Interest on SA, including anything that just spilled in.
    sa *= 1 + SA_RATE;
  }

  // The counterfactual: same projection, no Medisave ceiling. Skipped when the
  // cap never bit (nothing to measure) and when we ARE the counterfactual, so
  // this never recurses.
  const saBoostFromOverflow =
    totalOverflow > 0 && Number.isFinite(bhsCap)
      ? sa - projectCPFTo55WithFutureContributions({ ...input, bhsCap: Infinity }).saAt55
      : 0;

  return {
    oaAt55: oa,
    saAt55: sa,
    maAt55: ma,
    totalCPFAt55: oa + sa + ma,
    totalOverflow,
    saBoostFromOverflow,
    totalFutureContributions,
    totalContributedToOA,
    totalContributedToSA,
    yearsProjected: yearsTo55,
  };
}
