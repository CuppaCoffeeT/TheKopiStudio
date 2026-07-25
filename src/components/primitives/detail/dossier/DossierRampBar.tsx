/**
 * DossierRampBar — the detail panel's stacked composition bar.
 *
 * ONE brown ramp, four steps (`--chart-ramp-1..4`), assigned by SERIES ORDER
 * so a series keeps its step across renders. No sage, no terracotta, no
 * categorical hues — 2a keeps those semantic (status, deltas). 10px tall,
 * 5px radius, segments butted with no gap and no stroke; legend beneath at
 * 10px, 16px gaps, 11.5px `--fg-muted`.
 *
 * Contrast constraint: ramp steps 2–4 measure 3.08 / 2.15 / 1.47 on card
 * cream — decorative only. The bar is therefore `aria-hidden` and every
 * segment MUST carry its legend label; the underlying figures must also
 * appear as text (the `DossierStatGrid` above it in the comp).
 *
 * Non-positive totals render nothing — an empty 10px trough reads as a bug.
 *
 * Spec: KOPI_2A_SPEC.md → "Data-viz".
 */

import { cn } from '@/lib/utils';

const RAMP = [
  'var(--chart-ramp-1)',
  'var(--chart-ramp-2)',
  'var(--chart-ramp-3)',
  'var(--chart-ramp-4)',
];

export interface DossierRampSegment {
  label: string;
  /** Absolute magnitude; shares are computed from the total. Negatives are clamped to 0. */
  value: number;
}

interface DossierRampBarProps {
  segments: DossierRampSegment[];
  className?: string;
  /** Forwarded as `data-testid` on the wrapper. */
  testId?: string;
}

export function DossierRampBar({ segments, className, testId }: DossierRampBarProps) {
  const shares = segments.map((s) => (Number.isFinite(s.value) ? Math.max(s.value, 0) : 0));
  const total = shares.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return null;

  return (
    <div className={cn('mt-5', className)} data-testid={testId}>
      <div className="flex h-2.5 overflow-hidden rounded-[5px]" aria-hidden="true">
        {segments.map((segment, i) => (
          <div
            key={i}
            style={{
              width: `${(shares[i] / total) * 100}%`,
              background: RAMP[i % RAMP.length],
            }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted-foreground">
        {segments.map((segment, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ background: RAMP[i % RAMP.length] }}
            />
            {segment.label}
          </span>
        ))}
      </div>
    </div>
  );
}
