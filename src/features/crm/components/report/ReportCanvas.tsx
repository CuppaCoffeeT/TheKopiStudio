/**
 * ReportCanvas — the printed artifact itself: the sections, in order.
 *
 * ORDER follows the advisor's v42 reference (2026-09-25): protection first
 * (coverage → hospitalization → gaps), then value (cash value → ILP → what can
 * be accessed today), then retirement (CPF → savings at 65), then the policy
 * list and history.
 *
 * Split from `ClientReportPage` at the seam that was already there. The page
 * resolves the customer (from `/clients/:id/report` OR
 * `/tools/client-report?customer=`), owns the picker, the loading / error /
 * not-found branches and the print button; this owns WHAT the document is.
 *
 * ALL money math arrives pre-computed from lib (`summariseClient` · `heroTotals`
 * · `assessRetirementReadiness` · each section's own lib calls) — this file
 * wires lib outputs into sections and does no arithmetic of its own beyond the
 * three legacy render conditions (cash value / hospitalization / ILP sections
 * appear only when matching policies exist — `ClientReportModal.jsx:25-27`).
 *
 * `ReportMissingInfo` leads the document, and it PRINTS. Since the report was
 * ungated (2026-08-18) it generates at any stage of completeness, so a customer
 * holding a page with `NIL` on it should be able to read why.
 */

import { ReportCashValue } from './ReportCashValue';
import { ReportClientProfile } from './ReportClientProfile';
import { ReportCoverageAnalysis } from './ReportCoverageAnalysis';
import { ReportCoverageGaps } from './ReportCoverageGaps';
import { ReportCpfProjection } from './ReportCpfProjection';
import { ReportDisclaimer } from './ReportDisclaimer';
import { ReportHealthSnapshot } from './ReportHealthSnapshot';
import { ReportHero } from './ReportHero';
import { ReportHospitalization } from './ReportHospitalization';
import { ReportIlpAnalysis } from './ReportIlpAnalysis';
import { ReportInteractionHistory } from './ReportInteractionHistory';
import { ReportLiquidity } from './ReportLiquidity';
import { ReportMissingInfo } from './ReportMissingInfo';
import { ReportPolicyPortfolio } from './ReportPolicyPortfolio';
import { ReportRetirementProjection } from './ReportRetirementProjection';
import type { ReportGap } from '../../lib/reportCompleteness';
import type { CrmBankRecord, CrmClient, CrmInteraction, CrmPolicy } from '../../types';

interface ReportCanvasProps {
  client: CrmClient;
  policies: CrmPolicy[];
  interactions: CrmInteraction[];
  bankHistory: CrmBankRecord[];
  gaps: readonly ReportGap[];
  currentAge: number;
  refYear: number;
  /** `summariseClient(...)` — money totals for the whole record. */
  summary: ReturnType<typeof import('../../lib/finance').summariseClient>;
  /** `heroTotals(...)` — the hero strip's figures + years-to-retirement. */
  hero: ReturnType<typeof import('../../lib/financeReport').heroTotals>;
  /** `assessRetirementReadiness(...)` — CPF achievement for the snapshot. */
  readiness: ReturnType<typeof import('../../lib/financeReport').assessRetirementReadiness>;
}

export function ReportCanvas({
  client,
  policies,
  interactions,
  bankHistory,
  gaps,
  currentAge,
  refYear,
  summary,
  hero,
  readiness,
}: ReportCanvasProps) {
  // Legacy section conditions (ClientReportModal.jsx:25-27).
  const cashValuePolicies = policies.filter((p) => p.hasCashValue);
  const hospitalPolicies = policies.filter((p) => p.isHospitalization);
  const investmentPolicies = policies.filter((p) => p.isInvestmentLinked);

  return (
    <article className="report-canvas" data-testid="report-canvas">
      <ReportMissingInfo gaps={gaps} />
      <ReportHero
        name={client.name}
        policyCount={policies.length}
        summary={summary}
        hero={hero}
      />
      <ReportHealthSnapshot
        summary={summary}
        policies={policies}
        cpfAchievementPct={readiness.cpfAchievementPct}
      />
      <ReportClientProfile
        client={client}
        currentAge={currentAge}
        yearsToRetirement={hero.yearsToRetirement}
        income={summary.income}
      />
      <ReportCoverageAnalysis
        summary={summary}
        yearsToRetirement={hero.yearsToRetirement}
        policies={policies}
      />
      {hospitalPolicies.length > 0 && <ReportHospitalization policies={hospitalPolicies} />}
      <ReportCoverageGaps summary={summary} yearsToRetirement={hero.yearsToRetirement} />
      {cashValuePolicies.length > 0 && <ReportCashValue policies={cashValuePolicies} />}
      {investmentPolicies.length > 0 && <ReportIlpAnalysis policies={investmentPolicies} />}
      {/* Self-guards: only when a policy records a surrender value. */}
      <ReportLiquidity policies={policies} />
      {/* Sections [8]/[9] self-guard (CPF balance / bank-or-ILP). */}
      <ReportCpfProjection client={client} currentAge={currentAge} refYear={refYear} />
      <ReportRetirementProjection
        client={client}
        policies={policies}
        bankHistory={bankHistory}
        income={summary.income}
        refYear={refYear}
      />
      <ReportPolicyPortfolio policies={policies} />
      <ReportInteractionHistory interactions={interactions} />
      <ReportDisclaimer currentAge={currentAge} yearsToRetirement={hero.yearsToRetirement} />
    </article>
  );
}
