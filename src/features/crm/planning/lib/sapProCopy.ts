/**
 * SAP PRO — the inputs' options and every sentence the sheet computes, ported
 * verbatim from `income-illustrator2.html`'s `render()`. Golden-locked with the
 * maths in `__tests__/sapPro.test.ts`: a reworded hint is a failing test, on
 * purpose — these lines are what the advisor reads to a recruit.
 */

import { money } from './format';
import { incomeSupport, type SapIllustration, type SapTier, type SapYear } from './sapProMath';

export const SAP_DEFAULTS = { tier: 5000 as SapTier, flat: 3000, rate: 0.2, year: 1 } as const;
/** Stepper increment and the slider's ceiling — typing may go above it. */
export const SAP_STEP = 250;
export const SAP_SLIDER_MAX = 15000;
export const SAP_PRESETS = [1500, 3000, 5000, 8000] as const;
export const SAP_RATES = [0.1, 0.2, 0.3, 0.4] as const;

export const SAP_TIERS: readonly { value: SapTier; label: string; term: string }[] = [
  { value: 0, label: 'None', term: 'no scheme' },
  { value: 1000, label: '$1k', term: '12 mths' },
  { value: 5000, label: '$5k', term: '24 mths' },
  { value: 8000, label: '$8k', term: '24 mths' },
  { value: 10000, label: '$10k', term: '24 mths' },
];

export function tierHint(tier: SapTier): string {
  if (tier === 0) return 'Commission and bonuses only, no allowance.';
  if (tier === 1000) return 'Full $1,000 needs $1,000 base commission a month. Minimum $200. Paid for 12 months.';
  return `Full ${money(tier)} needs ${money(tier * 1.25)} base commission a month. Minimum $500 in months 1–3, then $1,250. Paid for 24 months.`;
}

/** What a flat base unlocks in a normal month (month 4). Null when silent. */
export function payHint(tier: SapTier, flat: number, custom: boolean): { text: string; warn: boolean } | null {
  if (custom || tier === 0) return null;
  const support = incomeSupport(tier, 4, flat);
  if (support === 0) {
    const tail = tier !== 1000 && flat >= 500 ? ' after month 3.' : '.';
    return { text: `Below the minimum: no income support at this level${tail}`, warn: true };
  }
  const pct = Math.round((support / tier) * 100);
  return {
    text: pct >= 100 ? 'Full income support unlocked.' : `Unlocks ${pct}% of the support: ${money(support)} a month.`,
    warn: false,
  };
}

export function equationTitle(custom: boolean, year: number): string {
  return `${custom ? 'An average month in Year ' : 'A month in Year '}${year}`;
}

export function bonusLabel(tier: SapTier, year: number): string {
  return tier !== 0 && year === 1 ? 'Monthly bonus: none in Year 1 on the scheme' : 'Monthly bonus 25%';
}

/** The equation for one year's average month, plus its quarter. */
export function averageMonth(y: SapYear) {
  return {
    base: y.base / 12,
    support: y.support / 12,
    bonus: y.bonus / 12,
    total: (y.base + y.support + y.bonus) / 12,
    quarterBase: y.base / 4,
    quarterly: y.quarterly / 4,
  };
}

export function quarterText(quarterBase: number, rate: number): string {
  return `Plus every quarter: ${money(quarterBase)} (3 months of base) × ${Math.round(rate * 100)}% quarterly bonus`;
}

/** The small line under each year's label. `index` is 0-based. */
export function yearNote(index: number, tier: SapTier): string {
  if (index === 2) return 'No income support';
  if (index === 1 && tier === 1000) return 'Support ended at month 12';
  if (tier === 0) return 'No income support';
  return index === 0 ? 'With support, no monthly bonus' : 'With income support';
}

/** Segment widths — base, monthly bonus, quarterly, support — against the best year. */
export function barWidths(years: readonly SapYear[]): string[][] {
  const max = Math.max(...years.map((y) => y.total)) || 1;
  const pct = (v: number) => `${((v / max) * 100).toFixed(2)}%`;
  return years.map((y) => [pct(y.base), pct(y.bonus), pct(y.quarterly), pct(y.support)]);
}

export function grandTotal(years: readonly SapYear[]): number {
  return years[0].total + years[1].total + years[2].total;
}

export interface SapTableRow {
  key: string;
  label: string;
  /** Base · Support · Monthly bonus · Quarterly bonus · Total. */
  cells: number[];
  yearSum: boolean;
}

/** "See every month": 36 rows with a Year subtotal after every twelfth. */
export function monthTableRows({ months, years }: SapIllustration): SapTableRow[] {
  const cells = (r: SapYear) => [r.base, r.support, r.bonus, r.quarterly, r.total];
  return months.flatMap((row) => {
    const out: SapTableRow[] = [{ key: `m${row.month}`, label: String(row.month), cells: cells(row), yearSum: false }];
    if (row.month % 12 === 0) {
      const y = row.month / 12;
      out.push({ key: `y${y}`, label: `Year ${y}`, cells: cells(years[y - 1]), yearSum: true });
    }
    return out;
  });
}
