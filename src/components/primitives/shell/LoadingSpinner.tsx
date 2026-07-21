/**
 * LoadingSpinner — neutral gold ring spinner.
 *
 * 2026-07-07 de-AppBase: replaced the JL logo-mark Lottie animation with a
 * plain CSS ring spinner in the brand gold (--primary). No external animation
 * data, no company logo. Respects `prefers-reduced-motion` (motion-reduce).
 *
 * 2026-07-21 (1a Masthead): when a `label` is passed, renders the 1a loading
 * state instead — thin gold progress bar + Georgia italic verb. Unlabeled
 * usage keeps the gold ring (backward compatible for inline spinners).
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
    // 1a Masthead loading state: serif italic verb + thin gold progress bar.
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn('flex flex-col items-center justify-center gap-3', className)}
      >
        <span
          className="text-[15px] italic text-[color:var(--fg-dim)]"
          style={{ fontFamily: 'var(--font-prose, Georgia, serif)' }}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className="block h-[3px] rounded-[2px] overflow-hidden bg-[color:var(--border-faint,#22303F)]"
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
