import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * ChartShell — header (title · subtitle · legend slot · tools slot) · 280h canvas · footer slot.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: canvas height 280 default · header/footer dividers `border-border` · title = 2a section
 *         head, Instrument Serif (`--font-pixel`) 22px (the serif floor); subtitle/footer mono, rest sans.
 */

/**
 * 2a "Kopi House" chart palette (2026-07-25) — ONE brown ramp, 4 steps assigned by SERIES ORDER
 * (never by value) so a series keeps its step across renders. No gold, no categorical hues:
 * sage/terracotta stay semantic (positive/negative), never decoration. Steps 2–4 measure
 * 3.08 / 2.15 / 1.47 on card cream — decorative only, so every segment needs its legend label and
 * any colour-encoded figure must also appear as text. Values: `--chart-ramp-1..4` in src/index.css;
 * literals here are unstyled-case fallbacks only. */
export const CHART_SERIES_PALETTE = [
  'var(--chart-ramp-1, #8b6a47)', // brown — ramp anchor, primary series
  'var(--chart-ramp-2, #a58868)', // second series
  'var(--chart-ramp-3, #c0a68c)', // third series
  'var(--chart-ramp-4, #dccbb6)', // fourth series
] as const;

/** Series color by index — clamps to the last (faintest) brown step. */
export function chartSeriesColor(index: number): string {
  return CHART_SERIES_PALETTE[Math.min(Math.max(index, 0), CHART_SERIES_PALETTE.length - 1)];
}

interface ChartShellProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  legend?: React.ReactNode;
  tools?: React.ReactNode;
  height?: number;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export const ChartShell = forwardRef<HTMLDivElement, ChartShellProps>(function ChartShell(
  { title, subtitle, legend, tools, height = 280, footer, children, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        // 2a cards rest FLAT: lift = the cream-on-page colour step, not a shadow. Carries
        // `--card-shadow` (`none`), never a black `shadow-sm`.
        'overflow-hidden rounded-xl border shadow-[var(--card-shadow)]',
        'border-border bg-card',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-start gap-3.5 border-b px-4.5 py-3.5',
          'border-border'
        )}
        style={{ padding: '14px 18px' }}
      >
        <div className="min-w-0 flex-1">
          <div
            // Section head per KOPI_2A_SPEC — Instrument Serif 22px on warm ink, above the
            // 18px floor the brand serif may not go under.
            className="text-[22px] text-foreground"
            style={{ fontFamily: 'var(--font-pixel)' }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              className="mt-[3px] text-[11px] text-muted-foreground"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {subtitle}
            </div>
          )}
          {legend && <div className="mt-2.5">{legend}</div>}
        </div>
        {tools && (
          <div className="flex flex-shrink-0 items-center gap-1.5">{tools}</div>
        )}
      </div>

      {/* Canvas */}
      <div
        className="relative bg-card"
        style={{ height }}
      >
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div
          className={cn(
            'border-t text-[11px]',
            'border-border text-muted-foreground'
          )}
          style={{ padding: '10px 18px', fontFamily: 'var(--font-mono)' }}
        >
          {footer}
        </div>
      )}
    </div>
  );
});

// ─── Helpers — AxisY / AxisX / GridLines (AreaChart + BarChart); inlined per spec so chart files import them from here ───

export interface AxisTick {
  pos: number; // 0..1
  value: number;
}

interface AxisYProps {
  ticks: AxisTick[];
  width?: number;
  height: number;
  format?: (v: number) => string | number;
}

export function AxisY({ ticks, width = 40, height, format = (v) => v }: AxisYProps) {
  return (
    <div className="relative flex-shrink-0" style={{ width, height }}>
      {ticks.map((t, i) => {
        const y = height - t.pos * height;
        return (
          <span
            key={i}
            className="absolute text-[10px] tabular-nums text-muted-foreground"
            style={{ top: y - 7, right: 6, fontFamily: 'var(--font-mono)' }}
          >
            {format(t.value)}
          </span>
        );
      })}
    </div>
  );
}

interface AxisXProps {
  ticks: Array<string | number>;
  width?: number;
  format?: (v: string | number) => string | number;
}

export function AxisX({ ticks, width = 640, format = (v) => v }: AxisXProps) {
  return (
    <div
      className="relative mt-1 flex justify-between"
      style={{ width, height: 22 }}
    >
      {ticks.map((t, i) => (
        <span
          key={i}
          className="text-[10px] tabular-nums text-muted-foreground"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {format(t)}
        </span>
      ))}
    </div>
  );
}

interface GridLinesProps {
  count?: number;
  height: number;
}

export function GridLines({ count = 4, height }: GridLinesProps) {
  return (
    <>
      {Array.from({ length: count + 1 }).map((_, i) => {
        const y = (i / count) * height;
        return (
          <span
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: y,
              height: 0,
              borderTop: '1px dashed var(--border-soft)',
            }}
          />
        );
      })}
    </>
  );
}
