/**
 * Portfolio report — hero strip + financial summary table (legacy
 * Reports.jsx:20-89, "Insurance Portfolio Review" + "Financial summary").
 *
 * ALL numbers arrive pre-computed from lib (`summarisePortfolio` via the
 * portfolio query); only formatting happens here (the legacy
 * `Math.round(...).toLocaleString()` display wrappers). The premium rows are
 * the PRD-documented ANNUALISED divergence from the legacy raw sum — flagged
 * by the "(annualised)" footnote. Print-first light-locked styling per the
 * lib/report-print.css contract.
 *
 * The premium row also declares what it EXCLUDED (2026-08-18): an ILP policy
 * with no premium-inclusion percent set contributes $0 to the annualised total,
 * and a printed report that under-states a book without saying so is the kind
 * of document an advisor stops trusting. See lib/ilpExclusion.
 */

import { describeIlpExclusion } from '../../lib/ilpExclusion';
import type { PortfolioTotals } from '../../lib/financeReport';

interface PortfolioSummaryProps {
  totals: PortfolioTotals;
  /** Pre-formatted generation timestamp (SG clock — the page owns the clock). */
  generatedAt: string;
}

/** Legacy display wrapper (Reports.jsx:45,63,67,74,83). */
const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

export function PortfolioSummary({ totals, generatedAt }: PortfolioSummaryProps) {
  const stats = [
    { id: 'clients', label: 'Total clients', value: String(totals.totalClients) },
    { id: 'policies', label: 'Total policies', value: String(totals.totalPolicies) },
    { id: 'active', label: 'Active policies', value: String(totals.activePolicies) },
    { id: 'coverage', label: 'Total coverage', value: money(totals.totalCoverage) },
  ];

  const rows = [
    {
      id: 'total-premium',
      metric:
        totals.excludedIlp.count > 0
          ? `Total annual premium revenue (annualised) — ${describeIlpExclusion(totals.excludedIlp)}`
          : 'Total annual premium revenue (annualised)',
      amount: money(totals.totalAnnualPremium),
    },
    {
      id: 'total-coverage',
      metric: 'Total coverage provided',
      amount: money(totals.totalCoverage),
    },
    {
      id: 'avg-premium',
      metric: 'Average premium per client (annualised)',
      amount: money(totals.avgAnnualPremiumPerClient),
    },
    {
      id: 'avg-coverage',
      metric: 'Average coverage per client',
      amount: money(totals.avgCoveragePerClient),
    },
  ];

  return (
    <>
      <header className="report-hero" data-testid="report-portfolio-hero">
        <h1>Insurance Portfolio Review</h1>
        <p className="report-hero-sub" data-testid="report-portfolio-generated">
          Generated: {generatedAt}
        </p>
        <div className="report-hero-stats">
          {stats.map((stat) => (
            <div
              key={stat.id}
              className="report-stat"
              data-testid={`report-portfolio-stat-${stat.id}`}
            >
              <div className="label">{stat.label}</div>
              <div className="value">{stat.value}</div>
            </div>
          ))}
        </div>
      </header>

      <section className="report-section" data-testid="report-portfolio-financial-summary">
        <h2>Financial summary</h2>
        <div className="overflow-x-auto">
          <table className="report-table">
            <thead>
              <tr>
                <th scope="col">Metric</th>
                <th scope="col" className="num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.metric}</td>
                  <td className="num" data-testid={`report-portfolio-${row.id}`}>
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p
          className="mt-2 text-[11px] text-[color:var(--fg-dim)]"
          data-testid="report-portfolio-annualised-note"
        >
          (annualised) — premium figures are frequency-annualised with ILP premiums at their
          inclusion percent, a documented divergence from the legacy raw per-frequency sum.
        </p>
      </section>
    </>
  );
}
