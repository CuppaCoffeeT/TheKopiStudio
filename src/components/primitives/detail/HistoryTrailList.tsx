/**
 * HistoryTrailList — from→to audit trail (override/status-change history).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-23-rNq9eFQw/project/preview/component-email-inbox.html (`.ei-trail`)
 * Adopters: AIOverrideClassificationPanel. Domain-agnostic — reusable anywhere
 * a from→to audit log needs to render inline.
 *
 * Renders as a simple list; optional collapse header. Uses render-slot for
 * `fromLabel` / `toLabel` so callers can drop a Badge/EmailCategoryBadge in.
 */

import { useState } from 'react';
import { History, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HistoryTrailEntry {
  id: string;
  from: React.ReactNode;
  to: React.ReactNode;
  reason?: string | null;
  by?: string | null;
  at?: string | null;
}

interface HistoryTrailListProps {
  entries: HistoryTrailEntry[];
  /** If true, wraps the list in a collapsible header (default collapsed). */
  collapsible?: boolean;
  /** Header text (used with `collapsible`). */
  heading?: string;
  /** Visible when not collapsible or when expanded. Default true. */
  defaultOpen?: boolean;
  emptyLabel?: string;
  className?: string;
}

export function HistoryTrailList({
  entries,
  collapsible = false,
  heading,
  defaultOpen = true,
  emptyLabel = 'No history yet.',
  className,
}: HistoryTrailListProps) {
  const [open, setOpen] = useState(defaultOpen);
  const resolvedHeading = heading ?? `History · ${entries.length} correction${entries.length === 1 ? '' : 's'}`;
  const isOpen = collapsible ? open : true;

  const headerNode = (
    <div
      className={cn(
        'flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.08em]',
        'text-muted-foreground mb-1.5',
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex items-center gap-1.5 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
          )}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDown className="w-3 h-3" aria-hidden />
          ) : (
            <ChevronRight className="w-3 h-3" aria-hidden />
          )}
          <History className="w-3 h-3" aria-hidden />
          <span>{resolvedHeading}</span>
        </button>
      ) : (
        <>
          <History className="w-3 h-3" aria-hidden />
          <span>{resolvedHeading}</span>
        </>
      )}
    </div>
  );

  return (
    <div className={cn('history-trail-list', className)}>
      {headerNode}
      {isOpen && (
        <ul className="divide-y divide-border border-t border-border">
          {entries.length === 0 ? (
            <li
              className="py-2 text-[11.5px] italic text-muted-foreground"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {emptyLabel}
            </li>
          ) : (
            entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  'grid items-center gap-x-2.5 gap-y-1 py-1.5',
                  'grid-cols-[auto_auto_minmax(0,1fr)_auto]',
                  'text-[11.5px] text-muted-foreground',
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {entry.from}
                <span className="text-muted-foreground" aria-hidden>
                  →
                </span>
                <span className="italic truncate text-muted-foreground">
                  {entry.reason ? `"${entry.reason}"` : ''}
                  {!entry.reason && entry.to}
                </span>
                <span
                  className="text-muted-foreground text-[10px] tabular-nums shrink-0"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {entry.at}
                </span>
                {entry.reason && (
                  <div className="col-span-4 flex items-center gap-2 pl-0">
                    <span className="text-muted-foreground">{entry.to}</span>
                    {entry.by && (
                      <span
                        className="text-[10px] text-muted-foreground ml-auto"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        by {entry.by}
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
