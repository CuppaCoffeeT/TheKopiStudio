/**
 * SRS drawdown SHAPES — how much to take in each year, before any tax is
 * priced. Split from `srsWithdrawals` along the seam the tool draws on screen:
 * this file decides the series, that one prices it.
 *
 * Two shapes, both from the reference tool:
 *   `equalWithdrawals`  — one level payment that exactly exhausts the balance
 *   `customWithdrawals` — up to three advisor-defined periods (amount × years)
 *
 * There is no deferral shape. Deferring the first withdrawal is not part of the
 * drawdown at all — the years before it belong to accumulation, and
 * `projectContributions` now runs through them. See `srs.ts`.
 */

import { SRS_EXEMPT_FRACTION, SRS_WITHDRAWAL_WINDOW_YEARS } from './srs';

/**
 * The zero-rate band: the first $20,000 of chargeable income is untaxed.
 * Personal reliefs sit on top of this and are deliberately ignored here — the
 * tool quotes the floor case, not an optimised one.
 */
export const SRS_ZERO_RATE_BAND = 20_000;

/**
 * A level annual withdrawal that exactly empties the account over `years`.
 *
 * Growth is credited BEFORE each withdrawal, so this is the annuity-due form:
 *
 *   PMT = PV · r · (1 + r)^n / ((1 + r)^n − 1)
 *
 * The earlier port took `balance / years remaining` each year, which also
 * exhausts the account but produces a RISING series — every year's withdrawal
 * a different number, and a different tax answer. A level payment is what an
 * advisor can actually commit a customer to, and it is what the reference now
 * does.
 */
export function equalWithdrawals(
  startingBalance: number,
  growthRate: number,
  years: number,
): number[] {
  const span = Math.max(1, Math.floor(years));
  const rate = growthRate;
  const level =
    rate === 0
      ? startingBalance / span
      : (startingBalance * rate * (1 + rate) ** span) / ((1 + rate) ** span - 1);
  return Array.from({ length: span }, () => level);
}

/** One leg of a custom drawdown — take `amount` a year for `years` years. */
export interface WithdrawalPeriod {
  amount: number;
  years: number;
}

/** How many custom periods the tool offers. Three covers every real plan. */
export const MAX_WITHDRAWAL_PERIODS = 3;

/**
 * Flatten advisor-defined periods into a year-by-year series. Periods with no
 * years (or no money) simply contribute nothing, so an unused row is harmless.
 */
export function customWithdrawals(periods: WithdrawalPeriod[]): number[] {
  const amounts: number[] = [];
  for (const period of periods) {
    const span = Math.max(0, Math.floor(period.years));
    const amount = Math.max(0, period.amount);
    for (let year = 0; year < span; year += 1) amounts.push(amount);
  }
  return amounts;
}

/** No plan may run past the statutory window, however it was built. */
export function capToWindow(amounts: number[]): number[] {
  return amounts.slice(0, SRS_WITHDRAWAL_WINDOW_YEARS);
}

/**
 * The most that can come out in a year without any tax at all.
 *
 * Room under the zero-rate band, DOUBLED — because only half of an SRS
 * withdrawal is chargeable, $2 comes out for every $1 of room. With no other
 * taxable income that is $40,000 a year. CPF LIFE payouts are not taxable and
 * must not be counted in `otherIncome`.
 */
export function annualTaxFreeCeiling(otherIncome: number): number {
  const room = Math.max(0, SRS_ZERO_RATE_BAND - otherIncome);
  return room / (1 - SRS_EXEMPT_FRACTION);
}
