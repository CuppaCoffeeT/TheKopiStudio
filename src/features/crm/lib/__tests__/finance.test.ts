/**
 * Golden-vector lock for the CRM finance port — replays ALL 115 vectors
 * captured by EXECUTING the legacy finance.js (`__fixtures__/
 * finance-golden-vectors.json`) FLOAT-EXACT (`toEqual` strict number
 * equality; no epsilon — operation order is preserved in the port).
 * Time-dependent functions are pinned to refYear 2026 (the capture year).
 * The caller-inline ports without vectors (projectBankTo65, splitPremiums,
 * currentRefYear) get explicit unit coverage at the bottom.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { getSingaporeYear } from '@/utils/timezoneUtils';
import {
  AVERAGE_CRITICAL_ILLNESS_COST,
  AVERAGE_EARLY_CI_COST,
  BHS_2026,
  MEDICAL_INFLATION_RATE,
  RETIREMENT_SUMS,
  ageFromDOB,
  annualisePremium,
  currentRefYear,
  formatCoverage,
  projectCPFTo55,
  retirementSumsFor,
  summariseClient,
  type ClientSummaryInput,
  type CpfProjectionInput,
  type PremiumPolicyInput,
} from '../finance';
import {
  analyseCoverageGaps,
  assessRetirementReadiness,
  futureCICost,
  futureECICost,
  projectBankTo65,
  splitPremiums,
} from '../financeReport';

/** Vectors were captured with `new Date().getFullYear()` === 2026. */
const REF_YEAR = 2026;

interface GoldenVector {
  id: string;
  fn: string;
  args: Record<string, unknown>;
  result: unknown;
}
interface GoldenFile {
  meta: { captureYear: number };
  constants: Record<string, unknown>;
  vectors: GoldenVector[];
}

// jsdom rewrites import.meta.url to localhost — resolve from the vitest root instead.
const golden: GoldenFile = JSON.parse(
  readFileSync(
    join(process.cwd(), 'src/features/crm/lib/__fixtures__/finance-golden-vectors.json'),
    'utf8',
  ),
);

/** Per-fn vector counts as captured — guards against a truncated fixture. */
const EXPECTED_FN_COUNTS: Record<string, number> = {
  projectCPFTo55: 45,
  'caller:raAssessment': 20,
  'caller:gapAnalysis': 15,
  summariseClient: 9,
  formatCoverage: 8,
  retirementSumsFor: 6,
  annualisePremium: 6,
  ageFromDOB: 6,
};

function replay(vector: GoldenVector): unknown {
  const a = vector.args as Record<string, never>;
  switch (vector.fn) {
    case 'ageFromDOB':
      return ageFromDOB(a.dob, REF_YEAR);
    case 'annualisePremium':
      return annualisePremium(a.policy as PremiumPolicyInput);
    case 'formatCoverage':
      return formatCoverage(a.amount);
    case 'projectCPFTo55':
      return projectCPFTo55({
        cpfOA: a.cpfOA, cpfSA: a.cpfSA, cpfMA: a.cpfMA, yearsTo55: a.yearsTo55,
      } as CpfProjectionInput);
    case 'retirementSumsFor':
      return retirementSumsFor(a.dob, REF_YEAR);
    case 'summariseClient':
      return summariseClient(a.client as ClientSummaryInput);
    case 'caller:gapAnalysis':
      return analyseCoverageGaps({
        income: a.income,
        yearsToRetirement: a.yearsToRetirement,
        totalCoverage: a.totalCoverage,
        totalCICoverage: a.totalCICoverage,
        totalECICoverage: a.totalECICoverage,
      });
    case 'caller:raAssessment':
      return assessRetirementReadiness(
        { dob: a.dob, yearsTo55: a.yearsTo55, cpfOA: a.cpfOA, cpfSA: a.cpfSA, cpfMA: a.cpfMA },
        REF_YEAR,
      );
    default:
      throw new Error(`Unmapped golden-vector fn: ${vector.fn}`);
  }
}

describe('finance golden vectors — legacy parity, float-exact', () => {
  it('fixture carries all 115 vectors captured at refYear 2026', () => {
    expect(golden.vectors).toHaveLength(115);
    expect(golden.meta.captureYear).toBe(REF_YEAR);
    const counts: Record<string, number> = {};
    for (const v of golden.vectors) counts[v.fn] = (counts[v.fn] ?? 0) + 1;
    expect(counts).toEqual(EXPECTED_FN_COUNTS);
  });

  it('ported constants match the captured legacy constants exactly', () => {
    expect(MEDICAL_INFLATION_RATE).toBe(golden.constants.MEDICAL_INFLATION_RATE);
    expect(AVERAGE_CRITICAL_ILLNESS_COST).toBe(golden.constants.AVERAGE_CRITICAL_ILLNESS_COST);
    expect(AVERAGE_EARLY_CI_COST).toBe(golden.constants.AVERAGE_EARLY_CI_COST);
    expect(BHS_2026).toBe(golden.constants.BHS_2026);
    // Captured JSON keys are strings; compare per-year rows.
    const captured = golden.constants.RETIREMENT_SUMS as Record<string, unknown>;
    for (const [year, row] of Object.entries(RETIREMENT_SUMS)) {
      expect(row).toEqual(captured[year]);
    }
  });

  it.each(golden.vectors.map((v) => [v.id, v] as const))('replays %s', (_id, vector) => {
    expect(replay(vector)).toEqual(vector.result);
  });
});

describe('caller-inline ports without golden vectors', () => {
  it('projectBankTo65 compounds at exactly 0.5% p.a. (RetirementProjection.jsx:13-14)', () => {
    expect(projectBankTo65(100000, 0)).toBe(100000);
    expect(projectBankTo65(100000, 30)).toBe(100000 * Math.pow(1.005, 30));
    expect(projectBankTo65(0, 30)).toBe(0);
  });

  it('futureCICost/futureECICost inflate the legacy bases at 6% (sanity vs gap vectors)', () => {
    expect(futureCICost(0)).toBe(AVERAGE_CRITICAL_ILLNESS_COST);
    expect(futureECICost(0)).toBe(AVERAGE_EARLY_CI_COST);
    expect(futureCICost(10)).toBe(AVERAGE_CRITICAL_ILLNESS_COST * Math.pow(1.06, 10));
  });

  it('splitPremiums splits by TYPE substring and counts ILP premiums FULL — ignores ilpPremiumInclusionPercent (preserved legacy inconsistency)', () => {
    const split = splitPremiums([
      // 0% inclusion would zero this in summariseClient — split still counts $1,200.
      { type: 'Investment-Linked Policy', premium: '100', frequency: 'Monthly', isInvestmentLinked: true, ilpPremiumInclusionPercent: '0' },
      { type: 'Whole Life', premium: '50', frequency: 'Monthly' },
      { type: 'Endowment Saver', premium: '300', frequency: 'Quarterly' },
    ]);
    expect(split.investmentPremiums).toBe(2400);
    expect(split.protectionPremiums).toBe(600);
  });

  it('splitPremiums buckets by type STRING only — an isInvestmentLinked "Term Life" stays protection', () => {
    const split = splitPremiums([
      { type: 'Term Life', premium: '10', frequency: 'Monthly', isInvestmentLinked: true },
    ]);
    expect(split.protectionPremiums).toBe(120);
    expect(split.investmentPremiums).toBe(0);
  });

  it('currentRefYear returns the Singapore calendar year (app-side clock for refYear params)', () => {
    // Asserted against getSingaporeYear(), not `new Date().getFullYear()` — the
    // latter is browser-local, so the old assertion agreed with a wrong
    // implementation on every machine except during the SGT new-year window.
    expect(currentRefYear()).toBe(getSingaporeYear());
  });
});
