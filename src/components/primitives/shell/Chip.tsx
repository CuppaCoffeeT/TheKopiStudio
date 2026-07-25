import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type ChipKind = 'filter' | 'tab';
export type ChipSize = 'sm' | 'md';

interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  kind?: ChipKind;
  size?: ChipSize;
  active?: boolean;
  count?: number | null;
}

/**
 * Chip — filter toggle OR routed tab.
 * Active state inherits the brown CTA (bg-primary / text-primary-foreground).
 * Optional count suffix in mono.
 */
export const Chip = forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { kind: _kind = 'filter', size = 'md', active = false, count, className, children, type = 'button', ...props },
  ref
) {
  void _kind;
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        size === 'sm' ? 'h-6 text-[11px]' : 'h-7 text-xs',
        'px-2.5 rounded-full inline-flex items-center gap-1.5 font-medium whitespace-nowrap border',
        active
          ? 'bg-primary text-primary-foreground border-transparent'
          : 'bg-transparent hover:bg-secondary text-muted-foreground border-border',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      <span>{children}</span>
      {count != null && (
        <>
          <span className="opacity-55">·</span>
          <span
            className="opacity-90 font-medium"
            style={{ fontFamily: 'var(--font-mono)', fontSize: size === 'sm' ? 10 : 11 }}
          >
            {count}
          </span>
        </>
      )}
    </button>
  );
});
