/**
 * CRM report-side finance math — EXACT ports of the formulas the legacy app
 * wrote INLINE in its report components (ClientReportModal.jsx,
 * CPFProjection.jsx, RetirementProjection.jsx — git c09c549), promoted to
 * named functions here so the reports PRD reuses tested code. Split from
 * `finance.ts` (the finance.js export surface) to respect the 200-LOC ratchet.
 *
 * This file is also the BARREL for the report-math surface: the health-band
 * logic lives in `financeReportBands.ts` and the cost-at-65 / hero /
 * retirement-economics math (incl. BANK_INTEREST_RATE + projectBankTo65,
 * which moved there) in `financeReportEconomics.ts` — both re-exported at the
 * bottom. Imports are strictly one-way (no cycles):
 * this file → {financeReportBands, financeReportEconomics} → finance.ts.
 *
 * Golden-locked: the `caller:gapAnalysis` + `caller:raAssessment` vectors in
 * `__fixtures__/finance-golden-vectors.json` replay through this module
 * float-exact. Preserved legacy inconsistencies are documented per function
 * and in `lib/decisions.md` (P2 entries) — do NOT "fix" them.
 */
import {
  AVERAGE_CRITICAL_ILLNESS_COST,
  AVERAGE_EARLY_CI_COST,
  MEDICAL_INFLATION_RATE,
  annualisePremium,
  projectCPFTo55,
  retirementSumsFor,
  toFloat,
  type SummaryPolicyInput,
} from './finance';

/** ClientReportModal.jsx:42-44 — gap-math income multiples (death / CI / early CI). */
export const DEATH_COVER_INCOME_MULTIPLE = 10;
export const CI_COVER_INCOME_MULTIPLE = 5;
export const ECI_COVER_INCOME_MULTIPLE = 1.5;
/** CPFProjection.jsx:201 — CPF LIFE Standard Plan monthly payout at exactly FRS. */
export const CPF_LIFE_PAYOUT_AT_FRS = 1780;

/** ClientReportModal.jsx:37-38 — average CI cost inflated at 6% medical inflation. */
export function futureCICost(yearsToRetirement: number): number {
  return AVERAGE_CRITICAL_ILLNESS_COST * Math.pow(1 + MEDICAL_INFLATION_RATE, yearsToRetirement);
}

/** ClientReportModal.jsx:39-40 — average early-CI cost inflated at 6% medical inflation. */
export function futureECICost(yearsToRetirement: number): number {
  return AVERAGE_EARLY_CI_COST * Math.pow(1 + MEDICAL_INFLATION_RATE, yearsToRetirement);
}

export interface CoverageGapInput {
  income: number; yearsToRetirement: number;
  totalCoverage: number; totalCICoverage: number; totalECICoverage: number;
}
export interface CoverageGapAnalysis {
  futureCICost: number; futureECICost: number;
  coverageGap: number; ciCoverageGap: number; eciCoverageGap: number;
}

/**
 * ClientReportModal.jsx:37-44 — gap math at the 10× / 5× / 1.5× income
 * multiples. Note the legacy 10× death multiple here vs the 5× adequacy
 * check in HealthSnapshot — preserved inconsistency.
 */
export function analyseCoverageGaps(input: CoverageGapInput): CoverageGapAnalysis {
  return {
    futureCICost: futureCICost(input.yearsToRetirement),
    futureECICost: futureECICost(input.yearsToRetirement),
    coverageGap: Math.max(0, input.income * DEATH_COVER_INCOME_MULTIPLE - input.totalCoverage),
    ciCoverageGap: Math.max(0, input.income * CI_COVER_INCOME_MULTIPLE - input.totalCICoverage),
    eciCoverageGap: Math.max(0, input.income * ECI_COVER_INCOME_MULTIPLE - input.totalECICoverage),
  };
}

export interface RetirementReadinessInput {
  dob: string | null; yearsTo55: number; cpfOA: number; cpfSA: number; cpfMA: number;
}
export interface RetirementReadiness {
  projectedRA: number; remainingOA: number; meetsFRS: boolean; meetsBRS: boolean;
  frsPercentage: number; cpfLifeMonthlyPayout: number; cpfAchievementPct: number;
}

/**
 * CPFProjection.jsx:14-18,201 + ClientReportModal.jsx:73-74 — RA assessment at
 * 55. `cpfLifeMonthlyPayout` is the RAW formula value (the UI rounds for
 * display) — matches the captured golden vectors.
 */
export function assessRetirementReadiness(
  input: RetirementReadinessInput,
  refYear: number,
): RetirementReadiness {
  const { oaAt55, saAt55 } = projectCPFTo55({
    cpfOA: input.cpfOA, cpfSA: input.cpfSA, cpfMA: input.cpfMA, yearsTo55: input.yearsTo55,
  });
  const sums = retirementSumsFor(input.dob, refYear);
  const projectedRA = Math.min(saAt55 + oaAt55, sums.frs);
  return {
    projectedRA,
    remainingOA: Math.max(0, oaAt55 - Math.max(0, sums.frs - saAt55)),
    meetsFRS: projectedRA >= sums.frs,
    meetsBRS: projectedRA >= sums.brs,
    frsPercentage: Math.round((projectedRA / sums.frs) * 100),
    cpfLifeMonthlyPayout: (projectedRA / sums.frs) * CPF_LIFE_PAYOUT_AT_FRS,
    cpfAchievementPct: sums.frs > 0 ? (projectedRA / sums.frs) * 100 : 0,
  };
}

export interface PremiumSplit { protectionPremiums: number; investmentPremiums: number }

/**
 * ClientReportModal.jsx:51-59 — protection vs investment premium split by TYPE
 * substring ('investment' / 'ilp' / 'endowment'). Deliberately IGNORES both
 * `ilpPremiumInclusionPercent` and `isInvestmentLinked` — preserved legacy
 * HealthSnapshot inconsistency (decisions.md "premium split").
 */
export function splitPremiums(policies: SummaryPolicyInput[]): PremiumSplit {
  let protectionPremiums = 0;
  let investmentPremiums = 0;
  for (const p of policies) {
    const prem = annualisePremium(p);
    const t = (p.type || '').toLowerCase();
    if (t.includes('investment') || t.includes('ilp') || t.includes('endowment')) {
      investmentPremiums += prem;
    } else {
      protectionPremiums += prem;
    }
  }
  return { protectionPremiums, investmentPremiums };
}

// Report-math split modules (200-LOC ratchet) — this file stays the single
// import surface for all report-side finance math.
export * from './financeReportBands';
export * from './financeReportEconomics';
export * from './financeReportPortfolio';

// ── P2 report-section helpers (appended; oracle tests in
// __tests__/financeReportSections.test.ts) ──────────────────────────────────

export interface PremiumIncomePcts {
  insurancePremiumsPct: number;
  investmentPremiumsPct: number;
}

/**
 * ClientReportModal.jsx:60-63 — the premium split rendered as a % of income
 * for the HealthSnapshot cards; both percentages are 0 when income ≤ 0
 * (legacy `summary.income > 0 ? … : 0` guard preserved).
 */
export function premiumsPctOfIncome(split: PremiumSplit, income: number): PremiumIncomePcts {
  return {
    insurancePremiumsPct: income > 0 ? (split.protectionPremiums / income) * 100 : 0,
    investmentPremiumsPct: income > 0 ? (split.investmentPremiums / income) * 100 : 0,
  };
}

export interface HospitalShieldPolicyInput {
  integratedShieldCPF?: string | number | null;
  integratedShieldCash?: string | number | null;
  riderCash?: string | number | null;
}
export interface HospitalShieldPremiums {
  cpf: number;
  cash: number;
  rider: number;
  /** ClientReportModal.jsx:324-326 — IS row total (CPF + cash). */
  shieldTotal: number;
  /** ClientReportModal.jsx:337 — bold Total row (CPF + cash + rider). */
  totalAnnual: number;
}

/**
 * ClientReportModal.jsx:301-303 — `parseFloat(v || 0)` coercion of the three
 * hospitalization premium components, plus the two sums the card displays.
 */
export function hospitalShieldPremiums(policy: HospitalShieldPolicyInput): HospitalShieldPremiums {
  const cpf = toFloat(policy.integratedShieldCPF);
  const cash = toFloat(policy.integratedShieldCash);
  const rider = toFloat(policy.riderCash);
  return { cpf, cash, rider, shieldTotal: cpf + cash, totalAnnual: cpf + cash + rider };
}

// Sections [8]/[9] residual math (cpfCurrentTotal, raShortfall,
// totalRetirementIfInvested, retirementSumOpportunityCost,
// currentHoldingsTotal) — split module per the 200-LOC ratchet.
export * from './financeReportSections';
