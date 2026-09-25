/**
 * v42 protection structure (2026-09-25) — oracle-locked against the
 * reference's inline expressions (`insurance_crm_v42.html` ~2709-2749, and the
 * Shield branch at ~2937) using its own two sample clients' shapes.
 */
import { describe, expect, it } from 'vitest';

import { summariseClient } from '../finance';
import { splitPremiums } from '../financeReport';
import {
  ciStructure,
  deathCoverPolicies,
  isPersonalAccident,
  liquidity,
  personalAccidentCover,
  protectionContributors,
} from '../protectionStructure';

const LIFE = { type: 'Whole Life', coverageAmount: '500000', criticalIllnessCoverage: '200000', ciAccelerated: true };
const TERM = { type: 'Term Life', coverageAmount: '300000', criticalIllnessCoverage: '400000', ciAccelerated: false };
const PA = { type: 'Personal Accident', coverageAmount: '200000', criticalIllnessCoverage: '0' };
const ILP = {
  type: 'Investment-Linked Policy', coverageAmount: '0', criticalIllnessCoverage: '0',
  currentAccountValue: '45000', currentCashValue: '0', surrenderValue: '22400',
};

describe('Personal Accident', () => {
  it('is matched by type substring, case-insensitive', () => {
    expect(isPersonalAccident({ type: 'personal accident plus' })).toBe(true);
    expect(isPersonalAccident({ type: 'Whole Life' })).toBe(false);
  });

  it('leaves death cover but keeps its own total; identity without PA', () => {
    const book = [LIFE, TERM, PA];
    expect(summariseClient({ policies: deathCoverPolicies(book) }).totalCoverage).toBe(800_000);
    expect(personalAccidentCover(book)).toBe(200_000);
    const noPa = [LIFE, TERM];
    expect(deathCoverPolicies(noPa)).toEqual(noPa);
    expect(deathCoverPolicies(noPa)[0]).toBe(LIFE);
  });
});

describe('ciStructure — v42 maxClaimableTotal', () => {
  it('merges accelerated pots, stacks standalone CI, excludes PA', () => {
    const s = ciStructure([LIFE, TERM, PA]);
    // v42: accelerated → max(500k, 200k); standalone → 300k + 400k; PA excluded.
    expect(s.maxClaimableTotal).toBe(500_000 + 700_000);
    expect(s.ciPoliciesCount).toBe(2);
    expect(s.acceleratedCICount).toBe(1);
    expect(s.standaloneCICount).toBe(1);
    // (totalCoverage ex-PA + totalCICoverage) − maxClaimable
    expect(s.naiveTotal).toBe(800_000 + 600_000);
    expect(s.acceleratedOverlap).toBe(200_000);
  });

  it('treats an unanswered ciAccelerated as accelerated (`!== false`)', () => {
    const s = ciStructure([{ type: 'Whole Life', coverageAmount: '100000', criticalIllnessCoverage: '150000' }]);
    expect(s.acceleratedCICount).toBe(1);
    expect(s.maxClaimableTotal).toBe(150_000);
  });
});

describe('protectionContributors', () => {
  it('lists policies with any death or CI cover', () => {
    expect(protectionContributors([LIFE, PA, ILP])).toEqual([LIFE, PA]);
  });
});

describe('liquidity — "What you can access today"', () => {
  it('sums surrender values and prefers account value over cash value', () => {
    const cashPolicy = { type: 'Whole Life', currentAccountValue: '0', currentCashValue: '12000', surrenderValue: '9500' };
    const { total, lines } = liquidity([ILP, cashPolicy, LIFE]);
    expect(total).toBe(31_900);
    expect(lines.map((l) => [l.built, l.surrender, l.difference])).toEqual([
      [45_000, 22_400, 22_600],
      [12_000, 9_500, 2_500],
    ]);
  });
});

describe('splitPremiums — v42 Shield branch', () => {
  it('counts only the cash part of a Shield plan as protection', () => {
    const shield = {
      type: 'Hospitalization', isHospitalization: true, premium: '999', frequency: 'Annual',
      integratedShieldCPF: '300', integratedShieldCash: '150', riderCash: '50',
    };
    const term = { type: 'Term Life', premium: '100', frequency: 'Monthly' };
    expect(splitPremiums([shield, term])).toEqual({ protectionPremiums: 200 + 1200, investmentPremiums: 0 });
  });
});
