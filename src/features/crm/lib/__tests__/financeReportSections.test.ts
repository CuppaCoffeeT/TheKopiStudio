/**
 * Oracle lock for the P2 report-section helpers appended to financeReport.ts
 * (REPORTS_LINK_PRD.md — sections [2] HealthSnapshot percentages and [6]
 * hospitalization sums). Expected values are computed in-test by ORACLE
 * EXPRESSIONS copied VERBATIM from the legacy JSX (git c09c549; file:line
 * cited above each) — STRICT equality, no epsilon.
 */
import { describe, expect, it } from 'vitest';

import { ageFromDOB, retirementSumsFor } from '../finance';
import {
  assessRetirementReadiness,
  cpfCurrentTotal,
  currentHoldingsTotal,
  hospitalShieldPremiums,
  premiumsPctOfIncome,
  raShortfall,
  retirementSumOpportunityCost,
  totalRetirementIfInvested,
  type PremiumSplit,
} from '../financeReport';

// ClientReportModal.jsx:60-63 (verbatim oracle — % of income, guarded at 0):
function legacyPcts(split: PremiumSplit, income: number) {
  return {
    insurancePremiumsPct: income > 0 ? (split.protectionPremiums / income) * 100 : 0,
    investmentPremiumsPct: income > 0 ? (split.investmentPremiums / income) * 100 : 0,
  };
}

describe('premiumsPctOfIncome — ClientReportModal.jsx:60-63', () => {
  const SPLITS: PremiumSplit[] = [
    { protectionPremiums: 0, investmentPremiums: 0 },
    { protectionPremiums: 4800, investmentPremiums: 7200 },
    { protectionPremiums: 1234.56, investmentPremiums: 18000 },
  ];
  const INCOMES = [0, 60000, 80000, 120000];

  it.each(SPLITS.flatMap((split) => INCOMES.map((income) => [split, income] as const)))(
    'matches the legacy oracle for split %j at income %d',
    (split, income) => {
      expect(premiumsPctOfIncome(split, income)).toEqual(legacyPcts(split, income));
    },
  );

  it('income 0 → both percentages 0 (legacy guard)', () => {
    expect(premiumsPctOfIncome({ protectionPremiums: 9999, investmentPremiums: 1 }, 0)).toEqual({
      insurancePremiumsPct: 0,
      investmentPremiumsPct: 0,
    });
  });
});

describe('hospitalShieldPremiums — ClientReportModal.jsx:301-303,324-326,337', () => {
  it('sums CPF + cash (IS row) and CPF + cash + rider (Total row)', () => {
    // Oracle (ClientReportModal.jsx:301-303 — `parseFloat(v || 0)`; the `|| 0`
    // branch is a no-op for non-empty strings and is exercised by the next test):
    const cpf = parseFloat('450.5');
    const cash = parseFloat('120');
    const rider = parseFloat('380');
    expect(
      hospitalShieldPremiums({
        integratedShieldCPF: '450.5',
        integratedShieldCash: '120',
        riderCash: '380',
      }),
    ).toEqual({ cpf, cash, rider, shieldTotal: cpf + cash, totalAnnual: cpf + cash + rider });
  });

  it("legacy `parseFloat(v || 0)` coercion — '' / null / undefined → 0", () => {
    expect(
      hospitalShieldPremiums({ integratedShieldCPF: '', integratedShieldCash: null }),
    ).toEqual({ cpf: 0, cash: 0, rider: 0, shieldTotal: 0, totalAnnual: 0 });
  });
});

// ── Sections [8]/[9] residual math (lib/financeReportSections.ts; appended by
// the sections [8]-[13] author — same verbatim-oracle contract as above) ────

describe('cpfCurrentTotal — CPFProjection.jsx:111', () => {
  const TRIPLES: Array<[number, number, number]> = [
    [0, 0, 0],
    [55000, 32000, 41000],
    [123456.78, 0.01, 98765.43],
  ];

  it.each(TRIPLES)('OA=%d SA=%d MA=%d', (cpfOA, cpfSA, cpfMA) => {
    // CPFProjection.jsx:111 (verbatim oracle): (cpfOA + cpfSA + cpfMA)
    expect(cpfCurrentTotal(cpfOA, cpfSA, cpfMA)).toBe(cpfOA + cpfSA + cpfMA);
  });
});

describe('raShortfall — CPFProjection.jsx:181-182,188-189', () => {
  /** Matches finance.test.ts — legacy captured with `new Date().getFullYear()` === 2026. */
  const REF_YEAR = 2026;
  const CLIENTS = [
    { dob: '1990-05-10', cpfOA: 80000, cpfSA: 60000, cpfMA: 50000 }, // turns 55 in 2045
    { dob: '1971-01-20', cpfOA: 5000, cpfSA: 3000, cpfMA: 2000 }, // turns 55 in 2026, below BRS
    { dob: null, cpfOA: 0, cpfSA: 0, cpfMA: 0 }, // null dob → fallback sums, RA 0
  ];

  it.each(CLIENTS)('replays the alert copy amounts for %j', ({ dob, cpfOA, cpfSA, cpfMA }) => {
    const yearsTo55 = Math.max(0, 55 - ageFromDOB(dob, REF_YEAR));
    const sums = retirementSumsFor(dob, REF_YEAR);
    const ra = assessRetirementReadiness({ dob, yearsTo55, cpfOA, cpfSA, cpfMA }, REF_YEAR);
    // CPFProjection.jsx:181-182 (verbatim oracle): sums.frs - projectedRA
    expect(raShortfall(sums.frs, ra.projectedRA)).toBe(sums.frs - ra.projectedRA);
    // CPFProjection.jsx:188-189 (verbatim oracle): sums.brs - projectedRA
    expect(raShortfall(sums.brs, ra.projectedRA)).toBe(sums.brs - ra.projectedRA);
  });

  it('an RA capped at exactly FRS shortfalls to 0', () => {
    expect(raShortfall(220400, 220400)).toBe(0);
  });
});

describe('retirement scenario totals — RetirementProjection.jsx:14-19,167', () => {
  const ILPS = [0, 180000, 421345.67];
  const BALANCES = [0, 45000, 250000.5];
  const YEARS = [0, 10, 30];
  const GRID = ILPS.flatMap((ilp) =>
    BALANCES.flatMap((balance) => YEARS.map((years) => ({ ilp, balance, years }))),
  );

  it.each(GRID)('ilp=$ilp balance=$balance years=$years', ({ ilp, balance, years }) => {
    // RetirementProjection.jsx:10-19,167 (verbatim oracle — the local consts
    // and the subtraction of the two precomputed totals):
    const nominalBankRate = 0.005;
    const moderateReturn = 0.06;
    const balanceAt65WithBank = balance * Math.pow(1 + nominalBankRate, years);
    const balanceAt65WithInvestment = balance * Math.pow(1 + moderateReturn, years);
    const totalRetirementSum = ilp + balanceAt65WithBank;
    const totalRetirementSumIfInvested = ilp + balanceAt65WithInvestment;

    expect(totalRetirementIfInvested(ilp, balance, years)).toBe(totalRetirementSumIfInvested);
    expect(retirementSumOpportunityCost(ilp, balance, years)).toBe(
      totalRetirementSumIfInvested - totalRetirementSum,
    );
  });

  it('years 0 → if-invested total equals the plain total, opportunity cost exactly 0', () => {
    expect(totalRetirementIfInvested(180000, 45000, 0)).toBe(180000 + 45000);
    expect(retirementSumOpportunityCost(180000, 45000, 0)).toBe(0);
  });
});

describe('currentHoldingsTotal — RetirementProjection.jsx:116-121', () => {
  const CASES: Array<{
    name: string;
    balance: number;
    policies: Array<{ currentAccountValue?: string | number | null }>;
  }> = [
    { name: 'no ILPs', balance: 80000, policies: [] },
    {
      name: 'string values + legacy `|| 0` coercion',
      balance: 45000,
      policies: [
        { currentAccountValue: '52000.75' },
        { currentAccountValue: '' },
        { currentAccountValue: null },
        { currentAccountValue: 31000 },
      ],
    },
    { name: 'zero balance, one ILP', balance: 0, policies: [{ currentAccountValue: '120000' }] },
  ];

  it.each(CASES)('$name', ({ balance, policies }) => {
    // RetirementProjection.jsx:117-121 (verbatim oracle; String() only
    // satisfies tsc — legacy passes the number 0 to parseFloat, identical):
    const expected =
      balance +
      policies.reduce((s, p) => s + parseFloat(String(p.currentAccountValue || 0)), 0);
    expect(currentHoldingsTotal(balance, policies)).toBe(expected);
  });
});
