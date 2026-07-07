/**
 * CDWProgressTimeline — 12-step CDW (Cable Detection Works) project workflow visualization.
 *
 * Dashboard-group primitive. Replaces `src/components/meeting-projects/MeetingCDWProgressBar.tsx`
 * (151 LOC) — same render, but caller-driven steps + Tooltip primitive + dark mode + a11y.
 *
 * Pure presentation. State derivation (which date goes where, drawings_done_override → step 9,
 * NCE override mapping, etc.) stays in `useCDWProgressSteps` + `utils/cdwProjectProgress`.
 *
 * Two responsive layouts:
 *   xl and up    →  Full mode — 2-line label + date(s) per step
 *   below xl     →  Mini mode — 2-letter code square per step
 *
 * Adopters at promotion: 3 — meetingprojects + admin-overview + engineer-dashboard.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-05-23-cdw-progress-timeline/
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/primitives/overlays';
import { Progress } from '@/components/primitives/form';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';

export interface CDWProgressStep {
  /** Full step label, used in tooltips. */
  label: string;
  /** First-line of the 2-line label, e.g. "Site". */
  labelLine1: string;
  /** Second-line of the 2-line label, e.g. "Plan". Optional — single-line if omitted. */
  labelLine2?: string;
  /** 2-letter code for the mini layout, e.g. "SP". */
  labelMini: string;
  /** Primary date — pass raw ISO/UTC string (e.g. `'2026-04-27'` or
   *  `'2026-04-11T00:58:00+00:00'`); primitive formats to `dd MMM yyyy` SGT.
   *  An already-formatted string also renders as-is (parse failure falls back). */
  date?: string | null;
  /** Optional secondary date — formatted the same way as `date`. */
  secondaryDate?: string | null;
  /** Optional text that replaces the date (e.g. "No NCE", "override"). */
  overrideText?: string;
  /** Explicit state — falls back to (date ? 'completed' : 'pending') if omitted. */
  state?: 'pending' | 'ongoing' | 'completed';
}

/** Format a date string for the step cell. Accepts raw ISO/UTC or
 *  already-formatted "dd MMM yyyy" — parse failure renders the original. */
function formatStepDate(d: string | null | undefined): string {
  if (!d) return '';
  // Cheap heuristic: if it already looks like "dd MMM yyyy" (length 11, has spaces), skip
  if (/^\d{2} [A-Z][a-z]{2} \d{4}$/.test(d)) return d;
  try {
    return formatDisplayDateLong(d);
  } catch {
    return d;
  }
}

export type CDWProgressTimelineVariant = 'compact' | 'detail';

export interface CDWProgressTimelineProps {
  steps: CDWProgressStep[];
  /** Loading skeleton — renders Loader2 spin. */
  isLoading?: boolean;
  /** Empty state copy — defaults to "No CDW". */
  emptyText?: string;
  /**
   * Visual density.
   *  - `compact` (default) — original dashboard-row size: 70px min-width cells,
   *    9-10px labels, inline "X / Y" counter. Used by meetingprojects /
   *    admin-overview / engineer-dashboard rows.
   *  - `detail` — full-width treatment for /projects/:id "Project Progress"
   *    card: cells flex-1 to fill the row, larger labels + dates, primitive
   *    Progress bar underneath. No inline counter (folded into the bar's label).
   */
  variant?: CDWProgressTimelineVariant;
  className?: string;
}

type StepState = 'pending' | 'ongoing' | 'completed';

function deriveState(step: CDWProgressStep): StepState {
  if (step.state) return step.state;
  return step.date ? 'completed' : 'pending';
}

/* ─── Locked status tokens — Tailwind palette, no raw hex ─────────────── */

const CELL_BG: Record<StepState, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  ongoing:   'bg-amber-100   text-amber-800   dark:bg-amber-900/30   dark:text-amber-300',
  pending:   'bg-secondary text-muted-foreground',
};

/** Date-line colour — one step softer than the label but still WCAG AA on
 *  the cell bg (label = 800, date = 700; both verified via axe-playwright). */
const DATE_FG: Record<StepState, string> = {
  completed: 'text-emerald-700 dark:text-emerald-400',
  ongoing:   'text-amber-700   dark:text-amber-400',
  pending:   'text-muted-foreground',
};

/* ─── Full mode (xl+) ─────────────────────────────────────────────────── */

function FullStep({ step }: { step: CDWProgressStep }) {
  const state = deriveState(step);
  const tip =
    step.overrideText
      ? `${step.label}: ${step.overrideText}`
      : state === 'pending'
        ? `${step.label}: Pending`
        : `${step.label}: ${formatStepDate(step.date)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex flex-col items-center justify-center rounded-md px-2 py-1.5 min-w-[70px]',
            'text-center',
            CELL_BG[state],
          )}
          aria-label={tip}
        >
          <span className="text-[10px] font-semibold leading-tight">{step.labelLine1}</span>
          {step.labelLine2 && (
            <span className="text-[10px] font-semibold leading-tight">{step.labelLine2}</span>
          )}

          {step.overrideText ? (
            <span className={cn('text-[9px] leading-tight mt-0.5', DATE_FG[state])}>
              {step.overrideText}
            </span>
          ) : step.secondaryDate ? (
            <>
              <span className={cn('text-[8px] leading-tight mt-0.5 tabular-nums', DATE_FG.ongoing)}>
                {formatStepDate(step.date)}
              </span>
              <span className={cn('text-[8px] leading-tight tabular-nums', DATE_FG.completed)}>
                {formatStepDate(step.secondaryDate)}
              </span>
            </>
          ) : (
            <span className={cn('text-[9px] leading-tight mt-0.5 tabular-nums', DATE_FG[state])}>
              {state !== 'pending' ? formatStepDate(step.date) : '—'}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">{tip}</TooltipContent>
    </Tooltip>
  );
}

function FullRow({ steps }: { steps: CDWProgressStep[] }) {
  const completed = steps.filter((s) => deriveState(s) === 'completed').length;
  return (
    <div className="flex items-stretch gap-1">
      {steps.map((step, i) => <FullStep key={i} step={step}/>)}
      <span className="text-xs ml-1.5 self-center whitespace-nowrap font-medium tabular-nums text-muted-foreground">
        {completed}/{steps.length}
      </span>
    </div>
  );
}

/* ─── Detail mode (full-width — /projects/:id "Project Progress" card) ─ */

function DetailStep({ step }: { step: CDWProgressStep }) {
  const state = deriveState(step);
  const tip =
    step.overrideText
      ? `${step.label}: ${step.overrideText}`
      : state === 'pending'
        ? `${step.label}: Pending`
        : `${step.label}: ${formatStepDate(step.date)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex-1 min-w-0 flex flex-col items-center justify-center rounded-lg px-2 py-2.5',
            'text-center',
            CELL_BG[state],
          )}
          aria-label={tip}
        >
          <span className="text-xs font-semibold leading-tight">{step.labelLine1}</span>
          {step.labelLine2 && (
            <span className="text-xs font-semibold leading-tight">{step.labelLine2}</span>
          )}

          {step.overrideText ? (
            <span className={cn('text-[10.5px] leading-tight mt-1.5', DATE_FG[state])}>
              {step.overrideText}
            </span>
          ) : step.secondaryDate ? (
            <>
              <span className={cn('text-[10.5px] leading-tight mt-1.5 tabular-nums', DATE_FG.ongoing)}>
                {formatStepDate(step.date)}
              </span>
              <span className={cn('text-[10.5px] leading-tight tabular-nums', DATE_FG.completed)}>
                {formatStepDate(step.secondaryDate)}
              </span>
            </>
          ) : (
            <span className={cn('text-[10.5px] leading-tight mt-1.5 tabular-nums', DATE_FG[state])}>
              {state !== 'pending' ? formatStepDate(step.date) : '—'}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">{tip}</TooltipContent>
    </Tooltip>
  );
}

function DetailRow({ steps }: { steps: CDWProgressStep[] }) {
  const completed = steps.filter((s) => deriveState(s) === 'completed').length;
  const pct = steps.length === 0 ? 0 : (completed / steps.length) * 100;
  const allComplete = completed === steps.length && steps.length > 0;
  return (
    <div className="flex flex-col gap-3">
      {/* md and up — stretched cells with 2-line label + date */}
      <div className="hidden md:flex items-stretch gap-1.5">
        {steps.map((step, i) => <DetailStep key={i} step={step}/>)}
      </div>
      {/* below md — mini 2-letter squares (same as compact's mini layout) so
          12 cells stay legible on narrow viewports without truncating labels */}
      <div className="flex md:hidden flex-wrap gap-1">
        {steps.map((step, i) => <MiniStep key={i} step={step}/>)}
      </div>
      <Progress
        tone={allComplete ? 'success' : 'neutral'}
        value={pct}
        label={`${completed} / ${steps.length} milestones`}
      />
    </div>
  );
}

/* ─── Mini mode (below xl) ────────────────────────────────────────────── */

function MiniStep({ step }: { step: CDWProgressStep }) {
  const state = deriveState(step);
  const tip =
    step.overrideText
      ? `${step.label}: ${step.overrideText}`
      : state === 'pending'
        ? `${step.label}: Pending`
        : `${step.label}: ${formatStepDate(step.date)}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'flex items-center justify-center rounded w-7 h-7',
            CELL_BG[state],
          )}
          aria-label={tip}
        >
          <span className="text-[10px] font-semibold leading-none">{step.labelMini}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-[11px]">{tip}</TooltipContent>
    </Tooltip>
  );
}

function MiniRow({ steps }: { steps: CDWProgressStep[] }) {
  const completed = steps.filter((s) => deriveState(s) === 'completed').length;
  return (
    <div className="flex items-center gap-0.5">
      {steps.map((step, i) => <MiniStep key={i} step={step}/>)}
      <span className="text-[10px] ml-1 whitespace-nowrap font-medium tabular-nums text-muted-foreground">
        {completed}/{steps.length}
      </span>
    </div>
  );
}

/* ─── Public primitive ────────────────────────────────────────────────── */

export function CDWProgressTimeline({
  steps,
  isLoading = false,
  emptyText = 'No CDW',
  variant = 'compact',
  className,
}: CDWProgressTimelineProps) {
  if (isLoading) {
    return (
      <div className={cn('inline-flex', className)} aria-label="Loading CDW progress" role="status">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>{emptyText}</span>
    );
  }

  if (variant === 'detail') {
    return (
      <TooltipProvider delayDuration={120}>
        <div className={cn('w-full', className)} aria-label="CDW project progress">
          <DetailRow steps={steps}/>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className={cn('overflow-x-auto', className)} aria-label="CDW project progress">
        <div className="hidden xl:block">
          <FullRow steps={steps}/>
        </div>
        <div className="block xl:hidden">
          <MiniRow steps={steps}/>
        </div>
      </div>
    </TooltipProvider>
  );
}
