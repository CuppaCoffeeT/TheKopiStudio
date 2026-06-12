/**
 * Oracle lock for the P3 portfolio-report math (REPORTS_LINK_PRD.md).
 *
 * Expected values are computed in-test by ORACLE EXPRESSIONS copied verbatim
 * from the legacy JSX (git c09c549; file:line cited per case) — STRICT
 * equality, no epsilon — EXCEPT `totalAnnualPremium`, which is the
 * PRD-documented divergence: legacy CrmApp.jsx:114-117 raw-summed `premium`
 * per stored frequency while labeling the row "annual"; the port reuses
 * `summariseClient`, so its oracle is the golden-locked `summariseClient`
 * itself plus an explicit divergence assertion against the legacy raw sum.
 * All imports go through the `financeReport` barrel — proving the portfolio
 * split re-exports.
 */
import { describe, expect, it } from 'vitest';

import { summariseClient, toFloat } from '../finance';
import { summarisePortfolio, type PortfolioPolicyInput } from '../financeReport';

/** A mixed-frequency, mixed-status book: 2 clients' policies flattened. */
const POLICIES: PortfolioPolicyInput[] = [
  { premium: 250, frequency: 'Monthly', coverageAmount: 500_000, status: 'Active' },
  { premium: 1200, frequency: 'Quarterly', coverageAmount: 150_000, status: 'Lapsed' },
  {
    premium: 6000,
    frequency: 'Annual',
    coverageAmount: 80_000,
    status: 'Active',
    isInvestmentLinked: true,
    ilpPremiumInclusionPercent: 40,
  },
  { premium: 900, frequency: 'Semi-Annual', coverageAmount: '', status: 'Active' },
];
const TOTAL_CLIENTS = 2;

describe('summarisePortfolio', () => {
  const totals = summarisePortfolio(TOTAL_CLIENTS, POLICIES);

  it('counts clients, policies and Active policies (CrmApp.jsx:109-113,125)', () => {
    // Oracle: crm.clients.length / Σ c.policies.length /
    //         Σ c.policies.filter((p) => p.status === 'Active').length
    expect(totals.totalClients).toBe(2);
    expect(totals.totalPolicies).toBe(POLICIES.length);
    expect(totals.activePolicies).toBe(POLICIES.filter((p) => p.status === 'Active').length);
  });

  it('sums coverage with the legacy parseFloat(v || 0) coercion (CrmApp.jsx:118-121)', () => {
    // Oracle: Σ parseFloat(p.coverageAmount || 0) — '' coerces to 0.
    const oracle = POLICIES.reduce((s, p) => s + parseFloat(String(p.coverageAmount || 0)), 0);
    expect(totals.totalCoverage).toBe(oracle);
    expect(totals.totalCoverage).toBe(730_000);
  });

  it('ANNUALISES the premium total via summariseClient (documented divergence)', () => {
    // The port's premium total is summariseClient's golden-locked figure …
    const { totalAnnualPremium } = summariseClient({ annualIncome: 0, policies: POLICIES });
    expect(totals.totalAnnualPremium).toBe(totalAnnualPremium);
    // … i.e. 250×12 + 1200×4 + 6000×0.4 + 900×2 (frequency + ILP percent):
    expect(totals.totalAnnualPremium).toBe(3000 + 4800 + 2400 + 1800);
    // … and DIVERGES from the legacy raw sum (CrmApp.jsx:114-117):
    const legacyRawSum = POLICIES.reduce((s, p) => s + toFloat(p.premium), 0);
    expect(legacyRawSum).toBe(8350);
    expect(totals.totalAnnualPremium).not.toBe(legacyRawSum);
  });

  it('divides averages per client with the legacy guard (Reports.jsx:70-86)', () => {
    // Oracle: totalClients > 0 ? totalPremium / totalClients : 0 (premium row
    // uses the annualised total per the divergence); same shape for coverage.
    expect(totals.avgAnnualPremiumPerClient).toBe(totals.totalAnnualPremium / TOTAL_CLIENTS);
    expect(totals.avgCoveragePerClient).toBe(totals.totalCoverage / TOTAL_CLIENTS);
  });

  it('returns all-zero money fields with 0 averages for an empty book', () => {
    const empty = summarisePortfolio(0, []);
    expect(empty).toEqual({
      totalClients: 0,
      totalPolicies: 0,
      activePolicies: 0,
      totalAnnualPremium: 0,
      totalCoverage: 0,
      avgAnnualPremiumPerClient: 0,
      avgCoveragePerClient: 0,
    });
  });

  it('counts a policy-less client in the average denominators (legacy parity)', () => {
    const one = summarisePortfolio(3, POLICIES);
    expect(one.avgCoveragePerClient).toBe(one.totalCoverage / 3);
    expect(one.avgAnnualPremiumPerClient).toBe(one.totalAnnualPremium / 3);
  });
});
