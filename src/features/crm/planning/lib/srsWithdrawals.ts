/**
 * SRS drawdown — turning a balance into a withdrawal schedule, and pricing it.
 *
 * Split from `srs.ts` (W23 LOC ceiling) along the seam the tool already draws
 * on screen: that file answers "what does paying in save me?", this one
 * answers "what does taking it out cost?". The second is where the statutory
 * rules bite — 50% of each withdrawal is chargeable, and whatever is left when
 * the 10-year window closes is deemed withdrawn in ONE year.
 */

import { SRS_EXEMPT_FRACTION, SRS_WITHDRAWAL_AGE, taxOnSlice } from './srs';

export interface WithdrawalPlanInput {
  /** Balance at `SRS_WITHDRAWAL_AGE` — usually the projection's output. */
  startingBalance: number;
  /** Return still earned on the un-withdrawn balance, as a fraction. */
  growthRate: number;
  /** Other chargeable income during retirement — eats the tax-free room. */
  otherIncome: number;
  /**
   * Amount to take in each successive year. `equalWithdrawals` builds the even
   * schedule; a caller may pass any custom series instead.
   */
  amounts: number[];
}

export interface WithdrawalYear {
  age: number;
  withdrawal: number;
  /** The 50% exemption PLUS whatever of the taxable half fell in the free room. */
  taxFree: number;
  tax: number;
  endBalance: number;
}

export interface WithdrawalPlan {
  schedule: WithdrawalYear[];
  totalWithdrawn: number;
  totalGrowth: number;
  totalTaxFree: number;
  totalTax: number;
  netReceived: number;
  /** Still in the account when the series runs out. */
  remainingBalance: number;
  /** Tax on the forced lump-sum payout of `remainingBalance`. Zero when clear. */
  forcedPayoutTax: number;
  /** True when the plan does NOT empty the account inside the window. */
  leavesRemainder: boolean;
  effectiveTaxRate: number;
}

/**
 * An even drawdown that empties the account over `years`, allowing for growth
 * on the shrinking balance. Each year takes `balance / years remaining`.
 */
export function equalWithdrawals(
  startingBalance: number,
  growthRate: number,
  years: number,
): number[] {
  const amounts: number[] = [];
  let balance = startingBalance;
  for (let i = 0; i < years; i += 1) {
    balance += balance * growthRate;
    const amount = balance / (years - i);
    amounts.push(amount);
    balance -= amount;
  }
  return amounts;
}

/** Tax on one year's withdrawal, and how much of it escapes tax entirely. */
function taxOneWithdrawal(withdrawal: number, otherIncome: number) {
  const exempt = withdrawal * SRS_EXEMPT_FRACTION;
  const chargeable = withdrawal - exempt;
  // Personal reliefs aside, the first $20,000 of chargeable income is untaxed —
  // other income consumes that room first.
  const freeRoom = Math.max(0, 20_000 - otherIncome);
  const shelteredByRoom = Math.min(chargeable, freeRoom);
  return {
    taxFree: exempt + shelteredByRoom,
    tax: taxOnSlice(otherIncome, chargeable),
  };
}

/** Run a withdrawal series year by year from `SRS_WITHDRAWAL_AGE`. */
export function planWithdrawals(input: WithdrawalPlanInput): WithdrawalPlan {
  let balance = input.startingBalance;
  let totalWithdrawn = 0;
  let totalGrowth = 0;
  let totalTaxFree = 0;
  let totalTax = 0;
  const schedule: WithdrawalYear[] = [];

  for (let year = 0; year < input.amounts.length; year += 1) {
    if (balance < 1) break;
    const requested = input.amounts[year];
    if (requested <= 0) continue;

    const growth = balance * input.growthRate;
    balance += growth;
    totalGrowth += growth;

    const withdrawal = Math.min(requested, balance);
    balance -= withdrawal;
    totalWithdrawn += withdrawal;

    const { taxFree, tax } = taxOneWithdrawal(withdrawal, input.otherIncome);
    totalTaxFree += taxFree;
    totalTax += tax;

    schedule.push({
      age: SRS_WITHDRAWAL_AGE + year,
      withdrawal,
      taxFree,
      tax,
      endBalance: balance,
    });
  }

  // Anything left is deemed withdrawn in one lump at the end of the window —
  // one big slice on top of other income, which is where the tax bites.
  const leavesRemainder = balance > 100;
  const forcedPayoutTax = leavesRemainder
    ? taxOnSlice(input.otherIncome, balance * (1 - SRS_EXEMPT_FRACTION))
    : 0;

  return {
    schedule,
    totalWithdrawn,
    totalGrowth,
    totalTaxFree,
    totalTax,
    netReceived: totalWithdrawn - totalTax,
    remainingBalance: balance,
    forcedPayoutTax,
    leavesRemainder,
    effectiveTaxRate: totalWithdrawn > 0 ? (totalTax / totalWithdrawn) * 100 : 0,
  };
}
