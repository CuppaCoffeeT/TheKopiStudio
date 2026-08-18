/**
 * CustomerQueueSection — one band of the Overview action queue.
 *
 * Per the 4a comp: a serif section head with a right-aligned muted caption,
 * then hairline-separated rows. Each row leads with the wait figure (days for
 * the quiet band, an index numeral otherwise), carries the customer's name over
 * the one-line reason, and closes with the single action that moves them
 * forward.
 *
 * The row itself is the link to the customer record — the trailing button is a
 * SEPARATE action, so it stops propagation. Nesting a button inside a clickable
 * row is only legitimate when the outer element is not itself a <button>: the
 * row is an <li> with a click handler plus a real anchor on the name, which
 * keeps one tab stop per destination and no invalid nesting.
 *
 * The NAME is masked by the privacy eye (`SensitiveName` → `Sk***`); the reason
 * line, the wait figure and the action label are not. That split is the whole
 * point of the feature: what a stranger over your shoulder must not read is WHO
 * is on the list, not that three people are overdue a call.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/primitives/shell/Button';
import { SensitiveName } from '@/components/primitives/shell/Sensitive';
import { cn } from '@/lib/utils';
import type { QueueCustomer } from '../api/customerQueueService';
import { JourneyChecklist } from './JourneyChecklist';

/** The action a queue row offers, resolved by the page from the customer's next step. */
export interface QueueRowAction {
  label: string;
  onClick: () => void;
}

interface CustomerQueueSectionProps {
  title: string;
  caption: string;
  customers: QueueCustomer[];
  /** `days` prints the wait in days; `index` prints 01, 02, 03. */
  leading: 'days' | 'index';
  resolveAction: (customer: QueueCustomer) => QueueRowAction;
  emptyText: string;
  testId: string;
}

export function CustomerQueueSection({
  title,
  caption,
  customers,
  leading,
  resolveAction,
  emptyText,
  testId,
}: CustomerQueueSectionProps) {
  return (
    <section className="mt-[30px]" aria-labelledby={`${testId}-heading`} data-testid={testId}>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2.5">
        <h2
          id={`${testId}-heading`}
          className="m-0 text-[22px] leading-tight text-foreground"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          {title}
        </h2>
        <span className="flex-none text-[11.5px] text-[color:var(--fg-dim)]">{caption}</span>
      </div>

      {customers.length === 0 ? (
        <p
          className="m-0 py-5 text-[12.5px] text-[color:var(--fg-dim)]"
          data-testid={`${testId}-empty`}
        >
          {emptyText}
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {customers.map((customer, index) => {
            const action = resolveAction(customer);
            return (
              <li
                key={customer.id}
                data-testid={`${testId}-row-${customer.id}`}
                className={cn(
                  'flex items-center gap-4 border-b border-[color:var(--border-soft)] py-3.5',
                  'transition-colors hover:bg-[color:var(--row-hover)]',
                )}
              >
                <span
                  className="w-11 flex-none text-[20px] leading-none text-[color:var(--brand-brown)]"
                  style={{ fontFamily: 'var(--font-pixel)' }}
                  aria-hidden="true"
                >
                  {leading === 'days'
                    ? `${customer.attention.quietDays ?? 0}d`
                    : String(index + 1).padStart(2, '0')}
                </span>

                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clients/${customer.id}`}
                    className="text-[13.5px] font-semibold text-foreground hover:text-[color:var(--brown-text)] focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
                  >
                    <SensitiveName value={customer.name} />
                  </Link>
                  <p className="m-0 mt-0.5 truncate text-[12px] text-[color:var(--fg-dim)]">
                    {customer.reasonText}
                  </p>
                </div>

                <JourneyChecklist
                  journey={customer.journey}
                  className="hidden flex-none sm:inline-flex"
                  testId={`${testId}-progress-${customer.id}`}
                />

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none pointer-coarse:min-h-11"
                  onClick={action.onClick}
                  data-testid={`${testId}-action-${customer.id}`}
                >
                  {action.label}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
