/**
 * The diff engine behind the customer history.
 *
 * Two behaviours are load-bearing and both have burned products before:
 * an empty diff must produce NO entry (a timeline that logs every Save teaches
 * people to ignore it), and a blank → value change must read as "not set →
 * $5,000" rather than "$0 → $5,000", which is a different and false claim.
 */

import { describe, expect, it } from 'vitest';
import { EMPTY_CLIENT } from '../../components/modals/client/clientFormModel';
import { diffClient, formatChange, summariseChanges } from '../customerActivity';
import type { CrmClient } from '../../types';

const base: CrmClient = { ...EMPTY_CLIENT, id: 'c1', name: 'Sky Tan', annualIncome: '4500' };

describe('diffClient', () => {
  it('reports nothing when nothing tracked moved', () => {
    expect(diffClient(base, { ...base })).toEqual([]);
  });

  it('formats money fields with the currency the advisor saw', () => {
    const changes = diffClient(base, { ...base, annualIncome: '5000' });
    expect(changes).toEqual([
      { field: 'annualIncome', label: 'Annual income', from: '$4,500', to: '$5,000' },
    ]);
  });

  it('reports a risk-profile change in the advisor’s own words', () => {
    const changes = diffClient(
      { ...base, riskProfile: 'Moderate' },
      { ...base, riskProfile: 'Aggressive' },
    );
    expect(changes).toEqual([
      { field: 'riskProfile', label: 'Risk profile', from: 'Moderate', to: 'Aggressive' },
    ]);
  });

  it('ignores system-written fields — a derived recompute is not an edit', () => {
    // totalBankBalance and lastReviewDate are owned by the bank-history
    // recompute, so they must never appear as something a person did.
    const changes = diffClient(base, {
      ...base,
      totalBankBalance: '90000',
      lastReviewDate: '2026-08-18',
      createdDate: '2026-01-01',
    });
    expect(changes).toEqual([]);
  });

  it('treats whitespace-only as unset, so trimming is not an "edit"', () => {
    expect(diffClient({ ...base, occupation: 'Engineer' }, { ...base, occupation: 'Engineer  ' })).toEqual([]);
  });
});

describe('formatChange', () => {
  it('names an empty side rather than printing an ambiguous blank', () => {
    expect(formatChange({ field: 'x', label: 'X', from: '', to: '$5,000' })).toBe(
      'not set → $5,000',
    );
    expect(formatChange({ field: 'x', label: 'X', from: '$5,000', to: '' })).toBe(
      '$5,000 → cleared',
    );
  });
});

describe('summariseChanges', () => {
  it('names the fields while the list is short enough to read', () => {
    const changes = diffClient(base, { ...base, annualIncome: '5000', occupation: 'Engineer' });
    expect(summariseChanges(changes)).toBe('Occupation, Annual income updated');
  });

  it('counts them once naming them would be a paragraph', () => {
    const changes = diffClient(base, {
      ...base,
      email: 'a@b.c',
      phone: '900',
      occupation: 'Engineer',
      annualIncome: '5000',
    });
    expect(summariseChanges(changes)).toBe('4 fields updated');
  });
});
