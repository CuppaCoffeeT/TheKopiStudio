/**
 * ClientReportPage — printable per-client financial report (route
 * /clients/:id/report; shares modulePath '/clients' — sub-route precedent).
 *
 * PRINT-FIRST CONTRACT (lib/report-print.css): this page is a dedicated
 * report canvas, NOT a DetailPageFrame — the `.report-canvas` is locked to
 * white/dark-ink on screen AND print (the dark-mode pairing rule is waived
 * for report pages by design; the screen preview IS the printed artifact).
 * The top action bar is `.no-print`; `.report-print-root` scopes printing to
 * the report alone; PDF stays window.print().
 *
 * ALL client/policy money math comes from lib (summariseClient · heroTotals ·
 * assessRetirementReadiness · section components' lib calls) — this page only
 * wires lib outputs into sections. Section render conditions are the legacy
 * ClientReportModal.jsx ones (cash value / hospitalization / ILP sections
 * appear only when matching policies exist).
 */

import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { Card } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';
import { ageFromDOB, currentRefYear, summariseClient, toFloat } from '../lib/finance';
import { assessRetirementReadiness, heroTotals } from '../lib/financeReport';
import { clientFromRow } from '../lib/mapping';
import { useClientDetail } from '../hooks/useClientDetail';
import { ReportCashValue } from '../components/report/ReportCashValue';
import { ReportClientProfile } from '../components/report/ReportClientProfile';
import { ReportCoverageAnalysis } from '../components/report/ReportCoverageAnalysis';
import { ReportCoverageGaps } from '../components/report/ReportCoverageGaps';
import { ReportCpfProjection } from '../components/report/ReportCpfProjection';
import { ReportDisclaimer } from '../components/report/ReportDisclaimer';
import { ReportHealthSnapshot } from '../components/report/ReportHealthSnapshot';
import { ReportHero } from '../components/report/ReportHero';
import { ReportHospitalization } from '../components/report/ReportHospitalization';
import { ReportIlpAnalysis } from '../components/report/ReportIlpAnalysis';
import { ReportInteractionHistory } from '../components/report/ReportInteractionHistory';
import { ReportPolicyPortfolio } from '../components/report/ReportPolicyPortfolio';
import { ReportRetirementProjection } from '../components/report/ReportRetirementProjection';
import '../lib/report-print.css';

export default function ClientReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { client, policies, interactions, bankHistory } = useClientDetail(id);

  const row = client.data ?? null;
  const model = useMemo(() => (row ? clientFromRow(row) : null), [row]);
  const policyList = policies.data ?? [];
  const interactionList = interactions.data ?? [];
  const bankList = bankHistory.data ?? [];

  const loading =
    client.isLoading || policies.isLoading || interactions.isLoading || bankHistory.isLoading;
  const failed = client.isError || policies.isError || interactions.isError || bankHistory.isError;

  const refYear = currentRefYear();
  const currentAge = model ? ageFromDOB(model.dateOfBirth || null, refYear) : 0;
  // ClientReportModal.jsx:65 — age math only (money math lives in lib).
  const yearsTo55 = Math.max(0, 55 - currentAge);

  const summary = model
    ? summariseClient({ annualIncome: model.annualIncome, policies: policyList })
    : null;
  const hero = model
    ? heroTotals(
        {
          dateOfBirth: model.dateOfBirth || null,
          totalBankBalance: model.totalBankBalance,
          policies: policyList,
        },
        refYear,
      )
    : null;
  const readiness = model
    ? assessRetirementReadiness(
        {
          dob: model.dateOfBirth || null,
          yearsTo55,
          cpfOA: toFloat(model.cpfOA),
          cpfSA: toFloat(model.cpfSA),
          cpfMA: toFloat(model.cpfMA),
        },
        refYear,
      )
    : null;

  // Legacy section conditions (ClientReportModal.jsx:25-27).
  const cashValuePolicies = policyList.filter((p) => p.hasCashValue);
  const hospitalPolicies = policyList.filter((p) => p.isHospitalization);
  const investmentPolicies = policyList.filter((p) => p.isInvestmentLinked);

  return (
    <div className="min-h-dvh bg-background px-3 py-4 sm:px-6 sm:py-6 print:bg-white">
      <div className="report-print-root mx-auto w-full max-w-4xl">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="lg"
            leadingIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
            onClick={() => navigate(`/clients/${id ?? ''}`)}
            data-testid="report-back-to-client"
          >
            Back to client
          </Button>
          <Button
            size="lg"
            leadingIcon={<Printer className="h-4 w-4" aria-hidden="true" />}
            onClick={() => window.print()}
            data-testid="report-print"
          >
            Print / Save as PDF
          </Button>
        </div>

        {loading && (
          <div data-testid="report-loading">
            <LoadingSkeleton variant="table-rows" rowCount={8} />
          </div>
        )}

        {!loading && failed && (
          <ErrorState
            subhead="Failed to load report"
            body="The client report could not be loaded. Check your connection and try again."
            path={`/clients/${id ?? ''}/report`}
            onRetry={() => {
              void client.refetch();
              void policies.refetch();
            }}
            className="rounded-2xl"
          />
        )}

        {!loading && !failed && !model && (
          <Card data-testid="report-not-found">
            <NoResultsState query={id} />
          </Card>
        )}

        {model && summary && hero && readiness && (
          <article className="report-canvas" data-testid="report-canvas">
            <ReportHero
              name={model.name}
              policyCount={policyList.length}
              summary={summary}
              hero={hero}
            />
            <ReportHealthSnapshot
              summary={summary}
              policies={policyList}
              cpfAchievementPct={readiness.cpfAchievementPct}
            />
            <ReportClientProfile
              client={model}
              currentAge={currentAge}
              yearsToRetirement={hero.yearsToRetirement}
              income={summary.income}
            />
            <ReportCoverageAnalysis summary={summary} yearsToRetirement={hero.yearsToRetirement} />
            {cashValuePolicies.length > 0 && <ReportCashValue policies={cashValuePolicies} />}
            {hospitalPolicies.length > 0 && <ReportHospitalization policies={hospitalPolicies} />}
            {investmentPolicies.length > 0 && <ReportIlpAnalysis policies={investmentPolicies} />}
            {/* Sections [8]/[9] self-guard (CPF balance / bank-or-ILP). */}
            <ReportCpfProjection client={model} currentAge={currentAge} refYear={refYear} />
            <ReportRetirementProjection
              client={model}
              policies={policyList}
              bankHistory={bankList}
              income={summary.income}
              refYear={refYear}
            />
            <ReportPolicyPortfolio policies={policyList} />
            <ReportCoverageGaps summary={summary} yearsToRetirement={hero.yearsToRetirement} />
            <ReportInteractionHistory interactions={interactionList} />
            <ReportDisclaimer
              currentAge={currentAge}
              yearsToRetirement={hero.yearsToRetirement}
            />
          </article>
        )}
      </div>
    </div>
  );
}
