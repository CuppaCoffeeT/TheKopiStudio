import { cn } from '@/lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
  /** Inverts colors for use on dark tooltip surfaces. */
  invert?: boolean;
}

/**
 * Keyboard shortcut pill. Geist Mono, subtle border.
 * Used in tooltips, dropdown items, launcher hints.
 */
export function Kbd({ children, className, invert = false }: KbdProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'px-1.5 py-[1px] rounded',
        'text-[10.5px] tracking-wider',
        'border',
        invert
          ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800',
        className
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {children}
    </span>
  );
}
