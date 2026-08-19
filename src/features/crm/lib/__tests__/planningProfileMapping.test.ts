/**
 * The tool-owned half of the client mapping (2026-08-19).
 *
 * Two properties matter here and nothing else does:
 *  1. `clientFromRow` READS the tax/SRS columns, including from a row that
 *     predates them, so the tools can pre-fill.
 *  2. `clientToRow` never WRITES them — the client form must not be able to
 *     blank a customer's SRS balance by saving their phone number.
 */
import { describe, expect, it } from 'vitest';

import type { ClientRow } from '../../types';
import { clientFromRow, clientToRow } from '../clientMapping';

const AUDIT = {
  created_at: '2026-06-11T00:00:00Z', updated_at: '2026-06-11T00:00:00Z',
  created_by: null, updated_by: null, is_deleted: false, user_id: 'user-1',
};

const BASE = {
  id: 'c1', name: 'Tan Wei Jie', email: null, phone: null,
  date_of_birth: '1990-04-02', occupation: null, annual_income: 85000,
  risk_profile: null, notes: null, created_date: null,
  last_review_date: null, next_review_date: null, review_frequency: null,
  total_bank_balance: null, cpf_oa: null, cpf_sa: null, cpf_ma: null,
  personal_investment_value: null, personal_investment_growth_rate: null,
  include_personal_investment_in_retirement: true,
  future_income_step1: null, future_income_start_age1: null, future_income_end_age1: null,
  future_income_step2: null, future_income_start_age2: null, future_income_end_age2: null,
  future_income_step3: null, future_income_start_age3: null, future_income_end_age3: null,
  ...AUDIT,
} as ClientRow;

const SAVED = {
  ...BASE,
  tax_employment_type: 'selfEmployed',
  tax_other_income: 12000,
  tax_donations: 500,
  tax_use_fedr: true,
  tax_fedr_rate: 0.6,
  tax_reliefs: { cpf: { on: true, quantity: 1, manualAmount: 0 } },
  tax_saved_at: '2026-08-19T06:00:00Z',
  srs_current_balance: 40000,
  srs_contribution_this_year: 15300,
  srs_annual_contribution: 15300,
  srs_growth_rate: 4,
  srs_contribute_until_age: 62,
  srs_withdrawal_age: 63,
  srs_withdrawal_strategy: 'custom',
  srs_balance_override: 250000,
  srs_withdrawal_start_age: 65,
  srs_withdrawal_years: 10,
  srs_withdrawal_growth: 3,
  srs_withdrawal_other_income: 24000,
  srs_withdrawal_periods: [{ amount: 60000, years: 5 }],
  srs_saved_at: '2026-08-19T07:00:00Z',
} as ClientRow;

describe('planning profile — read side', () => {
  it('maps every saved tax and SRS column onto the model', () => {
    const model = clientFromRow(SAVED);

    expect(model.tax).toEqual({
      employmentType: 'selfEmployed',
      otherIncome: '12000',
      donations: '500',
      useFedr: true,
      fedrRate: '0.6',
      reliefs: { cpf: { on: true, quantity: 1, manualAmount: 0 } },
      savedAt: '2026-08-19T06:00:00Z',
    });

    expect(model.srs.currentBalance).toBe('40000');
    expect(model.srs.withdrawalAge).toBe('63');
    expect(model.srs.strategy).toBe('custom');
    expect(model.srs.periods).toEqual([{ amount: 60000, years: 5 }]);
    expect(model.srs.savedAt).toBe('2026-08-19T07:00:00Z');
  });

  it('reads a never-saved customer as blanks, not as zeroes', () => {
    const model = clientFromRow(BASE);
    // '' is what makes the tools fall back to their statutory defaults; a '0'
    // here would silently open the SRS planner on a zero balance instead.
    expect(model.tax.employmentType).toBe('');
    expect(model.tax.useFedr).toBe(false);
    expect(model.tax.reliefs).toBeNull();
    expect(model.tax.savedAt).toBe('');
    expect(model.srs.currentBalance).toBe('');
    expect(model.srs.periods).toBeNull();
  });

  it('survives a row from before the columns existed', () => {
    const legacy = { ...BASE } as Record<string, unknown>;
    for (const key of Object.keys(legacy)) {
      if (key.startsWith('tax_') || key.startsWith('srs_')) delete legacy[key];
    }
    const model = clientFromRow(legacy as unknown as ClientRow);
    expect(model.tax.reliefs).toBeNull();
    expect(model.srs.strategy).toBe('');
  });

  it('degrades malformed jsonb to null rather than throwing', () => {
    // A relief catalogue that changed between saves must open on the defaults,
    // never blow up a customer's record.
    const junk = clientFromRow({
      ...SAVED,
      tax_reliefs: 'not an object',
      srs_withdrawal_periods: { nope: true },
    } as unknown as ClientRow);
    expect(junk.tax.reliefs).toBeNull();
    expect(junk.srs.periods).toBeNull();
  });

  it('drops entries of the wrong shape but keeps the good ones', () => {
    const mixed = clientFromRow({
      ...SAVED,
      tax_reliefs: { cpf: { on: true, quantity: '2', manualAmount: null }, bad: 7 },
      srs_withdrawal_periods: [{ amount: 1000, years: 2 }, 'nope'],
    } as unknown as ClientRow);
    expect(mixed.tax.reliefs).toEqual({ cpf: { on: true, quantity: 2, manualAmount: 0 } });
    expect(mixed.srs.periods).toEqual([{ amount: 1000, years: 2 }]);
  });
});

describe('planning profile — write side', () => {
  it('clientToRow writes no tax_* or srs_* column', () => {
    const payload = clientToRow(clientFromRow(SAVED)) as Record<string, unknown>;
    const owned = Object.keys(payload).filter(
      (key) => key.startsWith('tax_') || key.startsWith('srs_'),
    );
    expect(owned).toEqual([]);
  });
});
