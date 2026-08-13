/**
 * /dashboard — the customer-centred Overview (Kopi Studio Directions turns
 * 3a/4a, "Overview as home, tools live inside the customer").
 *
 * The page answers ONE question: who is waiting on you? Top to bottom —
 * the dateline masthead carrying the count, the Start-a-Profiler launcher band,
 * the four queue figures, then the queue itself in three mutually-exclusive
 * bands (gone quiet → unfinished work → reviews due), closed by the queue rule.
 *
 * WHAT THIS REPLACED (2026-07-28): a "Latest additions" feed over two index KPI
 * cards. That page was a *record inventory* — newest-first rows with no notion
 * of whether anything needed doing — which is exactly the tool-shaped IA the
 * customer-centred direction retires. Its four modules had NO other adopter
 * (`/crm` builds its own four-figure row from `KpiTile`), so they were deleted
 * rather than left orphaned: `useLatestAdditions`, `LatestAdditionsTable`,
 * `OverviewKpiRow`, `lib/latestAdditions`. The `KpiIndexCard` PRIMITIVE they
 * used survives in `primitives/dashboard` for the next adopter.
 *
 * Every figure and row is live, RLS-scoped data derived by ONE ruleset
 * (`lib/customerJourney` + `lib/customerAttention`) shared with the Customers list and the customer
 * detail launcher — so the queue can never claim a customer is unfinished while
 * their record shows the chain complete.
 *
 * Module gating: the queue reads `public.clients`, so it is parked entirely for
 * a viewer without `/clients` (an empty queue would read as "all caught up").
 * The launcher band is gated separately on `/profiler` — never advertise a
 * route the guard would then refuse.
 *
 * Testid contract (tests/workflows/crm/dashboard.spec.ts): the greeting is the
 * page's only h1; `home-start-profiler-band` + `home-start-profiler-btn`;
 * `home-queue-stats`; the three queue sections `home-queue-quiet` /
 * `home-queue-unfinished` / `home-queue-reviews`, each resolving to
 * `<section>-row-<id>` rows or `<section>-empty`; and `home-add-customer-btn`
 * opening `crm-add-customer-choice-modal`.
 */

/**
 * Chrome: this page composes NO archetype frame — its GreetingHeader masthead
 * is the header block, and AppHeaderShell would stack a second H1 over it — so
 * it renders `AppHeaderMobileBar` itself. Don't remove it: below lg the rail is
 * hidden and the ⌘K hotkey is gone, so that bar's search icon is the only way
 * off this page.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/primitives/shell';
import { GreetingHeader } from '@/components/primitives/dashboard';
import { AppHeaderMobileBar } from '@/components/primitives/shell/AppHeaderMobileBar';
import { ImpersonationBanner } from '@/components/primitives/shell/ImpersonationBanner';
import { ViewAsSelector } from '@/components/primitives/shell/ViewAsSelector';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { useDashboardChrome } from '@/hooks/useDashboardChrome';
import { getSingaporeGreeting } from '@/utils/dashboardHelpers';
import { CustomerQueueBoard } from '../components/CustomerQueueBoard';
import type { QueueRowAction } from '../components/CustomerQueueSection';
import { StartProfilerBand } from '../components/StartProfilerBand';
import { AddCustomerChoiceModal } from '../components/modals/AddCustomerChoiceModal';
import { ClientFormModal } from '../components/modals/ClientFormModal';
import { useCustomerQueue } from '../hooks/useCustomerQueue';
import type { QueueCustomer } from '../api/customerQueueService';

const CLIENTS_PATH = '/clients';
const PROFILER_PATH = '/profiler';

/**
 * Page label for the < lg bar. One segment: the bar shows only the last, and
 * this page IS the root — a `Workspace /` crumb above it would point at itself.
 * Matches `AppSidebar`'s HOME_LABEL so the rail and the bar name it the same.
 */
const BAR_BREADCRUMB = [{ label: 'Overview' }];

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, profile, modules } = useAuth();
  const chrome = useDashboardChrome();
  const { timeOfDay, dateText } = getSingaporeGreeting();

  const hasClients = modules.some((mod) => mod.path === CLIENTS_PATH);
  const canProfile = modules.some((mod) => mod.path === PROFILER_PATH);

  const [choiceOpen, setChoiceOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const queueQuery = useCustomerQueue(hasClients);
  const queue = queueQuery.data;

  /**
   * The single action each queue row offers: whatever the customer's chain says
   * comes next, falling back to opening the record. Resolved here rather than
   * inside the section component so the routing decision stays on the page that
   * owns the router.
   */
  const resolveAction = (customer: QueueCustomer): QueueRowAction => {
    const open = { label: 'Open', onClick: () => navigate(`/clients/${customer.id}`) };
    if (customer.journey.nextStep === 'profiler' && canProfile) {
      // Carry the customer's name into the wizard — the row names who to
      // profile; making the advisor retype it was the audit's worst paper-cut.
      return {
        label: 'Start profiler',
        onClick: () => navigate(`${PROFILER_PATH}?prospect=${encodeURIComponent(customer.name)}`),
      };
    }
    if (customer.journey.nextStep === 'info') {
      return { label: 'Complete info', onClick: () => navigate(`/clients/${customer.id}`) };
    }
    return open;
  };

  const handleChoice = (choice: 'profiler' | 'empty') => {
    setChoiceOpen(false);
    if (choice === 'profiler') navigate(PROFILER_PATH);
    else setAddOpen(true);
  };

  const waiting = queue?.totalWaiting ?? 0;

  return (
    <div className="min-h-dvh bg-background">
      {/* This page composes no archetype frame (its GreetingHeader masthead IS
          the header block, and AppHeaderShell would stack a second H1 over it),
          so it renders the < lg chrome itself, exactly as the frames do. Without
          this the rail is `hidden lg:flex` and nothing stands in: /dashboard had
          no navigation at all on a phone, and since the ⌘K hotkey was removed
          (2026-08-05) the bar's search icon is the only way to open the module
          palette. */}
      <AppHeaderMobileBar
        breadcrumb={BAR_BREADCRUMB}
        {...chrome.user}
        viewAsSlot={<ViewAsSelector {...chrome.viewAs} />}
        onSignOut={chrome.onSignOut}
      />
      {chrome.impersonation.active && <ImpersonationBanner {...chrome.impersonation.props} />}

      {/* Padding stays OUTSIDE `max-w-5xl` — inside it, the gutters would eat
          into the measure and narrow the column on wide screens. */}
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

        {canProfile && (
          <div className="motion-rise motion-rise-2">
            <StartProfilerBand onStart={() => navigate(PROFILER_PATH)} />
          </div>
        )}

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
