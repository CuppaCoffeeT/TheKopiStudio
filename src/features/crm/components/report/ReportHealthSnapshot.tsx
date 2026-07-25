/**
 * Report section [2] — financial health snapshot, 4 benchmark cards (legacy
 * HealthSnapshot.jsx + the inputs ClientReportModal.jsx:50-74 computed).
 *
 * ALL band logic + math comes from lib/financeReport (splitPremiums →
 * premiumsPctOfIncome; premiumCardStatus carries the SPECIAL premiums-card
 * rules incl. 'Underinsured'; bandFor + HEALTH_BANDS for the other three;
 * cpfAchievementPct arrives from assessRetirementReadiness via the page).
 * Band colors are the legacy hex triples returned BY lib — applied here as
 * inline styles only. Print-first light-locked per report-print.css.
 */

import type { ClientSummary } from '../../lib/finance';
import {
  HEALTH_BANDS,
  bandFor,
  premiumCardStatus,
  premiumsPctOfIncome,
  splitPremiums,
  type BandStatus,
} from '../../lib/financeReport';
import type { CrmPolicy } from '../../types';

interface ReportHealthSnapshotProps {
  summary: ClientSummary;
  policies: CrmPolicy[];
  /** assessRetirementReadiness(...).cpfAchievementPct, computed by the page. */
  cpfAchievementPct: number;
}

interface SnapshotCard {
  id: string;
  title: string;
  value: string;
  guide: string;
  status: BandStatus;
}

export function ReportHealthSnapshot({
  summary,
  policies,
  cpfAchievementPct,
}: ReportHealthSnapshotProps) {
  const { insurancePremiumsPct, investmentPremiumsPct } = premiumsPctOfIncome(
    splitPremiums(policies),
    summary.income,
  );

  const cards: SnapshotCard[] = [
    {
      id: 'insurance',
      title: 'Insurance premiums',
      value: `${insurancePremiumsPct.toFixed(1)}%`,
      guide: 'Guideline: <10% of income',
      status: premiumCardStatus(summary, insurancePremiumsPct),
    },
    {
      id: 'invested',
      title: 'Invested premiums',
      value: `${investmentPremiumsPct.toFixed(1)}%`,
      guide: 'Guideline: 20–30% of income',
      status: bandFor(investmentPremiumsPct, HEALTH_BANDS.investedPremiumsPct),
    },
    {
      id: 'protection',
      title: 'Protection coverage',
      value: `${summary.coverageRatio.toFixed(1)}x`,
      guide: 'Guideline: 5–10x annual income',
      status: bandFor(summary.coverageRatio, HEALTH_BANDS.coverageMultiple),
    },
    {
      id: 'cpf',
      title: 'CPF FRS track',
      value: `${cpfAchievementPct.toFixed(0)}%`,
      guide: 'Target: 100%+ of FRS',
      status: bandFor(cpfAchievementPct, HEALTH_BANDS.cpfFrsTrackPct),
    },
  ];

  return (
    <section className="report-section" data-testid="report-health-snapshot">
      <h2>Financial health snapshot</h2>
      <p className="mb-3 text-[12px] text-[color:var(--fg-dim)]">
        Quick health check against industry benchmarks
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="report-health-card"
            style={{ background: card.status.bg, borderColor: card.status.tone }}
            data-testid={`report-health-card-${card.id}`}
          >
            <div className="text-[12px] font-semibold text-[color:var(--fg-dim)]">{card.title}</div>
            <div className="mt-1 text-[26px] font-bold" style={{ color: card.status.tone }}>
              {card.value}
            </div>
            {/* --fg-dim (not --fg-muted) — 11px on the tinted band bg needs ≥4.5:1;
                #5D4F3F measures 6.2-6.3:1 across the three Kopi band tints. */}
            <div className="text-[11px] text-[color:var(--fg-dim)]">{card.guide}</div>
            <div className="mt-1 text-[12px] font-semibold" style={{ color: card.status.tone }}>
              {card.status.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
