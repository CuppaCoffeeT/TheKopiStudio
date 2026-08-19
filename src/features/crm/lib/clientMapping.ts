/**
 * Client row↔model mapping.
 *
 * Split from `mapping.ts` (W23 LOC ceiling) when the twelve planning fields
 * landed. The client is by far the widest entity in the CRM, and it carries
 * the two contract quirks worth reading in isolation:
 *
 * - Numerics coerce '' → null on write (policies use '' → 0 — a deliberate
 *   legacy asymmetry, see decisions.md).
 * - `clientToRow` writes NEITHER `total_bank_balance` NOR `last_review_date`:
 *   the bank-history recompute owns both columns (corrected legacy bug 1).
 * - Nor does it write the `tax_*` / `srs_*` columns (2026-08-19). Same rule,
 *   new owners: the tax calculator and the SRS planner write those through
 *   `planning/api/planningProfileService.ts`. `clientFromRow` still READS them
 *   so the tools can pre-fill, and so a form round-trip cannot drop them.
 */

import type {
  ClientRow,
  CrmClient,
  CrmClientInput,
  SavedReliefState,
  SavedWithdrawalPeriod,
} from '../types';
import { numStr, toNum } from './mappingCoercion';

export function clientFromRow(row: ClientRow): CrmClient {
  return {
    id: row.id,
    name: row.name ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    dateOfBirth: row.date_of_birth ?? '',
    occupation: row.occupation ?? '',
    annualIncome: numStr(row.annual_income),
    riskProfile: row.risk_profile ?? 'Moderate',
    notes: row.notes ?? '',
    createdDate: row.created_date ?? '',
    lastReviewDate: row.last_review_date ?? '',
    nextReviewDate: row.next_review_date ?? '',
    reviewFrequency: row.review_frequency ?? 'Annual',
    totalBankBalance: numStr(row.total_bank_balance, '0'),
    cpfOA: numStr(row.cpf_oa),
    cpfSA: numStr(row.cpf_sa),
    cpfMA: numStr(row.cpf_ma),
    personalInvestmentValue: numStr(row.personal_investment_value),
    personalInvestmentGrowthRate: numStr(row.personal_investment_growth_rate),
    // Column is NOT NULL DEFAULT true, but `!== false` keeps a legacy row that
    // predates the column (or an undefined from a partial select) reading true.
    includePersonalInvestmentInRetirement: row.include_personal_investment_in_retirement !== false,
    futureIncomeStep1: numStr(row.future_income_step1),
    futureIncomeStartAge1: numStr(row.future_income_start_age1),
    futureIncomeEndAge1: numStr(row.future_income_end_age1),
    futureIncomeStep2: numStr(row.future_income_step2),
    futureIncomeStartAge2: numStr(row.future_income_start_age2),
    futureIncomeEndAge2: numStr(row.future_income_end_age2),
    futureIncomeStep3: numStr(row.future_income_step3),
    futureIncomeStartAge3: numStr(row.future_income_start_age3),
    futureIncomeEndAge3: numStr(row.future_income_end_age3),
    tax: {
      employmentType: row.tax_employment_type ?? '',
      otherIncome: numStr(row.tax_other_income),
      donations: numStr(row.tax_donations),
      useFedr: row.tax_use_fedr === true,
      fedrRate: numStr(row.tax_fedr_rate),
      reliefs: parseReliefState(row.tax_reliefs),
      savedAt: row.tax_saved_at ?? '',
    },
    srs: {
      currentBalance: numStr(row.srs_current_balance),
      contributionThisYear: numStr(row.srs_contribution_this_year),
      annualContribution: numStr(row.srs_annual_contribution),
      growthRate: numStr(row.srs_growth_rate),
      contributeUntilAge: numStr(row.srs_contribute_until_age),
      withdrawalAge: numStr(row.srs_withdrawal_age),
      strategy: row.srs_withdrawal_strategy ?? '',
      balanceOverride: numStr(row.srs_balance_override),
      startAge: numStr(row.srs_withdrawal_start_age),
      withdrawalYears: numStr(row.srs_withdrawal_years),
      withdrawalGrowth: numStr(row.srs_withdrawal_growth),
      otherIncome: numStr(row.srs_withdrawal_other_income),
      periods: parseWithdrawalPeriods(row.srs_withdrawal_periods),
      savedAt: row.srs_saved_at ?? '',
    },
  };
}

/**
 * `jsonb` reaches us as `Json`, which is "anything". Both parsers below return
 * null rather than throwing on a shape they don't recognise: a relief
 * catalogue that changed between saves must degrade to "open on the defaults",
 * never to a blank screen on a customer's record.
 */
function parseReliefState(value: ClientRow['tax_reliefs']): SavedReliefState | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const out: SavedReliefState = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const e = entry as Record<string, unknown>;
    out[id] = {
      on: e.on === true,
      quantity: Number(e.quantity) || 0,
      manualAmount: Number(e.manualAmount) || 0,
    };
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseWithdrawalPeriods(
  value: ClientRow['srs_withdrawal_periods'],
): SavedWithdrawalPeriod[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
    const e = entry as Record<string, unknown>;
    return [{ amount: Number(e.amount) || 0, years: Number(e.years) || 0 }];
  });
  return out.length > 0 ? out : null;
}

export function clientToRow(data: CrmClientInput) {
  return {
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    date_of_birth: data.dateOfBirth || null,
    occupation: data.occupation || null,
    annual_income: toNum(data.annualIncome),
    risk_profile: data.riskProfile || 'Moderate',
    notes: data.notes || null,
    created_date: data.createdDate || null,
    next_review_date: data.nextReviewDate || null,
    review_frequency: data.reviewFrequency || 'Annual',
    cpf_oa: toNum(data.cpfOA),
    cpf_sa: toNum(data.cpfSA),
    cpf_ma: toNum(data.cpfMA),
    personal_investment_value: toNum(data.personalInvestmentValue),
    personal_investment_growth_rate: toNum(data.personalInvestmentGrowthRate),
    include_personal_investment_in_retirement: data.includePersonalInvestmentInRetirement,
    future_income_step1: toNum(data.futureIncomeStep1),
    future_income_start_age1: toNum(data.futureIncomeStartAge1),
    future_income_end_age1: toNum(data.futureIncomeEndAge1),
    future_income_step2: toNum(data.futureIncomeStep2),
    future_income_start_age2: toNum(data.futureIncomeStartAge2),
    future_income_end_age2: toNum(data.futureIncomeEndAge2),
    future_income_step3: toNum(data.futureIncomeStep3),
    future_income_start_age3: toNum(data.futureIncomeStartAge3),
    future_income_end_age3: toNum(data.futureIncomeEndAge3),
  };
}
