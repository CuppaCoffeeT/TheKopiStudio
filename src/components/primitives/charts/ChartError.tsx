import { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChartError — 503-style inline message with accent circle icon + Retry button.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/ChartPrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/charts/ChartPrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: accent red-700 (light) / red-400 (dark) icon circle · "Error <code> · chart service unreachable" sub-line.
 */

interface ChartErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  code?: string;
  onRetry?: () => void;
}

export const ChartError = forwardRef<HTMLDivElement, ChartErrorProps>(function ChartError(
  { message = 'Failed to load chart data.', code = '503', onRetry, className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        'flex h-full flex-col items-center justify-center gap-2.5 text-center',
        className
      )}
      style={{ padding: '32px 20px' }}
      {...props}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-400'
        )}
        style={{ width: 36, height: 36 }}
      >
        <AlertCircle size={18} strokeWidth={1.6} />
      </span>
      <div className="text-[14px] font-medium text-zinc-900 dark:text-zinc-50">
        {message}
      </div>
      <div
        className="text-[11px] text-zinc-500 dark:text-zinc-400"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Error {code} · chart service unreachable
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={cn(
          'mt-1.5 inline-flex items-center rounded-md border bg-transparent text-[12px] font-medium',
          'border-zinc-300 text-zinc-700 hover:bg-zinc-50',
          'dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900',
          'disabled:cursor-not-allowed disabled:opacity-40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950'
        )}
        style={{ height: 30, padding: '0 14px' }}
      >
        Retry
      </button>
    </div>
  );
});
