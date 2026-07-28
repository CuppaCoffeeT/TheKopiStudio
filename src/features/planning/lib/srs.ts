/**
 * Supplementary Retirement Scheme — contribution projection and withdrawal
 * schedule. Ported from the `srs-final` reference.
 *
 * The two halves answer different questions and are deliberately separate:
 *
 *   `projectContributions` — what does putting money in save me now, and what
 *                            will the balance be at the statutory age?
 *   `planWithdrawals`      — taking it out over N years, how much is actually
 *                            tax-free and what do I pay?
 *
 * THE RULES THAT DRIVE EVERYTHING (Singapore SRS):
 * - Withdrawals may begin penalty-free at the statutory retirement age that
 *   applied when the FIRST contribution was made (63 for current contributors).
 * - Only 50% of each withdrawal is chargeable — the other half is exempt.
 * - The penalty-free window is 10 years. Anything still in the account at the
 *   end is deemed withdrawn in one lump and taxed in that year, which is the
 *   whole point of spreading withdrawals out.
 *
 * Tax comes from `singaporeTax` — the same ladder the tax calculator uses, so
 * the two tools can never quote different numbers for the same income.
 */

import { grossTax } from './singaporeTax';

/** Penalty-free withdrawals start here for current contributors. */
export const SRS_WITHDRAWAL_AGE = 63;

/** The penalty-free window, in years. Whatever is left is force-paid after it. */
export const SRS_WITHDRAWAL_WINDOW_YEARS = 10;

/** Age at which any remaining balance is deemed withdrawn. */
export const SRS_FORCED_PAYOUT_AGE = SRS_WITHDRAWAL_AGE + SRS_WITHDRAWAL_WINDOW_YEARS - 1;

/** Half of every withdrawal is exempt from tax. */
export const SRS_EXEMPT_FRACTION = 0.5;

/** Annual contribution cap for citizens and PRs. */
export const SRS_CAP_CITIZEN = 15_300;

/** Annual contribution cap for foreigners. */
export const SRS_CAP_FOREIGNER = 35_700;

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
}

export interface ContributionYear {
  age: number;
  contribution: number;
  growth: number;
  balance: number;
  taxSaved: number;
}

export interface ContributionProjection {
  taxWithoutSrs: number;
  taxWithSrs: number;
  /** What this year's contribution is worth. */
  taxSavedThisYear: number;
  effectiveRateBefore: number;
  effectiveRateAfter: number;
  years: ContributionYear[];
  /** Projected balance at `SRS_WITHDRAWAL_AGE`. */
  balanceAtWithdrawalAge: number;
  /** This year's saving plus every future year's. */
  lifetimeTaxSaved: number;
  totalContributed: number;
}

/**
 * Grow the balance to the statutory withdrawal age.
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

  const yearsToWithdrawal = Math.max(0, SRS_WITHDRAWAL_AGE - input.currentAge);
  let balance = input.currentBalance;
  let lifetimeTaxSaved = taxSavedThisYear;
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
    totalContributed += contribution;

    years.push({ age, contribution, growth, balance, taxSaved });
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
