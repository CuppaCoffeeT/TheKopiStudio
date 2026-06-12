/**
 * Cost-at-65 + retirement-economics math — EXACT ports of formulas the legacy
 * app wrote INLINE in `ClientReportModal.jsx` and `RetirementProjection.jsx`
 * (git c09c549). Split out of `financeReport.ts` (200-LOC ratchet) and
 * re-exported there — import from `financeReport`; imports are strictly
 * one-way: this file → finance.ts.
 *
 * Literal-rate warning: the death cost at 65 inflates at LITERAL 1.025
 * (general inflation, NOT the 6% medical rate) and the CI/ECI costs at
 * LITERAL 1.06 with an ADDITIVE un-inflated gap term — preserved legacy
 * semantics; do NOT "fix" them (decisions.md).
 *
 * Oracle-locked: `__tests__/financeReportExtension.test.ts` compares every
 * function against expressions copied verbatim from the legacy JSX; the
 * legacy `Math.round(...).toLocaleString()` wrappers are display formatting
 * and stay in components — everything here returns RAW values.
 */
import { AVERAGE_CRITICAL_ILLNESS_COST, AVERAGE_EARLY_CI_COST, ageFromDOB, toFloat } from './finance';

/** RetirementProjection.jsx:10 / ClientReportModal.jsx:34 — nominal bank rate projecting balances to 65. */
export const BANK_INTEREST_RATE = 0.005;
/** RetirementProjection.jsx:12 — moderate-return rate for the "if invested" scenario. */
export const MODERATE_INVESTMENT_RETURN = 0.06;
/** RetirementProjection.jsx:11 — general inflation for the purchasing-power alert. */
export const GENERAL_INFLATION_RATE = 0.025;

/** RetirementProjection.jsx:14 / ClientReportModal.jsx:33-34 — bank balance compounded at 0.5%. */
export function projectBankTo65(balance: number, yearsTo65: number): number {
  return balance * Math.pow(1 + BANK_INTEREST_RATE, yearsTo65);
}

/**
 * ClientReportModal.jsx:205-210 — death-benefit "Cost at age 65": 10× income
 * inflated at LITERAL 1.025 general inflation (the lone 2.5% row in a 6%
 * medical-inflation table — preserved legacy inconsistency).
 */
export function coverageCostAt65Death(income: number, yearsToRetirement: number): number {
  return income * 10 * Math.pow(1.025, yearsToRetirement);
}

/**
 * ClientReportModal.jsx:221-227 — CI "Cost at age 65": the $150k average cost
 * inflated at LITERAL 1.06, PLUS the un-inflated ADDITIVE gap term
 * (income×5 − $150k; negative below $30k income — preserved).
 */
export function coverageCostAt65CI(income: number, yearsToRetirement: number): number {
  return (
    AVERAGE_CRITICAL_ILLNESS_COST * Math.pow(1.06, yearsToRetirement) +
    (income * 5 - AVERAGE_CRITICAL_ILLNESS_COST)
  );
}

/** ClientReportModal.jsx:238-244 — early-CI analogue: $30k base, 1.5× income multiple. */
export function coverageCostAt65ECI(income: number, yearsToRetirement: number): number {
  return (
    AVERAGE_EARLY_CI_COST * Math.pow(1.06, yearsToRetirement) +
    (income * 1.5 - AVERAGE_EARLY_CI_COST)
  );
}

/** ClientReportModal.jsx:46-48 — out-of-pocket exposure after coverage, floored at 0. */
export function postCoverageOOP(futureCost: number, coverage: number): number {
  return Math.max(0, futureCost - coverage);
}

export interface HeroPolicyInput {
  isInvestmentLinked?: boolean | null;
  illustratedValueAge65?: string | number | null;
}
export interface HeroClientInput {
  dateOfBirth?: string | null;
  totalBankBalance?: string | number | null;
  policies: HeroPolicyInput[];
}
export interface HeroTotals {
  /** ClientReportModal.jsx:21-22 — Math.max(0, 65 − age); missing DOB → age 40 → 25 years. */
  yearsToRetirement: number;
  /** ClientReportModal.jsx:27-32 — Σ illustratedValueAge65 over isInvestmentLinked policies. */
  totalILPValueAt65: number;
  /** ClientReportModal.jsx:33-34 — bank balance at 0.5% over yearsToRetirement. */
  bankBalanceAt65: number;
  /** ClientReportModal.jsx:35 — hero "Projected at age 65" stat (ILP + bank). */
  totalRetirementValue: number;
}

/** ClientReportModal.jsx:21-35 — the hero-strip retirement totals. */
export function heroTotals(client: HeroClientInput, refYear: number): HeroTotals {
  const yearsToRetirement = Math.max(0, 65 - ageFromDOB(client.dateOfBirth, refYear));
  const totalILPValueAt65 = client.policies
    .filter((p) => p.isInvestmentLinked)
    .reduce((sum, p) => sum + toFloat(p.illustratedValueAge65), 0);
  const bankBalanceAt65 = projectBankTo65(toFloat(client.totalBankBalance), yearsToRetirement);
  return {
    yearsToRetirement,
    totalILPValueAt65,
    bankBalanceAt65,
    totalRetirementValue: totalILPValueAt65 + bankBalanceAt65,
  };
}

/** RetirementProjection.jsx:15 — the same balance compounded at the 6% moderate-return scenario. */
export function investedAt6(balance: number, yearsTo65: number): number {
  return balance * Math.pow(1 + MODERATE_INVESTMENT_RETURN, yearsTo65);
}

/** RetirementProjection.jsx:16 — invested-scenario value minus bank-scenario value. */
export function opportunityCost(balance: number, yearsTo65: number): number {
  return investedAt6(balance, yearsTo65) - projectBankTo65(balance, yearsTo65);
}

export interface PurchasingPowerLoss {
  /** RetirementProjection.jsx:20 — the nominal sum deflated to today's dollars. */
  purchasingPowerToday: number;
  /** RetirementProjection.jsx:185 — nominal sum minus today's-dollars value. */
  loss: number;
  /** RetirementProjection.jsx:186 — loss as a % of the nominal sum (size-independent). */
  lossPct: number;
}

/** RetirementProjection.jsx:11,20,184-186 — 2.5%-inflation purchasing-power impact. */
export function purchasingPowerLoss2_5(
  totalRetirementSum: number,
  yearsTo65: number,
): PurchasingPowerLoss {
  const purchasingPowerToday =
    totalRetirementSum / Math.pow(1 + GENERAL_INFLATION_RATE, yearsTo65);
  return {
    purchasingPowerToday,
    loss: totalRetirementSum - purchasingPowerToday,
    lossPct: (1 - 1 / Math.pow(1 + GENERAL_INFLATION_RATE, yearsTo65)) * 100,
  };
}

/** RetirementProjection.jsx:199-200 — emergency fund "6–12 months" ≈ LITERAL 0.75 × annual income. */
export function emergencyFundTarget(income: number): number {
  return income * 0.75;
}

/** RetirementProjection.jsx:205 — bank balance above the emergency-fund target (negative when below). */
export function excessInvestable(balance: number, income: number): number {
  return balance - income * 0.75;
}

export interface ExcessInvestableRecommendation {
  /** RetirementProjection.jsx:205 — the investable excess. */
  excess: number;
  /** RetirementProjection.jsx:206 — the `client.riskProfile.toLowerCase()` copy fragment. */
  riskProfileLabel: string;
}

/**
 * RetirementProjection.jsx:202-208 — the conditional "invest the excess"
 * recommendation bullet: rendered ONLY when `currentBalance > income * 0.75`
 * (strict >; a balance exactly at the target gets NO bullet, including the
 * 0-income/0-balance case), with the risk profile lowercased into the copy.
 */
export function excessInvestableRecommendation(
  balance: number,
  income: number,
  riskProfile: string,
): ExcessInvestableRecommendation | null {
  if (!(balance > income * 0.75)) return null;
  return { excess: balance - income * 0.75, riskProfileLabel: riskProfile.toLowerCase() };
}
