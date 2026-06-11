import { cn } from '@/lib/utils';

interface AttentionHeaderProps {
  count?: number | null;
  className?: string;
}

/**
 * Small red-dot "Needs your attention" label above DashboardAttentionStrip.
 * Uppercase mono treatment — the hero attention moment.
 */
export function AttentionHeader({ count, className }: AttentionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-2.5', className)}>
      <span className="w-2.5 h-2.5 rounded-full bg-red-700 dark:bg-red-400 inline-block" />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 dark:text-red-400"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Needs your attention
      </span>
      {count != null && (
        <span
          className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 rounded-full bg-red-700 dark:bg-red-400 text-white dark:text-zinc-950 text-[10.5px] font-semibold"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
