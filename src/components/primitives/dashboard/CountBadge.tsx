import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number | string;
  urgent?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Small pill badge for module-card counts.
 * Goes red when count ≥ 10 or `urgent` flag is set — calls attention to pending work.
 */
export function CountBadge({ count, urgent = false, compact = false, className }: CountBadgeProps) {
  const critical = urgent || (typeof count === 'number' && count >= 10) || count === '99+';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold tabular-nums',
        compact ? 'min-w-[22px] h-[18px] px-1.5' : 'min-w-[24px] h-5 px-1.5',
        'text-[10.5px]',
        critical
          ? 'bg-red-700 text-white dark:bg-red-500/60'
          : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200',
        className
      )}
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {count}
    </span>
  );
}
