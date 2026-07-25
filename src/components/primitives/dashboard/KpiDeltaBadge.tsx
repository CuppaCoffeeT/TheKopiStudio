import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KpiDeltaBadge — signed delta chip rendered in KpiTile's label row.
 *
 * Spec: docs/99-refactor/_system/design/session-03-dashboard/export/appbase/project/dashboard/DashAtoms.jsx (KpiTile section)
 * Tokens: --delta-positive-bg/fg, --delta-negative-bg/fg.
 * Internal to KpiTile — not barrel-exported.
 */

export type KpiDeltaTone = 'positive' | 'negative' | 'neutral' | 'auto';

export interface KpiDelta {
  value: number;
  tone?: KpiDeltaTone;
  /** Suffix after the number (default '%'). Pass '' to omit. */
  suffix?: string;
}

function resolveTone(value: number, tone?: KpiDeltaTone): 'positive' | 'negative' | 'neutral' {
  if (tone && tone !== 'auto') return tone;
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

export function KpiDeltaBadge({ value, tone = 'auto', suffix = '%' }: KpiDelta) {
  const resolved = resolveTone(value, tone);
  const isPositive = resolved === 'positive';
  const isNegative = resolved === 'negative';
  return (
    <span
      className={cn(
        'inline-flex flex-shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium',
        isPositive && 'text-[color:var(--delta-positive-fg)] bg-[color:var(--delta-positive-bg)]',
        isNegative && 'text-[color:var(--delta-negative-fg)] bg-[color:var(--delta-negative-bg)]',
        // Neutral arm carries the same contrast budget as the tuned pairs above:
        // --fg-muted is 4.37:1 on the secondary tint (fails at 12px), dim ink is 6.79:1.
        !isPositive && !isNegative && 'text-[color:var(--fg-dim)] bg-secondary',
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
