/**
 * v42 CPF inputs (2026-09-25): the average-income fallback, the OA housing
 * drain, the record → plan adapter and the build-up waterfall.
 *
 * The oracle below is the v42 per-year loop (`insurance_crm_v42.html`
 * ~3772-3840) copied with its operation order intact — contribution, then
 * housing, then interest, then the Medisave clip — over our own rate tables.
 */
import { describe, expect, it } from 'vitest';

import { BHS_2026, projectCPFTo55 } from '../finance';
import { projectCPFTo55WithFutureContributions } from '../cpfContributions';
import { cpfAllocation, cpfContributionRate, MONTHLY_SALARY_CAP } from '../cpfRates';
import { cpfBuildUp, cpfPlanFromClient } from '../cpfBuildUp';
import { assessRetirementReadiness } from '../financeReport';
import { incomeForAge } from '../incomeSteps';

function v42Oracle(o: {
  cpfOA: number; cpfSA: number; cpfMA: number; currentAge: number;
  avgIncome: number; housingMonthly: number; housingEndAge: string;
}) {
  let currentOA = o.cpfOA;
  let currentSA = o.cpfSA;
  let currentMA = o.cpfMA;
  let totalHousingDeducted = 0;
  const yearsTo55 = Math.max(0, 55 - o.currentAge);
  for (let year = 0; year < yearsTo55; year++) {
    const clientAge = o.currentAge + year;
    const annualIncome = o.avgIncome > 0 && clientAge < 55 ? o.avgIncome : 0;
    if (annualIncome > 0 && clientAge < 55) {
      const annualContribution =
        Math.min(annualIncome / 12, MONTHLY_SALARY_CAP) * cpfContributionRate(clientAge) * 12;
      const allocation = cpfAllocation(clientAge);
      currentMA += annualContribution * allocation.ma;
      currentSA += annualContribution * allocation.sa;
      currentOA += annualContribution * allocation.oa;
    }
    if (o.housingMonthly > 0) {
      const housingEndAge = parseInt(o.housingEndAge || '55');
      if (clientAge < housingEndAge) {
        const actualDeduction = Math.min(o.housingMonthly * 12, currentOA);
        currentOA = currentOA - actualDeduction;
        totalHousingDeducted += actualDeduction;
      }
    }
    currentOA = currentOA * 1.025;
    currentMA = currentMA * 1.04;
    if (currentMA > BHS_2026) {
      currentSA += currentMA - BHS_2026;
      currentMA = BHS_2026;
    }
    currentSA = currentSA * 1.04;
  }
  return { oaAt55: currentOA, saAt55: currentSA, maAt55: currentMA, totalHousingDeducted };
}

const base = { cpfOA: 62_000, cpfSA: 55_000, cpfMA: 35_000, currentAge: 38 };

describe('incomeForAge — v42 average-income fallback', () => {
  it('uses the average before 55 only when no tier is defined', () => {
    expect(incomeForAge([], 40, 90_000)).toBe(90_000);
    expect(incomeForAge([], 55, 90_000)).toBe(0);
    expect(incomeForAge([{ annualIncome: 120_000, startAge: 30, endAge: 45 }], 50, 90_000)).toBe(0);
    expect(incomeForAge([{ annualIncome: 120_000, startAge: 30, endAge: 45 }], 40, 90_000)).toBe(120_000);
  });
});

describe('projectCPFTo55WithFutureContributions — v42 oracle', () => {
  const shapes = [
    { label: 'housing until an end age', avgIncome: 0, housingMonthly: 1200, housingEndAge: '52' },
    { label: 'housing, blank end age → 55', avgIncome: 0, housingMonthly: 1500, housingEndAge: '' },
    { label: 'average income + housing', avgIncome: 90_000, housingMonthly: 1500, housingEndAge: '58' },
    { label: 'housing larger than OA (floors at 0)', avgIncome: 0, housingMonthly: 20_000, housingEndAge: '' },
    { label: 'average income only', avgIncome: 180_000, housingMonthly: 0, housingEndAge: '' },
  ];
  for (const s of shapes) {
    it(s.label, () => {
      const oracle = v42Oracle({ ...base, ...s });
      const plan = cpfPlanFromClient({
        avgAnnualIncomeTo55: String(s.avgIncome || ''),
        cpfHousingMonthly: String(s.housingMonthly || ''),
        cpfHousingEndAge: s.housingEndAge,
      });
      const got = projectCPFTo55WithFutureContributions({ ...base, ...plan });
      expect(got.oaAt55).toBeCloseTo(oracle.oaAt55, 6);
      expect(got.saAt55).toBeCloseTo(oracle.saAt55, 6);
      expect(got.maAt55).toBeCloseTo(oracle.maAt55, 6);
      expect(got.totalHousingDeducted).toBeCloseTo(oracle.totalHousingDeducted, 6);
      expect(got.oaAt55).toBeGreaterThanOrEqual(0);
    });
  }

  it('with no average income and no housing it is still the golden projection', () => {
    const golden = projectCPFTo55({ ...base, yearsTo55: 55 - base.currentAge });
    const got = projectCPFTo55WithFutureContributions({ ...base, ...cpfPlanFromClient({}) });
    expect(got.oaAt55).toBeCloseTo(golden.oaAt55, 6);
    expect(got.saAt55).toBeCloseTo(golden.saAt55, 6);
    expect(got.totalHousingDeducted).toBe(0);
  });
});

describe('cpfPlanFromClient', () => {
  it('reports what the contributions were projected from — tiers win', () => {
    expect(cpfPlanFromClient({}).incomeBasis).toBe('none');
    expect(cpfPlanFromClient({ avgAnnualIncomeTo55: '90000' }).incomeBasis).toBe('average');
    expect(
      cpfPlanFromClient({
        avgAnnualIncomeTo55: '90000',
        futureIncomeStep1: '120000', futureIncomeStartAge1: '30', futureIncomeEndAge1: '50',
      }).incomeBasis,
    ).toBe('tiers');
  });

  it('omits housing when no monthly amount; blank end age means 55', () => {
    expect(cpfPlanFromClient({ cpfHousingEndAge: '50' }).housing).toBeUndefined();
    expect(cpfPlanFromClient({ cpfHousingMonthly: '1200' }).housing).toEqual({ monthly: 1200, endAge: null });
    expect(cpfPlanFromClient({ cpfHousingMonthly: '1200', cpfHousingEndAge: '52' }).housing).toEqual({ monthly: 1200, endAge: 52 });
  });
});

describe('cpfBuildUp — the waterfall reconciles', () => {
  it('start + contributions − housing + overflow + interest = value at 55', () => {
    const input = { cpfOA: 62_000, cpfSA: 55_000, cpfMA: 70_000, currentAge: 35 };
    const plan = cpfPlanFromClient({ avgAnnualIncomeTo55: '90000', cpfHousingMonthly: '1200', cpfHousingEndAge: '50' });
    const p = projectCPFTo55WithFutureContributions({ ...input, ...plan });
    const { oa, sa } = cpfBuildUp(input, p);
    expect(oa.housing).toBeGreaterThan(0);
    expect(sa.overflow).toBeGreaterThan(0);
    expect(oa.start + oa.contributions - oa.housing + oa.interest).toBeCloseTo(oa.at55, 6);
    expect(sa.start + sa.contributions + sa.overflow + sa.interest).toBeCloseTo(sa.at55, 6);
  });
});

describe('assessRetirementReadiness — RA + CPF LIFE read the v42 projection', () => {
  const dob = '1991-01-01';
  const bal = { cpfOA: 62_000, cpfSA: 55_000, cpfMA: 70_000 };
  const run = (client: Parameters<typeof cpfPlanFromClient>[0]) =>
    projectCPFTo55WithFutureContributions({ ...bal, currentAge: 35, ...cpfPlanFromClient(client) });

  it('no at55 ⇒ identical to passing the golden no-contribution run', () => {
    const golden = projectCPFTo55({ ...bal, yearsTo55: 20 });
    const a = assessRetirementReadiness({ dob, yearsTo55: 20, ...bal }, 2026);
    const b = assessRetirementReadiness({ dob, yearsTo55: 20, ...bal, at55: golden }, 2026);
    expect(b).toEqual(a);
  });

  it('the OA housing drain lowers the projected RA and the CPF LIFE payout', () => {
    const without = assessRetirementReadiness({ dob, yearsTo55: 20, ...bal, at55: run({}) }, 2026);
    const withHousing = assessRetirementReadiness(
      { dob, yearsTo55: 20, ...bal, at55: run({ cpfHousingMonthly: '2500' }) },
      2026,
    );
    expect(withHousing.projectedRA).toBeLessThan(without.projectedRA);
    expect(withHousing.cpfLifeMonthlyPayout).toBeLessThan(without.cpfLifeMonthlyPayout);
  });
});
