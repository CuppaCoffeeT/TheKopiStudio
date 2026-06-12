/**
 * Oracle lock for the P1 financeReport extension (REPORTS_LINK_PRD.md).
 *
 * EVERY expected value is computed in-test by an ORACLE EXPRESSION copied
 * VERBATIM from the legacy JSX (git c09c549; file:line cited above each),
 * over a grid of incomes/years/balances — STRICT equality, no epsilon.
 * The legacy `Math.round(...).toLocaleString()` wrappers are display
 * formatting that stays in components, so the oracles are the INNER
 * expressions of those render cells. All imports go through the
 * `financeReport` barrel — proving the bands/economics split re-exports.
 */
import { describe, expect, it } from 'vitest';

import {
  AVERAGE_CRITICAL_ILLNESS_COST,
  AVERAGE_EARLY_CI_COST,
  ageFromDOB,
  summariseClient,
} from '../finance';
import {
  BANK_INTEREST_RATE,
  GENERAL_INFLATION_RATE,
  HEALTH_BANDS,
  MODERATE_INVESTMENT_RETURN,
  bandFor,
  coverageCostAt65CI,
  coverageCostAt65Death,
  coverageCostAt65ECI,
  emergencyFundTarget,
  excessInvestable,
  excessInvestableRecommendation,
  heroTotals,
  investedAt6,
  isAdequatelyCovered,
  opportunityCost,
  postCoverageOOP,
  premiumCardStatus,
  purchasingPowerLoss2_5,
  type BandThresholds,
  type CoverageRatios,
  type HeroClientInput,
} from '../financeReport';

/** Matches finance.test.ts — legacy captured with `new Date().getFullYear()` === 2026. */
const REF_YEAR = 2026;

const INCOMES = [0, 60000, 120000];
const YEARS = [0, 10, 30];
const BALANCES = [0, 45000, 90001, 250000];
const INCOME_YEAR_GRID = INCOMES.flatMap((income) => YEARS.map((years) => ({ income, years })));
const BALANCE_YEAR_GRID = BALANCES.flatMap((balance) => YEARS.map((years) => ({ balance, years })));

// HealthSnapshot.jsx:3-7 oracle — band LOGIC/labels/bg verbatim; tones carry
// the DELIBERATE WCAG-AA divergence (legacy #059669/#f59e0b/#dc2626 darkened
// to the Tailwind *-700/800 badge pairings — see financeReportBands.ts):
function legacyBand(value: number, benchmarks: BandThresholds) {
  if (value >= benchmarks.good) return { tone: '#047857', bg: '#d1fae5', label: 'Good' };
  if (value >= benchmarks.review) return { tone: '#92400e', bg: '#fef3c7', label: 'Review' };
  return { tone: '#b91c1c', bg: '#fee2e2', label: 'Action needed' };
}

// ClientReportModal.jsx:138-142 (verbatim oracle — the inline adequacy check):
function legacyIsAdequatelyCovered(summary: CoverageRatios): boolean {
  return (
    summary.coverageRatio >= 5 && summary.ciCoverageRatio >= 5 && summary.eciCoverageRatio >= 1.5
  );
}

const ratios = (
  coverageRatio: number,
  ciCoverageRatio: number,
  eciCoverageRatio: number,
): CoverageRatios => ({ coverageRatio, ciCoverageRatio, eciCoverageRatio });

describe('isAdequatelyCovered — ClientReportModal.jsx:138-142', () => {
  const CASES: Array<[string, CoverageRatios, boolean]> = [
    ['all exactly at thresholds (≥ is inclusive)', ratios(5, 5, 1.5), true],
    ['well covered', ratios(12, 8, 3), true],
    ['death ratio just under 5', ratios(4.999, 5, 1.5), false],
    ['CI ratio just under 5', ratios(5, 4.999, 1.5), false],
    ['ECI ratio just under 1.5', ratios(5, 5, 1.499), false],
    ['all zero (income 0 → summariseClient ratios 0)', ratios(0, 0, 0), false],
  ];

  it.each(CASES)('%s', (_name, summary, expected) => {
    expect(legacyIsAdequatelyCovered(summary)).toBe(expected); // oracle self-check
    expect(isAdequatelyCovered(summary)).toBe(expected);
  });

  it('income 0 with non-zero coverage routes to false via summariseClient zero ratios', () => {
    const summary = summariseClient({
      annualIncome: 0,
      policies: [
        {
          coverageAmount: '1000000',
          criticalIllnessCoverage: '500000',
          earlyCriticalIllnessCoverage: '200000',
          premium: '100',
          frequency: 'Monthly',
        },
      ],
    });
    expect(isAdequatelyCovered(summary)).toBe(legacyIsAdequatelyCovered(summary));
    expect(isAdequatelyCovered(summary)).toBe(false);
  });
});

describe('HEALTH_BANDS + bandFor — HealthSnapshot.jsx:3-7,23-25', () => {
  it('thresholds match the legacy literals (HealthSnapshot.jsx:23-25)', () => {
    expect(HEALTH_BANDS.investedPremiumsPct).toEqual({ good: 20, review: 14 });
    expect(HEALTH_BANDS.coverageMultiple).toEqual({ good: 5, review: 3.5 });
    expect(HEALTH_BANDS.cpfFrsTrackPct).toEqual({ good: 100, review: 70 });
  });

  const BAND_GRID = Object.entries(HEALTH_BANDS).flatMap(([name, b]) =>
    [b.good, b.good - 0.1, b.review, b.review - 0.1, 0].map((value) => ({ name, b, value })),
  );

  it.each(BAND_GRID)('$name at $value matches the legacy band()', ({ b, value }) => {
    expect(bandFor(value, b)).toEqual(legacyBand(value, b));
  });

  it('income-0 percentages (0%) band to Action needed on every card', () => {
    for (const b of Object.values(HEALTH_BANDS)) {
      expect(bandFor(0, b)).toEqual(legacyBand(0, b));
      expect(bandFor(0, b).label).toBe('Action needed');
    }
  });
});

describe('premiumCardStatus — HealthSnapshot.jsx:16-21 (SPECIAL underinsured logic)', () => {
  const CASES: Array<[string, CoverageRatios, number]> = [
    ['adequate + pct exactly 10 (≤10 inclusive) → Good', ratios(5, 5, 1.5), 10],
    ['adequate + pct just over 10 → Review cost', ratios(12, 8, 3), 10.1],
    ['underinsured beats cheap premiums (pct 5) → Underinsured', ratios(4, 5, 1.5), 5],
    ['underinsured + expensive (pct 15) → Underinsured', ratios(0, 0, 0), 15],
    ['income 0 → ratios 0 → Underinsured even at pct 0', ratios(0, 0, 0), 0],
  ];

  it.each(CASES)('%s', (_name, summary, insurancePremiumsPct) => {
    // HealthSnapshot.jsx:16-21 oracle (logic/labels/bg verbatim; tones use
    // the WCAG-AA darkened palette — see legacyBand above), fed by the
    // ClientReportModal.jsx:138-142 adequacy oracle:
    const isAdequate = legacyIsAdequatelyCovered(summary);
    const expected =
      isAdequate && insurancePremiumsPct <= 10
        ? { tone: '#047857', bg: '#d1fae5', label: 'Good' }
        : !isAdequate
          ? { tone: '#b91c1c', bg: '#fee2e2', label: 'Underinsured' }
          : { tone: '#92400e', bg: '#fef3c7', label: 'Review cost' };
    expect(premiumCardStatus(summary, insurancePremiumsPct)).toEqual(expected);
  });
});

describe('coverageCostAt65{Death,CI,ECI} — ClientReportModal.jsx:205-244', () => {
  it.each(INCOME_YEAR_GRID)('death cost income=$income years=$years', ({ income, years }) => {
    // ClientReportModal.jsx:206-209 (verbatim oracle — LITERAL 1.025):
    //   summary.income * 10 * Math.pow(1.025, yearsToRetirement)
    expect(coverageCostAt65Death(income, years)).toBe(income * 10 * Math.pow(1.025, years));
  });

  it.each(INCOME_YEAR_GRID)('CI cost income=$income years=$years', ({ income, years }) => {
    // ClientReportModal.jsx:223-226 (verbatim oracle — LITERAL 1.06, additive gap term):
    //   AVERAGE_CRITICAL_ILLNESS_COST * Math.pow(1.06, yearsToRetirement) +
    //     (summary.income * 5 - AVERAGE_CRITICAL_ILLNESS_COST)
    expect(coverageCostAt65CI(income, years)).toBe(
      AVERAGE_CRITICAL_ILLNESS_COST * Math.pow(1.06, years) +
        (income * 5 - AVERAGE_CRITICAL_ILLNESS_COST),
    );
  });

  it.each(INCOME_YEAR_GRID)('ECI cost income=$income years=$years', ({ income, years }) => {
    // ClientReportModal.jsx:240-243 (verbatim oracle — 30000 base, ×1.5 multiple):
    //   AVERAGE_EARLY_CI_COST * Math.pow(1.06, yearsToRetirement) +
    //     (summary.income * 1.5 - AVERAGE_EARLY_CI_COST)
    expect(coverageCostAt65ECI(income, years)).toBe(
      AVERAGE_EARLY_CI_COST * Math.pow(1.06, years) + (income * 1.5 - AVERAGE_EARLY_CI_COST),
    );
  });

  it('income 0 + years 0 collapses CI/ECI to exactly 0 (base cancels the additive term)', () => {
    expect(coverageCostAt65Death(0, 0)).toBe(0);
    expect(coverageCostAt65CI(0, 0)).toBe(0);
    expect(coverageCostAt65ECI(0, 0)).toBe(0);
  });
});

describe('postCoverageOOP — ClientReportModal.jsx:46-48', () => {
  const OOP_GRID = INCOME_YEAR_GRID.flatMap(({ income, years }) => {
    const futureCost = coverageCostAt65CI(income, years);
    // coverage strictly below / exactly at / strictly above the future cost
    return [futureCost - 50000, futureCost, futureCost + 50000].map((coverage) => ({
      futureCost,
      coverage,
    }));
  });

  it.each(OOP_GRID)('futureCost=$futureCost coverage=$coverage', ({ futureCost, coverage }) => {
    // ClientReportModal.jsx:47 (verbatim oracle): Math.max(0, futureCICost - summary.totalCICoverage)
    expect(postCoverageOOP(futureCost, coverage)).toBe(Math.max(0, futureCost - coverage));
  });

  it('coverage above the future cost floors at exactly 0', () => {
    expect(postCoverageOOP(100000, 100001)).toBe(0);
    expect(postCoverageOOP(100000, 100000)).toBe(0);
    expect(postCoverageOOP(0, 0)).toBe(0);
  });
});

describe('heroTotals — ClientReportModal.jsx:21-35', () => {
  const CLIENTS: Array<[string, HeroClientInput]> = [
    [
      'mixed book (string values; non-ILP illustrated value EXCLUDED)',
      {
        dateOfBirth: '1990-05-10', // age 36 at refYear 2026 → 29 years
        totalBankBalance: '80000',
        policies: [
          { isInvestmentLinked: true, illustratedValueAge65: '250000' },
          { isInvestmentLinked: true, illustratedValueAge65: null }, // legacy `|| 0`
          { isInvestmentLinked: false, illustratedValueAge65: '999999' },
        ],
      },
    ],
    [
      'missing DOB defaults to age 40 → 25 years; null balance → 0',
      { dateOfBirth: null, totalBankBalance: null, policies: [] },
    ],
    [
      'past retirement age clamps years to 0 (no growth)',
      {
        dateOfBirth: '1950-01-01', // age 76 → Math.max(0, -11) = 0
        totalBankBalance: 120000,
        policies: [{ isInvestmentLinked: true, illustratedValueAge65: 50000 }],
      },
    ],
  ];

  it.each(CLIENTS)('%s', (_name, client) => {
    // ClientReportModal.jsx:21-35 (verbatim oracle; String() only satisfies
    // tsc — legacy passes the number 0 to parseFloat, identical result):
    const currentAge = ageFromDOB(client.dateOfBirth, REF_YEAR);
    const yearsToRetirement = Math.max(0, 65 - currentAge);
    const investmentPolicies = client.policies.filter((p) => p.isInvestmentLinked);
    const totalILPValueAt65 = investmentPolicies.reduce(
      (s, p) => s + parseFloat(String(p.illustratedValueAge65 || 0)),
      0,
    );
    const bankBalanceAt65 =
      parseFloat(String(client.totalBankBalance || 0)) * Math.pow(1.005, yearsToRetirement);
    const totalRetirementValue = totalILPValueAt65 + bankBalanceAt65;

    expect(heroTotals(client, REF_YEAR)).toEqual({
      yearsToRetirement,
      totalILPValueAt65,
      bankBalanceAt65,
      totalRetirementValue,
    });
  });
});

describe('retirement economics — RetirementProjection.jsx:10-20,184-186,199-208', () => {
  it('rates match the legacy local constants (RetirementProjection.jsx:10-12)', () => {
    expect(BANK_INTEREST_RATE).toBe(0.005);
    expect(GENERAL_INFLATION_RATE).toBe(0.025);
    expect(MODERATE_INVESTMENT_RETURN).toBe(0.06);
  });

  it.each(BALANCE_YEAR_GRID)(
    'investedAt6 + opportunityCost balance=$balance years=$years',
    ({ balance, years }) => {
      // RetirementProjection.jsx:10-16 (verbatim oracle):
      const nominalBankRate = 0.005;
      const moderateReturn = 0.06;
      const balanceAt65WithBank = balance * Math.pow(1 + nominalBankRate, years);
      const balanceAt65WithInvestment = balance * Math.pow(1 + moderateReturn, years);
      expect(investedAt6(balance, years)).toBe(balanceAt65WithInvestment);
      expect(opportunityCost(balance, years)).toBe(
        balanceAt65WithInvestment - balanceAt65WithBank,
      );
    },
  );

  it('years 0 → opportunity cost is exactly 0', () => {
    expect(opportunityCost(250000, 0)).toBe(0);
  });

  const TOTALS = [0, 500000, 1234567.89];
  it.each(TOTALS.flatMap((total) => YEARS.map((years) => ({ total, years }))))(
    'purchasingPowerLoss2_5 total=$total years=$years',
    ({ total, years }) => {
      // RetirementProjection.jsx:11,20,184-186 (verbatim oracle):
      const inflationRate = 0.025;
      const purchasingPowerToday = total / Math.pow(1 + inflationRate, years);
      expect(purchasingPowerLoss2_5(total, years)).toEqual({
        purchasingPowerToday,
        loss: total - purchasingPowerToday,
        lossPct: (1 - 1 / Math.pow(1 + inflationRate, years)) * 100,
      });
    },
  );

  it('years 0 → zero loss and zero percent (division by 1.025^0 === 1)', () => {
    expect(purchasingPowerLoss2_5(500000, 0)).toEqual({
      purchasingPowerToday: 500000,
      loss: 0,
      lossPct: 0,
    });
  });

  it.each(INCOMES)('emergencyFundTarget income=%d', (income) => {
    // RetirementProjection.jsx:199-200 (verbatim oracle): income * 0.75
    expect(emergencyFundTarget(income)).toBe(income * 0.75);
  });

  it.each(BALANCES.flatMap((balance) => INCOMES.map((income) => ({ balance, income }))))(
    'excessInvestable balance=$balance income=$income',
    ({ balance, income }) => {
      // RetirementProjection.jsx:205 (verbatim oracle): currentBalance - income * 0.75
      expect(excessInvestable(balance, income)).toBe(balance - income * 0.75);
    },
  );

  it.each(
    BALANCES.flatMap((balance) => INCOMES.map((income) => ({ balance, income }))),
  )(
    'excessInvestableRecommendation balance=$balance income=$income',
    ({ balance, income }) => {
      const riskProfile = 'Moderately Aggressive';
      // RetirementProjection.jsx:202-207 (verbatim oracle): the bullet renders
      // ONLY when `currentBalance > income * 0.75`; copy interpolates
      // `currentBalance - income * 0.75` and `client.riskProfile.toLowerCase()`.
      const expected =
        balance > income * 0.75
          ? { excess: balance - income * 0.75, riskProfileLabel: riskProfile.toLowerCase() }
          : null;
      expect(excessInvestableRecommendation(balance, income, riskProfile)).toEqual(expected);
    },
  );

  it('balance exactly at the 0.75× target gets NO recommendation (strict >, incl. 0/0)', () => {
    expect(excessInvestableRecommendation(45000, 60000, 'Balanced')).toBeNull();
    expect(excessInvestableRecommendation(0, 0, 'Balanced')).toBeNull();
    // one dollar over the boundary at income 120000 (target 90000)
    expect(excessInvestableRecommendation(90001, 120000, 'Balanced')).toEqual({
      excess: 1,
      riskProfileLabel: 'balanced',
    });
  });
});
