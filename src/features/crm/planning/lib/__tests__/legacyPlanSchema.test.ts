/**
 * Stored-plan parser corpus.
 *
 * The plan is persisted as one JSONB document, so what comes back is `unknown`
 * — and it can legitimately be OLD, written by an earlier build. The parser is
 * therefore TOTAL: these tests exist to prove that no shape of stored data can
 * throw, and that a partly-readable document yields its readable part rather
 * than an error screen over a plan the advisor spent an hour building.
 */
import { describe, expect, it } from 'vitest';

import type { LegacyPlan } from '../legacy';
import { emptyLegacyPlan, isEmptyLegacyPlan, parseLegacyPlan } from '../legacyPlanSchema';

const FULL: LegacyPlan = {
  spouseName: 'Mei Lin',
  people: [
    { id: 'p1', generation: 'kids', name: 'Jia Wei', relationship: 'Son', age: 23 },
    { id: 'p2', generation: 'elders', name: 'Ah Kong', relationship: 'Father', age: null },
  ],
  assets: [
    { id: 'a1', type: 'cpf', name: 'CPF balances', value: 152_000, growthPct: 4 },
    { id: 'a2', type: 'property', name: 'HDB', value: 650_000, growthPct: 2.5 },
  ],
  nominations: [{ assetId: 'a1', shares: [{ personId: 'p1', percentage: 100 }] }],
  allocations: [{ assetId: 'a2', shares: [{ personId: 'p2', percentage: 100 }] }],
};

describe('parseLegacyPlan — round trip', () => {
  it('reads back exactly what was written', () => {
    expect(parseLegacyPlan(JSON.parse(JSON.stringify(FULL)))).toEqual(FULL);
  });

  it('reads the column default (an empty plan)', () => {
    const stored = { spouseName: '', people: [], assets: [], nominations: [], allocations: [] };
    expect(parseLegacyPlan(stored)).toEqual(emptyLegacyPlan());
  });
});

describe('parseLegacyPlan — never throws', () => {
  const junk: unknown[] = [
    null,
    undefined,
    0,
    'a string',
    [],
    true,
    { spouseName: 42 },
    { people: 'not an array' },
    { assets: [null, 3, 'x'] },
    { nominations: [{ shares: 'nope' }] },
    { allocations: [{ assetId: 'a1', shares: [{ percentage: 'lots' }] }] },
  ];

  for (const [i, value] of junk.entries()) {
    it(`survives junk input #${i}`, () => {
      expect(() => parseLegacyPlan(value)).not.toThrow();
      const plan = parseLegacyPlan(value);
      expect(Array.isArray(plan.people)).toBe(true);
      expect(Array.isArray(plan.assets)).toBe(true);
      expect(typeof plan.spouseName).toBe('string');
    });
  }
});

describe('parseLegacyPlan — partial recovery', () => {
  it('keeps the good entries and drops the malformed ones', () => {
    const plan = parseLegacyPlan({
      spouseName: 'Mei',
      people: [
        { id: 'p1', generation: 'kids', name: 'Jia Wei', relationship: 'Son', age: 23 },
        { name: 'no id — dropped' },
        'not an object',
      ],
      assets: [{ id: 'a1', type: 'cash', name: 'DBS', value: 1000, growthPct: 1 }, null],
    });
    expect(plan.spouseName).toBe('Mei');
    expect(plan.people).toHaveLength(1);
    expect(plan.assets).toHaveLength(1);
  });

  it('falls back to "others" for an unknown generation rather than dropping the person', () => {
    const plan = parseLegacyPlan({
      people: [{ id: 'p1', generation: 'cousins', name: 'X', relationship: 'Other' }],
    });
    expect(plan.people[0].generation).toBe('others');
  });

  it('keeps an unknown asset type — it degrades to an estate asset downstream', () => {
    const plan = parseLegacyPlan({
      assets: [{ id: 'a1', type: 'crypto', name: 'BTC', value: 5000, growthPct: 0 }],
    });
    expect(plan.assets[0].type).toBe('crypto');
  });

  it('keeps a null age as null — 0 would read as a newborn', () => {
    const plan = parseLegacyPlan({
      people: [{ id: 'p1', generation: 'kids', name: 'X', relationship: 'Son', age: null }],
    });
    expect(plan.people[0].age).toBeNull();
  });

  it('coerces a non-finite value to zero rather than NaN', () => {
    const plan = parseLegacyPlan({
      assets: [{ id: 'a1', type: 'cash', name: 'X', value: 'lots', growthPct: null }],
    });
    expect(plan.assets[0].value).toBe(0);
    expect(plan.assets[0].growthPct).toBe(0);
  });
});

describe('parseLegacyPlan — referential integrity', () => {
  it('DROPS a direction pointing at an asset that no longer exists', () => {
    // Otherwise the comparison table would distribute money to a beneficiary
    // from an asset that is not in the estate.
    const plan = parseLegacyPlan({
      assets: [{ id: 'a1', type: 'cash', name: 'DBS', value: 1000, growthPct: 0 }],
      nominations: [{ assetId: 'gone', shares: [{ personId: 'p1', percentage: 100 }] }],
      allocations: [{ assetId: 'also-gone', shares: [{ personId: 'p2', percentage: 100 }] }],
    });
    expect(plan.nominations).toHaveLength(0);
    expect(plan.allocations).toHaveLength(0);
  });

  it('keeps a direction whose asset is still present', () => {
    const plan = parseLegacyPlan({
      assets: [{ id: 'a1', type: 'cpf', name: 'CPF', value: 1000, growthPct: 4 }],
      nominations: [{ assetId: 'a1', shares: [{ personId: 'p1', percentage: 100 }] }],
    });
    expect(plan.nominations).toHaveLength(1);
  });

  it('drops a share with no beneficiary id', () => {
    const plan = parseLegacyPlan({
      assets: [{ id: 'a1', type: 'cpf', name: 'CPF', value: 1000, growthPct: 4 }],
      nominations: [{ assetId: 'a1', shares: [{ percentage: 100 }, { personId: 'p1', percentage: 50 }] }],
    });
    expect(plan.nominations[0].shares).toHaveLength(1);
    expect(plan.nominations[0].shares[0].personId).toBe('p1');
  });
});

describe('isEmptyLegacyPlan', () => {
  it('is true for a fresh plan', () => {
    expect(isEmptyLegacyPlan(emptyLegacyPlan())).toBe(true);
  });

  it('is false once anything is entered', () => {
    expect(isEmptyLegacyPlan({ ...emptyLegacyPlan(), spouseName: 'Mei' })).toBe(false);
    expect(isEmptyLegacyPlan(FULL)).toBe(false);
  });

  it('ignores whitespace in the spouse name', () => {
    expect(isEmptyLegacyPlan({ ...emptyLegacyPlan(), spouseName: '   ' })).toBe(true);
  });
});
