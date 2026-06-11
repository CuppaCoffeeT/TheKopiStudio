/**
 * Badge — static label pill (status / count / outline variants).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-badges.html
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked status formula: 50-tint bg · 700-sat fg · 200-same-hue border · 5px fg-hue dot.
 * Counts are mono, 10.5px, tabular. Critical counts (≥10 or `critical`) use red-7 solid fill.
 * Tones: neutral (zinc) · success (emerald) · warning (amber) · danger (red) · info (blue) · accent (purple).
 *
 * Replaces shadcn `@/components/ui/badge` in new code. For interactive chips
 * (toggle/tab), use the Chip primitive instead.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
/** `status`/`count`/`outline` are canonical. `secondary`/`destructive`/`default` are shadcn-compat aliases so legacy adopters can swap imports without touching props. */
export type BadgeVariant = 'status' | 'count' | 'outline' | 'secondary' | 'destructive' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** Count badges only — if true, forces red-7 solid fill regardless of tone. */
  critical?: boolean;
  /** Show the leading dot for `variant='status'`. Default: true. */
  dot?: boolean;
}

function normalizeVariant(variant: BadgeVariant, tone: BadgeTone): { kind: 'status' | 'count' | 'outline'; tone: BadgeTone; dot: boolean } {
  if (variant === 'destructive') return { kind: 'status', tone: 'danger', dot: false };
  if (variant === 'secondary' || variant === 'default') return { kind: 'status', tone, dot: false };
  return { kind: variant, tone, dot: true };
}

const STATUS_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
  success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
  warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40',
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40',
  accent: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40',
};

const DOT_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-zinc-400 dark:bg-zinc-500',
  success: 'bg-emerald-600 dark:bg-emerald-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
  danger: 'bg-red-700 dark:bg-red-400',
  info: 'bg-blue-600 dark:bg-blue-400',
  accent: 'bg-purple-600 dark:bg-purple-400',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone: toneProp = 'neutral', variant: variantProp = 'status', critical = false, dot: dotProp = true, className, children, ...props },
  ref,
) {
  const normalized = normalizeVariant(variantProp, toneProp);
  const variant = normalized.kind;
  const tone = normalized.tone;
  const dot = dotProp && normalized.dot;

  if (variant === 'count') {
    const isCritical = critical || (typeof children === 'number' && children >= 10);
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-full',
          'text-[10.5px] font-semibold tabular-nums',
          isCritical
            ? 'bg-red-700 text-white'
            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200',
          className,
        )}
        style={{ fontFamily: 'var(--font-mono)' }}
        {...props}
      >
        {children}
      </span>
    );
  }

  if (variant === 'outline') {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex flex-row flex-nowrap items-center gap-1.5 px-2 py-0.5 rounded-full whitespace-nowrap',
          'text-[11px] font-medium',
          'bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        {...props}
      >
        {children}
      </span>
    );
  }

  // status
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex flex-row flex-nowrap items-center gap-1.5 pl-[7px] pr-2 py-[3px] rounded-full whitespace-nowrap',
        'text-[11px] font-medium border',
        STATUS_TONE[tone],
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {dot && <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', DOT_TONE[tone])} />}
      <span className="inline-flex flex-row flex-nowrap items-center gap-1.5 min-w-0">{children}</span>
    </span>
  );
});
