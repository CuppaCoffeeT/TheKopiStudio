/**
 * SRS drawdown PRICING — running a withdrawal series year by year and working
 * out what each year actually costs.
 *
 * The series itself is built in `srsSchedules` (level, custom, deferred); this
 * file is where the statutory rules bite — 50% of each withdrawal is
 * chargeable, and whatever is left when the 10-year window closes is deemed
 * withdrawn in ONE year.
 *
 * The window is counted from the FIRST withdrawal, so every age here is
 * relative to `startAge`, never to a fixed 63.
 */

import { forcedPayoutAge, SRS_EXEMPT_FRACTION, taxOnSlice } from './srs';
import { capToWindow, SRS_ZERO_RATE_BAND } from './srsSchedules';

export interface WithdrawalPlanInput {
  /** Balance at the first withdrawal — after any deferral growth. */
  startingBalance: number;
  /** Return still earned on the un-withdrawn balance, as a fraction. */
  growthRate: number;
  /** Other CHARGEABLE income during retirement — eats the tax-free room. */
  otherIncome: number;
  /**
   * Amount to take in each successive year. `equalWithdrawals` builds the level
   * schedule and `customWithdrawals` the period-based one; anything past the
   * statutory window is dropped.
   */
  amounts: number[];
  /** Age the first withdrawal is taken — the statutory age, or later. */
  startAge: number;
}

export interface WithdrawalYear {
  age: number;
  withdrawal: number;
  /** The 50% exemption PLUS whatever of the taxable half fell in the free room. */
  taxFree: number;
  /** What the year is taxed ON — the reference's headline column. */
  taxedPortion: number;
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
  /** Age the window shuts — `startAge` + 9, not a fixed 72. */
  windowEndsAt: number;
  /** Years the plan actually pays out, after the window cap and any early stop. */
  yearsDrawn: number;
  /** Mean annual withdrawal — compared against the tax-free ceiling. */
  averagePerYear: number;
}

/** Tax on one year's withdrawal, and how much of it escapes tax entirely. */
function taxOneWithdrawal(withdrawal: number, otherIncome: number) {
  const exempt = withdrawal * SRS_EXEMPT_FRACTION;
  const chargeable = withdrawal - exempt;
  // The first $20,000 of chargeable income is untaxed — other income consumes
  // that room first.
  const freeRoom = Math.max(0, SRS_ZERO_RATE_BAND - otherIncome);
  const shelteredByRoom = Math.min(chargeable, freeRoom);
  const taxFree = exempt + shelteredByRoom;
  return {
    taxFree,
    taxedPortion: withdrawal - taxFree,
    tax: taxOnSlice(otherIncome, chargeable),
  };
}

/** Run a withdrawal series year by year from `startAge`. */
export function planWithdrawals(input: WithdrawalPlanInput): WithdrawalPlan {
  const amounts = capToWindow(input.amounts);
  let balance = input.startingBalance;
  let totalWithdrawn = 0;
  let totalGrowth = 0;
  let totalTaxFree = 0;
  let totalTax = 0;
  const schedule: WithdrawalYear[] = [];

  for (let year = 0; year < amounts.length; year += 1) {
    if (balance < 1) break;
    const requested = amounts[year];
    if (requested <= 0) continue;

    const growth = balance * input.growthRate;
    balance += growth;
    totalGrowth += growth;

    const withdrawal = Math.min(requested, balance);
    balance -= withdrawal;
    totalWithdrawn += withdrawal;

    const { taxFree, taxedPortion, tax } = taxOneWithdrawal(withdrawal, input.otherIncome);
    totalTaxFree += taxFree;
    totalTax += tax;

    schedule.push({
      age: input.startAge + year,
      withdrawal,
      taxFree,
      taxedPortion,
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
    windowEndsAt: forcedPayoutAge(input.startAge),
    yearsDrawn: schedule.length,
    averagePerYear: schedule.length > 0 ? totalWithdrawn / schedule.length : 0,
  };
}
