/**
 * Supplementary Retirement Scheme — contribution projection and the statutory
 * constants the whole tool hangs off. Ported from the `srs tool` reference.
 *
 * The halves answer different questions and are deliberately separate:
 *
 *   `projectContributions` — what does putting money in save me now, and what
 *                            will the balance be at my withdrawal age?
 *   `planWithdrawals`      — taking it out over N years, how much is actually
 *                            tax-free and what do I pay?  (`srsWithdrawals`)
 *
 * THE RULES THAT DRIVE EVERYTHING (Singapore SRS):
 * - The penalty-free withdrawal age is LOCKED IN at the statutory retirement
 *   age that applied when the FIRST contribution was made — 62, 63 or 64. It is
 *   a property of the customer, not a constant, which is why it is an input.
 * - Only 50% of each withdrawal is chargeable — the other half is exempt.
 * - The penalty-free window is 10 years and it starts at the FIRST withdrawal,
 *   not at the statutory age. Delaying shifts the whole window later while the
 *   balance keeps compounding. Anything still in the account when the window
 *   shuts is deemed withdrawn in one lump and taxed in that year, which is the
 *   whole point of spreading withdrawals out.
 *
 * Tax comes from `singaporeTax` — the same ladder the tax calculator uses, so
 * the two tools can never quote different numbers for the same income.
 */

import { grossTax } from './singaporeTax';

/**
 * The three statutory ages a customer's penalty-free withdrawal age can be.
 * Which one applies is fixed by the date of the FIRST contribution: before
 * 1 Jul 2022 → 62 · before 1 Jul 2026 → 63 · from 1 Jul 2026 → 64.
 */
export const SRS_STATUTORY_AGES = [62, 63, 64] as const;

/** Used when nothing better is known — the current contributor's age. */
export const SRS_DEFAULT_WITHDRAWAL_AGE = 63;

/** The penalty-free window, in years. Whatever is left is force-paid after it. */
export const SRS_WITHDRAWAL_WINDOW_YEARS = 10;

/** Half of every withdrawal is exempt from tax. */
export const SRS_EXEMPT_FRACTION = 0.5;

/** Annual contribution cap for citizens and PRs. */
export const SRS_CAP_CITIZEN = 15_300;

/** Annual contribution cap for foreigners. */
export const SRS_CAP_FOREIGNER = 35_700;

/**
 * The age any remaining balance is deemed withdrawn at.
 *
 * Counted from the FIRST withdrawal, not from the statutory age — a customer
 * who defers to 67 has a window that shuts at 76, not 72.
 */
export function forcedPayoutAge(firstWithdrawalAge: number): number {
  return firstWithdrawalAge + SRS_WITHDRAWAL_WINDOW_YEARS - 1;
}

/**
 * Tax attributable to an extra slice of income on top of a base — the marginal
 * cost of that slice, not an average. Used for both the contribution saving and
 * the withdrawal charge, so the two are symmetrical by construction.
 */
export function taxOnSlice(baseIncome: number, slice: number): number {
  return grossTax(baseIncome + slice) - grossTax(baseIncome);
}

export interface ContributionProjectionInput {
  currentAge: number;
  /** Chargeable income before the SRS deduction. */
  annualIncome: number;
  /** This year's contribution — drives the headline "tax saved this year". */
  contributionThisYear: number;
  currentBalance: number;
  /** Expected annual return as a fraction (0.04 = 4%). */
  growthRate: number;
  /** Contribution made in each FUTURE year, until `contributeUntilAge`. */
  annualContribution: number;
  contributeUntilAge: number;
  /** The customer's locked-in penalty-free age — where the projection stops. */
  withdrawalAge: number;
}

export interface ContributionYear {
  age: number;
  contribution: number;
  growth: number;
  balance: number;
  taxSaved: number;
  /** Running total of `taxSaved` across the projected years only. */
  cumulativeTaxSaved: number;
}

export interface ContributionProjection {
  taxWithoutSrs: number;
  taxWithSrs: number;
  /** What this year's contribution is worth. */
  taxSavedThisYear: number;
  effectiveRateBefore: number;
  effectiveRateAfter: number;
  years: ContributionYear[];
  /** Projected balance at the customer's withdrawal age. */
  balanceAtWithdrawalAge: number;
  /** This year's saving plus every future year's. */
  lifetimeTaxSaved: number;
  totalContributed: number;
}

/**
 * Grow the balance to the customer's withdrawal age.
 *
 * Order within a year is growth-then-contribution, matching the reference:
 * `balance = balance + balance*rate + contribution`. A contribution made during
 * the year therefore earns nothing in that year, which is the conservative
 * reading and the one the advisor's existing spreadsheet uses.
 */
export function projectContributions(input: ContributionProjectionInput): ContributionProjection {
  const taxWithoutSrs = grossTax(input.annualIncome);
  const taxWithSrs = grossTax(Math.max(input.annualIncome - input.contributionThisYear, 0));
  const taxSavedThisYear = taxWithoutSrs - taxWithSrs;

  const yearsToWithdrawal = Math.max(0, input.withdrawalAge - input.currentAge);
  let balance = input.currentBalance;
  let lifetimeTaxSaved = taxSavedThisYear;
  let cumulativeTaxSaved = 0;
  let totalContributed = input.currentBalance + input.contributionThisYear;
  const years: ContributionYear[] = [];

  for (let year = 1; year <= yearsToWithdrawal; year += 1) {
    const age = input.currentAge + year;
    const contributing = age <= input.contributeUntilAge;
    const contribution = contributing ? input.annualContribution : 0;
    const growth = balance * input.growthRate;
    balance = balance + growth + contribution;

    const taxSaved = contributing
      ? grossTax(input.annualIncome) - grossTax(Math.max(input.annualIncome - contribution, 0))
      : 0;
    lifetimeTaxSaved += taxSaved;
    cumulativeTaxSaved += taxSaved;
    totalContributed += contribution;

    years.push({ age, contribution, growth, balance, taxSaved, cumulativeTaxSaved });
  }

  return {
    taxWithoutSrs,
    taxWithSrs,
    taxSavedThisYear,
    effectiveRateBefore: input.annualIncome > 0 ? (taxWithoutSrs / input.annualIncome) * 100 : 0,
    effectiveRateAfter: input.annualIncome > 0 ? (taxWithSrs / input.annualIncome) * 100 : 0,
    years,
    balanceAtWithdrawalAge: balance,
    lifetimeTaxSaved,
    totalContributed,
  };
}

/**
 * The ages the projection table shows — today, every fifth birthday after it,
 * and the withdrawal age itself. A 45-year run of rows tells an advisor
 * nothing; five or six milestones tell the story.
 */
export function milestoneAges(currentAge: number, withdrawalAge: number): number[] {
  const ages = [currentAge];
  for (let age = Math.ceil(currentAge / 5) * 5; age < withdrawalAge; age += 5) {
    if (age > currentAge) ages.push(age);
  }
  if (!ages.includes(withdrawalAge)) ages.push(withdrawalAge);
  return ages;
}

/**
 * The projected years reduced to the milestone rows.
 *
 * The current age never appears — the projection starts at the year AFTER it,
 * which is what the reference table shows and what the balance column means.
 */
export function milestoneRows(
  projection: ContributionProjection,
  currentAge: number,
  withdrawalAge: number,
): ContributionYear[] {
  const wanted = new Set(milestoneAges(currentAge, withdrawalAge));
  return projection.years.filter((year) => wanted.has(year.age));
}
