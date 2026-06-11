/**
 * Timeline — Aceternity-style vertical scroll-beam timeline for detail-page activity tabs.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-timeline-beam.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/ui_kits/appbase/src/Timeline.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked:
 *  - Variants: `full` (activity tab) · `sidebar` (compact side-rail card).
 *  - `scrollProgress` (0..1) drives a red-700 beam fill with soft glow.
 *  - Mobile: beam disabled, single-column flat list with a tiny red dot.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TimelineEvent = {
  id: string;
  timestamp: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actor?: string;
};

export type TimelineVariant = 'full' | 'sidebar';

interface TimelineProps {
  events: TimelineEvent[];
  variant?: TimelineVariant;
  /** 0..1 — fraction of beam filled with red. Drives scroll-reveal effect. */
  scrollProgress?: number;
  className?: string;
}

export function Timeline({ events, variant = 'full', scrollProgress = 0, className }: TimelineProps) {
  const compact = variant === 'sidebar';
  const beamInset = compact ? 14 : 22;
  const fillPct = Math.min(100, Math.max(0, scrollProgress * 100));

  return (
    <div
      className={cn('relative', compact ? 'py-2' : 'py-3', className)}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Beam track — desktop only */}
      <div
        aria-hidden
        className="hidden md:block absolute top-3.5 bottom-3.5 w-px bg-gradient-to-b from-zinc-900/5 via-zinc-900/10 to-zinc-900/5 dark:from-white/5 dark:via-white/10 dark:to-white/5"
        style={{ left: beamInset }}
      />
      {/* Beam fill */}
      <div
        aria-hidden
        className="hidden md:block absolute top-3.5 w-px bg-gradient-to-b from-red-700 via-red-700 to-transparent dark:from-red-400 dark:via-red-400 shadow-[0_0_12px_rgba(185,28,28,0.28)] dark:shadow-[0_0_12px_rgba(248,113,113,0.45)]"
        style={{ left: beamInset, height: `calc(${fillPct}% - 28px)` }}
      />

      {events.map((ev, i) => {
        const passed = i / Math.max(1, events.length) < scrollProgress;
        return (
          <div
            key={ev.id}
            className={cn(
              'relative flex',
              compact ? 'gap-3.5 py-2.5' : 'gap-5 py-3.5',
            )}
          >
            {/* Desktop dot */}
            <div
              className="hidden md:flex justify-center flex-shrink-0 relative z-[1]"
              style={{ width: beamInset * 2, marginTop: compact ? 2 : 4 }}
            >
              <span
                className={cn(
                  'rounded-full border-2',
                  compact ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5',
                  passed
                    ? 'bg-red-700 border-red-700 dark:bg-red-400 dark:border-red-400 shadow-[0_0_0_3px_rgba(185,28,28,0.10)] dark:shadow-[0_0_0_3px_rgba(248,113,113,0.14)]'
                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                )}
              />
            </div>
            {/* Mobile dot */}
            <span className="md:hidden w-2.5 h-2.5 rounded-full mt-1.5 bg-red-700 dark:bg-red-400 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <div
                className="text-[10.5px] uppercase tracking-wide text-zinc-500"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {ev.timestamp}
              </div>
              <div className={cn('mt-1 font-medium text-zinc-900 dark:text-zinc-50 leading-snug', compact ? 'text-[12.5px]' : 'text-[13.5px]')}>
                {ev.title}
              </div>
              {ev.description && (
                <div className={cn('mt-0.5 text-zinc-500 leading-relaxed', compact ? 'text-[11.5px]' : 'text-[12.5px]')}>
                  {ev.description}
                </div>
              )}
              {ev.actor && !compact && (
                <div
                  className="mt-1.5 inline-flex items-center gap-1.5 text-[10.5px] text-zinc-400 dark:text-zinc-600 tracking-wide"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[8px] font-semibold bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {ev.actor.charAt(0)}
                  </span>
                  {ev.actor}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
