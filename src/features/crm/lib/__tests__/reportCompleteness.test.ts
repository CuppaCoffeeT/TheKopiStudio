/**
 * The report is no longer gated, so it has to be honest about what it lacks.
 *
 * The one thing that must never happen: an unknown income printing as `$0`.
 * "We have not asked" and "the answer is zero" are opposite facts to read back
 * to a customer, and every other assertion here exists to protect that line.
 */

import { describe, expect, it } from 'vitest';
import { EMPTY_CLIENT } from '../../components/modals/client/clientFormModel';
import { NIL, nilMoney, nilOr, reportGaps } from '../reportCompleteness';
import type { CrmClient, CrmPolicy } from '../../types';

const blank: CrmClient = { ...EMPTY_CLIENT, id: 'c1', riskProfile: '' };

const filled: CrmClient = {
  ...blank,
  name: 'Sky Tan',
  email: 'sky@example.com',
  phone: '90000000',
  dateOfBirth: '1986-04-02',
  occupation: 'Engineer',
  annualIncome: '5000',
  riskProfile: 'Moderate',
  cpfOA: '12000',
};

const policy = { id: 'p1' } as CrmPolicy;

describe('nilOr / nilMoney', () => {
  it('prints NIL rather than a blank, so the gap is visible on paper', () => {
    expect(nilOr('')).toBe(NIL);
    expect(nilOr('   ')).toBe(NIL);
    expect(nilOr(null)).toBe(NIL);
  });

  it('never turns an unknown amount into a zero', () => {
    expect(nilMoney('')).toBe(NIL);
    expect(nilMoney(null)).toBe(NIL);
    expect(nilMoney('0')).toBe('$0'); // a real, stated zero still prints
    expect(nilMoney('5000')).toBe('$5,000');
  });

  it('falls back to NIL for a value that is not a number at all', () => {
    expect(nilMoney('n/a')).toBe(NIL);
  });
});

describe('reportGaps', () => {
  it('names every gap on an empty record, and points at the tool that fills it', () => {
    const gaps = reportGaps(blank, []);
    const fields = gaps.map((gap) => gap.field);
    expect(fields).toContain('Risk profile');
    expect(fields).toContain('Annual income');
    expect(fields).toContain('Portfolio');
    expect(gaps.find((gap) => gap.field === 'Risk profile')?.remedy).toContain(
      'Prospect Profiler',
    );
  });

  it('reports nothing once the record and the portfolio are populated', () => {
    expect(reportGaps(filled, [policy])).toEqual([]);
  });

  it('counts contact details as present when either channel is on file', () => {
    const gaps = reportGaps({ ...filled, email: '' }, [policy]);
    expect(gaps.map((gap) => gap.field)).not.toContain('Contact details');
  });

  it('flags the portfolio when the customer holds no policies', () => {
    expect(reportGaps(filled, []).map((gap) => gap.field)).toContain('Portfolio');
  });
});
