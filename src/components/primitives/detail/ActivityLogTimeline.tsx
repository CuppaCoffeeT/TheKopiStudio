/**
 * ActivityLogTimeline — Dense audit-log list, grouped by day, [avatar][name][verb-chip][object]·[timestamp].
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-activity-log.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/detail/ActivityLogTimeline.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Different from <Timeline>: no scroll-beam, tight rows, dense audit surface for Company / Invoice.
 * Locked:
 *  - Day-header = mono uppercase, zinc-50 bg, sticky-style.
 *  - Row min-height 44px (mobile tap-target). Mobile wraps timestamp below.
 *  - Verb chip = 3px radius mono uppercase, 10px size.
 */

import type { ReactNode, ElementType } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

export type ActivityLogEntry = {
  id: string;
  actor: string;
  initials?: string;
  verb: string;
  object: ReactNode;
  objectHref?: string;
  /** Relative timestamp text (e.g. "14:32 · 3h ago"). */
  rel: ReactNode;
  /** Treat as system/automated event (dims avatar). */
  system?: boolean;
};

export type ActivityLogGroup = {
  day: ReactNode;
  entries: ActivityLogEntry[];
};

interface ActivityLogTimelineProps {
  groups: ActivityLogGroup[];
  /** Total entries across all pages — displayed in footer ("142 total"). */
  totalCount?: number;
  onLoadMore?: () => void;
  onFilter?: () => void;
  className?: string;
}

export function ActivityLogTimeline({
  groups,
  totalCount,
  onLoadMore,
  onFilter,
  className,
}: ActivityLogTimelineProps) {
  return (
    <div
      className={cn(
        'rounded-[10px] overflow-hidden',
        'border border-zinc-200 dark:border-zinc-800',
        'bg-white dark:bg-zinc-950',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {groups.map((g, gi) => (
        <div key={gi}>
          <div
            className={cn(
              'px-3 md:px-4 py-2 md:py-2.5',
              'bg-zinc-50 dark:bg-zinc-900',
              'border-b border-zinc-100 dark:border-zinc-900',
              gi > 0 && 'border-t border-zinc-100 dark:border-zinc-900',
              'text-[10.5px] font-semibold uppercase tracking-widest text-zinc-500'
            )}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {g.day}
          </div>
          {g.entries.map((e, ei) => {
            const isLast = ei === g.entries.length - 1;
            const useLink = e.objectHref && !isExternal(e.objectHref);
            const ObjectTag: ElementType = useLink ? Link : e.objectHref ? 'a' : 'span';
            const objectProps = useLink
              ? { to: e.objectHref }
              : e.objectHref
              ? { href: e.objectHref }
              : {};
            return (
              <div
                key={e.id}
                className={cn(
                  'flex items-start md:items-center gap-2.5',
                  'px-3 md:px-4 py-2.5',
                  'min-h-11 flex-wrap md:flex-nowrap',
                  !isLast && 'border-b border-zinc-100 dark:border-zinc-900',
                  'hover:bg-white hover:shadow-[inset_0_0_0_1px_#ececee,0_1px_2px_rgba(24,24,27,0.04)]',
                  'dark:hover:bg-white/[0.04] dark:hover:shadow-none'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full inline-flex items-center justify-center flex-shrink-0',
                    'text-[9.5px] font-semibold tracking-wide',
                    e.system
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                      : 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900'
                  )}
                  style={{ fontFamily: 'var(--font-sans)' }}
                  aria-hidden
                >
                  {e.initials ?? (e.actor.charAt(0) + (e.actor.split(' ')[1]?.charAt(0) ?? '')).toUpperCase()}
                </span>
                <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-50 flex-shrink-0">
                  {e.actor}
                </span>
                <span
                  className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-[3px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex-shrink-0"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {e.verb}
                </span>
                <ObjectTag
                  {...objectProps}
                  className={cn(
                    'flex-1 min-w-0 text-[13px] text-zinc-600 dark:text-zinc-300 truncate no-underline',
                    e.objectHref &&
                      'hover:border-b hover:border-dotted hover:border-zinc-400 dark:hover:border-zinc-600 pb-px'
                  )}
                >
                  {e.object}
                </ObjectTag>
                <span
                  className="text-[10.5px] text-zinc-500 tracking-wide flex-shrink-0 w-full pl-[34px] md:w-auto md:pl-0"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {e.rel}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {(onLoadMore || totalCount != null) && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/40 dark:bg-white/[0.015]">
          {onLoadMore && (
            <button
              type="button"
              onClick={onLoadMore}
              className={cn(
                'h-[26px] px-2.5 rounded-[5px] text-[12px] font-medium text-zinc-700 dark:text-zinc-300',
                'hover:bg-zinc-100 dark:hover:bg-zinc-900',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700'
              )}
            >
              Load earlier
            </button>
          )}
          <div className="flex-1" />
          {totalCount != null && (
            <span className="text-[10.5px] text-zinc-500 tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
              {totalCount} total{onFilter && ' · '}
              {onFilter && (
                <button
                  type="button"
                  onClick={onFilter}
                  className="hover:text-zinc-900 dark:hover:text-zinc-50 underline-offset-2 hover:underline"
                >
                  filter
                </button>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
