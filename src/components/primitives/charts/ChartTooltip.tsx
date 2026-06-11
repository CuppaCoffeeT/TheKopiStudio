import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * ChartTooltip — glass popover (zinc-10/80% + backdrop-blur). Title + key-value rows in Geist Mono.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 180px min width · 8px 2px dot · uppercase Geist Mono 10.5px title.
 */

export interface ChartTooltipRow {
  label: React.ReactNode;
  value: React.ReactNode;
  color: string;
}

interface ChartTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  rows: ChartTooltipRow[];
}

export const ChartTooltip = forwardRef<HTMLDivElement, ChartTooltipProps>(function ChartTooltip(
  { title, rows = [], className, style, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border shadow-2xl',
        'border-white/10 bg-zinc-900/90 text-zinc-50 backdrop-blur-md backdrop-saturate-150',
        'dark:bg-zinc-950/85',
        className
      )}
      style={{ minWidth: 180, padding: '10px 12px', fontFamily: 'var(--font-sans)', ...style }}
      {...props}
    >
      {title && (
        <div
          className="mb-1.5 text-[10.5px] uppercase tracking-wider text-zinc-400"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {title}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="flex-shrink-0 rounded-sm"
              style={{ width: 8, height: 8, background: r.color }}
            />
            <span className="flex-1 whitespace-nowrap text-[12px] text-zinc-200">
              {r.label}
            </span>
            <span
              className="text-[12px] font-medium tabular-nums text-zinc-50"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
