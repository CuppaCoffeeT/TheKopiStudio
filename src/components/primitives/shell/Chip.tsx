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
 * Active state inherits CTA slate-800. Optional count suffix in mono.
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
          ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
          : 'bg-transparent hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
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
