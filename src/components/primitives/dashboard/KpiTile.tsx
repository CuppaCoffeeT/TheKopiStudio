import { forwardRef, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NumberTicker } from './NumberTicker';

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

export type KpiDeltaTone = 'positive' | 'negative' | 'neutral' | 'auto';

export interface KpiDelta {
  value: number;
  tone?: KpiDeltaTone;
  /** Suffix after the number (default '%'). Pass '' to omit. */
  suffix?: string;
}

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
  /** Shows red alert dot top-left. */
  alert?: boolean;
  /** Mobile-friendly reduced height. */
  compact?: boolean;
  /** Disable count-up animation (e.g. SSR / fast refresh). */
  animate?: boolean;
  /** Optional sparkline slot — usually <AreaChart> from charts primitives. */
  sparkline?: ReactNode;
  className?: string;
  onClick?: () => void;
  /** Forwarded as `data-testid` on the KpiTile root element. */
  testId?: string;
}

function resolveTone(value: number, tone?: KpiDeltaTone): 'positive' | 'negative' | 'neutral' {
  if (tone && tone !== 'auto') return tone;
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
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
    sparkline,
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
        'relative overflow-hidden border border-border bg-card shadow-[0_1px_2px_rgba(24,24,27,0.04),0_1px_0_rgba(24,24,27,0.02)]',
        compact ? 'px-4 py-[14px]' : 'p-5',
        interactive &&
          'cursor-pointer transition-all hover:shadow-sm hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]',
        className,
      )}
      style={{ borderRadius: 'var(--kpi-radius)' }}
    >
      {alert && (
        <span
          aria-hidden
          className="absolute top-3 left-3 h-1.5 w-1.5 rounded-full bg-primary"
          style={{ boxShadow: '0 0 0 3px #fef2f2' }}
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
        <span className="flex-1 min-w-0 truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
        {delta && <DeltaBadge {...delta} />}
      </div>

      {/* Row 2: value */}
      <div
        className={cn(
          'font-mono font-bold tracking-tight tabular-nums text-foreground leading-[1.05]',
          compact ? 'text-[22px]' : 'text-[32px] mb-1.5',
        )}
      >
        {prefix && (
          <span className="mr-1 font-medium text-muted-foreground">{prefix}</span>
        )}
        {animate ? (
          <NumberTicker value={value} decimalPlaces={decimals} format={formatValue} />
        ) : (
          formatValue(value)
        )}
        {suffix && (
          <span className="ml-0.5 font-medium text-muted-foreground">{suffix}</span>
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

function DeltaBadge({ value, tone = 'auto', suffix = '%' }: KpiDelta) {
  const resolved = resolveTone(value, tone);
  const isPositive = resolved === 'positive';
  const isNegative = resolved === 'negative';
  return (
    <span
      className={cn(
        'inline-flex flex-shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium',
        isPositive && 'text-[color:var(--delta-positive-fg)] bg-[color:var(--delta-positive-bg)]',
        isNegative && 'text-[color:var(--delta-negative-fg)] bg-[color:var(--delta-negative-bg)]',
        !isPositive && !isNegative && 'text-muted-foreground bg-secondary',
      )}
    >
      {isPositive && <ArrowUpRight className="h-3 w-3" />}
      {isNegative && <ArrowDownRight className="h-3 w-3" />}
      {value > 0 ? '+' : ''}
      {value}
      {suffix}
    </span>
  );
}
