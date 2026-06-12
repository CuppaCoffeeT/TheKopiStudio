/**
 * Report section [11] — coverage gap analysis alerts (legacy
 * ClientReportModal.jsx:37-48,482-518, git c09c549).
 *
 * Four alerts: death / CI / early-CI gaps (warning when a gap exists, success
 * otherwise) and the always-primary premium-affordability note (>15% review
 * threshold). ALL numbers come from the vectored lib fns — analyseCoverageGaps
 * (10×/5×/1.5× income multiples + 6%-inflated future costs) and
 * postCoverageOOP; the legacy death OOP (line 46) is the SAME expression as
 * `coverageGap` (line 42), so it renders the gap value directly. Only
 * Math.round/toFixed/locale formatting happens here. Props mirror
 * ReportCoverageAnalysis (page passes summariseClient output + the hero
 * years-to-retirement). Print-first light-locked per report-print.css.
 */

import type { ClientSummary } from '../../lib/finance';
import { analyseCoverageGaps, postCoverageOOP } from '../../lib/financeReport';

const money = (value: number): string => `$${Math.round(value).toLocaleString()}`;

interface ReportCoverageGapsProps {
  summary: ClientSummary;
  yearsToRetirement: number;
}

export function ReportCoverageGaps({ summary, yearsToRetirement }: ReportCoverageGapsProps) {
  const gaps = analyseCoverageGaps({
    income: summary.income,
    yearsToRetirement,
    totalCoverage: summary.totalCoverage,
    totalCICoverage: summary.totalCICoverage,
    totalECICoverage: summary.totalECICoverage,
  });

  const alerts = [
    {
      id: 'death',
      title: 'Death benefit',
      tone: gaps.coverageGap > 0 ? 'warning' : 'success',
      body:
        gaps.coverageGap > 0
          ? `Coverage gap of ${money(gaps.coverageGap)}. Beneficiaries could face ${money(gaps.coverageGap)} in out-of-pocket expenses.`
          : `Coverage of ${summary.coverageRatio.toFixed(1)}x income meets industry recommendations.`,
    },
    {
      id: 'ci',
      title: 'Critical illness',
      tone: gaps.ciCoverageGap > 0 ? 'warning' : 'success',
      body:
        gaps.ciCoverageGap > 0
          ? `Gap of ${money(gaps.ciCoverageGap)}. Future CI cost at 65: ${money(gaps.futureCICost)}. Out-of-pocket exposure: ${money(postCoverageOOP(gaps.futureCICost, summary.totalCICoverage))}.`
          : 'CI coverage provides strong protection.',
    },
    {
      id: 'eci',
      title: 'Early CI',
      tone: gaps.eciCoverageGap > 0 ? 'warning' : 'success',
      body:
        gaps.eciCoverageGap > 0
          ? `Gap of ${money(gaps.eciCoverageGap)}. Future early CI cost: ${money(gaps.futureECICost)}. Exposure: ${money(postCoverageOOP(gaps.futureECICost, summary.totalECICoverage))}.`
          : 'Adequate protection for early-stage intervention.',
    },
    {
      id: 'premium',
      title: 'Premium affordability',
      tone: 'primary',
      body:
        `Annual premium ${money(summary.totalAnnualPremium)} is ${summary.premiumRatio.toFixed(1)}% of income.` +
        (summary.premiumRatio > 15
          ? ' Exceeds the 10–15% threshold; review for optimization.'
          : ' Within a sustainable range.'),
    },
  ];

  return (
    <section className="report-section" data-testid="report-coverage-gaps">
      <h2>Coverage gap analysis</h2>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`report-callout report-callout--${alert.tone}`}
          data-testid={`report-gap-${alert.id}`}
          data-tone={alert.tone}
        >
          <h3>{alert.title}</h3>
          <p className="m-0 text-[13px]">{alert.body}</p>
        </div>
      ))}
    </section>
  );
}
