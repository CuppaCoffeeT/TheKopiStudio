/**
 * ErrorState — two shapes, one API.
 *
 * `compact` (2a "Kopi House", KOPI_2A_SPEC → States → Error) is the shape for
 * anything rendering INSIDE the app layout: an Instrument Serif 20px *italic*
 * line tinted `--negative-text`, a 12.5px `--fg-dim` explanation, and at most
 * ONE quiet outline action. Same block `DataTableStates` ships, so a failed
 * table body and a failed panel read as one system. No numeral, no mono chip,
 * no red panel fill — 2a errors tint text, they never flood a card.
 *
 * `hero` is the signature full-screen crash page (see `ErrorStateHero`) —
 * sized for a whole viewport, wrong anywhere narrower. It stays the DEFAULT so
 * consumers that predate the compact variant keep their current rendering;
 * `ErrorBoundary` is the one deliberate adopter.
 *
 * The explanation is `--fg-dim`, not `--fg-muted`: these render on the page
 * cream too, where `#7d6b5b` measures 4.12:1 and fails AA.
 */

import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ErrorStateHero } from './ErrorStateHero';

export type ErrorStateVariant = 'hero' | 'compact';

interface ErrorStateProps {
  /** `compact` (2a in-layout error) or `hero` (full-screen crash). Default `hero`. */
  variant?: ErrorStateVariant;
  /** Hero only — code/wordmark rendered giant in Instrument Serif. "500", "404", "NETWORK". */
  code?: string;
  /** The headline. Hero renders an uppercase mono subhead; compact the serif line. */
  subhead?: string;
  /** Body paragraph explaining what happened. */
  body?: string;
  /** Hero only — failed path shown in a mono-stack chip with a terracotta × prefix. */
  path?: string;
  /** Hero only — request id, shown beside `path` in the same chip. */
  requestId?: string;
  onRetry?: () => void;
  onReport?: () => void;
  className?: string;
}

export function ErrorState({
  variant = 'hero',
  code = '500',
  subhead = 'Server error',
  body = "Something went wrong on our end. Your filters are preserved — try again in a moment, or send us a report if this persists.",
  path,
  requestId,
  onRetry,
  onReport,
  className,
}: ErrorStateProps) {
  if (variant === 'hero') {
    return (
      <ErrorStateHero
        code={code}
        subhead={subhead}
        body={body}
        path={path}
        requestId={requestId}
        onRetry={onRetry}
        onReport={onReport}
        className={className}
      />
    );
  }

  // 2a allows exactly one action, so Retry wins whenever it is offered and
  // Report only stands in for it. Rendering both would restate the state block
  // as a decision the reader does not have to make.
  const action = onRetry
    ? { label: 'Retry', onClick: onRetry }
    : onReport
      ? { label: 'Report', onClick: onReport }
      : null;

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center bg-transparent px-5 py-10 text-center',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      role="alert"
    >
      {/* Instrument Serif 20px italic — 20px clears the 18px serif floor. */}
      <p
        className="m-0 text-[20px] italic leading-tight text-[color:var(--negative-text)]"
        style={{ fontFamily: 'var(--font-pixel)', fontWeight: 400 }}
      >
        {subhead}
      </p>
      <p className="m-0 mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-[color:var(--fg-dim)]">
        {body}
      </p>
      {action && (
        <Button variant="outline" size="md" className="mt-3.5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
