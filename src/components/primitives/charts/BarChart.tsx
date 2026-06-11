import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';
import { AxisY, AxisX, GridLines } from './ChartShell';

/**
 * BarChart — grouped + stacked modes. Vertical bars with 200ms stagger-in motion.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 200ms bar stagger via CSS animation-delay = index * 40ms.
 */

export interface BarSeries {
  name: string;
  color: string;
  points: number[];
}

interface BarChartProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  width?: number;
  height?: number;
  series: BarSeries[];
  labels: Array<string | number>;
  mode?: 'grouped' | 'stacked';
  max?: number;
}

export const BarChart = forwardRef<HTMLDivElement, BarChartProps>(function BarChart(
  { width = 640, height = 220, series = [], labels = [], mode = 'grouped', max, className, ...props },
  ref
) {
  const uid = useId().replace(/:/g, '');
  const pad = { l: 40, r: 12, t: 10, b: 22 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  const n = labels.length;

  const groupW = W / Math.max(1, n);
  const barInner = 0.6;
  const groupInner = groupW * barInner;

  let yMax = max;
  if (!yMax) {
    if (mode === 'stacked') {
      yMax =
        Math.max(
          ...labels.map((_, j) => series.reduce((sum, s) => sum + s.points[j], 0))
        ) * 1.15;
    } else {
      yMax = Math.max(...series.flatMap((s) => s.points)) * 1.15;
    }
  }
  const py = (v: number) => (v / (yMax || 1)) * H;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    pos: p,
    value: Math.round((yMax || 1) * p),
  }));

  const formatY = (v: number | string) => {
    const num = typeof v === 'number' ? v : Number(v);
    if (num >= 1000) return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'k';
    return num;
  };

  return (
    <div
      ref={ref}
      className={cn('flex h-full w-full', className)}
      {...props}
    >
      <style>{`
        @keyframes bar-rise-${uid} {
          from { transform: scaleY(0); opacity: 0; }
          to { transform: scaleY(1); opacity: 1; }
        }
        .bar-seg-${uid} {
          transform-origin: bottom;
          animation: bar-rise-${uid} 200ms ease-out both;
        }
      `}</style>
      <AxisY ticks={ticks} width={pad.l} height={H} format={formatY} />
      <div className="relative flex-1" style={{ paddingTop: pad.t }}>
        <div className="relative" style={{ width: W, height: H }}>
          <GridLines count={4} height={H} />
          {labels.map((_, j) => {
            const gx = j * groupW + (groupW - groupInner) / 2;
            if (mode === 'stacked') {
              let running = 0;
              return (
                <div
                  key={j}
                  className="absolute"
                  style={{ left: gx, bottom: 0, width: groupInner, height: H }}
                >
                  {series.map((s, i) => {
                    const h = py(s.points[j]);
                    const bottom = running;
                    running += h;
                    return (
                      <div
                        key={i}
                        className={`bar-seg-${uid} absolute left-0 right-0`}
                        style={{
                          bottom,
                          height: Math.max(0, h - 1),
                          background: s.color,
                          borderTopLeftRadius: i === series.length - 1 ? 3 : 0,
                          borderTopRightRadius: i === series.length - 1 ? 3 : 0,
                          animationDelay: `${j * 40}ms`,
                        }}
                      />
                    );
                  })}
                </div>
              );
            }
            const barW = groupInner / Math.max(1, series.length) - 2;
            return (
              <div
                key={j}
                className="absolute flex"
                style={{ left: gx, bottom: 0, height: H, gap: 2 }}
              >
                {series.map((s, i) => {
                  const h = py(s.points[j]);
                  return (
                    <div
                      key={i}
                      className={`bar-seg-${uid} self-end`}
                      style={{
                        width: barW,
                        height: h,
                        background: s.color,
                        borderRadius: '3px 3px 0 0',
                        animationDelay: `${(j * series.length + i) * 40}ms`,
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        <AxisX ticks={labels} width={W} />
      </div>
    </div>
  );
});
