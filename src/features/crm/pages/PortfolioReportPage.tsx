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
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { AppHeaderShell } from '@/components/primitives/shell/AppHeaderShell';
import { Button } from '@/components/primitives/shell/Button';
import { Card, CardDescription, CardTitle } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { usePortfolioReport } from '../hooks/usePortfolioReport';
import { PortfolioSummary } from '../components/report/PortfolioSummary';
import { PortfolioClientDetails } from '../components/report/PortfolioClientDetails';
import '../lib/report-print.css';

/** Legacy `new Date().toLocaleString()` header, on the SG clock. */
function generatedTimestamp(): string {
  return getCurrentSingaporeTime().toLocaleString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Empty book — nothing to report on yet (legacy showed a muted placeholder). */
function EmptyBookNotice({ onGoToClients }: { onGoToClients: () => void }) {
  return (
    <Card
      className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="report-portfolio-empty"
    >
      <div>
        <CardTitle as="h2">No clients to report on</CardTitle>
        <CardDescription className="mt-1.5">
          The portfolio report covers every client visible to you — add your first client and
          their policies, then generate the report again.
        </CardDescription>
      </div>
      <Button
        variant="primary"
        size="lg"
        className="min-h-[44px] shrink-0"
        onClick={onGoToClients}
        data-testid="portfolio-report-go-clients-btn"
      >
        Go to clients
      </Button>
    </Card>
  );
}

export default function PortfolioReportPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = usePortfolioReport();

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
      <div className="no-print mb-4 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="lg"
          className="min-h-[44px]"
          onClick={() => navigate('/crm')}
          leadingIcon={<ArrowLeft className="h-4 w-4" strokeWidth={1.8} />}
          data-testid="portfolio-report-back-btn"
        >
          Back to dashboard
        </Button>
        <Button
          variant="primary"
          size="lg"
          className="min-h-[44px]"
          onClick={() => window.print()}
          disabled={!data || data.totals.totalClients === 0}
          leadingIcon={<Printer className="h-4 w-4" strokeWidth={1.8} />}
          data-testid="portfolio-report-print-btn"
        >
          Print / Save as PDF
        </Button>
      </div>

      {isLoading && (
        <div data-testid="portfolio-report-loading">
          <LoadingSkeleton variant="table-rows" rowCount={6} />
        </div>
      )}

      {isError && !data && (
        <ErrorState
          subhead="REPORT UNAVAILABLE"
          body="The portfolio report could not be loaded. Check your connection and retry."
          path="/crm-reports"
          onRetry={() => void refetch()}
        />
      )}

      {data && data.totals.totalClients === 0 && (
        <EmptyBookNotice onGoToClients={() => navigate('/clients')} />
      )}

      {data && data.totals.totalClients > 0 && (
        <div className="report-print-root report-canvas" data-testid="report-portfolio">
          <PortfolioSummary totals={data.totals} generatedAt={generatedTimestamp()} />
          <PortfolioClientDetails clients={data.clients} />
        </div>
      )}
    </AppHeaderShell>
  );
}
