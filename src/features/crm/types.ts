/**
 * CRM feature types — flat file (never a types/ directory).
 *
 * The feature owns the 5 CRM tables created by migration 20260611_164841
 * (clients, policies, projected_cash_values, interactions,
 * bank_balance_history) — re-export the generated DB types as the single
 * source of truth for row shapes. Domain model types (mapping, finance,
 * follow-ups) are appended below by the lib layer.
 */

import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

/** A client row (`public.clients`). */
export type ClientRow = Tables<'clients'>;
/** Insert payload for `public.clients`. */
export type ClientRowInsert = TablesInsert<'clients'>;
/** Update payload for `public.clients`. */
export type ClientRowUpdate = TablesUpdate<'clients'>;

/** A policy row (`public.policies`). */
export type PolicyRow = Tables<'policies'>;
/** Insert payload for `public.policies`. */
export type PolicyRowInsert = TablesInsert<'policies'>;
/** Update payload for `public.policies`. */
export type PolicyRowUpdate = TablesUpdate<'policies'>;

/** A projected cash value row (`public.projected_cash_values`, UNIQUE(policy_id, age)). */
export type ProjectedCashValueRow = Tables<'projected_cash_values'>;
/** Insert payload for `public.projected_cash_values`. */
export type ProjectedCashValueRowInsert = TablesInsert<'projected_cash_values'>;
/** Update payload for `public.projected_cash_values`. */
export type ProjectedCashValueRowUpdate = TablesUpdate<'projected_cash_values'>;

/** An interaction row (`public.interactions`). */
export type InteractionRow = Tables<'interactions'>;
/** Insert payload for `public.interactions`. */
export type InteractionRowInsert = TablesInsert<'interactions'>;
/** Update payload for `public.interactions`. */
export type InteractionRowUpdate = TablesUpdate<'interactions'>;

/** A bank balance history row (`public.bank_balance_history`). */
export type BankBalanceRow = Tables<'bank_balance_history'>;
/** Insert payload for `public.bank_balance_history`. */
export type BankBalanceRowInsert = TablesInsert<'bank_balance_history'>;
/** Update payload for `public.bank_balance_history`. */
export type BankBalanceRowUpdate = TablesUpdate<'bank_balance_history'>;

// ── P2 — domain models (lib/mapping.ts row↔model contract; legacy UI shapes) ──
// Numeric fields are STRINGS in models ('' = unset) because the legacy modals
// are controlled string-state forms; mapping.ts owns all coercion (client
// numerics '' → null, policy numerics '' → 0, booleans `!!`).

/** One projected cash value point — age stays numeric, value stays a form string. */
export interface CashValueProjection {
  age: number;
  value: string;
}

/** Client model. `totalBankBalance`/`lastReviewDate` are READ-ONLY derivations
 *  (bank-history recompute owns the columns; `clientToRow` never writes them). */
export interface CrmClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  occupation: string;
  annualIncome: string;
  riskProfile: string;
  notes: string;
  createdDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  reviewFrequency: string;
  totalBankBalance: string;
  cpfOA: string;
  cpfSA: string;
  cpfMA: string;
  // ── Planning fields (2026-07-28, from the reference CRM) ──────────────────
  // Holdings outside CPF and outside policies, plus the advisor's call on
  // whether that pot is genuinely earmarked for retirement.
  personalInvestmentValue: string;
  /** Expected annual return as a PERCENT ('6' = 6%), matching the CRM input. */
  personalInvestmentGrowthRate: string;
  includePersonalInvestmentInRetirement: boolean;
  // Three life stages of expected earnings. These are what let the CPF
  // projection keep paying in — see lib/cpfContributions.ts. Ages inclusive.
  futureIncomeStep1: string;
  futureIncomeStartAge1: string;
  futureIncomeEndAge1: string;
  futureIncomeStep2: string;
  futureIncomeStartAge2: string;
  futureIncomeEndAge2: string;
  futureIncomeStep3: string;
  futureIncomeStartAge3: string;
  futureIncomeEndAge3: string;
}

/** Client form payload (ADD reads `totalBankBalance` to seed the initial bank-history row). */
export type CrmClientInput = Omit<CrmClient, 'id'>;

/** Policy model incl. ILP / hospitalization detail and cash-value projections. */
export interface CrmPolicy {
  id: string;
  type: string;
  provider: string;
  policyNumber: string;
  premium: string;
  frequency: string;
  coverageAmount: string;
  tpdCoverage: string;
  tpdSameAsDeath: boolean;
  criticalIllnessCoverage: string;
  ciNotes: string;
  earlyCriticalIllnessCoverage: string;
  eciNotes: string;
  startDate: string;
  endDate: string;
  status: string;
  hasCashValue: boolean;
  currentCashValue: string;
  projectedCashValue: CashValueProjection[];
  isInvestmentLinked: boolean;
  currentAccountValue: string;
  investmentAllocation: string;
  illustratedValueAge55: string;
  illustratedValueAge65: string;
  ilpPremiumInclusionPercent: string;
  isHospitalization: boolean;
  hospitalType: string;
  integratedShieldCPF: string;
  integratedShieldCash: string;
  riderCash: string;
}

/** Policy form payload (projections persist separately via `projectionsToRows`). */
export type CrmPolicyInput = Omit<CrmPolicy, 'id'>;

/** Interaction model — `followUp` '' = none (mapping writes null). */
export interface CrmInteraction {
  id: string;
  date: string;
  type: string;
  notes: string;
  followUp: string;
}

export type CrmInteractionInput = Omit<CrmInteraction, 'id'>;

/** Bank balance history record — `balance` is a form string; mapping writes a number. */
export interface CrmBankRecord {
  id: string;
  date: string;
  balance: string;
  notes: string;
}

export type CrmBankRecordInput = Omit<CrmBankRecord, 'id'>;

// ── P3 — dashboard stats (api/dashboardService ↔ pages/CrmDashboardPage) ──

/** Dashboard stat block — shape shared by the stats query and the KPI tiles. */
export interface CrmDashboardStats {
  /** Non-deleted clients visible to the viewer (RLS-scoped). */
  totalClients: number;
  /** Policies with status 'Active'. */
  activePolicies: number;
  /** Annualised premium total (frequency multiplier + ILP inclusion percent). */
  totalAnnualPremium: number;
  /** Interactions with a follow-up date strictly after now (no window — parity). */
  upcomingFollowUps: number;
  /**
   * What `totalAnnualPremium` had to leave out: ILP policies whose
   * premium-inclusion percent is 0 or unset contribute nothing to it. Surfaced
   * rather than silently absorbed — see lib/ilpExclusion for why the math is
   * not "fixed" instead.
   */
  excludedIlp: { count: number; annualPremium: number };
}

// ── P4 — prospect→client bridge (REPORTS_LINK_PRD; crm-owned read of `results`) ──

/**
 * Bounded projection of a linked `public.results` row for the Communication
 * style card. Pick over the generated row type keeps it in sync with the
 * schema without importing profiler feature types (cross-feature imports are
 * a drift error). RLS prunes rows the viewer cannot see — possibly to empty.
 */
export type LinkedProfilerResult = Pick<
  Tables<'results'>,
  'id' | 'prospect_name' | 'disc_primary' | 'disc_secondary' | 'mbti' | 'created_at'
>;
