/**
 * DossierLoadingPanel — 2a's loading state for a detail panel.
 *
 * A dashed placeholder (`--hairline-frame`, the only dashed border in the
 * system) carrying an Instrument Serif 19px ITALIC verb, then a thin brown
 * progress bar (70% wide, 4px, 2px radius, `--border-faint` track), then an
 * 11.5px muted caption. The bar fill is the only brown in the panel — no
 * spinner, no illustration.
 *
 * Determinate when `progress` is passed (0–100); otherwise the fill sits at
 * the comp's 55% and pulses, and `aria-valuenow` is omitted, which is the
 * ARIA signal for an indeterminate progressbar.
 *
 * Spec: KOPI_2A_SPEC.md → "States" → Loading.
 */

import { cn } from '@/lib/utils';

interface DossierLoadingPanelProps {
  /** Serif italic verb, e.g. `"Generating report…"`. Write it as a verb phrase, not a noun. */
  verb: string;
  /** 11.5px muted line under the bar — say what is being waited on. */
  caption?: string;
  /** 0–100. Omit for an indeterminate bar. */
  progress?: number;
  className?: string;
  /** Forwarded as `data-testid` on the panel. */
  testId?: string;
}

export function DossierLoadingPanel({
  verb,
  caption,
  progress,
  className,
  testId,
}: DossierLoadingPanelProps) {
  const determinate = typeof progress === 'number' && Number.isFinite(progress);
  const fill = determinate ? Math.min(Math.max(progress, 0), 100) : 55;

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed border-[color:var(--hairline-frame)] bg-card p-[22px] text-center',
        className,
      )}
      data-testid={testId}
    >
      <p
        className="m-0 text-[19px] italic leading-tight text-foreground"
        style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
      >
        {verb}
      </p>
      <div
        role="progressbar"
        aria-label={verb}
        aria-valuemin={0}
        aria-valuemax={100}
        {...(determinate ? { 'aria-valuenow': fill } : {})}
        className="mx-auto mt-3 h-1 w-[70%] overflow-hidden rounded-[2px] bg-[color:var(--border-faint)]"
      >
        <div
          className={cn('h-full bg-primary transition-[width] duration-300', !determinate && 'animate-pulse')}
          style={{ width: `${fill}%` }}
        />
      </div>
      {caption && <p className="m-0 mt-2.5 text-[11.5px] text-muted-foreground">{caption}</p>}
    </div>
  );
}
