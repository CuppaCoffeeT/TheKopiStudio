import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { AxisY, AxisX, GridLines, chartSeriesColor } from './ChartShell';

/**
 * AreaChart — stacked + single-series modes. SVG area + line path.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 600ms path-draw motion via CSS keyframes inside the SVG.
 *         Grid: dashed --border-soft hairlines; mono-stack (--font-mono) 11px axis labels.
 */

export interface AreaSeries {
  name: string;
  /** Optional — defaults to the monochrome brown ramp (CHART_SERIES_PALETTE in ChartShell) by series index. */
  color?: string;
  points: number[];
}

interface AreaChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  width?: number;
  height?: number;
  series: AreaSeries[];
  labels: Array<string | number>;
  stacked?: boolean;
  max?: number;
}

export const AreaChart = forwardRef<HTMLDivElement, AreaChartProps>(function AreaChart(
  { width = 640, height = 220, series = [], labels = [], stacked = false, max, className, ...props },
  ref
) {
  const uid = useId().replace(/:/g, '');
  const pad = { l: 40, r: 12, t: 10, b: 22 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const n = labels.length;

  const stackedPoints: number[][] = [];
  series.forEach((s, i) => {
    if (!stacked || i === 0) {
      stackedPoints.push(s.points.slice());
    } else {
      const prev = stackedPoints[i - 1];
      stackedPoints.push(s.points.map((v, j) => v + prev[j]));
    }
  });

  const allVals = stacked
    ? stackedPoints[stackedPoints.length - 1] || [0]
    : series.flatMap((s) => s.points);
  const yMax = max || Math.max(...allVals, 1) * 1.1;

  const px = (i: number) => (n > 1 ? (i / (n - 1)) * W : 0);
  const py = (v: number) => H - (v / yMax) * H;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    pos: p,
    value: Math.round(yMax * p),
  }));

  const xTicks = labels.filter(
    (_, i) => i % Math.max(1, Math.ceil(n / 6)) === 0 || i === n - 1
  );

  const formatY = (v: number | string) => {
    const num = typeof v === 'number' ? v : Number(v);
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'k';
    return num;
  };

  return (
    <div
      ref={ref}
      className={cn('flex h-full w-full', className)}
      style={{ position: 'relative' }}
      {...props}
    >
      <AxisY ticks={ticks} width={pad.l} height={H} format={formatY} />
      <div className="relative flex-1" style={{ paddingTop: pad.t }}>
        <div className="relative" style={{ width: W, height: H }}>
          <GridLines count={4} height={H} />
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="absolute inset-0 overflow-visible"
          >
            <style>{`
              @keyframes area-draw-${uid} {
                from { stroke-dashoffset: var(--len); opacity: 0; }
                to { stroke-dashoffset: 0; opacity: 1; }
              }
              @keyframes area-fade-${uid} {
                from { opacity: 0; }
                to { opacity: var(--to); }
              }
              .area-line-${uid} {
                stroke-dasharray: 2000;
                --len: 2000;
                animation: area-draw-${uid} 600ms ease-out forwards;
              }
              .area-fill-${uid} {
                animation: area-fade-${uid} 600ms ease-out forwards;
              }
            `}</style>
            {/* Areas */}
            {series.map((s, idx) => {
              const pts = stackedPoints[idx];
              const prev = stacked && idx > 0 ? stackedPoints[idx - 1] : null;
              const top = pts.map((v, i) => `${px(i)},${py(v)}`).join(' L ');
              const bot = prev
                ? prev.map((v, i) => `${px(i)},${py(v)}`).reverse().join(' L ')
                : `${px(n - 1)},${H} L 0,${H}`;
              const toOp = stacked ? 0.85 : 0.15;
              return (
                <path
                  key={`f-${idx}`}
                  d={`M ${top} L ${bot} Z`}
                  fill={s.color ?? chartSeriesColor(idx)}
                  className={`area-fill-${uid}`}
                  style={{ ['--to' as string]: toOp } as React.CSSProperties}
                />
              );
            })}
            {/* Lines */}
            {series.map((s, idx) => {
              const pts = stackedPoints[idx];
              const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)},${py(v)}`).join(' ');
              return (
                <path
                  key={`l-${idx}`}
                  d={d}
                  fill="none"
                  stroke={s.color ?? chartSeriesColor(idx)}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`area-line-${uid}`}
                />
              );
            })}
            {/* Last-point dots */}
            {series.map((s, idx) => {
              const pts = stackedPoints[idx];
              const v = pts[pts.length - 1];
              return (
                <circle
                  key={`d-${idx}`}
                  cx={px(n - 1)}
                  cy={py(v)}
                  r={3}
                  fill={s.color ?? chartSeriesColor(idx)}
                  className={`area-fill-${uid}`}
                  style={{ ['--to' as string]: 1 } as React.CSSProperties}
                />
              );
            })}
          </svg>
        </div>
        <AxisX ticks={xTicks} width={W} />
      </div>
    </div>
  );
});
