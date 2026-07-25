import { cn } from '@/lib/utils';

interface AttentionHeaderProps {
  count?: number | null;
  className?: string;
}

/**
 * Small terracotta-dot "Needs your attention" label above DashboardAttentionStrip.
 * Uppercase mono treatment — the hero attention moment.
 */
export function AttentionHeader({ count, className }: AttentionHeaderProps) {
  return (
    <div className={cn('flex items-center gap-2 mb-2.5', className)}>
      {/* Attention = error tone, never brown — brown is CTA/focus/index/in-progress/links only */}
      <span
        className="w-2.5 h-2.5 rounded-full inline-block"
        style={{ background: 'var(--delta-negative-fg)' }}
      />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--delta-negative-fg)' }}
      >
        Needs your attention
      </span>
      {count != null && (
        <span
          className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1.5 rounded-full text-[10.5px] font-semibold"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--status-rejected-fg)',
            background: 'var(--status-rejected-bg)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}
