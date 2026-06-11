/**
 * IconButton — W07 atom (extracted from Session 1 DataTable.jsx spec 2026-04-19).
 *
 * Ghost-bordered 32px icon button used in filter bars (columns · export ·
 * settings) and table rows (delete · duplicate · etc.). Larger `md` variant
 * for mobile (44px tap target per v3.3).
 *
 * Deep import per Q-W07-b.
 *
 * @see docs/99-refactor/_system/DESIGN_CATALOG.md — Atoms group
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export type IconButtonSize = 'sm' | 'md';

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',       // 32px — toolbar/filter bar
  md: 'h-11 w-11',     // 44px — mobile tap target
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  /** Icon node (typically a lucide-react icon at h-3.5 w-3.5 for sm, h-4 w-4 for md). */
  children: React.ReactNode;
  /** Screen-reader label. REQUIRED for accessibility when the icon conveys the action. */
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'sm', children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        {...props}
        className={cn(
          'inline-flex items-center justify-center rounded-md border shrink-0',
          'bg-[var(--surface)] border-[color:var(--border-soft)] text-[color:var(--fg-muted)]',
          'hover:bg-[color:var(--row-hover)] hover:text-[color:var(--fg)]',
          'disabled:opacity-50 disabled:cursor-default',
          'focus-visible:outline-2 focus-visible:outline-[color:var(--brand-red)] focus-visible:outline-offset-2',
          SIZE_CLASSES[size],
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
IconButton.displayName = 'IconButton';
