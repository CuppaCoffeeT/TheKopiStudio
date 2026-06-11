import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountBadge } from './CountBadge';

interface NeedsAttentionPillProps {
  name: string;
  icon: LucideIcon;
  count: number | string;
  urgent?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Module link pill used in the DashboardAttentionStrip row.
 * Clicking navigates to the module. Taller (44px) tap target for mobile.
 */
export function NeedsAttentionPill({
  name,
  icon: Icon,
  count,
  urgent = true,
  onClick,
  className,
}: NeedsAttentionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2.5 h-11 pl-3.5 pr-2',
        'bg-white dark:bg-zinc-950',
        'border border-zinc-200 dark:border-zinc-800 rounded-lg',
        'hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:border-slate-800 dark:hover:border-zinc-600',
        'min-w-[260px] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 dark:focus-visible:ring-red-400',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <Icon className="w-4 h-4 text-zinc-500 flex-shrink-0" strokeWidth={1.6} />
      <span className="flex-1 text-left truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-50">
        {name}
      </span>
      <CountBadge count={count} urgent={urgent} />
      <ChevronRight className="w-2.5 h-2.5 text-zinc-400" strokeWidth={1.3} />
    </button>
  );
}
