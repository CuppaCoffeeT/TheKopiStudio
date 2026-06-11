import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryHeaderProps {
  label: string;
  icon?: LucideIcon;
  count?: number | null;
  collapsed?: boolean;
  chevron?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Mono uppercase label strip above each module-group in DashboardCategorySection.
 * Examples: "CLIENT OPS" · "FIELD OPS" · "FINANCE" · "ADMIN".
 */
export function CategoryHeader({
  label,
  icon: Icon,
  count,
  collapsed = false,
  chevron = true,
  onToggle,
  className,
}: CategoryHeaderProps) {
  const clickable = !!onToggle;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!clickable}
      className={cn(
        'group w-full flex items-center gap-2 px-3 py-2.5 mb-2.5 rounded-md',
        'border border-transparent',
        'text-left transition-all duration-150',
        clickable && [
          'cursor-pointer',
          // Hover bg must CONTRAST with --page-bg (zinc-100) — use white/zinc-800 not zinc-100/900
          'hover:bg-white dark:hover:bg-zinc-800',
          'hover:border-zinc-200 dark:hover:border-zinc-700',
          'hover:shadow-sm',
          'active:bg-zinc-50 dark:active:bg-zinc-900',
          'active:shadow-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-1',
        ],
        !clickable && 'cursor-default border-b border-zinc-100 dark:border-zinc-900 rounded-none',
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'w-3 h-3 transition-colors',
            clickable
              ? 'text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200'
              : 'text-zinc-400'
          )}
          strokeWidth={1.3}
        />
      )}
      <span
        className={cn(
          'text-[10.5px] font-medium uppercase tracking-[0.12em] transition-colors',
          clickable
            ? 'text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-50'
            : 'text-zinc-700 dark:text-zinc-300'
        )}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      <div className="flex-1" />
      {count != null && (
        <span
          className={cn(
            'text-[10px] transition-colors',
            clickable
              ? 'text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300'
              : 'text-zinc-600 dark:text-zinc-400'
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {count}
        </span>
      )}
      {chevron && (
        <ChevronDown
          className={cn(
            'w-3 h-3 transition-all duration-150',
            clickable
              ? 'text-zinc-400 group-hover:text-red-700 dark:group-hover:text-red-400'
              : 'text-zinc-400',
            collapsed && '-rotate-90'
          )}
          strokeWidth={1.5}
        />
      )}
    </button>
  );
}
