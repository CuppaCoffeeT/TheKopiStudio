/**
 * The blind spot in the annual-premium figure, pinned.
 *
 * Reproduces the prod case found on 2026-08-18: four investment-linked
 * policies with a real monthly premium and `ilpPremiumInclusionPercent = 0`
 * (the column default), each contributing exactly $0 to a total that offered
 * no hint anything was missing.
 */

import { describe, expect, it } from 'vitest';
import { summariseClient } from '../finance';
import { describeIlpExclusion, ilpExclusion } from '../ilpExclusion';

/** The four zero-percent ILPs on the live NKB record. */
const ZERO_PERCENT_ILPS = [
  { premium: 300, frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: 0 },
  { premium: 250, frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: 0 },
  { premium: 378, frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: 0 },
  { premium: 150, frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: 0 },
];

describe('ilpExclusion', () => {
  it('reports the annual premium the ILP rule silently dropped', () => {
    // (300 + 250 + 378 + 150) × 12 = 12,936 a year, invisible in the tile.
    expect(ilpExclusion(ZERO_PERCENT_ILPS)).toEqual({ count: 4, annualPremium: 12_936 });
  });

  it('confirms those policies really do contribute nothing to the total', () => {
    const { totalAnnualPremium } = summariseClient({
      annualIncome: 0,
      policies: ZERO_PERCENT_ILPS,
    });
    expect(totalAnnualPremium).toBe(0);
  });

  it('ignores an ILP whose percent was deliberately set', () => {
    expect(
      ilpExclusion([
        { premium: 300, frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: 50 },
      ]),
    ).toEqual({ count: 0, annualPremium: 0 });
  });

  it('ignores non-ILP policies — the rule never touched them', () => {
    expect(
      ilpExclusion([
        { premium: 165, frequency: 'Monthly', isInvestmentLinked: false, ilpPremiumInclusionPercent: 0 },
      ]),
    ).toEqual({ count: 0, annualPremium: 0 });
  });

  it('ignores an ILP with no premium — that is not a blind spot', () => {
    expect(
      ilpExclusion([
        { premium: 0, frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: 0 },
      ]),
    ).toEqual({ count: 0, annualPremium: 0 });
  });

  it('treats a null/absent percent the same as zero', () => {
    expect(
      ilpExclusion([
        { premium: 100, frequency: 'Annual', isInvestmentLinked: true, ilpPremiumInclusionPercent: null },
        { premium: 100, frequency: 'Annual', isInvestmentLinked: true },
      ]),
    ).toEqual({ count: 2, annualPremium: 200 });
  });
});

describe('describeIlpExclusion', () => {
  it('says nothing when nothing was excluded, so callers can render it blind', () => {
    expect(describeIlpExclusion({ count: 0, annualPremium: 0 })).toBe('');
  });

  it('names the count and stays singular for one', () => {
    expect(describeIlpExclusion({ count: 1, annualPremium: 1200 })).toContain('1 investment-linked policy');
    expect(describeIlpExclusion({ count: 4, annualPremium: 12_936 })).toContain('4 investment-linked policies');
  });
});
