/**
 * Badge — static label pill (status / count / outline variants).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-MUmgnpT1/project/preview/component-badges.html
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked status formula (Kopi 2a, 2026-07-25): every tone reads its bg / fg /
 * border / dot straight off the `--status-*` token family in index.css, so the
 * six tones stay inside the cream-brown-sage-terracotta system.
 * Tone → token set: neutral → expired · success → accepted (sage) ·
 * warning → sent (brown) · danger → rejected (terracotta) · info → draft ·
 * accent → revised (deep brown).
 * Counts are mono, 10.5px, tabular. Critical counts (≥10 or `critical`) use the
 * solid terracotta `--cta-destructive-bg` fill with a cream label.
 * Status badges expose `data-tone` so E2E specs can assert the semantic tone
 * (e.g. the CRM follow-up badge turning brown) without coupling to classes.
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
  /** Count badges only — if true, forces the solid terracotta fill regardless of tone. */
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
  neutral: 'bg-[color:var(--status-expired-bg)] text-[color:var(--status-expired-fg)] border-[color:var(--status-expired-border)]',
  success: 'bg-[color:var(--status-accepted-bg)] text-[color:var(--status-accepted-fg)] border-[color:var(--status-accepted-border)]',
  warning: 'bg-[color:var(--status-sent-bg)] text-[color:var(--status-sent-fg)] border-[color:var(--status-sent-border)]',
  danger: 'bg-[color:var(--status-rejected-bg)] text-[color:var(--status-rejected-fg)] border-[color:var(--status-rejected-border)]',
  info: 'bg-[color:var(--status-draft-bg)] text-[color:var(--status-draft-fg)] border-[color:var(--status-draft-border)]',
  accent: 'bg-[color:var(--status-revised-bg)] text-[color:var(--status-revised-fg)] border-[color:var(--status-revised-border)]',
};

const DOT_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-[color:var(--status-expired-dot)]',
  success: 'bg-[color:var(--status-accepted-dot)]',
  warning: 'bg-[color:var(--status-sent-dot)]',
  danger: 'bg-[color:var(--status-rejected-dot)]',
  info: 'bg-[color:var(--status-draft-dot)]',
  accent: 'bg-[color:var(--status-revised-dot)]',
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
            ? 'bg-[color:var(--cta-destructive-bg)] text-[color:var(--cta-primary-fg)]'
            : 'bg-secondary text-[color:var(--fg-dim)]',
          className,
        )}
        style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}
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
          'bg-transparent border border-border text-[color:var(--fg-dim)]',
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
      data-tone={tone}
    >
      {dot && <span className={cn('w-[5px] h-[5px] rounded-full flex-shrink-0', DOT_TONE[tone])} />}
      <span className="inline-flex flex-row flex-nowrap items-center gap-1.5 min-w-0">{children}</span>
    </span>
  );
});
