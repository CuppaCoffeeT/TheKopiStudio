import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * ChartLoading — shimmer bars matching chart type (area | bar | hbar).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 1.6s linear shimmer · centered Geist Mono 11px "Loading data…" footer.
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
        .shim-light-${uid} {
          background: linear-gradient(90deg, #ececee 0%, #f6f6f7 50%, #ececee 100%);
          background-size: 200% 100%;
          animation: shim-${uid} 1.6s linear infinite;
        }
        .dark .shim-${uid} {
          background: linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%);
          background-size: 200% 100%;
          animation: shim-${uid} 1.6s linear infinite;
        }
      `}</style>

      {kind === 'bar' || kind === 'hbar' ? (
        <div className="flex flex-1 flex-col justify-center gap-2.5">
          {ROW_WIDTHS.map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span
                className={`shim-light-${uid} shim-${uid} rounded-full`}
                style={{ width: 22, height: 22 }}
              />
              <span
                className={`shim-light-${uid} shim-${uid} rounded`}
                style={{ width: 140, height: 10 }}
              />
              <span
                className={`shim-light-${uid} shim-${uid} h-3.5 rounded`}
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
              <linearGradient id={`sk-grad-light-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ececee">
                  <animate attributeName="offset" values="-1;1" dur="1.6s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#f6f6f7">
                  <animate attributeName="offset" values="-0.5;1.5" dur="1.6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#ececee">
                  <animate attributeName="offset" values="0;2" dur="1.6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
              <linearGradient id={`sk-grad-dark-${uid}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#18181b">
                  <animate attributeName="offset" values="-1;1" dur="1.6s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor="#27272a">
                  <animate attributeName="offset" values="-0.5;1.5" dur="1.6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor="#18181b">
                  <animate attributeName="offset" values="0;2" dur="1.6s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>
            <path
              d="M0,160 Q100,100 200,120 T400,80 T600,110 L600,200 L0,200 Z"
              fill={`url(#sk-grad-light-${uid})`}
              className="dark:hidden"
            />
            <path
              d="M0,160 Q100,100 200,120 T400,80 T600,110 L600,200 L0,200 Z"
              fill={`url(#sk-grad-dark-${uid})`}
              className="hidden dark:block"
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
