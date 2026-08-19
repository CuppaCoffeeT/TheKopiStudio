/**
 * ClientFormModal's form model — the blank form, the risk options, and the
 * model→input projection used to seed edit mode.
 *
 * Extracted from `ClientFormModal` (W23 LOC ceiling) when the twelve planning
 * fields landed. Keeping the blank shape here means adding a client column is
 * one edit in this file plus one in the section that renders it, and the modal
 * itself stays about validation and submission.
 */

import type {
  CrmClient,
  CrmClientInput,
  CrmClientSrsProfile,
  CrmClientTaxProfile,
} from '../../../types';

export const RISK_PROFILES = ['Conservative', 'Moderate', 'Aggressive'] as const;

/**
 * The two tool-owned sub-models, never saved.
 *
 * They sit on the client model so the tools can pre-fill from the record, but
 * the modal does not render them and `clientToRow` does not write them — the
 * tax calculator and the SRS planner own their own columns. A blank here is
 * "this customer has never saved that tool", which is what makes the tool open
 * on its statutory defaults.
 */
export const EMPTY_TAX_PROFILE: CrmClientTaxProfile = {
  employmentType: '',
  otherIncome: '',
  donations: '',
  useFedr: false,
  fedrRate: '',
  reliefs: null,
  savedAt: '',
};

export const EMPTY_SRS_PROFILE: CrmClientSrsProfile = {
  currentBalance: '',
  contributionThisYear: '',
  annualContribution: '',
  growthRate: '',
  contributeUntilAge: '',
  withdrawalAge: '',
  strategy: '',
  balanceOverride: '',
  startAge: '',
  withdrawalYears: '',
  withdrawalGrowth: '',
  otherIncome: '',
  periods: null,
  savedAt: '',
};

/**
 * A blank client. Every key of `CrmClientInput` must appear — TypeScript
 * enforces it, which is what stops a newly added column from silently
 * submitting `undefined`.
 */
export const EMPTY_CLIENT: CrmClientInput = {
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  occupation: '',
  annualIncome: '',
  riskProfile: 'Moderate',
  notes: '',
  createdDate: '',
  lastReviewDate: '',
  nextReviewDate: '',
  reviewFrequency: 'Annual',
  totalBankBalance: '',
  cpfOA: '',
  cpfSA: '',
  cpfMA: '',
  personalInvestmentValue: '',
  personalInvestmentGrowthRate: '',
  includePersonalInvestmentInRetirement: true,
  futureIncomeStep1: '',
  futureIncomeStartAge1: '',
  futureIncomeEndAge1: '',
  futureIncomeStep2: '',
  futureIncomeStartAge2: '',
  futureIncomeEndAge2: '',
  futureIncomeStep3: '',
  futureIncomeStartAge3: '',
  futureIncomeEndAge3: '',
  tax: EMPTY_TAX_PROFILE,
  srs: EMPTY_SRS_PROFILE,
};

/** Strip the id so an existing client can seed the form. */
export function toInput(client: CrmClient): CrmClientInput {
  const { id: _id, ...input } = client;
  return input;
}
