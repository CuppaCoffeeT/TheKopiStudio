import { RefreshCw, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ErrorStateProps {
  /** Hero code/wordmark rendered giant in Geist Pixel Grid. "500", "404", "NETWORK", etc. */
  code?: string;
  /** Uppercase mono subheader, e.g. "SERVER ERROR". */
  subhead?: string;
  /** Roboto body paragraph explaining what happened. */
  body?: string;
  /** Failed path / request shown in Geist Mono chip with red × prefix. */
  path?: string;
  requestId?: string;
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}

/**
 * Baby-version of the AppBase 404 page. Massive Geist Pixel Grid code + mono path chip
 * + slate-800 Retry primary + ghost Report. Red-700 accent dot top-right.
 *
 * DNA matches `src/pages/NotFound.tsx` — same fonts, spacing, aesthetic.
 */
export function ErrorState({
  code = '500',
  subhead = 'Server error',
  body = "Something went wrong on our end. Your filters are preserved — try again in a moment, or send us a report if this persists.",
  path,
  requestId,
  onRetry,
  onReport,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'relative w-full py-12 px-6 flex flex-col items-center text-center',
        'bg-zinc-100 dark:bg-zinc-950',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* red-700 accent dot top-right */}
      <span
        aria-hidden
        className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-700 dark:bg-red-400"
      />

      <h1
        className="font-pixel-crisp font-pixel-display m-0 text-zinc-900 dark:text-zinc-50 select-none mb-4"
        style={{
          fontFamily: 'var(--font-pixel-display)',
          fontSize: 'clamp(110px, 16vw, 180px)',
          lineHeight: 0.82,
          letterSpacing: '-0.02em',
        }}
      >
        {code}
      </h1>

      <div
        className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {subhead}
      </div>

      <p className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-[420px] mb-4">
        {body}
      </p>

      {(path || requestId) && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border max-w-full mb-7 bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
        >
          <span className="text-red-700 dark:text-red-400 font-medium">×</span>
          {path && (
            <span
              className="truncate max-w-[280px]"
              title={path}
            >
              {path}
            </span>
          )}
          {path && requestId && <span className="text-zinc-400 dark:text-zinc-600">·</span>}
          {requestId && <span>{requestId}</span>}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="primary" size="md" onClick={onRetry} leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry
          </Button>
        )}
        {onReport && (
          <Button variant="outline" size="md" onClick={onReport} leadingIcon={<Undo className="w-3.5 h-3.5" />}>
            Report
          </Button>
        )}
      </div>

      <div
        className="mt-9 text-xs text-zinc-500 dark:text-zinc-400"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        AppBase · error {code}
      </div>
    </div>
  );
}
