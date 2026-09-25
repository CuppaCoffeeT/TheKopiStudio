/**
 * SAP PRO — the scheme arithmetic behind tool 08: what a new ADVISOR earns in
 * their first 36 months from base commission, the 25% monthly bonus (BDB), the
 * quarterly bonus and the income support scheme.
 *
 * Ported 2026-09-25 from the advisor's standalone `income-illustrator2.html`
 * (`support` + `compute`), operation for operation — including the order the
 * floats are summed in. `__tests__/sapPro.test.ts` locks it against that
 * sheet's own output. Faithful, not "improved": see planning/CONTEXT.md.
 *
 * Pure: no dates, no I/O. Nothing here is persisted.
 */

export const SAP_MONTHS = 36;
/** Monthly bonus (BDB) — a flat 25% of base commission. */
export const SAP_BDB_RATE = 0.25;

/** Income support tier, in dollars a month. 0 = not on the scheme. */
export type SapTier = 0 | 1000 | 5000 | 8000 | 10000;

export interface SapMonth {
  month: number;
  base: number;
  bonus: number;
  support: number;
  quarterly: number;
  total: number;
}

export type SapYear = Omit<SapMonth, 'month'>;

export interface SapIllustration {
  months: SapMonth[];
  /** Exactly three: Year 1, Year 2, Year 3. */
  years: SapYear[];
}

/**
 * Income support for one month, given that month's base commission (treated
 * as EFYC). $1k tier: months 1–12, $200 floor, full at $1,000. $5k/$8k/$10k:
 * months 1–24, floor $500 in months 1–3 then $1,250, full at 1.25 × the tier.
 * Pro-rated between floor and target, rounded to the dollar.
 */
export function incomeSupport(tier: SapTier, month: number, base: number): number {
  if (tier === 0) return 0;
  if (tier === 1000) {
    if (month > 12 || base < 200) return 0;
    return Math.round(Math.min(base / 1000, 1) * 1000);
  }
  if (month > 24) return 0;
  const floor = month <= 3 ? 500 : 1250;
  if (base < floor) return 0;
  return Math.round(Math.min(base / (tier * 1.25), 1) * tier);
}

/**
 * The 36-month illustration. `bases` holds one base commission per month
 * (index 0 = month 1); `rate` is the quarterly bonus rate (0.1–0.4).
 * On the scheme there is no BDB in months 1–12. The quarterly bonus is the
 * rate on the quarter's three bases, paid in months 3, 6, 9 …
 */
export function illustrateIncome(tier: SapTier, rate: number, bases: readonly number[]): SapIllustration {
  const months: SapMonth[] = [];
  for (let i = 0; i < SAP_MONTHS; i++) {
    const month = i + 1;
    const base = bases[i] ?? 0;
    const noBdb = tier !== 0 && month <= 12;
    const row: SapMonth = {
      month,
      base,
      bonus: noBdb ? 0 : base * SAP_BDB_RATE,
      support: incomeSupport(tier, month, base),
      quarterly: 0,
      total: 0,
    };
    if (month % 3 === 0) {
      let quarterBase = 0;
      for (let k = month - 3; k < month; k++) quarterBase += k < i ? months[k].base : base;
      row.quarterly = quarterBase * rate;
    }
    row.total = row.base + row.bonus + row.support + row.quarterly;
    months.push(row);
  }

  const years = [1, 2, 3].map((year) => {
    const sum: SapYear = { base: 0, bonus: 0, support: 0, quarterly: 0, total: 0 };
    months.slice((year - 1) * 12, year * 12).forEach((row) => {
      sum.base += row.base;
      sum.bonus += row.bonus;
      sum.support += row.support;
      sum.quarterly += row.quarterly;
      sum.total += row.total;
    });
    return sum;
  });

  return { months, years };
}

/** The sheet's `num`: a typed amount, blank / junk / negative reading as 0. */
export function parseAmount(raw: string | number): number {
  const value = typeof raw === 'number' ? raw : parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

/** Flat mode repeats one base for all 36 months; custom mode uses the grid. */
export function monthlyBases(custom: boolean, flat: number, months: readonly number[]): number[] {
  return custom ? [...months] : Array.from({ length: SAP_MONTHS }, () => flat);
}
