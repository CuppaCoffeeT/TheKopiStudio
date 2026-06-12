/**
 * CRM row↔model mapping — port of the legacy useClients.js conversion layer
 * (git c09c549) against the new 5-table spine. Pure functions; the api/
 * services stamp identity/audit columns (user_id, client_id/policy_id,
 * created_by, updated_by, is_deleted) — never this module.
 *
 * Contract (PRD § Data layer + decisions.md P2 entries):
 * - Client numerics: '' → null on write; rows render back as strings.
 * - Policy numerics: '' → 0 on write (legacy `?? 0` semantics).
 * - `clientToRow` writes NEITHER `total_bank_balance` NOR `last_review_date`
 *   (corrected legacy bug 1 — the bank-history recompute owns both columns).
 * - Interaction `followUp` '' → null (schema `date` rejects ''); notes keep ''.
 * - Booleans coerce with `!!`; projections: model age number + value string,
 *   sorted by age on read.
 */
import type {
  BankBalanceRow,
  CashValueProjection,
  ClientRow,
  CrmBankRecord,
  CrmBankRecordInput,
  CrmClient,
  CrmClientInput,
  CrmInteraction,
  CrmInteractionInput,
  CrmPolicy,
  CrmPolicyInput,
  InteractionRow,
  PolicyRow,
  ProjectedCashValueRow,
} from '../types';

/** Legacy `toNum` — '' / null / undefined → null, else Number(). */
const toNum = (v: string | number | null | undefined): number | null =>
  v === '' || v == null ? null : Number(v);

/** Render a nullable numeric column as a form string ('' when unset). */
const numStr = (v: number | null | undefined, fallback = ''): string =>
  v != null ? String(v) : fallback;

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
  };
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
  };
}

/** Projection rows → model points, sorted by age (corrected behavior 4). */
export function projectionsFromRows(rows: readonly ProjectedCashValueRow[]): CashValueProjection[] {
  return [...rows]
    .sort((a, b) => a.age - b.age)
    .map((p) => ({ age: p.age, value: String(p.value) }));
}

/** Model points → bare write rows (service stamps user_id + policy_id). */
export function projectionsToRows(projections: readonly CashValueProjection[]) {
  return projections.map((p) => ({ age: Number(p.age), value: Number(p.value) }));
}

export function policyFromRow(row: PolicyRow, projectionRows: readonly ProjectedCashValueRow[] = []): CrmPolicy {
  return {
    id: row.id,
    type: row.type ?? '',
    provider: row.provider ?? '',
    policyNumber: row.policy_number ?? '',
    premium: numStr(row.premium),
    frequency: row.frequency ?? 'Annual',
    coverageAmount: numStr(row.coverage_amount),
    tpdCoverage: numStr(row.tpd_coverage),
    tpdSameAsDeath: !!row.tpd_same_as_death,
    criticalIllnessCoverage: numStr(row.critical_illness_coverage),
    ciNotes: row.ci_notes ?? '',
    earlyCriticalIllnessCoverage: numStr(row.early_critical_illness_coverage),
    eciNotes: row.eci_notes ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    status: row.status ?? 'Active',
    hasCashValue: !!row.has_cash_value,
    currentCashValue: numStr(row.current_cash_value),
    projectedCashValue: projectionsFromRows(projectionRows),
    isInvestmentLinked: !!row.is_investment_linked,
    currentAccountValue: numStr(row.current_account_value),
    investmentAllocation: row.investment_allocation ?? '',
    illustratedValueAge55: numStr(row.illustrated_value_age_55),
    illustratedValueAge65: numStr(row.illustrated_value_age_65),
    ilpPremiumInclusionPercent: numStr(row.ilp_premium_inclusion_percent, '0'),
    isHospitalization: !!row.is_hospitalization,
    hospitalType: row.hospital_type ?? 'Private',
    integratedShieldCPF: numStr(row.integrated_shield_cpf),
    integratedShieldCash: numStr(row.integrated_shield_cash),
    riderCash: numStr(row.rider_cash),
  };
}

export function policyToRow(data: CrmPolicyInput) {
  return {
    type: data.type,
    provider: data.provider || null,
    policy_number: data.policyNumber || null,
    premium: toNum(data.premium) ?? 0,
    frequency: data.frequency || 'Annual',
    coverage_amount: toNum(data.coverageAmount) ?? 0,
    tpd_coverage: toNum(data.tpdCoverage) ?? 0,
    tpd_same_as_death: !!data.tpdSameAsDeath,
    critical_illness_coverage: toNum(data.criticalIllnessCoverage) ?? 0,
    ci_notes: data.ciNotes || null,
    early_critical_illness_coverage: toNum(data.earlyCriticalIllnessCoverage) ?? 0,
    eci_notes: data.eciNotes || null,
    start_date: data.startDate || null,
    end_date: data.endDate || null,
    status: data.status || 'Active',
    has_cash_value: !!data.hasCashValue,
    current_cash_value: toNum(data.currentCashValue) ?? 0,
    is_investment_linked: !!data.isInvestmentLinked,
    current_account_value: toNum(data.currentAccountValue) ?? 0,
    investment_allocation: data.investmentAllocation || null,
    illustrated_value_age_55: toNum(data.illustratedValueAge55) ?? 0,
    illustrated_value_age_65: toNum(data.illustratedValueAge65) ?? 0,
    ilp_premium_inclusion_percent: toNum(data.ilpPremiumInclusionPercent) ?? 0,
    is_hospitalization: !!data.isHospitalization,
    hospital_type: data.hospitalType || 'Private',
    integrated_shield_cpf: toNum(data.integratedShieldCPF) ?? 0,
    integrated_shield_cash: toNum(data.integratedShieldCash) ?? 0,
    rider_cash: toNum(data.riderCash) ?? 0,
  };
}

export function interactionFromRow(row: InteractionRow): CrmInteraction {
  return {
    id: row.id,
    date: row.date ?? '',
    type: row.type ?? 'Meeting',
    notes: row.notes ?? '',
    followUp: row.follow_up ?? '',
  };
}

export function interactionToRow(data: CrmInteractionInput) {
  return {
    date: data.date,
    type: data.type,
    notes: data.notes,
    follow_up: data.followUp || null,
  };
}

export function bankFromRow(row: BankBalanceRow): CrmBankRecord {
  return {
    id: row.id,
    date: row.date ?? '',
    balance: numStr(row.balance, '0'),
    notes: row.notes ?? '',
  };
}

export function bankToRow(record: CrmBankRecordInput) {
  return {
    date: record.date,
    balance: Number(record.balance),
    notes: record.notes,
  };
}
