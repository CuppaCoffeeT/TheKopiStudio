/**
 * ClientReportPage — printable per-client financial report.
 *
 * TWO ROUTES, one component (2026-08-18):
 *   `/clients/:id/report`             — from the customer record, as before.
 *   `/tools/client-report?customer=…` — from navigation, with the customer
 *                                       picker at the top of the page.
 * The customer resolves from whichever the URL carries, so the report itself is
 * written once. Reached with no customer at all, the page is the picker and
 * nothing else — there is no report to print for nobody.
 *
 * NO COMPLETENESS GATE (2026-08-18). The report used to be unreachable until
 * the profiler and the customer information were both marked done. It now
 * generates from whatever is on file at any stage: blank fields print `NIL`
 * (`lib/reportCompleteness`), and `ReportMissingInfo` heads the document with a
 * named list of what is missing and which tool fills it. A report that says
 * what it does not know is more useful at a first meeting than no report.
 *
 * NEVER MASKED. This page ignores the privacy eye (`MaskContext`) on purpose —
 * it IS the client-facing artifact, and a printed PDF of asterisks is not a
 * report.
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
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { CUSTOMER_PARAM } from '@/lib/toolRoutes';
import { Button } from '@/components/primitives/shell/Button';
import { Card } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';
import { ageFromDOB, currentRefYear, summariseClient, toFloat } from '../lib/finance';
import { assessRetirementReadiness, heroTotals } from '../lib/financeReport';
import { clientFromRow } from '../lib/clientMapping';
import { reportGaps } from '../lib/reportCompleteness';
import { useClientDetail } from '../hooks/useClientDetail';
import { useLogToolOpen } from '../hooks/useLogToolOpen';
import { ToolCustomerBar } from '../components/ToolCustomerBar';
import { ReportMissingInfo } from '../components/report/ReportMissingInfo';
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
  const { id: routeId } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  /**
   * The record sub-route wins when present. Only the standalone route shows the
   * picker — on `/clients/:id/report` the customer is the URL, and offering a
   * dropdown that silently disagrees with the path would be a second source of
   * truth for the same question.
   */
  const id = routeId ?? params.get(CUSTOMER_PARAM) ?? undefined;
  const standalone = !routeId;

  const chooseCustomer = (next: string | null) => {
    const updated = new URLSearchParams(params);
    if (next) updated.set(CUSTOMER_PARAM, next);
    else updated.delete(CUSTOMER_PARAM);
    setParams(updated);
  };

  const { client, policies, interactions, bankHistory, linkedResults } = useClientDetail(id);

  // Opening the report IS generating it — there is no separate build step, and
  // the printed PDF is just this page. The customer's timeline records it once
  // per visit. (The book-wide Portfolio Report is deliberately NOT logged: it
  // covers every customer, and writing one entry onto each of them would bury
  // the log under an event nobody performed against any individual.)
  useLogToolOpen(
    'client-report',
    'Client Report generated',
    client.data ? (id ?? null) : null,
    client.data?.user_id ?? null,
    'report_generated',
  );

  const row = client.data ?? null;
  const model = useMemo(() => (row ? clientFromRow(row) : null), [row]);
  const policyList = policies.data ?? [];
  const interactionList = interactions.data ?? [];
  const bankList = bankHistory.data ?? [];

  const loading =
    Boolean(id) &&
    (client.isLoading || policies.isLoading || interactions.isLoading || bankHistory.isLoading);
  const failed =
    Boolean(id) &&
    (client.isError || policies.isError || interactions.isError || bankHistory.isError);

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

  /**
   * What the record could not supply — printed above the hero, never hidden.
   * "Profiled" is `results.client_id`, NOT `client.riskProfile`: the add form
   * defaults that column to 'Moderate', so reading it would report a completed
   * profiler for every customer who has never been near one.
   */
  const gaps = model ? reportGaps(model, policyList, (linkedResults.data ?? []).length > 0) : [];

  return (
    <div className="bg-background px-3 py-4 sm:px-6 sm:py-6 print:bg-white">
      <div className="report-print-root mx-auto w-full max-w-4xl">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          {id ? (
            <Button
              variant="outline"
              size="lg"
              leadingIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate(`/clients/${id}`)}
              data-testid="report-back-to-client"
            >
              Back to client
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="lg"
            leadingIcon={<Printer className="h-4 w-4" aria-hidden="true" />}
            onClick={() => window.print()}
            disabled={!model}
            data-testid="report-print"
          >
            Print / Save as PDF
          </Button>
        </div>

        {/* `.no-print` — the picker is chrome for choosing WHAT to print, and
            must never appear on the printed artifact. */}
        {standalone && (
          <div className="no-print print:hidden">
            <ToolCustomerBar
              value={id ?? null}
              onChange={chooseCustomer}
              blankHint="Pick a customer to generate their report — it works at any stage, and prints NIL for anything not on file yet."
              testId="client-report-customer-bar"
            />
          </div>
        )}

        {loading && (
          <div data-testid="report-loading">
            <LoadingSkeleton variant="table-rows" rowCount={8} />
          </div>
        )}

        {!loading && failed && (
          <ErrorState
            variant="compact"
            subhead="This report didn't load."
            body="The client and their policies could not be read. Check your connection and try again."
            onRetry={() => {
              void client.refetch();
              void policies.refetch();
            }}
          />
        )}

        {!loading && !failed && !model && id && (
          <Card data-testid="report-not-found">
            <NoResultsState query={id} />
          </Card>
        )}

        {model && summary && hero && readiness && (
          <article className="report-canvas" data-testid="report-canvas">
            <ReportMissingInfo gaps={gaps} />
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
