/**
 * Report section [1] — hero strip (legacy ClientReportModal.jsx:88-131).
 *
 * Title "{name}'s Financial Protection Plan", the as-of date, and the 5 hero
 * stats. The date goes through `formatDisplayDateLong`, which pins
 * `timeZone: Asia/Singapore`; the previous
 * `getCurrentSingaporeTime().toLocaleDateString('en-SG', …)` was browser-local
 * despite the name and could print yesterday's date onto the report west of
 * SGT (see `src/features/crm/lib/lessons.md`, 2026-07-14). ALL numbers arrive
 * pre-computed from lib (summariseClient / heroTotals); only formatting happens
 * here. Print-first light-locked styling per the report-print.css contract.
 */

import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { formatCoverage, type ClientSummary } from '../../lib/finance';
import type { HeroTotals } from '../../lib/financeReport';

interface ReportHeroProps {
  name: string;
  policyCount: number;
  summary: ClientSummary;
  hero: HeroTotals;
}

interface HeroStat {
  id: string;
  label: string;
  value: string;
  note?: string;
}

export function ReportHero({ name, policyCount, summary, hero }: ReportHeroProps) {
  const asOf = formatDisplayDateLong(new Date());

  const stats: HeroStat[] = [
    { id: 'policies', label: 'Total policies', value: String(policyCount) },
    { id: 'coverage', label: 'Death coverage', value: formatCoverage(summary.totalCoverage) },
    {
      id: 'investment',
      label: 'Annual investment in self',
      value: formatCoverage(summary.totalAnnualInvestment),
    },
    {
      id: 'projected-65',
      label: 'Projected at age 65',
      value: formatCoverage(hero.totalRetirementValue),
      note: 'ILP + bank',
    },
    {
      id: 'years-to-retirement',
      label: 'Years to retirement',
      value: String(hero.yearsToRetirement),
    },
  ];

  return (
    <header className="report-hero" data-testid="report-hero">
      <h1>{name}&apos;s Financial Protection Plan</h1>
      <p className="report-hero-sub">
        Comprehensive insurance and investment review as of {asOf}
      </p>
      <div className="report-hero-stats">
        {stats.map((stat) => (
          <div key={stat.id} className="report-stat" data-testid={`report-hero-stat-${stat.id}`}>
            <div className="label">{stat.label}</div>
            <div className="value">{stat.value}</div>
            {stat.note && <div className="note">{stat.note}</div>}
          </div>
        ))}
      </div>
    </header>
  );
}
