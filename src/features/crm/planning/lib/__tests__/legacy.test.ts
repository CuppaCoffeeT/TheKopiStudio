/**
 * Legacy Map corpus — locks the Intestate Succession Act 1967 s.7 ladder and
 * the nominated-vs-estate split.
 *
 * These are the rules that decide who actually inherits. A wrong branch here
 * silently hands an estate to the wrong side of a family, so every rule gets
 * its own case, including the exclusions the Act makes (in-laws are not
 * "parents"; grandparents only inherit after siblings).
 */
import { describe, expect, it } from 'vitest';

import {
  ASSET_TYPES,
  assetTypeFor,
  estateTotals,
  isNominated,
  plannedDistribution,
  projectAsset,
  projectEstate,
  SPOUSE_ID,
  type Asset,
  type LegacyPlan,
  type Person,
} from '../legacy';
import { calculateIsaDistribution, ISA_RULES, planningGap } from '../legacyIsa';

const person = (
  id: string,
  generation: Person['generation'],
  relationship: string,
  name = id,
): Person => ({ id, generation, name, relationship, age: null });

const asset = (id: string, type: string, value: number, growthPct = 0): Asset => ({
  id,
  type,
  name: id,
  value,
  growthPct,
});

const emptyPlan = (): LegacyPlan => ({
  spouseName: '',
  people: [],
  assets: [],
  nominations: [],
  allocations: [],
});

describe('asset types', () => {
  it('marks CPF as forced — nomination is the ONLY route', () => {
    const cpf = assetTypeFor('cpf');
    expect(cpf.nominatable).toBe(true);
    expect(cpf.forced).toBe(true);
  });

  it('marks insurance nominatable but not forced', () => {
    const insurance = assetTypeFor('insurance');
    expect(insurance.nominatable).toBe(true);
    expect(insurance.forced).toBe(false);
  });

  it('treats ordinary assets as estate assets', () => {
    for (const id of ['cash', 'property', 'investment', 'srs', 'business', 'other']) {
      expect(assetTypeFor(id).nominatable).toBe(false);
    }
  });

  it('falls back to "other" for an unknown id rather than crashing', () => {
    expect(assetTypeFor('nonsense').id).toBe('other');
    expect(ASSET_TYPES).toHaveLength(8);
  });
});

describe('isNominated — an empty nomination is not a nomination', () => {
  it('is false with no nomination row at all', () => {
    const plan = { ...emptyPlan(), assets: [asset('a1', 'cpf', 100)] };
    expect(isNominated(plan, 'a1')).toBe(false);
  });

  it('is false for a nomination with no beneficiaries', () => {
    const plan = {
      ...emptyPlan(),
      assets: [asset('a1', 'cpf', 100)],
      nominations: [{ assetId: 'a1', shares: [] }],
    };
    expect(isNominated(plan, 'a1')).toBe(false);
  });

  it('is false for shares summing to zero', () => {
    const plan = {
      ...emptyPlan(),
      assets: [asset('a1', 'cpf', 100)],
      nominations: [{ assetId: 'a1', shares: [{ personId: 'p1', percentage: 0 }] }],
    };
    expect(isNominated(plan, 'a1')).toBe(false);
  });

  it('is true once a real share exists', () => {
    const plan = {
      ...emptyPlan(),
      assets: [asset('a1', 'cpf', 100)],
      nominations: [{ assetId: 'a1', shares: [{ personId: 'p1', percentage: 100 }] }],
    };
    expect(isNominated(plan, 'a1')).toBe(true);
  });
});

describe('estateTotals', () => {
  it('separates nominated assets from the distributable estate', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      assets: [asset('cpf', 'cpf', 300_000), asset('house', 'property', 700_000)],
      nominations: [{ assetId: 'cpf', shares: [{ personId: 'k1', percentage: 100 }] }],
    };
    const totals = estateTotals(plan);
    expect(totals.totalEstate).toBe(1_000_000);
    expect(totals.nominatedTotal).toBe(300_000);
    expect(totals.distributableTotal).toBe(700_000);
  });

  it('counts a partial will allocation as partly unallocated', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      assets: [asset('house', 'property', 700_000)],
      allocations: [{ assetId: 'house', shares: [{ personId: 'k1', percentage: 60 }] }],
    };
    const totals = estateTotals(plan);
    expect(totals.allocatedTotal).toBeCloseTo(420_000, 6);
    expect(totals.unallocatedTotal).toBeCloseTo(280_000, 6);
  });

  it('never counts an over-100% allocation as more than the asset', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      assets: [asset('house', 'property', 100_000)],
      allocations: [
        {
          assetId: 'house',
          shares: [
            { personId: 'k1', percentage: 80 },
            { personId: 'k2', percentage: 80 },
          ],
        },
      ],
    };
    expect(estateTotals(plan).allocatedTotal).toBeCloseTo(100_000, 6);
    expect(estateTotals(plan).unallocatedTotal).toBeCloseTo(0, 6);
  });
});

describe('calculateIsaDistribution — the s.7 ladder', () => {
  const estate = [asset('house', 'property', 900_000)];

  it('Rule 1 — spouse alone takes everything', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[0]);
    expect(result.distribution[SPOUSE_ID]).toBe(900_000);
  });

  it('Rule 2 — spouse takes half, children split the rest', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      people: [person('k1', 'kids', 'Son'), person('k2', 'kids', 'Daughter')],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[1]);
    expect(result.distribution[SPOUSE_ID]).toBe(450_000);
    expect(result.distribution.k1).toBe(225_000);
    expect(result.distribution.k2).toBe(225_000);
  });

  it('Rule 2 outranks Rule 4 — parents get nothing when children exist', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      people: [person('k1', 'kids', 'Son'), person('e1', 'elders', 'Father')],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[1]);
    expect(result.distribution.e1).toBeUndefined();
  });

  it('Rule 3 — children alone split everything', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      people: [person('k1', 'kids', 'Son'), person('k2', 'kids', 'Daughter')],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[2]);
    expect(result.distribution.k1).toBe(450_000);
  });

  it('Rule 4 — spouse and parents split half each', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      people: [person('e1', 'elders', 'Father'), person('e2', 'elders', 'Mother')],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[3]);
    expect(result.distribution[SPOUSE_ID]).toBe(450_000);
    expect(result.distribution.e1).toBe(225_000);
  });

  it('Rule 5 — parents alone split everything', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      people: [person('e1', 'elders', 'Mother')],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[4]);
    expect(result.distribution.e1).toBe(900_000);
  });

  it('EXCLUDES in-laws from the parents test — they are not parents under the Act', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      people: [person('e1', 'elders', 'Father-in-law')],
      assets: estate,
    });
    // Spouse only, because an in-law does not satisfy "parent".
    expect(result.rule).toBe(ISA_RULES[0]);
    expect(result.distribution.e1).toBeUndefined();
  });

  it('Rule 6 — siblings inherit only when nobody above them survives', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      people: [person('o1', 'others', 'Brother'), person('o2', 'others', 'Sister')],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[5]);
    expect(result.distribution.o1).toBe(450_000);
  });

  it('does NOT treat a friend or charity as a sibling', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      people: [person('o1', 'others', 'Friend'), person('o2', 'others', 'Charity')],
      assets: estate,
    });
    // Nobody qualifies → the Government takes it.
    expect(result.rule).toBe(ISA_RULES[8]);
    expect(result.distribution).toEqual({});
  });

  it('Rule 7 — grandparents inherit only after siblings', () => {
    const withSiblings = calculateIsaDistribution({
      ...emptyPlan(),
      people: [person('o1', 'others', 'Brother'), person('e1', 'elders', 'Grandparent')],
      assets: estate,
    });
    expect(withSiblings.rule).toBe(ISA_RULES[5]);

    const withoutSiblings = calculateIsaDistribution({
      ...emptyPlan(),
      people: [person('e1', 'elders', 'Grandparent')],
      assets: estate,
    });
    expect(withoutSiblings.rule).toBe(ISA_RULES[6]);
    expect(withoutSiblings.distribution.e1).toBe(900_000);
  });

  it('Rule 9 — an estate with no qualifying relatives goes to the Government', () => {
    const result = calculateIsaDistribution({ ...emptyPlan(), assets: estate });
    expect(result.rule).toBe(ISA_RULES[8]);
    expect(result.distribution).toEqual({});
  });

  it('ignores unnamed people — a blank row is not a beneficiary', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      people: [{ ...person('k1', 'kids', 'Son'), name: '   ' }],
      assets: estate,
    });
    expect(result.rule).toBe(ISA_RULES[0]);
  });

  it('EXCLUDES nominated assets — the ISA never reaches them', () => {
    const result = calculateIsaDistribution({
      ...emptyPlan(),
      spouseName: 'Mei',
      assets: [asset('house', 'property', 900_000), asset('cpf', 'cpf', 300_000)],
      nominations: [{ assetId: 'cpf', shares: [{ personId: 'k1', percentage: 100 }] }],
    });
    expect(result.distributable).toBe(900_000);
    expect(result.distribution[SPOUSE_ID]).toBe(900_000);
  });
});

describe('plannedDistribution', () => {
  it('credits nominations and will allocations alike', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      assets: [asset('cpf', 'cpf', 300_000), asset('house', 'property', 700_000)],
      nominations: [{ assetId: 'cpf', shares: [{ personId: 'k1', percentage: 100 }] }],
      allocations: [{ assetId: 'house', shares: [{ personId: 'k2', percentage: 100 }] }],
    };
    const dist = plannedDistribution(plan);
    expect(dist.k1).toBe(300_000);
    expect(dist.k2).toBe(700_000);
  });

  it('ignores a will allocation on an asset that is nominated', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      assets: [asset('cpf', 'cpf', 300_000)],
      nominations: [{ assetId: 'cpf', shares: [{ personId: 'k1', percentage: 100 }] }],
      allocations: [{ assetId: 'cpf', shares: [{ personId: 'k2', percentage: 100 }] }],
    };
    const dist = plannedDistribution(plan);
    // The nomination wins — a will cannot override it.
    expect(dist.k1).toBe(300_000);
    expect(dist.k2).toBeUndefined();
  });
});

describe('projection', () => {
  it('compounds an asset at its percentage growth', () => {
    expect(projectAsset(asset('a', 'cash', 100_000, 10), 2)).toBeCloseTo(121_000, 6);
  });

  it('leaves a zero-growth asset alone', () => {
    expect(projectAsset(asset('a', 'insurance', 1_000_000, 0), 20)).toBe(1_000_000);
  });

  it('never projects backwards for a target age in the past', () => {
    const plan: LegacyPlan = { ...emptyPlan(), assets: [asset('a', 'cash', 100_000, 10)] };
    expect(projectEstate(plan, 60, 50)).toBeCloseTo(100_000, 6);
  });
});

describe('planningGap — the headline comparison', () => {
  it('shows the difference a will makes to the named beneficiaries', () => {
    // Everything left to one child; intestacy would split it with the spouse.
    const plan: LegacyPlan = {
      ...emptyPlan(),
      spouseName: 'Mei',
      people: [person('k1', 'kids', 'Son')],
      assets: [asset('house', 'property', 1_000_000)],
      allocations: [{ assetId: 'house', shares: [{ personId: 'k1', percentage: 100 }] }],
    };
    const gap = planningGap(plan);
    expect(gap.withPlanning).toBe(1_000_000);
    expect(gap.withoutPlanning).toBe(1_000_000); // 500k spouse + 500k child
    expect(gap.difference).toBe(0);
  });

  it('counts nominated assets on BOTH sides — a nomination survives intestacy', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      people: [person('k1', 'kids', 'Son')],
      assets: [asset('cpf', 'cpf', 400_000)],
      nominations: [{ assetId: 'cpf', shares: [{ personId: 'k1', percentage: 100 }] }],
    };
    const gap = planningGap(plan);
    expect(gap.withPlanning).toBe(400_000);
    expect(gap.withoutPlanning).toBe(400_000);
  });

  it('exposes an unallocated estate as a planning shortfall', () => {
    const plan: LegacyPlan = {
      ...emptyPlan(),
      people: [person('k1', 'kids', 'Son')],
      assets: [asset('house', 'property', 1_000_000)],
      // No will allocation at all.
    };
    const gap = planningGap(plan);
    expect(gap.withPlanning).toBe(0);
    expect(gap.withoutPlanning).toBe(1_000_000);
    expect(gap.difference).toBe(-1_000_000);
  });
});
