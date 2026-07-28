/**
 * Singapore resident income tax — the shared engine (YA 2025/2026).
 *
 * Ported from the `sg_tax_calculator.html` reference. The SRS tool needs the
 * same bands to price a withdrawal, so the ladder lives here ONCE rather than
 * being copied into two calculators that would then drift apart the first time
 * IRAS moves a rate.
 *
 * Everything is pure and takes plain numbers. No dates, no `Date.now()` — the
 * caller supplies the age, so a report generated for a past year stays
 * reproducible.
 *
 * SOURCE OF TRUTH: the reference tool's own band table and relief list, kept
 * verbatim. Where the reference rounds or caps, this does too — a "corrected"
 * figure that disagrees with the advisor's own spreadsheet is worse than a
 * faithfully ported one. Deviations, if any, must be recorded in
 * `features/planning/lib/decisions.md`.
 */

/**
 * Progressive bands as `[width, rate]`, lowest first. Cumulative boundaries:
 * 20k · 30k · 40k · 80k · 120k · 160k · 200k · 240k · 280k · 320k · 500k · 1M.
 * Anything above the last band is taxed at `TOP_MARGINAL_RATE`.
 */
const BANDS: readonly (readonly [number, number])[] = [
  [20_000, 0],
  [10_000, 0.02],
  [10_000, 0.035],
  [40_000, 0.07],
  [40_000, 0.115],
  [40_000, 0.15],
  [40_000, 0.18],
  [40_000, 0.19],
  [40_000, 0.195],
  [40_000, 0.2],
  [180_000, 0.22],
  [500_000, 0.23],
];

/** Applies to chargeable income above $1,000,000. */
const TOP_MARGINAL_RATE = 0.24;

/** Total personal reliefs are capped at this figure, however many are claimed. */
export const RELIEF_CAP = 80_000;

/** Approved-IPC donations are deductible at 2.5× the amount given. */
export const DONATION_MULTIPLIER = 2.5;

/** Personal income tax rebate: 60% of gross tax, capped at $200. */
const REBATE_RATE = 0.6;
const REBATE_CAP = 200;

/** Ordinary Wage ceiling used by the employee CPF relief (annualised). */
const CPF_ANNUAL_SALARY_CEILING = 81_600;

/** Gross tax on a chargeable income, before any rebate. */
export function grossTax(chargeableIncome: number): number {
  let tax = 0;
  let remaining = Math.max(chargeableIncome, 0);
  for (const [width, rate] of BANDS) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, width);
    tax += slice * rate;
    remaining -= slice;
  }
  if (remaining > 0) tax += remaining * TOP_MARGINAL_RATE;
  return tax;
}

export interface TaxPayable {
  gross: number;
  /** 60% of gross, capped at $200. */
  rebate: number;
  /** Never negative — the rebate cannot create a refund. */
  net: number;
}

/** Gross tax, the rebate it attracts, and what is actually payable. */
export function computeTax(chargeableIncome: number): TaxPayable {
  const gross = grossTax(chargeableIncome);
  const rebate = Math.min(gross * REBATE_RATE, REBATE_CAP);
  return { gross, rebate, net: Math.max(gross - rebate, 0) };
}

/** Marginal rate the NEXT dollar of chargeable income would attract. */
export function marginalRate(chargeableIncome: number): number {
  let remaining = Math.max(chargeableIncome, 0);
  for (const [width, rate] of BANDS) {
    if (remaining < width) return rate;
    remaining -= width;
  }
  return TOP_MARGINAL_RATE;
}

// ── Auto-computed reliefs ───────────────────────────────────────────────────

/** Earned Income Relief — $1,000 under 55 · $6,000 at 55–59 · $8,000 at 60+. */
export function earnedIncomeRelief(age: number, earnedIncome: number): number {
  const cap = age < 55 ? 1_000 : age < 60 ? 6_000 : 8_000;
  return Math.min(Math.max(earnedIncome, 0), cap);
}

/** Employee CPF relief — age-banded rate on salary up to the annual ceiling. */
export function cpfEmployedRelief(age: number, earnedIncome: number): number {
  const base = Math.min(Math.max(earnedIncome, 0), CPF_ANNUAL_SALARY_CEILING);
  const rate =
    age <= 45 ? 0.2
    : age <= 50 ? 0.19
    : age <= 55 ? 0.18
    : age <= 60 ? 0.145
    : age <= 65 ? 0.13
    : age <= 70 ? 0.09
    : 0.075;
  return base * rate;
}

export interface SeMedisaveRelief {
  amount: number;
  /** True when the age-banded cap bit — the UI shows a "Capped" marker. */
  capped: boolean;
}

/**
 * Self-employed MediSave relief — age-banded rate on net trade income, each
 * band with its own dollar cap. Net trade income at or below $6,000 attracts
 * no contribution at all.
 */
export function seMedisaveRelief(age: number, netTradeIncome: number): SeMedisaveRelief {
  if (netTradeIncome <= 6_000) return { amount: 0, capped: false };
  const [rate, cap] =
    age <= 35 ? [0.08, 7_680]
    : age <= 45 ? [0.09, 8_640]
    : age <= 50 ? [0.095, 9_120]
    : age <= 55 ? [0.1, 9_600]
    : [0.105, 10_080];
  const raw = netTradeIncome * rate;
  return { amount: Math.min(raw, cap), capped: raw > cap };
}

/**
 * Working Mother's Child Relief for children born or adopted from 2024 —
 * a flat $8,000 / $10,000 / $12,000 for the 1st / 2nd / 3rd-and-subsequent.
 */
export function wmcrFixed(children: number): number {
  if (children <= 0) return 0;
  if (children === 1) return 8_000;
  if (children === 2) return 18_000;
  return 30_000 + 12_000 * (children - 3);
}

/**
 * Working Mother's Child Relief for children born before 2024 — 15% / 20% /
 * 25% of earned income for the 1st / 2nd / 3rd-and-subsequent, and the total
 * can never exceed the mother's earned income.
 */
export function wmcrPercentage(children: number, earnedIncome: number): number {
  const pct =
    children <= 0 ? 0
    : children === 1 ? 0.15
    : children === 2 ? 0.35
    : 0.35 + 0.25 * (children - 2);
  return Math.min(pct, 1) * Math.max(earnedIncome, 0);
}
