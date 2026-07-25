import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number | string;
  urgent?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Small pill badge for module-card counts.
 * Switches to the terracotta error tone when count ≥ 10 or `urgent` is set —
 * calls attention to pending work. There is no red in the palette.
 */
export function CountBadge({ count, urgent = false, compact = false, className }: CountBadgeProps) {
  const critical = urgent || (typeof count === 'number' && count >= 10) || count === '99+';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold tabular-nums',
        compact ? 'min-w-[22px] h-[18px] px-1.5' : 'min-w-[24px] h-5 px-1.5',
        'text-[10.5px]',
        // Dim ink, not --fg-muted — the latter is 4.37:1 on the secondary tint
        // and fails AA at 10.5px.
        !critical && 'bg-secondary text-[color:var(--fg-dim)]',
        className
      )}
      style={{
        fontFamily: 'var(--font-mono)',
        // Critical = error tone, never brown — brown is reserved for CTA/focus/index
        ...(critical && {
          color: 'var(--status-rejected-fg)',
          background: 'var(--status-rejected-bg)',
        }),
      }}
    >
      {count}
    </span>
  );
}
