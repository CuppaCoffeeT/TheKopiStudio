/**
 * Row↔model mapping lock — per-entity round-trips INCLUDING the deliberate
 * asymmetries: client numerics '' → null vs policy numerics '' → 0; client
 * writes omit total_bank_balance + last_review_date (recompute owns them);
 * interaction followUp '' → null while notes keep ''; projections sort by
 * age on read and coerce value string → number on write.
 */
import { describe, expect, it } from 'vitest';

import type { BankBalanceRow, ClientRow, InteractionRow, PolicyRow, ProjectedCashValueRow } from '../../types';
import { clientFromRow, clientToRow } from '../clientMapping';
import {
  bankFromRow, bankToRow, interactionFromRow, interactionToRow,
  policyFromRow, policyToRow, projectionsFromRows, projectionsToRows,
} from '../mapping';

const AUDIT = {
  created_at: '2026-06-11T00:00:00Z', updated_at: '2026-06-11T00:00:00Z',
  created_by: null, updated_by: null, is_deleted: false, user_id: 'user-1',
};

const CLIENT_ROW = {
  id: 'c1', name: 'Tan Wei Jie', email: 'tan@example.com', phone: '91234567',
  date_of_birth: '1990-04-02', occupation: 'Engineer', annual_income: 85000.5,
  risk_profile: 'Aggressive', notes: 'VIP', created_date: '2024-01-15',
  last_review_date: '2026-05-01', next_review_date: '2026-12-01',
  review_frequency: 'Quarterly', total_bank_balance: 42000, cpf_oa: 30000,
  cpf_sa: 20000, cpf_ma: 15000,
  // Planning fields (2026-07-28) — real values, so the round-trip below
  // exercises them rather than only proving nulls survive.
  personal_investment_value: 50000, personal_investment_growth_rate: 6,
  include_personal_investment_in_retirement: true,
  future_income_step1: 120000, future_income_start_age1: 39, future_income_end_age1: 50,
  future_income_step2: 80000, future_income_start_age2: 51, future_income_end_age2: 60,
  future_income_step3: null, future_income_start_age3: null, future_income_end_age3: null,
  ...AUDIT,
} as ClientRow;

describe('client mapping', () => {
  it('renders nullable columns as form strings with legacy defaults', () => {
    const empty = clientFromRow({ ...CLIENT_ROW, email: null, annual_income: null, risk_profile: null, review_frequency: null, total_bank_balance: null, cpf_oa: null } as ClientRow);
    expect(empty.email).toBe('');
    expect(empty.annualIncome).toBe('');
    expect(empty.riskProfile).toBe('Moderate');
    expect(empty.reviewFrequency).toBe('Annual');
    expect(empty.totalBankBalance).toBe('0');
    expect(empty.cpfOA).toBe('');
  });

  it('round-trips row → model → write payload for every written column', () => {
    const payload = clientToRow(clientFromRow(CLIENT_ROW));
    expect(payload).toEqual({
      name: 'Tan Wei Jie', email: 'tan@example.com', phone: '91234567',
      date_of_birth: '1990-04-02', occupation: 'Engineer', annual_income: 85000.5,
      risk_profile: 'Aggressive', notes: 'VIP', created_date: '2024-01-15',
      next_review_date: '2026-12-01', review_frequency: 'Quarterly',
      cpf_oa: 30000, cpf_sa: 20000, cpf_ma: 15000,
      personal_investment_value: 50000, personal_investment_growth_rate: 6,
      include_personal_investment_in_retirement: true,
      future_income_step1: 120000, future_income_start_age1: 39, future_income_end_age1: 50,
      future_income_step2: 80000, future_income_start_age2: 51, future_income_end_age2: 60,
      future_income_step3: null, future_income_start_age3: null, future_income_end_age3: null,
    });
  });

  it('reads the retirement-inclusion flag as TRUE for a row predating the column', () => {
    // The column is NOT NULL DEFAULT true, but a partial select (or a row from
    // before the migration) yields undefined — which must not read as "exclude".
    const legacy = clientFromRow({
      ...CLIENT_ROW,
      include_personal_investment_in_retirement: undefined,
    } as unknown as ClientRow);
    expect(legacy.includePersonalInvestmentInRetirement).toBe(true);

    const excluded = clientFromRow({
      ...CLIENT_ROW,
      include_personal_investment_in_retirement: false,
    } as ClientRow);
    expect(excluded.includePersonalInvestmentInRetirement).toBe(false);
  });

  it('NEVER writes total_bank_balance or last_review_date (recompute owns them)', () => {
    const payload = clientToRow(clientFromRow(CLIENT_ROW));
    expect(payload).not.toHaveProperty('total_bank_balance');
    expect(payload).not.toHaveProperty('last_review_date');
  });

  it("coerces '' numerics to null and '' strings to null on write (client contract)", () => {
    const payload = clientToRow({ ...clientFromRow(CLIENT_ROW), annualIncome: '', cpfOA: '', email: '', notes: '' });
    expect(payload.annual_income).toBeNull();
    expect(payload.cpf_oa).toBeNull();
    expect(payload.email).toBeNull();
    expect(payload.notes).toBeNull();
  });
});

const POLICY_ROW = {
  id: 'p1', client_id: 'c1', type: 'Investment-Linked Policy', provider: 'Prudential',
  policy_number: 'ILP-001', premium: 250.5, frequency: 'Monthly', coverage_amount: 500000,
  tpd_coverage: 500000, tpd_same_as_death: true, critical_illness_coverage: 100000,
  ci_notes: 'Standard CI', early_critical_illness_coverage: 30000, eci_notes: 'ECI rider',
  start_date: '2020-03-01', end_date: '2060-03-01', status: 'Active', has_cash_value: true,
  current_cash_value: 12000, is_investment_linked: true, current_account_value: 45000,
  investment_allocation: '70/30 equity', illustrated_value_age_55: 180000,
  illustrated_value_age_65: 320000, ilp_premium_inclusion_percent: 50,
  is_hospitalization: false, hospital_type: 'Private', integrated_shield_cpf: 0,
  integrated_shield_cash: 0, rider_cash: 0, ...AUDIT,
} as PolicyRow;

const PROJECTION_ROWS = [
  { id: 'j2', policy_id: 'p1', age: 65, value: 320000, ...AUDIT },
  { id: 'j1', policy_id: 'p1', age: 55, value: 180000, ...AUDIT },
] as ProjectedCashValueRow[];

describe('policy mapping', () => {
  it('maps rows to string models with projections sorted by age', () => {
    const model = policyFromRow(POLICY_ROW, PROJECTION_ROWS);
    expect(model.premium).toBe('250.5');
    expect(model.tpdSameAsDeath).toBe(true);
    expect(model.ilpPremiumInclusionPercent).toBe('50');
    expect(model.projectedCashValue).toEqual([
      { age: 55, value: '180000' },
      { age: 65, value: '320000' },
    ]);
  });

  it('defaults null booleans to false and null enums to legacy defaults', () => {
    const bare = policyFromRow({ ...POLICY_ROW, tpd_same_as_death: null, has_cash_value: null, frequency: null, status: null, hospital_type: null, ilp_premium_inclusion_percent: null } as PolicyRow, []);
    expect(bare.tpdSameAsDeath).toBe(false);
    expect(bare.hasCashValue).toBe(false);
    expect(bare.frequency).toBe('Annual');
    expect(bare.status).toBe('Active');
    expect(bare.hospitalType).toBe('Private');
    expect(bare.ilpPremiumInclusionPercent).toBe('0');
  });

  it('round-trips row → model → write payload for every written column', () => {
    const payload = policyToRow(policyFromRow(POLICY_ROW, PROJECTION_ROWS));
    expect(payload).toEqual({
      type: 'Investment-Linked Policy', provider: 'Prudential', policy_number: 'ILP-001',
      premium: 250.5, frequency: 'Monthly', coverage_amount: 500000, tpd_coverage: 500000,
      tpd_same_as_death: true, critical_illness_coverage: 100000, ci_notes: 'Standard CI',
      early_critical_illness_coverage: 30000, eci_notes: 'ECI rider', start_date: '2020-03-01',
      end_date: '2060-03-01', status: 'Active', has_cash_value: true, current_cash_value: 12000,
      is_investment_linked: true, current_account_value: 45000,
      investment_allocation: '70/30 equity', illustrated_value_age_55: 180000,
      illustrated_value_age_65: 320000, ilp_premium_inclusion_percent: 50,
      is_hospitalization: false, hospital_type: 'Private', integrated_shield_cpf: 0,
      integrated_shield_cash: 0, rider_cash: 0,
    });
  });

  it("coerces '' policy numerics to 0 on write (asymmetric vs client null)", () => {
    const model = policyFromRow({ ...POLICY_ROW, premium: null, coverage_amount: null, rider_cash: null } as PolicyRow, []);
    expect(model.premium).toBe('');
    const payload = policyToRow(model);
    expect(payload.premium).toBe(0);
    expect(payload.coverage_amount).toBe(0);
    expect(payload.rider_cash).toBe(0);
  });
});

describe('projection mapping', () => {
  it('writes age and value as numbers (model keeps value as form string)', () => {
    expect(projectionsToRows([{ age: 55, value: '180000.50' }])).toEqual([
      { age: 55, value: 180000.5 },
    ]);
  });

  it('sorts read rows by age without mutating the input array', () => {
    const sorted = projectionsFromRows(PROJECTION_ROWS);
    expect(sorted.map((p) => p.age)).toEqual([55, 65]);
    expect(PROJECTION_ROWS[0].age).toBe(65);
  });
});

const INTERACTION_ROW = {
  id: 'i1', client_id: 'c1', date: '2026-06-01', type: 'Phone Call',
  notes: 'Discussed top-up', follow_up: '2026-06-20', ...AUDIT,
} as InteractionRow;

describe('interaction mapping', () => {
  it('round-trips and defaults null type to Meeting on read', () => {
    expect(interactionToRow(interactionFromRow(INTERACTION_ROW))).toEqual({
      date: '2026-06-01', type: 'Phone Call', notes: 'Discussed top-up', follow_up: '2026-06-20',
    });
    expect(interactionFromRow({ ...INTERACTION_ROW, type: null } as InteractionRow).type).toBe('Meeting');
  });

  it("writes followUp '' as null but keeps notes '' verbatim (schema date vs text)", () => {
    const payload = interactionToRow({ date: '2026-06-01', type: 'Email', notes: '', followUp: '' });
    expect(payload.follow_up).toBeNull();
    expect(payload.notes).toBe('');
  });
});

const BANK_ROW = {
  id: 'b1', client_id: 'c1', date: '2026-06-01', balance: 42000.75,
  notes: 'Initial client onboarding', ...AUDIT,
} as BankBalanceRow;

describe('bank history mapping', () => {
  it('renders balance as a string model and writes it back as a number', () => {
    const model = bankFromRow(BANK_ROW);
    expect(model.balance).toBe('42000.75');
    expect(bankToRow(model)).toEqual({
      date: '2026-06-01', balance: 42000.75, notes: 'Initial client onboarding',
    });
  });

  it("defaults null balance to '0' on read and passes notes through verbatim", () => {
    expect(bankFromRow({ ...BANK_ROW, balance: null, notes: null } as BankBalanceRow).balance).toBe('0');
    expect(bankToRow({ date: '2026-06-02', balance: '0', notes: '' }).notes).toBe('');
  });
});
