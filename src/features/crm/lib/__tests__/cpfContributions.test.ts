/**
 * CPF-with-contributions corpus.
 *
 * THE LOAD-BEARING TEST is the first describe: with no income steps this
 * projection must agree with the golden `projectCPFTo55` to floating-point
 * exactness. That equivalence is what makes it safe for the report to call
 * this one unconditionally — a customer with nothing filled in must project
 * precisely as they do today, or the change is a silent regression across the
 * whole book.
 */
import { describe, expect, it } from 'vitest';

import { BHS_2026, projectCPFTo55 } from '../finance';
import { projectCPFTo55WithFutureContributions } from '../cpfContributions';
import { cpfAllocation, cpfContributionRate, MONTHLY_SALARY_CAP } from '../cpfRates';
import { incomeForAge, incomeStepsFromClient, type IncomeStep } from '../incomeSteps';

const NO_STEPS: IncomeStep[] = [];

describe('equivalence with the golden projection when nobody is earning', () => {
  const cases = [
    { label: 'typical mid-career', cpfOA: 62_000, cpfSA: 55_000, cpfMA: 35_000, currentAge: 40 },
    { label: 'young, small balances', cpfOA: 12_000, cpfSA: 8_000, cpfMA: 5_000, currentAge: 25 },
    { label: 'MA already at the BHS', cpfOA: 50_000, cpfSA: 40_000, cpfMA: BHS_2026, currentAge: 35 },
    { label: 'MA above the BHS', cpfOA: 50_000, cpfSA: 40_000, cpfMA: BHS_2026 + 20_000, currentAge: 45 },
    { label: 'one year to go', cpfOA: 100_000, cpfSA: 90_000, cpfMA: 60_000, currentAge: 54 },
    { label: 'already 55', cpfOA: 100_000, cpfSA: 90_000, cpfMA: 60_000, currentAge: 55 },
    { label: 'past 55', cpfOA: 100_000, cpfSA: 90_000, cpfMA: 60_000, currentAge: 62 },
    { label: 'all zero', cpfOA: 0, cpfSA: 0, cpfMA: 0, currentAge: 30 },
  ];

  for (const c of cases) {
    it(`matches projectCPFTo55 — ${c.label}`, () => {
      const golden = projectCPFTo55({
        cpfOA: c.cpfOA,
        cpfSA: c.cpfSA,
        cpfMA: c.cpfMA,
        yearsTo55: Math.max(0, 55 - c.currentAge),
      });
      const withContrib = projectCPFTo55WithFutureContributions({ ...c, incomeSteps: NO_STEPS });

      expect(withContrib.oaAt55).toBeCloseTo(golden.oaAt55, 6);
      expect(withContrib.saAt55).toBeCloseTo(golden.saAt55, 6);
      expect(withContrib.maAt55).toBeCloseTo(golden.maAt55, 6);
      expect(withContrib.totalCPFAt55).toBeCloseTo(golden.totalCPFAt55, 6);
      expect(withContrib.totalOverflow).toBeCloseTo(golden.totalOverflow, 6);
      expect(withContrib.saBoostFromOverflow).toBeCloseTo(golden.saBoostFromOverflow, 6);
      expect(withContrib.totalFutureContributions).toBe(0);
    });
  }
});

describe('cpfContributionRate', () => {
  it('steps down with age', () => {
    expect(cpfContributionRate(30)).toBe(0.37);
    expect(cpfContributionRate(55)).toBe(0.37);
    expect(cpfContributionRate(56)).toBe(0.34);
    expect(cpfContributionRate(61)).toBe(0.25);
    expect(cpfContributionRate(66)).toBe(0.165);
    expect(cpfContributionRate(71)).toBe(0.125);
  });
});

describe('cpfAllocation', () => {
  it('sums to 1 in every band', () => {
    for (const age of [25, 35, 40, 45, 48, 50, 53, 55, 58, 60, 63, 65, 68, 70, 75]) {
      const a = cpfAllocation(age);
      expect(a.oa + a.sa + a.ma).toBeCloseTo(1, 6);
    }
  });

  it('shifts away from OA and toward MA with age', () => {
    expect(cpfAllocation(30).oa).toBeGreaterThan(cpfAllocation(50).oa);
    expect(cpfAllocation(30).ma).toBeLessThan(cpfAllocation(50).ma);
  });

  it('routes the SA share to the Retirement Account only after 55', () => {
    expect(cpfAllocation(55).toRetirementAccount).toBe(false);
    expect(cpfAllocation(56).toRetirementAccount).toBe(true);
  });
});

describe('incomeForAge', () => {
  const steps: IncomeStep[] = [
    { annualIncome: 120_000, startAge: 39, endAge: 50 },
    { annualIncome: 80_000, startAge: 51, endAge: 60 },
  ];

  it('reads the step covering the age, inclusive at both ends', () => {
    expect(incomeForAge(steps, 39)).toBe(120_000);
    expect(incomeForAge(steps, 50)).toBe(120_000);
    expect(incomeForAge(steps, 51)).toBe(80_000);
    expect(incomeForAge(steps, 60)).toBe(80_000);
  });

  it('returns nothing outside every step — a gap is a real career break', () => {
    expect(incomeForAge(steps, 38)).toBe(0);
    expect(incomeForAge(steps, 61)).toBe(0);
    expect(incomeForAge([], 45)).toBe(0);
  });

  it('ignores a slot with no income even when its ages cover the year', () => {
    expect(incomeForAge([{ annualIncome: 0, startAge: 30, endAge: 60 }], 45)).toBe(0);
  });

  it('takes the FIRST matching step when two overlap', () => {
    const overlapping: IncomeStep[] = [
      { annualIncome: 100_000, startAge: 30, endAge: 50 },
      { annualIncome: 200_000, startAge: 40, endAge: 60 },
    ];
    expect(incomeForAge(overlapping, 45)).toBe(100_000);
  });
});

describe('projectCPFTo55WithFutureContributions', () => {
  const base = { cpfOA: 50_000, cpfSA: 40_000, cpfMA: 30_000, currentAge: 40 };

  it('THE POINT OF THE FEATURE: a younger customer now out-projects an older one', () => {
    const steps: IncomeStep[] = [{ annualIncome: 120_000, startAge: 30, endAge: 60 }];
    const young = projectCPFTo55WithFutureContributions({ ...base, currentAge: 35, incomeSteps: steps });
    const old = projectCPFTo55WithFutureContributions({ ...base, currentAge: 54, incomeSteps: steps });

    // With identical balances, twenty extra earning years must show up.
    expect(young.totalCPFAt55).toBeGreaterThan(old.totalCPFAt55);
    expect(young.totalFutureContributions).toBeGreaterThan(old.totalFutureContributions);

    // Without contributions the two would differ only by compounding — this is
    // the comparison the legacy projection got materially wrong.
    const youngNoContrib = projectCPFTo55WithFutureContributions({ ...base, currentAge: 35, incomeSteps: [] });
    expect(young.totalCPFAt55).toBeGreaterThan(youngNoContrib.totalCPFAt55 * 1.5);
  });

  it('caps contributions at the Ordinary Wage ceiling', () => {
    const atCap = projectCPFTo55WithFutureContributions({
      ...base,
      incomeSteps: [{ annualIncome: MONTHLY_SALARY_CAP * 12, startAge: 30, endAge: 60 }],
    });
    const wayOverCap = projectCPFTo55WithFutureContributions({
      ...base,
      incomeSteps: [{ annualIncome: 10_000_000, startAge: 30, endAge: 60 }],
    });
    expect(wayOverCap.totalFutureContributions).toBeCloseTo(atCap.totalFutureContributions, 6);
  });

  it('splits each contribution across OA, SA and MA', () => {
    const p = projectCPFTo55WithFutureContributions({
      ...base,
      incomeSteps: [{ annualIncome: 120_000, startAge: 30, endAge: 60 }],
    });
    expect(p.totalContributedToOA).toBeGreaterThan(0);
    expect(p.totalContributedToSA).toBeGreaterThan(0);
    // OA takes the largest share before 50.
    expect(p.totalContributedToOA).toBeGreaterThan(p.totalContributedToSA);
  });

  it('never lets Medisave exceed the Basic Healthcare Sum', () => {
    const p = projectCPFTo55WithFutureContributions({
      cpfOA: 0,
      cpfSA: 0,
      cpfMA: BHS_2026 - 1_000,
      currentAge: 30,
      incomeSteps: [{ annualIncome: 200_000, startAge: 30, endAge: 60 }],
    });
    expect(p.maAt55).toBeLessThanOrEqual(BHS_2026);
    expect(p.totalOverflow).toBeGreaterThan(0);
    // The spill compounds in SA after it lands, so the boost exceeds the raw
    // overflow — that is the whole reason it is derived rather than reused.
    expect(p.saBoostFromOverflow).toBeGreaterThan(p.totalOverflow);
  });

  it('reports no SA boost when the Medisave cap never bites', () => {
    const p = projectCPFTo55WithFutureContributions({
      cpfOA: 10_000, cpfSA: 10_000, cpfMA: 1_000, currentAge: 52, incomeSteps: [],
    });
    expect(p.totalOverflow).toBe(0);
    expect(p.saBoostFromOverflow).toBe(0);
  });

  it('stops contributing once the income steps run out', () => {
    const stopsAt45 = projectCPFTo55WithFutureContributions({
      ...base,
      incomeSteps: [{ annualIncome: 120_000, startAge: 40, endAge: 45 }],
    });
    const runsToEnd = projectCPFTo55WithFutureContributions({
      ...base,
      incomeSteps: [{ annualIncome: 120_000, startAge: 40, endAge: 60 }],
    });
    expect(stopsAt45.totalFutureContributions).toBeLessThan(runsToEnd.totalFutureContributions);
  });

  it('projects nothing for a customer already past 55', () => {
    const p = projectCPFTo55WithFutureContributions({
      ...base,
      currentAge: 60,
      incomeSteps: [{ annualIncome: 120_000, startAge: 30, endAge: 70 }],
    });
    expect(p.yearsProjected).toBe(0);
    expect(p.totalFutureContributions).toBe(0);
    expect(p.totalCPFAt55).toBeCloseTo(base.cpfOA + base.cpfSA + base.cpfMA, 6);
  });
});

describe('incomeStepsFromClient', () => {
  it('reads the three CRM slots into a list', () => {
    const steps = incomeStepsFromClient({
      futureIncomeStep1: '120000', futureIncomeStartAge1: '39', futureIncomeEndAge1: '50',
      futureIncomeStep2: '80000', futureIncomeStartAge2: '51', futureIncomeEndAge2: '60',
    });
    expect(steps).toEqual([
      { annualIncome: 120_000, startAge: 39, endAge: 50 },
      { annualIncome: 80_000, startAge: 51, endAge: 60 },
    ]);
  });

  it('drops blank slots rather than carrying zero-value steps', () => {
    expect(incomeStepsFromClient({})).toEqual([]);
    expect(
      incomeStepsFromClient({ futureIncomeStep1: '', futureIncomeStartAge1: '', futureIncomeEndAge1: '' }),
    ).toEqual([]);
  });

  it('drops a slot with income but no usable age range', () => {
    expect(
      incomeStepsFromClient({ futureIncomeStep1: '120000', futureIncomeStartAge1: '', futureIncomeEndAge1: '' }),
    ).toEqual([]);
  });

  it('drops a slot whose range runs backwards', () => {
    expect(
      incomeStepsFromClient({ futureIncomeStep1: '120000', futureIncomeStartAge1: '60', futureIncomeEndAge1: '40' }),
    ).toEqual([]);
  });

  it('accepts numbers as well as the CRM form strings', () => {
    expect(
      incomeStepsFromClient({ futureIncomeStep1: 90_000, futureIncomeStartAge1: 35, futureIncomeEndAge1: 55 }),
    ).toEqual([{ annualIncome: 90_000, startAge: 35, endAge: 55 }]);
  });
});
