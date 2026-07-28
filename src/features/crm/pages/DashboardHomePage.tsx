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
 * (`lib/customerJourney`) shared with the Customers list and the customer
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

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/primitives/shell';
import { GreetingHeader } from '@/components/primitives/dashboard';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { getSingaporeGreeting } from '@/utils/dashboardHelpers';
import { CustomerQueueSection, type QueueRowAction } from '../components/CustomerQueueSection';
import { QueueStatStrip } from '../components/QueueStatStrip';
import { StartProfilerBand } from '../components/StartProfilerBand';
import { AddCustomerChoiceModal } from '../components/modals/AddCustomerChoiceModal';
import { ClientFormModal } from '../components/modals/ClientFormModal';
import { useCustomerQueue } from '../hooks/useCustomerQueue';
import { QUIET_DAYS, REVIEW_WINDOW_DAYS } from '../lib/customerJourney';
import type { QueueCustomer } from '../api/customerQueueService';

const CLIENTS_PATH = '/clients';
const PROFILER_PATH = '/profiler';

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export default function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, profile, modules } = useAuth();
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
      return { label: 'Start profiler', onClick: () => navigate(PROFILER_PATH) };
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
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-10 sm:py-[34px]">
      <div className="mx-auto max-w-5xl">
        <GreetingHeader
          className="mb-[26px]"
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

        {canProfile && <StartProfilerBand onStart={() => navigate(PROFILER_PATH)} />}

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
          <>
            <QueueStatStrip
              stats={[
                {
                  value: queue.quiet.length,
                  label: 'gone quiet',
                  hint: `${QUIET_DAYS} days+`,
                  testId: 'home-stat-quiet',
                },
                {
                  value: queue.unfinished.length,
                  label: 'unfinished',
                  hint: 'chain incomplete',
                  testId: 'home-stat-unfinished',
                },
                {
                  value: queue.reviewsDue.length,
                  label: 'reviews due',
                  hint: `next ${REVIEW_WINDOW_DAYS} days`,
                  testId: 'home-stat-reviews',
                },
                {
                  value: queue.addedThisMonth,
                  label: 'added',
                  hint: 'this month',
                  testId: 'home-stat-added',
                },
              ]}
            />

            <div className="mt-[26px] flex items-center justify-end">
              <Button
                className="pointer-coarse:min-h-11"
                onClick={() => setChoiceOpen(true)}
                data-testid="home-add-customer-btn"
              >
                + New customer
              </Button>
            </div>

            <CustomerQueueSection
              testId="home-queue-quiet"
              title={`No contact in ${QUIET_DAYS} days`}
              caption="Follow up"
              customers={queue.quiet}
              leading="days"
              resolveAction={resolveAction}
              emptyText="Nobody has gone quiet — every customer has been contacted recently."
            />

            <CustomerQueueSection
              testId="home-queue-unfinished"
              title="Unfinished work"
              caption="Pick up where you left off"
              customers={queue.unfinished}
              leading="index"
              resolveAction={resolveAction}
              emptyText="Every customer's profiler, information and report are complete."
            />

            <CustomerQueueSection
              testId="home-queue-reviews"
              title="Reviews coming up"
              caption={`Next ${REVIEW_WINDOW_DAYS} days`}
              customers={queue.reviewsDue}
              leading="index"
              resolveAction={resolveAction}
              emptyText={`No reviews fall inside the next ${REVIEW_WINDOW_DAYS} days.`}
            />

            {/* --fg-dim: this line sits on the PAGE cream, where --fg-muted
                #7D6B5B is 4.12:1 and fails AA (.claude/rules/light-theme.md). */}
            <p className="mt-[26px] text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
              Queue rule — a customer surfaces here when there has been no contact logged for{' '}
              {QUIET_DAYS} days, a tool in the chain is left incomplete, or a review date falls
              inside the next {REVIEW_WINDOW_DAYS} days. Everything else stays out of the way.
            </p>
          </>
        ) : null}
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
