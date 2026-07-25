/**
 * CRM finance math — EXACT port of legacy `Insurance CRM/src/utils/finance.js`
 * (git c09c549). The caller-inline report formulas live in `financeReport.ts`
 * (one-way import of this module).
 *
 * Golden-locked: `__tests__/finance.test.ts` replays all 115 vectors in
 * `__fixtures__/finance-golden-vectors.json` FLOAT-EXACT. Do NOT refactor
 * operation order (the per-year MA grow → clip → overflow → SA grow loop is
 * load-bearing) and do NOT "fix" the preserved legacy inconsistencies — see
 * `lib/decisions.md` (P2 entries).
 *
 * ONE deliberate change vs legacy: time-dependent functions take an
 * injectable `refYear` instead of calling `new Date()`. The app passes
 * `currentRefYear()`; golden tests pin 2026 (the vector capture year).
 */
import { getSingaporeYear } from '@/utils/timezoneUtils';

export const MEDICAL_INFLATION_RATE = 0.06;
export const AVERAGE_CRITICAL_ILLNESS_COST = 150000;
export const AVERAGE_EARLY_CI_COST = 30000;
export const BHS_2026 = 79000;

export interface RetirementSumRow { brs: number; frs: number; ers: number }

/** Official CPF Retirement Sums (Source: MOM Budget 2022, ~3.5% annual growth). */
export const RETIREMENT_SUMS: Record<number, RetirementSumRow> = {
  2023: { brs: 99400, frs: 198800, ers: 298200 },
  2024: { brs: 102900, frs: 205800, ers: 308700 },
  2025: { brs: 106500, frs: 213000, ers: 426000 },
  2026: { brs: 110200, frs: 220400, ers: 440800 },
  2027: { brs: 114100, frs: 228200, ers: 456400 },
};

/** Legacy `parseFloat(v || 0)` coercion — '' / null / undefined / 0 → 0. */
export function toFloat(value: string | number | null | undefined): number {
  return parseFloat(String(value || 0));
}

/**
 * Reference year for time-dependent math (SG calendar; legacy used
 * `new Date().getFullYear()`). `getSingaporeYear()` pins the zone —
 * `getCurrentSingaporeTime().getFullYear()`, which this used to call, is
 * browser-local and rolls the CPF retirement-sum lookup a year early west of
 * SGT (see `lib/lessons.md`, 2026-07-14).
 */
export function currentRefYear(): number {
  return getSingaporeYear();
}

/** Age as plain year difference (no month/day adjustment); missing dob → 40. */
export function ageFromDOB(dob: string | null | undefined, refYear: number): number {
  if (!dob) return 40;
  return refYear - new Date(dob).getFullYear();
}

export interface PremiumPolicyInput { premium?: string | number | null; frequency?: string | null }

export function annualisePremium(policy: PremiumPolicyInput): number {
  const premium = toFloat(policy.premium);
  switch (policy.frequency) {
    case 'Monthly':
      return premium * 12;
    case 'Quarterly':
      return premium * 4;
    case 'Semi-Annual':
      return premium * 2;
    default:
      return premium;
  }
}

/** $X.XM / $XK tiers; sub-$1K amounts are rounded and locale-formatted. */
export function formatCoverage(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

export interface CpfProjectionInput { cpfOA: number; cpfSA: number; cpfMA: number; yearsTo55: number }
export interface CpfProjection {
  oaAt55: number; saAt55: number; maAt55: number;
  totalOverflow: number; saBoostFromOverflow: number; totalCPFAt55: number;
}

/** OA 2.5% closed-form; MA/SA per-year loop (grow MA → clip at BHS → overflow to SA → grow SA). */
export function projectCPFTo55({ cpfOA, cpfSA, cpfMA, yearsTo55 }: CpfProjectionInput): CpfProjection {
  const oaRate = 0.025;
  const saRate = 0.04;
  const maRate = 0.04;

  let currentMA = cpfMA;
  let currentSA = cpfSA;
  let totalOverflow = 0;

  for (let year = 0; year < yearsTo55; year++) {
    currentMA *= 1 + maRate;
    if (currentMA > BHS_2026) {
      const overflow = currentMA - BHS_2026;
      totalOverflow += overflow;
      currentMA = BHS_2026;
      currentSA += overflow;
    }
    currentSA *= 1 + saRate;
  }

  const oaAt55 = cpfOA * Math.pow(1 + oaRate, yearsTo55);
  const saAt55 = currentSA;
  const maAt55 = currentMA; // initial MA above BHS is NOT clipped when yearsTo55 === 0
  const saWithoutOverflow = cpfSA * Math.pow(1 + saRate, yearsTo55);

  return {
    oaAt55,
    saAt55,
    maAt55,
    totalOverflow,
    saBoostFromOverflow: saAt55 - saWithoutOverflow,
    totalCPFAt55: oaAt55 + saAt55 + maAt55,
  };
}

export interface RetirementSums extends RetirementSumRow { cohortYear: number; projected: boolean }

/** Sums for the turning-55 cohort; >2027 extrapolated at 2.5%/yr; fallback per decisions.md. */
export function retirementSumsFor(dob: string | null | undefined, refYear: number): RetirementSums {
  const birthYear = dob ? parseInt(dob.split('-')[0], 10) : null;
  const age55Year = birthYear ? birthYear + 55 : null;

  if (age55Year && RETIREMENT_SUMS[age55Year]) {
    return { ...RETIREMENT_SUMS[age55Year], cohortYear: age55Year, projected: false };
  }
  if (age55Year && age55Year > 2027) {
    const yearsAfter = age55Year - 2027;
    const base = RETIREMENT_SUMS[2027];
    return {
      brs: Math.round(base.brs * Math.pow(1.025, yearsAfter)),
      frs: Math.round(base.frs * Math.pow(1.025, yearsAfter)),
      ers: Math.round(base.ers * Math.pow(1.025, yearsAfter)),
      cohortYear: age55Year,
      projected: true,
    };
  }
  // Null/pre-2023 cohorts: refYear's published row when in-table, else the legacy-
  // hardcoded 2026 row — NEVER extrapolated. At refYear 2026 this is byte-identical
  // to legacy (vectors pin 2026); see decisions.md "retirementSumsFor fallback".
  const fallbackYear = RETIREMENT_SUMS[refYear] ? refYear : 2026;
  return { ...RETIREMENT_SUMS[fallbackYear], cohortYear: fallbackYear, projected: false };
}

export interface SummaryPolicyInput extends PremiumPolicyInput {
  coverageAmount?: string | number | null;
  criticalIllnessCoverage?: string | number | null;
  earlyCriticalIllnessCoverage?: string | number | null;
  isInvestmentLinked?: boolean | null;
  ilpPremiumInclusionPercent?: string | number | null;
  type?: string | null;
}
export interface ClientSummaryInput { annualIncome?: string | number | null; policies: SummaryPolicyInput[] }
export interface ClientSummary {
  income: number; totalCoverage: number; totalCICoverage: number; totalECICoverage: number;
  totalAnnualPremium: number; totalAnnualInvestment: number;
  coverageRatio: number; ciCoverageRatio: number; eciCoverageRatio: number; premiumRatio: number;
}

/** ILP premiums scale by `ilpPremiumInclusionPercent` in totalAnnualPremium ONLY; ratios 0 when income ≤ 0. */
export function summariseClient(client: ClientSummaryInput): ClientSummary {
  const income = toFloat(client.annualIncome);
  const totalCoverage = client.policies.reduce((s, p) => s + toFloat(p.coverageAmount), 0);
  const totalCICoverage = client.policies.reduce((s, p) => s + toFloat(p.criticalIllnessCoverage), 0);
  const totalECICoverage = client.policies.reduce((s, p) => s + toFloat(p.earlyCriticalIllnessCoverage), 0);

  const totalAnnualPremium = client.policies.reduce((sum, p) => {
    let prem = annualisePremium(p);
    if (p.isInvestmentLinked) {
      const pct = toFloat(p.ilpPremiumInclusionPercent) / 100;
      prem *= pct;
    }
    return sum + prem;
  }, 0);

  const totalAnnualInvestment = client.policies.reduce((s, p) => s + annualisePremium(p), 0);

  return {
    income,
    totalCoverage,
    totalCICoverage,
    totalECICoverage,
    totalAnnualPremium,
    totalAnnualInvestment,
    coverageRatio: income > 0 ? totalCoverage / income : 0,
    ciCoverageRatio: income > 0 ? totalCICoverage / income : 0,
    eciCoverageRatio: income > 0 ? totalECICoverage / income : 0,
    premiumRatio: income > 0 ? (totalAnnualPremium / income) * 100 : 0,
  };
}
