import { forwardRef, type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberTicker } from './NumberTicker';
import { KpiDeltaBadge, type KpiDelta } from './KpiDeltaBadge';

/**
 * KpiTile — dashboard metric tile with value, delta, optional icon / subtitle / sparkline.
 *
 * Spec: docs/99-refactor/_system/design/session-03-dashboard/export/appbase/project/dashboard/DashAtoms.jsx (KpiTile section)
 * Locked: Tremor card shape + Magic UI NumberTicker (LOCKED_PICKS v1 KpiTile, 2026-04-19).
 * Tokens: --kpi-radius, --delta-positive-bg/fg, --delta-negative-bg/fg, ticker spring (100/60).
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Usage:
 *   <KpiTile label="Active projects" value={127} delta={{ value: 12 }} icon={Briefcase} />
 *   <KpiTile label="Revenue" value={487300} prefix="$" delta={{ value: -3.2 }} subtitle="vs last month" />
 *   <KpiTile label="Open issues" value={4} alert variant="alert" />
 *   <KpiTile compact label="Hours" value={42.5} decimals={1} suffix="h" />
 */

export type { KpiDelta, KpiDeltaTone } from './KpiDeltaBadge';

interface KpiTileProps {
  label: string;
  value: number;
  /** Prepended to value (e.g. '$' for currency). */
  prefix?: string;
  /** Appended to value (e.g. 'h', 'pts'). */
  suffix?: string;
  decimals?: number;
  delta?: KpiDelta;
  subtitle?: string;
  icon?: LucideIcon;
  /** Shows terracotta alert dot top-left. */
  alert?: boolean;
  /** Mobile-friendly reduced height. */
  compact?: boolean;
  /** Disable count-up animation (e.g. SSR / fast refresh). */
  animate?: boolean;
  /** Hide the figure behind the privacy run; label + subtitle stay readable.
   *  A prop, not a masked STRING as `value`: the tile owns its formatting,
   *  count-up and tabular alignment, and a caller passing "******" loses all
   *  three. */
  masked?: boolean;
  /** Optional sparkline slot — usually <AreaChart> from charts primitives. */
  sparkline?: ReactNode;
  /** Optional corner index numeral (e.g. "01") — Instrument Serif 18px raw brown, per the 2a spec. */
  index?: string;
  className?: string;
  onClick?: () => void;
  /** Forwarded as `data-testid` on the KpiTile root element. */
  testId?: string;
}

export const KpiTile = forwardRef<HTMLDivElement, KpiTileProps>(function KpiTile(
  {
    label,
    value,
    prefix,
    suffix,
    decimals = 0,
    delta,
    subtitle,
    icon: Icon,
    alert = false,
    compact = false,
    animate = true,
    masked = false,
    sparkline,
    index,
    className,
    onClick,
    testId,
  },
  ref,
) {
  const interactive = typeof onClick === 'function';
  const formatValue = (n: number) =>
    decimals > 0
      ? n.toLocaleString('en-SG', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(n).toLocaleString('en-SG');

  return (
    <div
      ref={ref}
      onClick={onClick}
      data-testid={testId}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        // 2a cards rest FLAT — the lift is the cream-card-on-cream-page colour
        // step, not a shadow. Only interactive tiles cast one, and only on hover.
        'relative overflow-hidden border border-border bg-card shadow-[var(--card-shadow-rest)]',
        compact ? 'px-4 py-[14px]' : 'p-5',
        interactive &&
          'cursor-pointer transition-all hover:shadow-[var(--card-shadow-hover)] hover:border-[color:var(--border-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]',
        className,
      )}
      style={{ borderRadius: 'var(--kpi-radius)' }}
    >
      {alert && (
        <span
          aria-hidden
          className="absolute top-3 left-3 h-1.5 w-1.5 rounded-full"
          style={{ background: 'var(--delta-negative-fg)' }}
        />
      )}

      {/* Row 1: icon + label + delta */}
      <div
        className={cn(
          'flex items-center gap-2 min-w-0',
          compact ? 'mb-1.5' : 'mb-2.5',
          alert && 'pl-3',
        )}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
        <span className="flex-1 min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--fg-dim)]">
          {label}
        </span>
        {delta && <KpiDeltaBadge {...delta} />}
        {index && (
          <span
            aria-hidden
            // 18px is the Instrument Serif floor; the index numeral sits exactly
            // on it, which is also where the spec sanctions the RAW brown.
            className="flex-shrink-0 text-[18px] leading-none"
            style={{ fontFamily: 'var(--font-pixel)', color: 'var(--brand-brown)' }}
          >
            {index}
          </span>
        )}
      </div>

      {/* Row 2: value */}
      <div
        className={cn(
          'tabular-nums leading-[1.05]',
          compact ? 'text-[22px]' : 'text-[32px] mb-1.5',
        )}
        style={{ fontFamily: 'var(--font-pixel)', color: 'var(--fg)' }}
      >
        {/* Prefix / suffix units pin themselves to the sans face: at 14px they sit
            under the 18px Instrument Serif floor, so they must not inherit the
            parent numeral's serif. */}
        {prefix && !masked && (
          <span
            className="mr-1 text-[14px]"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--fg-dim)' }}
          >
            {prefix}
          </span>
        )}
        {/* The prefix goes too: "$******" still says "this is money". */}
        {masked ? (
          <span style={{ color: 'var(--fg-dim)', letterSpacing: '0.08em' }}>******</span>
        ) : animate ? (
          <NumberTicker value={value} decimalPlaces={decimals} format={formatValue} />
        ) : (
          formatValue(value)
        )}
        {suffix && !masked && (
          <span
            className="ml-1 text-[14px]"
            style={{ fontFamily: 'var(--font-sans)', color: 'var(--fg-dim)' }}
          >
            {suffix}
          </span>
        )}
      </div>

      {/* Row 3: subtitle */}
      {!compact && subtitle && (
        <div className={cn('text-xs text-muted-foreground', sparkline && 'mb-2')}>
          {subtitle}
        </div>
      )}

      {/* Row 4: sparkline slot */}
      {!compact && sparkline && <div className="mt-2 -mx-1">{sparkline}</div>}
    </div>
  );
});
