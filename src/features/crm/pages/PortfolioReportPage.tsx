/**
 * PortfolioReportPage — book-wide printable financial summary (TOOL
 * archetype, route /crm-reports; REPORTS_LINK_PRD.md P3).
 *
 * Re-engineers the legacy Reports.jsx tab as a full page: hero stats +
 * financial summary (ANNUALISED premium totals — the documented divergence
 * from the legacy raw sum, footnoted in PortfolioSummary) + per-client
 * policy tables. Data is RLS-scoped (advisor = own book, manager/
 * super_admin = all). PDF = window.print() + lib/report-print.css: the
 * `.report-canvas` is print-first light-locked (white on screen AND paper —
 * the dark-mode pairing rule is waived per the print-css contract); the
 * action bar is `.no-print`; `.report-print-root` keeps app chrome off the
 * paper.
 *
 * 2a "Kopi House" (2026-07-25): 2a mocks no report screen, so the page
 * *around* the canvas is assembled from its documented parts — breadcrumb →
 * serif title → hairline (AppHeaderShell, Detail archetype), the print CTA
 * kept prominent as the brown primary on its own `.no-print` row with a
 * muted caption, the comp's dashed loading placeholder (serif italic verb +
 * thin brown bar), and the comp's empty state (serif italic line + one quiet
 * secondary action, no primary CTA, no illustration). The printed artifact
 * is untouched — it is its own contract in report-print.css.
 */

import { useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Button } from '@/components/primitives/shell/Button';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { formatDisplayDateTimeLong } from '@/utils/timezoneUtils';
import { usePortfolioReport } from '../hooks/usePortfolioReport';
import { PortfolioSummary } from '../components/report/PortfolioSummary';
import { PortfolioClientDetails } from '../components/report/PortfolioClientDetails';
import '../lib/report-print.css';

/**
 * "Generated: …" header, on the SG clock.
 *
 * Goes through `formatDisplayDateTimeLong` rather than a bare
 * `toLocaleString('en-SG', …)`: `getCurrentSingaporeTime()` returns a plain
 * `new Date()`, so every getter and every `toLocaleString` without an explicit
 * `timeZone` reads the BROWSER's zone. This stamp is printed onto a financial
 * PDF — it was wrong by hours on any non-SGT machine. See
 * `src/features/crm/lib/lessons.md` (2026-07-14).
 */
function generatedTimestamp(): string {
  return formatDisplayDateTimeLong(new Date());
}

/**
 * Loading — the comp's dashed placeholder: serif italic verb, a thin brown bar
 * on the `--border-faint` track, then the 11.5px caption. The bar pulses whole
 * rather than filling to a percentage; the query reports no progress, and a
 * part-filled bar would state one it does not have.
 */
function CompilingNotice() {
  return (
    <div
      className="rounded-xl border border-dashed border-[color:var(--hairline-frame)] bg-card px-[22px] py-10 text-center"
      data-testid="portfolio-report-loading"
    >
      <p
        className="m-0 text-[19px] italic leading-tight text-foreground"
        style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
      >
        Compiling the portfolio…
      </p>
      <div className="mx-auto mt-3 h-1 w-[70%] overflow-hidden rounded-[2px] bg-[color:var(--border-faint)]">
        <div className="h-full w-full animate-pulse bg-[color:var(--brand-brown)]" />
      </div>
      <p className="mt-2.5 text-[11.5px] text-muted-foreground">
        Reading every client, policy and premium visible to you.
      </p>
    </div>
  );
}

/** Empty book — 2a empty state: serif italic line, one muted explanatory line,
 *  one quiet secondary action. No illustration, no primary CTA. */
function EmptyBookNotice({ onGoToClients }: { onGoToClients: () => void }) {
  return (
    <div
      className="border-t border-[color:var(--border-soft)] px-4 pb-2 pt-10 text-center"
      data-testid="report-portfolio-empty"
    >
      <p
        className="m-0 text-[20px] italic leading-tight text-foreground"
        style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
      >
        No clients to report on yet.
      </p>
      <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-[color:var(--fg-dim)]">
        The portfolio report covers every client visible to you — add your first client and their
        policies, then generate the report again.
      </p>
      <Button
        variant="outline"
        size="lg"
        className="mt-3.5"
        onClick={onGoToClients}
        data-testid="portfolio-report-go-clients-btn"
      >
        Go to clients
      </Button>
    </div>
  );
}

export default function PortfolioReportPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = usePortfolioReport();

  const clientCount = data?.totals.totalClients ?? 0;
  const printable = clientCount > 0;

  return (
    <AppHeaderShell
      title="Portfolio report"
      description="Book-wide financial summary — stats, annualised premiums and per-client policies, print-ready."
      breadcrumb={[
        { label: 'Workspace', href: '/dashboard' },
        { label: 'CRM', href: '/crm' },
        { label: 'Portfolio report' },
      ]}
      testId="crm-portfolio-report"
    >
      <div className="no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Caption waits for the query: until it resolves neither count nor
            "nothing to print" is a claim this page can make. */}
        {data && (
          <p className="m-0 text-[12.5px] leading-relaxed text-[color:var(--fg-dim)]">
            {printable
              ? `${clientCount} ${clientCount === 1 ? 'client' : 'clients'} · prints A4 with 12 mm margins`
              : 'Nothing to print until the book has a client.'}
          </p>
        )}
        <Button
          variant="primary"
          size="lg"
          className="min-h-[44px] w-full sm:ml-auto sm:w-auto"
          onClick={() => window.print()}
          disabled={!printable}
          leadingIcon={<Printer className="h-4 w-4" strokeWidth={1.8} />}
          data-testid="portfolio-report-print-btn"
        >
          Print / Save as PDF
        </Button>
      </div>

      {isLoading && <CompilingNotice />}

      {isError && !data && (
        <ErrorState
          variant="compact"
          subhead="The portfolio report didn't load."
          body="Your book could not be read. Check your connection and retry."
          onRetry={() => void refetch()}
        />
      )}

      {data && !printable && <EmptyBookNotice onGoToClients={() => navigate('/clients')} />}

      {data && printable && (
        <div className="report-print-root report-canvas" data-testid="report-portfolio">
          <PortfolioSummary totals={data.totals} generatedAt={generatedTimestamp()} />
          <PortfolioClientDetails clients={data.clients} />
        </div>
      )}
    </AppHeaderShell>
  );
}
