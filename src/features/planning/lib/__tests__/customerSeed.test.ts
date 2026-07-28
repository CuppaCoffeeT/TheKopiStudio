/**
 * Seeding guard corpus.
 *
 * Locks the case that shipped a −60 age into the tax calculator: the
 * `DatePicker`'s `dd/mm/yy` field reads "86" as **2086**, storing a future date
 * of birth, and `ageFromDOB` is a plain year subtraction. Every tool now goes
 * through `seedAge`, so a nonsense DOB can never open a calculator on a
 * nonsense age again.
 */
import { describe, expect, it } from 'vitest';

import { DEFAULT_SEED_AGE, seedAge, seedAmount } from '../customerSeed';

const REF_YEAR = 2026;

describe('seedAge', () => {
  it('returns the real age for an ordinary date of birth', () => {
    expect(seedAge('1986-03-15', REF_YEAR)).toBe(40);
    expect(seedAge('1960-01-01', REF_YEAR)).toBe(66);
  });

  it('falls back for a missing date of birth', () => {
    expect(seedAge(null, REF_YEAR)).toBe(DEFAULT_SEED_AGE);
    expect(seedAge(undefined, REF_YEAR)).toBe(DEFAULT_SEED_AGE);
    expect(seedAge('', REF_YEAR)).toBe(DEFAULT_SEED_AGE);
  });

  it('REGRESSION: a future DOB no longer yields a negative age', () => {
    // The 2086 case — "15/03/86" typed into the dd/mm/yy picker.
    expect(seedAge('2086-03-15', REF_YEAR)).toBe(DEFAULT_SEED_AGE);
  });

  it('falls back for an unparseable date rather than producing NaN', () => {
    expect(seedAge('not-a-date', REF_YEAR)).toBe(DEFAULT_SEED_AGE);
  });

  it('rejects ages outside the plausible advice range', () => {
    expect(seedAge('2020-01-01', REF_YEAR)).toBe(DEFAULT_SEED_AGE); // age 6
    expect(seedAge('1900-01-01', REF_YEAR)).toBe(DEFAULT_SEED_AGE); // age 126
  });

  it('accepts the boundaries themselves', () => {
    expect(seedAge('2010-01-01', REF_YEAR)).toBe(16);
    expect(seedAge('1926-01-01', REF_YEAR)).toBe(100);
  });
});

describe('seedAmount', () => {
  it('parses a form-string numeric field', () => {
    expect(seedAmount('180000')).toBe(180_000);
  });

  it('treats blank, null and non-numeric as zero', () => {
    expect(seedAmount('')).toBe(0);
    expect(seedAmount(null)).toBe(0);
    expect(seedAmount(undefined)).toBe(0);
    expect(seedAmount('abc')).toBe(0);
  });

  it('never seeds a negative balance', () => {
    expect(seedAmount('-500')).toBe(0);
  });
});
