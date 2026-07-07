/**
 * LoadingSpinner — neutral gold ring spinner.
 *
 * 2026-07-07 de-AppBase: replaced the JL logo-mark Lottie animation with a
 * plain CSS ring spinner in the brand gold (--primary). No external animation
 * data, no company logo. Respects `prefers-reduced-motion` (motion-reduce).
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
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
      className={cn('flex flex-col items-center justify-center gap-3', className)}
    >
      <span
        aria-hidden="true"
        className="inline-block animate-spin rounded-full border-solid border-primary/25 border-t-primary motion-reduce:animate-none"
        style={{ width: px, height: px, borderWidth: BORDER[size] }}
      />
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  );
};
