/**
 * CustomerQueueBoard — the body of the Overview action queue.
 *
 * Extracted from `DashboardHomePage` (2026-07-28, W23 LOC ceiling) at the seam
 * that was already there: the page owns auth, module gating, the greeting and
 * the modals; this owns the four figures, the three bands and the rule line.
 * It renders only once the queue has RESOLVED, so it carries no loading or
 * error branches — those stay with the page that owns the query.
 *
 * The three bands are mutually exclusive by construction (`deriveAttention`
 * assigns one reason per customer), so the figures across the top never
 * double-count a person and no row appears twice.
 */

import { Button } from '@/components/primitives/shell/Button';
import type { CustomerQueue, QueueCustomer } from '../api/customerQueueService';
import { QUIET_DAYS, REVIEW_WINDOW_DAYS } from '../lib/customerAttention';
import { CustomerQueueSection, type QueueRowAction } from './CustomerQueueSection';
import { QueueStatStrip } from './QueueStatStrip';

interface CustomerQueueBoardProps {
  queue: CustomerQueue;
  resolveAction: (customer: QueueCustomer) => QueueRowAction;
  onAddCustomer: () => void;
  /**
   * Slot rendered directly under the four figures (the Overview tool-shortcut
   * row). A slot rather than a prop-driven render: the shortcuts launch routes,
   * so the page that owns the router owns them — this component only knows
   * WHERE they sit, which is a layout decision and belongs here.
   */
  belowStats?: React.ReactNode;
}

export function CustomerQueueBoard({
  queue,
  resolveAction,
  onAddCustomer,
  belowStats,
}: CustomerQueueBoardProps) {
  return (
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

      {belowStats}

      <div className="mt-[26px] flex items-center justify-end">
        <Button
          className="pointer-coarse:min-h-11"
          onClick={onAddCustomer}
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

      {/* --fg-dim: this line sits on the PAGE cream, where --fg-muted #7D6B5B
          is 4.12:1 and fails AA (.claude/rules/light-theme.md). */}
      <p className="mt-[26px] text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
        Queue rule — a customer surfaces here when there has been no contact logged for{' '}
        {QUIET_DAYS} days, a tool in the chain is left incomplete, or a review date falls inside
        the next {REVIEW_WINDOW_DAYS} days. Everything else stays out of the way.
      </p>
    </>
  );
}
