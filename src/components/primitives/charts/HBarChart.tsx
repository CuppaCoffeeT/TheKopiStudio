import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { chartSeriesColor } from './ChartShell';

/**
 * HBarChart — horizontal bar chart. Avatar prefix per row · ranked lists / engineer workload.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 22px avatar · 140px label · 56px trailing value cell · mono-stack (--font-mono) tabular values.
 */

export interface HBarRow {
  label: React.ReactNode;
  avatar?: React.ReactNode;
  value: number;
  color?: string;
}

interface HBarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  rows: HBarRow[];
  valueFormat?: (v: number) => React.ReactNode;
  max?: number;
}

export const HBarChart = forwardRef<HTMLDivElement, HBarChartProps>(function HBarChart(
  { rows = [], valueFormat = (v) => v, max, className, ...props },
  ref
) {
  const m = max || Math.max(...rows.map((r) => r.value), 1);
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2.5', className)}
      style={{ padding: '10px 18px 16px' }}
      {...props}
    >
      {rows.map((r, i) => {
        const pct = (r.value / m) * 100;
        return (
          <div key={i} className="flex items-center gap-2.5">
            {r.avatar && (
              <span
                className={cn(
                  'inline-flex flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                  'bg-secondary text-[color:var(--fg-dim)]'
                )}
                style={{ width: 22, height: 22, fontFamily: 'var(--font-mono)' }}
              >
                {r.avatar}
              </span>
            )}
            <span
              className="flex-shrink-0 truncate text-[13px] text-foreground"
              style={{ width: 140 }}
            >
              {r.label}
            </span>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-secondary">
              <div
                className="absolute inset-y-0 left-0 rounded"
                style={{
                  width: `${pct}%`,
                  background: r.color || chartSeriesColor(0),
                }}
              />
            </div>
            <span
              className="flex-shrink-0 text-right text-[12px] tabular-nums text-muted-foreground"
              style={{ width: 56, fontFamily: 'var(--font-mono)' }}
            >
              {valueFormat(r.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
});
