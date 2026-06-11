/**
 * DrawingStatusBar — drawing-workflow status visualization (badge row + segmented bar).
 *
 * Shell-group primitive. Replaces `src/components/drafter/DrawingProgressBar.tsx`.
 * Adopters at promotion time: 2 — `components/drafter/DrawingsTab`, `pages/AdminOverview`.
 *
 * Locked: 5 status segments (to_prepare · to_check · approved · submitted · rejected) with
 * fixed colour families. Bar height 4px (sm) / 6px (md). Returns null when total === 0
 * so the caller can decide its own empty-state.
 *
 * Spec: see DESIGN_CATALOG_PRIMITIVES.md row + the design handoff at
 *   docs/99-refactor/_system/design/handoffs/2026-05-23-drawing-status-bar/
 */

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/overlays/Tooltip';

export interface DrawingStatusCounts {
  total: number;
  to_prepare: number;
  to_check: number;
  approved: number;
  submitted: number;
  rejected: number;
}

export interface DrawingStatusBarProps {
  counts: DrawingStatusCounts;
  /** Size knob. Default 'sm'. */
  size?: 'sm' | 'md';
  /** Hide the badge row, keep only the bar. Default false. */
  barOnly?: boolean;
  className?: string;
}

type StatusKey = Exclude<keyof DrawingStatusCounts, 'total'>;

interface StatusToken {
  key: StatusKey;
  label: string;
  /** Bar segment fill — 400-tint, vivid enough to read at 4–6 px. */
  bar: string;
  /** Badge bg + fg pair — 100/700 light, 900/30 · 400 dark. */
  badge: string;
}

/**
 * Five AppBase drawing-workflow states. Locked colour families — do NOT
 * remap per-tenant; the colour IS the status semantics here.
 */
const STATUS_SEGMENTS: readonly StatusToken[] = [
  {
    key: 'to_prepare',
    label: 'To Prepare',
    bar: 'bg-zinc-400 dark:bg-zinc-500',
    badge:
      'bg-zinc-100 text-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300',
  },
  {
    key: 'to_check',
    label: 'To Check',
    bar: 'bg-amber-400 dark:bg-amber-500',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    key: 'approved',
    label: 'Approved',
    bar: 'bg-emerald-400 dark:bg-emerald-500',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    bar: 'bg-blue-400 dark:bg-blue-500',
    badge:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    bar: 'bg-red-400 dark:bg-red-500',
    badge:
      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
] as const;

export function DrawingStatusBar({
  counts,
  size = 'sm',
  barOnly = false,
  className,
}: DrawingStatusBarProps) {
  if (counts.total === 0) return null;

  const activeBadges = STATUS_SEGMENTS.filter((s) => counts[s.key] > 0);

  const badgeClasses =
    size === 'md'
      ? 'text-[10px] px-1.5 py-0.5'
      : 'text-[9px] px-1 py-0';
  const barHeight = size === 'md' ? 'h-1.5' : 'h-1';

  return (
    <TooltipProvider delayDuration={120}>
      <div className={cn('space-y-0.5', className)}>
        {/* Badge row */}
        {!barOnly && (
          <div className="flex flex-wrap gap-1">
            {activeBadges.map((s) => (
              <span
                key={s.key}
                className={cn(
                  'inline-flex items-center rounded font-medium tabular-nums',
                  badgeClasses,
                  s.badge,
                )}
              >
                {counts[s.key]} {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div
          className={cn(
            'flex w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800',
            barHeight,
          )}
          role="progressbar"
          aria-label="Drawing status breakdown"
          aria-valuemin={0}
          aria-valuemax={counts.total}
          aria-valuenow={counts.approved}
        >
          {STATUS_SEGMENTS.map((s) => {
            const count = counts[s.key];
            if (count === 0) return null;
            const pct = (count / counts.total) * 100;
            const pctLabel = pct >= 10 ? Math.round(pct) : pct.toFixed(1);
            return (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(s.bar, 'transition-[width] duration-200')}
                    style={{ width: `${pct}%` }}
                    aria-label={`${s.label}: ${count} of ${counts.total} (${pctLabel}%)`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-[11px]">
                  <span className="font-medium">{s.label}</span>
                  <span className="ml-1 tabular-nums text-zinc-300 dark:text-zinc-600">
                    {count} · {pctLabel}%
                  </span>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
