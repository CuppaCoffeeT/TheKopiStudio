/**
 * ErrorStateHero — the signature full-screen crash shape behind
 * `<ErrorState variant="hero">` (its default). Massive Instrument Serif code,
 * uppercase subhead, mono path chip, brown Retry + outline Report.
 *
 * DNA matches `src/pages/NotFound.tsx` — same fonts, spacing, aesthetic. Sized
 * for a whole viewport (`clamp(110px, 16vw, 180px)` of numeral), so it is only
 * correct where a whole viewport is what failed; `ErrorBoundary` is its adopter.
 * Anything rendering inside the app layout wants `variant="compact"` instead.
 *
 * Split out of `ErrorState` (2026-07-25) when the compact variant landed and
 * the pair stopped fitting under the LOC ceiling. `ErrorState` stays the only
 * import path adopters need.
 */

import { RefreshCw, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCT_NAME } from '@/lib/product';
import { Button } from './Button';

interface ErrorStateHeroProps {
  code: string;
  subhead: string;
  body: string;
  path?: string;
  requestId?: string;
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}

export function ErrorStateHero({
  code,
  subhead,
  body,
  path,
  requestId,
  onRetry,
  onReport,
  className,
}: ErrorStateHeroProps) {
  return (
    <div
      className={cn(
        'relative w-full py-12 px-6 flex flex-col items-center text-center',
        /* Transparent, not `bg-background`: this state renders BOTH page-level
           and INSIDE cards. Pinning page cream #F0E6D6 put a DARKER slab inside
           card cream #FAF6EE, inverting the raised-lighter ladder so the card
           broke open exactly when an error fired. Inheriting the host surface is
           right in both. */
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
            <span className="truncate max-w-[280px]" title={path}>
              {path}
            </span>
          )}
          {path && requestId && <span className="text-[color:var(--fg-dim)]">·</span>}
          {requestId && <span>{requestId}</span>}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            leadingIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        )}
        {onReport && (
          <Button
            variant="outline"
            size="md"
            onClick={onReport}
            leadingIcon={<Undo className="w-3.5 h-3.5" />}
          >
            Report
          </Button>
        )}
      </div>

      <div
        className="mt-9 text-xs text-[color:var(--fg-dim)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {PRODUCT_NAME} · error {code}
      </div>
    </div>
  );
}
