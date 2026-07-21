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
        'bg-background',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* error accent dot top-right — 1a gold discipline: never gold on error surfaces */}
      <span
        aria-hidden
        className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#E8836F]"
      />

      <h1
        className="font-pixel-crisp font-pixel-display m-0 text-foreground select-none mb-4"
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
        className="text-xs uppercase tracking-[0.2em] text-[#E8836F] mb-2"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {subhead}
      </div>

      <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[420px] mb-4">
        {body}
      </p>

      {(path || requestId) && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border max-w-full mb-7 bg-[rgba(192,57,43,.15)] border-[rgba(192,57,43,.35)] text-[color:var(--fg-dim)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
        >
          <span className="text-[#E8836F] font-medium">×</span>
          {path && (
            <span
              className="truncate max-w-[280px]"
              title={path}
            >
              {path}
            </span>
          )}
          {path && requestId && <span className="text-muted-foreground">·</span>}
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
        className="mt-9 text-xs text-muted-foreground"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        AppBase · error {code}
      </div>
    </div>
  );
}
