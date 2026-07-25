import { RefreshCw, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ErrorStateProps {
  /** Hero code/wordmark rendered giant in Instrument Serif. "500", "404", "NETWORK", etc. */
  code?: string;
  /** Uppercase mono subheader, e.g. "SERVER ERROR". */
  subhead?: string;
  /** Body paragraph explaining what happened. */
  body?: string;
  /** Failed path / request shown in a mono-stack (--font-mono) chip with a terracotta × prefix. */
  path?: string;
  requestId?: string;
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}

/**
 * Baby-version of the AppBase 404 page. Massive Instrument Serif code + mono path chip
 * + brown Retry primary + outline Report. Terracotta accent dot top-right.
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
        /* Transparent, not `bg-background`: this state renders BOTH page-level
           (ClientDetailPage, DashboardHomePage, CrmDashboardPage,
           PortfolioReportPage, ClientReportPage, ResultDetailPage,
           ErrorBoundary — all already painting page cream) and INSIDE cards
           (ListSection, OverviewTab, DashboardHomePage's client list). Pinning
           page cream #F0E6D6 put a DARKER slab inside card cream #FAF6EE,
           inverting the raised-lighter ladder so the card broke open exactly
           when an error fired. Inheriting the host surface is right in both. */
        'bg-transparent',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* error accent dot top-right — brown is never used on error surfaces */}
      <span
        aria-hidden
        className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[color:var(--brand-terracotta)]"
      />

      <h1
        className="font-pixel-display m-0 text-foreground select-none mb-4"
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
        className="text-xs uppercase tracking-[0.2em] text-[color:var(--negative-text)] mb-2"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {subhead}
      </div>

      <p className="text-[15px] text-[color:var(--fg-dim)] leading-relaxed max-w-[420px] mb-4">
        {body}
      </p>

      {(path || requestId) && (
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border max-w-full mb-7 bg-[color:var(--red-soft)] border-[color:var(--status-rejected-border)] text-[color:var(--fg-dim)]"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
        >
          <span className="text-[color:var(--negative-text)] font-medium">×</span>
          {path && (
            <span
              className="truncate max-w-[280px]"
              title={path}
            >
              {path}
            </span>
          )}
          {path && requestId && <span className="text-[color:var(--fg-dim)]">·</span>}
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
        className="mt-9 text-xs text-[color:var(--fg-dim)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Insurance CRM · error {code}
      </div>
    </div>
  );
}
