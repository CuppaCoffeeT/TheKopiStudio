/**
 * Shield comparison — golden corpus.
 *
 * Every expected figure below was produced by running the advisor's own
 * `shield-comparison.html` (`calc`, `claim`, `cancerCalc`) on the same inputs.
 * The port is faithful, not "improved": if one of these moves, the React tool
 * now quotes a client a different number from the sheet the advisor checked.
 */
import { describe, expect, it } from 'vitest';

import { BENEFIT_AREAS, BENEFIT_ROWS } from '../shieldBenefits';
import { cancerOutcome, everydayClaim, offPanelClaim } from '../shieldClaims';
import { FIT_QUESTIONS, scoreFit } from '../shieldFit';
import { ageNextBirthday, clampShieldAge, shieldPremium } from '../shieldPremium';
import { CANCER_COVER_PLUS, SINGLIFE_BASE, SINGLIFE_RIDER } from '../shieldRates';
import {
  CANCER_SCENARIOS,
  EVERYDAY_SCENARIOS,
  OFF_PANEL_SCENARIOS,
} from '../shieldScenarios';

describe('shield rate tables', () => {
  it('cover every age 1–100', () => {
    expect(SINGLIFE_BASE).toHaveLength(100);
    expect(SINGLIFE_RIDER).toHaveLength(100);
    expect(CANCER_COVER_PLUS).toHaveLength(100);
  });
});

describe('shieldPremium', () => {
  it.each([
    [1, '1 to 18', 332.5, 650, 774.5, 1149],
    [19, '19 to 20', 462.5, 668, 925.5, 1168],
    [36, '36 to 40', 827.51, 1113, 1630.51, 1916],
    [41, '41 to 45', 1484.51, 1573, 2721.51, 2810],
    [60, '56 to 60', 3966.51, 4454, 5469.51, 5957],
    [75, '74 to 75', 12177.99, 13552, 14893.99, 16268],
    [100, '99 to 100', 20162.26, 23576, 23888.26, 27302],
  ])('age %i → band %s, cash %d / %d, total %d / %d', (age, band, slCash, inCash, slTotal, inTotal) => {
    const p = shieldPremium(age);
    expect(p.band).toBe(band);
    expect(p.singlife.cash).toBeCloseTo(slCash, 2);
    expect(p.income.cash).toBeCloseTo(inCash, 2);
    expect(p.singlife.total).toBeCloseTo(slTotal, 2);
    expect(p.income.total).toBeCloseTo(inTotal, 2);
  });

  it('age 36 breaks down as the sheet shows', () => {
    const p = shieldPremium(36);
    expect(p.singlife).toMatchObject({ medishield: 503, plan: 425, riderWithNcd: 562, medisave: 803 });
    expect(p.income).toMatchObject({ medishield: 503, plan: 502, rider: 911, medisave: 803 });
    expect(p.cancerCoverPlus).toBe(155);
  });

  it('Singlife is cheaper in cash at every age — the claim the page makes', () => {
    for (let age = 1; age <= 100; age++) {
      const p = shieldPremium(age);
      expect(p.income.cash).toBeGreaterThan(p.singlife.cash);
    }
  });

  it('ageNextBirthday counts the birthday itself as reached', () => {
    expect(ageNextBirthday('1990-09-24', '2026-09-24')).toBe(37);
    expect(ageNextBirthday('1990-09-25', '2026-09-24')).toBe(36);
  });

  it('ageNextBirthday returns null for nothing usable', () => {
    expect(ageNextBirthday(null, '2026-09-24')).toBeNull();
    expect(ageNextBirthday('garbage', '2026-09-24')).toBeNull();
    expect(ageNextBirthday('2086-01-01', '2026-09-24')).toBeNull();
  });

  it('clamps junk to the table', () => {
    expect(clampShieldAge(0)).toBe(1);
    expect(clampShieldAge(Number.NaN)).toBe(1);
    expect(clampShieldAge(140)).toBe(100);
    expect(clampShieldAge(36.6)).toBe(37);
  });
});

describe('claims', () => {
  it('everyday: client pays Singlife / Income', () => {
    expect(
      EVERYDAY_SCENARIOS.map((s) => {
        const c = everydayClaim(s);
        return [c.singlife.client, c.income.client];
      }),
    ).toEqual([
      [2050, 3000],
      [2150, 3575],
      [2300, 3725],
      [150, 150],
      [500, 500],
      [3950, 3950],
    ]);
  });

  it('off panel: Singlife any / Income extended / Income any', () => {
    expect(
      OFF_PANEL_SCENARIOS.map(({ bill }) => {
        const c = offPanelClaim(bill);
        return [c.singlife.client, c.incomeExtended.client, c.incomeAny.client];
      }),
    ).toEqual([
      [2150, 3620, 3620],
      [2300, 3860, 3860],
      [10825, 9500, 15220],
    ]);
  });

  it('cancer: cover, plan, top-up and client share', () => {
    const rows = CANCER_SCENARIOS.map((s) => [cancerOutcome(s, false), cancerOutcome(s, true)]);
    const pick = (o: ReturnType<typeof cancerOutcome>) => [o.cover, o.plan, o.topUp, o.client, o.clientWithTopUp];
    expect(rows.map(([sl, inc]) => [pick(sl), pick(inc)])).toEqual([
      [[14000, 34200, 0, 1800, 1800], [18400, 34200, 0, 1800, 1800]],
      [[20000, 189000, 0, 6000, 6000], [46000, 189000, 0, 6000, 6000]],
      [[10000, 114000, 0, 42000, 42000], [15000, 140400, 0, 15600, 15600]],
      [[150000, 144000, 248800, 456000, 207200], [250000, 237500, 174000, 362500, 188500]],
    ]);
  });
});

describe('fit finder', () => {
  it('reads "none" with nothing answered', () => {
    expect(scoreFit(FIT_QUESTIONS.map(() => null)).lean).toBe('none');
  });

  it('a child with cancer worries leans Income', () => {
    const answers = FIT_QUESTIONS.map(() => null as number | null);
    answers[0] = 0; // cancer drug bills: Income 3
    answers[1] = 0; // child: Income 3
    expect(scoreFit(answers)).toMatchObject({ singlife: 0, income: 6, answered: 2, lean: 'income' });
  });

  it('a margin under three is too close to call', () => {
    const answers = FIT_QUESTIONS.map(() => null as number | null);
    answers[2] = 2; // not sure about a specialist: Singlife 1
    expect(scoreFit(answers).lean).toBe('close');
  });
});

describe('benefit comparison', () => {
  it('keeps every row and its areas in first-appearance order', () => {
    expect(BENEFIT_ROWS).toHaveLength(53);
    expect(BENEFIT_AREAS).toEqual(['Money', 'Limits', 'Cancer', 'Hospital', 'Family', 'Overseas', 'Admin', 'Top-up']);
  });
});
