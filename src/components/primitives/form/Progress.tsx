import { cn } from '@/lib/utils';

/**
 * Progress — linear bar, determinate + indeterminate, tones neutral/success/error/active.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/FormPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/form/FormPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: indeterminate anim runs via Tailwind; neutral = slate-800; active = red-700.
 */

export type ProgressTone = 'neutral' | 'active' | 'success' | 'error';
export type ProgressSize = 'sm' | 'md';

interface ProgressProps {
  tone?: ProgressTone;
  size?: ProgressSize;
  value?: number;
  max?: number;
  indeterminate?: boolean;
  label?: React.ReactNode;
  /** Accessible name for the progressbar role. Required when `label` is omitted or non-string; otherwise auto-derived from the visible label. */
  'aria-label'?: string;
  className?: string;
}

export function Progress({
  tone = 'neutral',
  size = 'md',
  value = 0,
  max = 100,
  indeterminate = false,
  label,
  'aria-label': ariaLabel,
  className,
}: ProgressProps) {
  const h = size === 'sm' ? 'h-1' : 'h-2';
  const pct = Math.min(100, (value / max) * 100);

  const fillClass = {
    neutral: 'bg-slate-800 dark:bg-slate-100',
    active: 'bg-primary',
    success: 'bg-green-700 dark:bg-green-400',
    error: 'bg-red-700 dark:bg-red-400',
  }[tone];

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      {label && (
        <div className="flex items-center gap-2">
          <span
            className="uppercase text-muted-foreground"
            style={{ fontFamily: 'var(--font-pixel)', fontSize: 11, letterSpacing: '0.08em' }}
          >
            {label}
          </span>
          <div className="flex-1" />
          {!indeterminate && (
            <span
              className="tabular-nums text-muted-foreground"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
            >
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden relative',
          h,
          'bg-secondary'
        )}
        role="progressbar"
        aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
        aria-valuenow={indeterminate ? undefined : Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {indeterminate ? (
          <span
            className={cn(
              'absolute inset-y-0 rounded-full',
              fillClass,
              'w-2/5 animate-[progress-indet_1.6s_ease-in-out_infinite]'
            )}
          />
        ) : (
          <span
            className={cn('block h-full rounded-full transition-[width] duration-[400ms]', fillClass)}
            style={{ width: `${pct}%`, transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
          />
        )}
      </div>
      <style>{`
        @keyframes progress-indet {
          0%   { left: -40%; }
          50%  { left: 60%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
