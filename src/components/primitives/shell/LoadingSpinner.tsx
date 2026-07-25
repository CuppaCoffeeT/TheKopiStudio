/**
 * LoadingSpinner — brown ring spinner.
 *
 * 2026-07-07 de-AppBase: replaced the JL logo-mark Lottie animation with a
 * plain CSS ring spinner in the brand accent (--primary). No external animation
 * data, no company logo. Respects `prefers-reduced-motion` (motion-reduce).
 *
 * 2026-07-25 (Kopi Studio 2a): when a `label` is passed, renders the 2a loading
 * state instead — Instrument Serif italic verb over a thin brown bar on the
 * faint hairline track. Unlabeled usage keeps the ring (backward compatible for
 * inline spinners). Spec: docs/05-implementation/design-handoffs/
 * 2026-07-25-kopi-studio-2a/KOPI_2A_SPEC.md → "States → Loading".
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  /** Size variant: sm (24px), md (40px), lg (64px) */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Optional text label below the spinner */
  label?: string;
}

const SIZES = {
  sm: 24,
  md: 40,
  lg: 64,
};

const BORDER = {
  sm: 2,
  md: 3,
  lg: 4,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  label,
}) => {
  const px = SIZES[size];

  if (label) {
    // 2a loading state: Instrument Serif italic verb at the spec'd 19px (also
    // the serif floor) + a thin brown progress bar.
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('flex flex-col items-center justify-center gap-3', className)}
      >
        <span
          className="text-[19px] italic text-[color:var(--fg-dim)]"
          style={{ fontFamily: 'var(--font-prose)' }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className="block h-[3px] rounded-[2px] overflow-hidden bg-[color:var(--border-faint)]"
          style={{ width: Math.max(px * 3, 120) }}
        >
          <span className="block h-full w-[55%] bg-primary animate-pulse motion-reduce:animate-none" />
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={cn('flex flex-col items-center justify-center gap-3', className)}
    >
      <span
        aria-hidden="true"
        className="inline-block animate-spin rounded-full border-solid border-primary/25 border-t-primary motion-reduce:animate-none"
        style={{ width: px, height: px, borderWidth: BORDER[size] }}
      />
    </div>
  );
};
