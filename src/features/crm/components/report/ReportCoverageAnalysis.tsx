/**
 * Report section [4] — coverage analysis with medical inflation (legacy
 * ClientReportModal.jsx:183-259, printed on a fresh page → report-page-break).
 *
 * FIVE columns exactly as legacy (Coverage type / Current / Ratio /
 * Recommended / Cost at age 65). Out-of-pocket exposure is NOT a column here:
 * in legacy those numbers appear only in the section [11] gap-alert copy
 * (ClientReportModal.jsx:488,496,504), rendered by ReportCoverageGaps.
 *
 * Cost-at-65 cells use the lib coverageCostAt65{Death,CI,ECI} ports (death at
 * LITERAL 1.025 general inflation, CI/ECI at LITERAL 1.06 with the additive
 * un-inflated gap term — preserved legacy quirks, do NOT "fix").
 * Only Math.round(...).toLocaleString() display formatting happens here.
 */

import type { ClientSummary } from '../../lib/finance';
import {
  coverageCostAt65CI,
  coverageCostAt65Death,
  coverageCostAt65ECI,
} from '../../lib/financeReport';

interface ReportCoverageAnalysisProps {
  summary: ClientSummary;
  yearsToRetirement: number;
}

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;

export function ReportCoverageAnalysis({
  summary,
  yearsToRetirement,
}: ReportCoverageAnalysisProps) {
  const rows = [
    {
      id: 'death',
      label: 'Death benefit',
      current: money(summary.totalCoverage),
      ratio: `${summary.coverageRatio.toFixed(1)}x`,
      recommended: '10–15x income',
      costAt65: money(coverageCostAt65Death(summary.income, yearsToRetirement)),
    },
    {
      id: 'ci',
      label: 'Critical illness',
      current: money(summary.totalCICoverage),
      ratio: `${summary.ciCoverageRatio.toFixed(1)}x`,
      recommended: '5x income',
      costAt65: money(coverageCostAt65CI(summary.income, yearsToRetirement)),
    },
    {
      id: 'eci',
      label: 'Early CI',
      current: money(summary.totalECICoverage),
      ratio: `${summary.eciCoverageRatio.toFixed(1)}x`,
      recommended: '1.5x income',
      costAt65: money(coverageCostAt65ECI(summary.income, yearsToRetirement)),
    },
    {
      id: 'premium',
      label: 'Premium / income',
      current: money(summary.totalAnnualPremium),
      ratio: `${summary.premiumRatio.toFixed(1)}%`,
      recommended: '10–15%',
      costAt65: '-',
    },
  ];

  return (
    <section
      className="report-section report-page-break"
      data-testid="report-coverage-analysis"
    >
      <h2>Coverage analysis with medical inflation</h2>
      <table className="report-table">
        <thead>
          <tr>
            <th scope="col">Coverage type</th>
            <th scope="col" className="num">Current</th>
            <th scope="col" className="num">Ratio</th>
            <th scope="col" className="num">Recommended</th>
            <th scope="col" className="num">Cost at age 65</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-testid={`report-coverage-row-${row.id}`}>
              <td>
                <strong>{row.label}</strong>
              </td>
              <td className="num">{row.current}</td>
              <td className="num">{row.ratio}</td>
              <td className="num">{row.recommended}</td>
              <td className="num">{row.costAt65}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
