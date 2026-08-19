/**
 * /dashboard — the customer-centred Overview (Kopi Studio Directions turns
 * 3a/4a, "Overview as home, tools live inside the customer").
 *
 * The page answers ONE question: who is waiting on you? Top to bottom —
 * the dateline masthead carrying the count and the privacy eye, the quote of
 * the day, then the queue itself in three mutually-exclusive bands, ordered
 * most-urgent-first (reviews coming up → unfinished work → no contact in 14
 * days), closed by the queue rule.
 *
 * WHAT WAS REMOVED (2026-08-18): `StartProfilerBand` and the tool-shortcut row
 * (TOOLS on a page about PEOPLE), and `QueueStatStrip` — four figures counting
 * the rows printed directly beneath them. Tools now live in the rail's
 * "Tools" band, reachable from anywhere rather than only here.
 *
 * PRIVACY: customer names are masked by default (`MaskContext`); the eye lives
 * in the app chrome, not per page. Band titles, reasons and the waiting count
 * are NOT masked — they say how much work there is, not whose.
 *
 * WHAT THIS REPLACED (2026-07-28): a "Latest additions" record-inventory
 * feed over two index KPI cards, and the four modules that served only it
 * (`useLatestAdditions`, `LatestAdditionsTable`, `OverviewKpiRow`,
 * `lib/latestAdditions`). The `KpiIndexCard` primitive survives.
 *
 * Every figure and row is live data derived by ONE ruleset
 * (`lib/customerJourney` + `lib/customerAttention`) shared with the Customers list and the customer
 * detail launcher — so the queue can never claim a customer is unfinished while
 * their record shows the chain complete.
 *
 * Scope: the viewer's OWN customers only, whatever their role — this page is a
 * personal work queue. Cross-advisor reach lives on the Customers list, which
 * is the surface built to explain whose customer is whose.
 *
 * Module gating: the queue reads `public.clients`, so it is parked entirely for
 * a viewer without `/clients` (an empty queue would read as "all caught up").
 * `/profiler` is checked separately, but only to decide whether a queue row's
 * action may be "Start profiler" — never advertise a route the guard would
 * then refuse.
 *
 * Testid contract (tests/workflows/crm/dashboard.spec.ts): the greeting is the
 * page's only h1; `home-daily-quote`; the three queue
 * sections in DOM order `home-queue-reviews` / `home-queue-unfinished` /
 * `home-queue-quiet`, each resolving to `<section>-row-<id>` rows or
 * `<section>-empty`; and `home-add-customer-btn` opening
 * `crm-add-customer-choice-modal`. The retired ids `home-start-profiler-band`,
 * `home-start-profiler-btn` and `home-queue-stats` are gone from the spec too,
 * bar one assertion that they stay absent.
 */

/**
 * Chrome: composes NO archetype frame (the GreetingHeader masthead IS the
 * header block; AppHeaderShell would stack a second H1 over it), so it renders
 * `AppHeaderMobileBar` itself. Don't drop it — below lg the rail is hidden, so
 * the bar (its menu button → `AppNavDrawer`) is the only way off this page.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { GreetingHeader, DailyQuoteCard } from '@/components/primitives/dashboard';
import { AppHeaderMobileBar } from '@/components/primitives/shell/AppHeaderMobileBar';
import { ImpersonationBanner } from '@/components/primitives/shell/ImpersonationBanner';
import { ViewAsSelector } from '@/components/primitives/shell/ViewAsSelector';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { quoteForDate } from '@/lib/dailyQuote';
import { getSingaporeGreeting } from '@/utils/dashboardHelpers';
import { getLocalDateString } from '@/utils/timezoneUtils';
import { CustomerQueueBoard } from '../components/CustomerQueueBoard';
import { AddCustomerChoiceModal } from '../components/modals/AddCustomerChoiceModal';
import { ClientFormModal } from '../components/modals/ClientFormModal';
import { useCustomerQueue } from '../hooks/useCustomerQueue';
import { useQueueRowAction } from '../hooks/useQueueRowAction';
import { PROFILER_PATH } from '../lib/profilerEntry';

const CLIENTS_PATH = '/clients';

/** Page label for the < lg bar (it shows only the last segment). Matches
 *  `AppSidebar`'s HOME_LABEL so rail and bar name this page the same. */
const BAR_BREADCRUMB = [{ label: 'Overview' }];

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, profile, modules } = useAuth();
  const chrome = useDashboardChrome();
  const { timeOfDay, dateText } = getSingaporeGreeting();
  // Same SG date the greeting's dateline reads, so the two can never disagree
  // about which day it is at the midnight boundary.
  const quote = quoteForDate(getLocalDateString(new Date()));

  const hasClients = modules.some((mod) => mod.path === CLIENTS_PATH);
  const canProfile = modules.some((mod) => mod.path === PROFILER_PATH);

  const [choiceOpen, setChoiceOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const queueQuery = useCustomerQueue(hasClients);
  const queue = queueQuery.data;

  const resolveAction = useQueueRowAction();

  const handleChoice = (choice: 'profiler' | 'empty') => {
    setChoiceOpen(false);
    if (choice === 'profiler') navigate(PROFILER_PATH);
    else setAddOpen(true);
  };

  const waiting = queue?.totalWaiting ?? 0;

  return (
    <div className="min-h-svh bg-background">
      <AppHeaderMobileBar
        breadcrumb={BAR_BREADCRUMB}
        {...chrome.user}
        viewAsSlot={<ViewAsSelector {...chrome.viewAs} />}
        onSignOut={chrome.onSignOut}
      />
      {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}

      {/* Padding stays OUTSIDE `max-w-5xl` or the gutters eat the measure. */}
      <div className="px-4 py-7 sm:px-10 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <GreetingHeader
          className="mb-10 motion-rise-hero"
          name={profile?.name || user?.email?.split('@')[0] || 'there'}
          dateText={dateText}
          timeOfDay={timeOfDay}
          contextStat={
            queue
              ? waiting === 0
                ? 'nobody is waiting on you'
                : `${waiting} ${plural(waiting, 'customer', 'customers')} ${plural(waiting, 'is', 'are')} waiting on you`
              : undefined
          }
        />

        <div className="motion-rise motion-rise-2 mb-10">
          <DailyQuoteCard quote={quote} />
        </div>

        {!hasClients ? (
          <p className="text-[13px] leading-[1.6] text-[color:var(--fg-dim)]">
            The customer book is not granted to your account yet, so there is no queue to show. An
            administrator can grant it from Manage accounts.
          </p>
        ) : queueQuery.isLoading ? (
          <div data-testid="home-queue-loading">
            <LoadingSkeleton variant="table-rows" rowCount={6} />
          </div>
        ) : queueQuery.isError ? (
          <ErrorState
            variant="compact"
            subhead="The queue didn't load."
            body="Your customer book could not be read. Check your connection and try again."
            onRetry={() => void queueQuery.refetch()}
          />
        ) : queue ? (
          <div className="motion-rise motion-rise-3">
            <CustomerQueueBoard
              queue={queue}
              resolveAction={resolveAction}
              onAddCustomer={() => setChoiceOpen(true)}
            />
          </div>
        ) : null}
      </div>
      </div>

      {hasClients && (
        <AddCustomerChoiceModal
          open={choiceOpen}
          onOpenChange={setChoiceOpen}
          canProfile={canProfile}
          onChoose={handleChoice}
        />
      )}
      {hasClients && <ClientFormModal open={addOpen} onOpenChange={setAddOpen} />}
    </div>
  );
}
