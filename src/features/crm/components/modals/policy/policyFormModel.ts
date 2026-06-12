/**
 * PolicyFormModal model — option lists, empty form state, required-field
 * validation and the projection-row form shape shared by the policy form
 * sections (port map: CRM_MODULE_PRD.md § UI port map / PolicyFormModal).
 */

import type { CashValueProjection, CrmPolicyInput } from '../../../types';

export const POLICY_TYPES = [
  'Life Insurance',
  'Critical Illness',
  'Early Critical Illness',
  'Disability Income',
  'Whole Life',
  'Term Life',
  'Investment-Linked Policy',
  'Hospitalization',
] as const;

export const POLICY_STATUSES = ['Active', 'Pending', 'Lapsed', 'Cancelled'] as const;

export const PREMIUM_FREQUENCIES = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'] as const;

export const HOSPITAL_TYPES = [
  'Private',
  'Public - Class A',
  'Public - Class B1',
  'Public - Class B2/C',
] as const;

export const ILP_PERCENT_OPTIONS = [
  { value: '0', label: "0% — Don't include" },
  { value: '30', label: '30% — Partial protection' },
  { value: '50', label: '50% — Balanced' },
  { value: '100', label: '100% — Full premium' },
] as const;

export const EMPTY_POLICY: CrmPolicyInput = {
  type: '',
  provider: '',
  policyNumber: '',
  premium: '',
  frequency: 'Annual',
  coverageAmount: '',
  tpdCoverage: '',
  tpdSameAsDeath: false,
  criticalIllnessCoverage: '',
  ciNotes: '',
  earlyCriticalIllnessCoverage: '',
  eciNotes: '',
  startDate: '',
  endDate: '',
  status: 'Active',
  hasCashValue: false,
  currentCashValue: '',
  projectedCashValue: [],
  isInvestmentLinked: false,
  currentAccountValue: '',
  investmentAllocation: '',
  illustratedValueAge55: '',
  illustratedValueAge65: '',
  ilpPremiumInclusionPercent: '0',
  isHospitalization: false,
  hospitalType: 'Private',
  integratedShieldCPF: '',
  integratedShieldCash: '',
  riderCash: '',
};

/** One editable projection row — both halves stay free-typed strings. */
export interface ProjectionRow {
  age: string;
  value: string;
}

export type PolicyErrors = Partial<
  Record<'type' | 'provider' | 'policyNumber' | 'startDate' | 'premium' | 'coverageAmount', string>
>;

/** Stored projections → editable rows (always at least one row to type into). */
export function toProjectionRows(projections: readonly CashValueProjection[]): ProjectionRow[] {
  const rows = projections.map((p) => ({ age: String(p.age), value: p.value }));
  return rows.length > 0 ? rows : [{ age: '', value: '' }];
}

/** Editable rows → model points; incomplete rows are dropped on submit (legacy parity). */
export function fromProjectionRows(rows: readonly ProjectionRow[]): CashValueProjection[] {
  return rows
    .filter((row) => row.age.trim() !== '' && row.value.trim() !== '')
    .map((row) => ({ age: Number(row.age), value: row.value.trim() }));
}

/** Required-field validation; premium/death benefit apply to non-hospitalization only. */
export function validatePolicy(form: CrmPolicyInput): PolicyErrors {
  const errors: PolicyErrors = {};
  if (!form.type) errors.type = 'Policy type is required';
  if (!form.provider.trim()) errors.provider = 'Provider is required';
  if (!form.policyNumber.trim()) errors.policyNumber = 'Policy number is required';
  if (!form.startDate) errors.startDate = 'Start date is required';
  if (!form.isHospitalization) {
    if (form.premium.trim() === '') errors.premium = 'Premium is required';
    if (form.coverageAmount.trim() === '') errors.coverageAmount = 'Death benefit is required';
  }
  return errors;
}
