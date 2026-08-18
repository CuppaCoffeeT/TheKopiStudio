/**
 * CustomerQueueBoard — the body of the Overview action queue.
 *
 * Extracted from `DashboardHomePage` (2026-07-28, W23 LOC ceiling) at the seam
 * that was already there: the page owns auth, module gating, the greeting and
 * the modals; this owns the bands. It renders only once the queue has RESOLVED,
 * so it carries no loading or error branches — those stay with the page that
 * owns the query.
 *
 * BAND ORDER IS THE PRIORITY ORDER (2026-08-18), most urgent first:
 *
 *   1. Reviews coming up   — a dated commitment to the customer; it expires.
 *   2. Unfinished work     — started and abandoned; the cost is already sunk.
 *   3. No contact in 14 days — real, but nothing breaks today.
 *
 * The bands used to run in the opposite order (quiet → unfinished → reviews),
 * which put the only band with a DEADLINE at the bottom of the page. Reading
 * order is priority whether or not anyone intends it to be.
 *
 * The three bands are mutually exclusive by construction (`deriveAttention`
 * assigns one reason per customer), so no row can appear twice.
 *
 * WHAT WAS REMOVED (2026-08-18): `QueueStatStrip`, the four figures that sat
 * above these bands, and the `belowStats` tool-shortcut slot. The figures
 * counted the same rows printed directly underneath them — an advisor read "3
 * reviews due", then read the three names. The tools moved to the sidebar's
 * "Others" group, where they are reachable from every page rather than only
 * this one.
 */

import { Button } from '@/components/primitives/shell/Button';
import type { CustomerQueue, QueueCustomer } from '../api/customerQueueService';
import { QUIET_DAYS, REVIEW_WINDOW_DAYS } from '../lib/customerAttention';
import { CustomerQueueSection, type QueueRowAction } from './CustomerQueueSection';

interface CustomerQueueBoardProps {
  queue: CustomerQueue;
  resolveAction: (customer: QueueCustomer) => QueueRowAction;
  onAddCustomer: () => void;
}

export function CustomerQueueBoard({
  queue,
  resolveAction,
  onAddCustomer,
}: CustomerQueueBoardProps) {
  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          className="pointer-coarse:min-h-11"
          onClick={onAddCustomer}
          data-testid="home-add-customer-btn"
        >
          + New customer
        </Button>
      </div>

      <CustomerQueueSection
        testId="home-queue-reviews"
        title="Reviews coming up"
        caption={`Next ${REVIEW_WINDOW_DAYS} days`}
        customers={queue.reviewsDue}
        leading="index"
        resolveAction={resolveAction}
        emptyText={`No reviews fall inside the next ${REVIEW_WINDOW_DAYS} days.`}
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
        testId="home-queue-quiet"
        title={`No contact in ${QUIET_DAYS} days`}
        caption="Follow up"
        customers={queue.quiet}
        leading="days"
        resolveAction={resolveAction}
        emptyText="Nobody has gone quiet — every customer has been contacted recently."
      />

      {/* --fg-dim: this line sits on the PAGE cream, where --fg-muted #7D6B5B
          is 4.12:1 and fails AA (.claude/rules/light-theme.md). */}
      <p className="mt-[26px] text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
        Queue rule — a customer surfaces here when a review date falls inside the next{' '}
        {REVIEW_WINDOW_DAYS} days, a tool in the chain is left incomplete, or there has been no
        contact logged for {QUIET_DAYS} days. Everything else stays out of the way.
      </p>
    </>
  );
}
