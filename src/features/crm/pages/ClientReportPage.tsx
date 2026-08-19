/**
 * ClientReportPage — resolves the customer, then hands off to `ReportCanvas`.
 *
 * TWO ROUTES, one component (2026-08-18): `/clients/:id/report` from the
 * record, `/tools/client-report?customer=…` from navigation with the picker at
 * the top. The customer resolves from whichever the URL carries. Reached with
 * no customer at all, the page IS the picker — there is no report for nobody.
 *
 * NO COMPLETENESS GATE (2026-08-18): it generates at any stage, prints `NIL`
 * for blanks and heads the document with what is missing. NEVER MASKED — this
 * IS the client-facing artifact. Both decisions: lib/decisions.md.
 *
 * PRINT-FIRST CONTRACT (lib/report-print.css): a dedicated report canvas, NOT
 * a DetailPageFrame — `.report-canvas` is locked to white/dark-ink on screen
 * AND print (the screen preview IS the printed artifact). The action bar and
 * the picker are `.no-print`; `.report-print-root` scopes printing to the
 * report alone; PDF stays window.print().
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
import { clientFromRow } from '../lib/clientMapping';
import { buildReportModel } from '../lib/reportModel';
import { reportGaps } from '../lib/reportCompleteness';
import { useClientDetail } from '../hooks/useClientDetail';
import { useLogToolOpen } from '../hooks/useLogToolOpen';
import { ToolCustomerBar } from '../components/ToolCustomerBar';
import { ReportCanvas } from '../components/report/ReportCanvas';
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

  // Every figure the canvas prints, derived in one pure call (lib/reportModel).
  const derived = useMemo(
    () => (model ? buildReportModel(model, policyList) : null),
    // `policies.data` identity is stable per fetch (React Query structural
    // sharing), so this recomputes only when the record or the policies change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model, policies.data],
  );

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

        {model && derived && (
          <ReportCanvas
            client={model}
            policies={policyList}
            interactions={interactionList}
            bankHistory={bankList}
            gaps={gaps}
            {...derived}
          />
        )}
      </div>
    </div>
  );
}
