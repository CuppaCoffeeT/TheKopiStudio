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
  /** Bar segment fill — the family's `--status-*-dot`, the saturated mark of
   *  each pair, so the segment still reads at 4–6 px. */
  bar: string;
  /** Badge bg + fg pair — the family's `--status-*-bg` / `--status-*-fg`. */
  badge: string;
}

/**
 * Five AppBase drawing-workflow states, mapped onto the `--status-*` families
 * in `src/index.css` (the same quadruples <StatusBadge> consumes). Kopi 2a
 * admits no categorical hues, so the five states borrow the six status
 * families: inert taupe (expired) → brown in-progress (sent) → sage positive
 * (accepted) → terracotta negative (rejected), with the faint brown draft tint
 * for the delivered state. Do NOT remap per-tenant; the colour IS the status
 * semantics here.
 */
const STATUS_SEGMENTS: readonly StatusToken[] = [
  {
    key: 'to_prepare',
    label: 'To Prepare',
    bar: 'bg-[color:var(--status-expired-dot)]',
    badge:
      'bg-[color:var(--status-expired-bg)] text-[color:var(--status-expired-fg)]',
  },
  {
    key: 'to_check',
    label: 'To Check',
    bar: 'bg-[color:var(--status-sent-dot)]',
    badge:
      'bg-[color:var(--status-sent-bg)] text-[color:var(--status-sent-fg)]',
  },
  {
    key: 'approved',
    label: 'Approved',
    bar: 'bg-[color:var(--status-accepted-dot)]',
    badge:
      'bg-[color:var(--status-accepted-bg)] text-[color:var(--status-accepted-fg)]',
  },
  {
    key: 'submitted',
    label: 'Submitted',
    bar: 'bg-[color:var(--status-draft-dot)]',
    badge:
      'bg-[color:var(--status-draft-bg)] text-[color:var(--status-draft-fg)]',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    bar: 'bg-[color:var(--status-rejected-dot)]',
    badge:
      'bg-[color:var(--status-rejected-bg)] text-[color:var(--status-rejected-fg)]',
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
            'flex w-full overflow-hidden rounded-full bg-secondary',
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
                  <span className="ml-1 tabular-nums text-muted-foreground">
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
