import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { chartSeriesColor } from './ChartShell';

/**
 * ChartTooltip — glass popover on the 2a tint surface (--surface-subtle at 96%
 * + backdrop-blur), hairline border, warm ink type. Title + key-value rows.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 180px min width · 8px 2px dot · uppercase 10.5px sans title.
 */

export interface ChartTooltipRow {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Optional — defaults to the monochrome brown ramp (CHART_SERIES_PALETTE in ChartShell) by row index. */
  color?: string;
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
        'rounded-lg border shadow-2xl backdrop-blur-md backdrop-saturate-150',
        className
      )}
      style={{
        minWidth: 180,
        padding: '10px 12px',
        fontFamily: 'var(--font-sans)',
        borderColor: 'var(--border-soft)',
        // Reads the token rather than restating #F3EDE3, so the glass follows
        // --surface-subtle if the tint is ever retuned.
        background: 'color-mix(in srgb, var(--surface-subtle) 96%, transparent)',
        color: 'var(--fg)',
        ...style,
      }}
      {...props}
    >
      {title && (
        // 10.5px on the tinted surface: --fg-muted only reaches 4.37:1 there
        // (fails AA), so the title takes --fg-dim = 6.79:1. Same trap as the
        // CommandPalette footer.
        <div
          className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--fg-dim)' }}
        >
          {title}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="flex-shrink-0 rounded-sm"
              style={{ width: 8, height: 8, background: r.color ?? chartSeriesColor(i) }}
            />
            <span className="flex-1 whitespace-nowrap text-[12px]" style={{ color: 'var(--fg-dim)' }}>
              {r.label}
            </span>
            <span
              className="text-[12px] font-medium tabular-nums"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg)' }}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
