import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * ChartLoading — shimmer bars matching chart type (area | bar | hbar).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 1.6s linear shimmer · centered mono-stack (--font-mono) 11px "Loading data…" footer.
 *
 * 2a: the shimmer rides the warm skeleton pair — `--skeleton` (#E0D3C3, the same
 * hairline the table rows repeat on) sweeping through `--skeleton-hi` (#F3EDE3,
 * the tint). The app is light-pinned, so there is no second gradient to swap to.
 */

type ChartKind = 'area' | 'bar' | 'hbar';

interface ChartLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  kind?: ChartKind;
  height?: number;
}

const ROW_WIDTHS = [70, 55, 80, 40, 60];

export const ChartLoading = forwardRef<HTMLDivElement, ChartLoadingProps>(function ChartLoading(
  { kind = 'area', height = 260, className, ...props },
  ref
) {
  const uid = useId().replace(/:/g, '');
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2.5', className)}
      style={{ height, padding: '16px 18px' }}
      {...props}
    >
      <style>{`
        @keyframes shim-${uid} {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shim-${uid} {
          background: linear-gradient(
            90deg,
            var(--skeleton) 0%,
            var(--skeleton-hi) 50%,
            var(--skeleton) 100%
          );
          background-size: 200% 100%;
          animation: shim-${uid} 1.6s linear infinite;
        }
      `}</style>

      {kind === 'bar' || kind === 'hbar' ? (
        <div className="flex flex-1 flex-col justify-center gap-2.5">
          {ROW_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span
                className={`shim-${uid} rounded-full`}
                style={{ width: 22, height: 22 }}
              />
              <span
                className={`shim-${uid} rounded`}
                style={{ width: 140, height: 10 }}
              />
              <span
                className={`shim-${uid} h-3.5 rounded`}
                style={{ width: `${w}%`, maxWidth: `${w}%` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative flex-1">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id={`sk-grad-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--skeleton)">
                  <animate attributeName="offset" values="-1;1" dur="1.6s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="var(--skeleton-hi)">
                  <animate attributeName="offset" values="-0.5;1.5" dur="1.6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="var(--skeleton)">
                  <animate attributeName="offset" values="0;2" dur="1.6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            <path
              d="M0,160 Q100,100 200,120 T400,80 T600,110 L600,200 L0,200 Z"
              fill={`url(#sk-grad-${uid})`}
            />
          </svg>
        </div>
      )}

      <div
        className="text-center text-[11px] text-muted-foreground"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Loading data…
      </div>
    </div>
  );
});
