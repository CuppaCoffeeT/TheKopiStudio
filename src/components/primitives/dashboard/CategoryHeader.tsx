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
          // Hover lifts to card cream (--card #FAF6EE) — it must stay LIGHTER than
          // the page cream ground (--page-bg #F0E6D6), never a grey and never a
          // same-value fill, or the hover reads as nothing.
          'hover:bg-card',
          'hover:border-border',
          'hover:shadow-sm',
          'active:bg-secondary',
          'active:shadow-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        ],
        !clickable && 'cursor-default border-b border-border rounded-none',
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            'w-3 h-3 transition-colors',
            clickable
              ? 'text-muted-foreground group-hover:text-foreground'
              : 'text-muted-foreground'
          )}
          strokeWidth={1.3}
        />
      )}
      <span
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
          // The strip is transparent until hover, so the resting ground is the
          // page cream — where --fg-muted is 4.12:1 and fails AA at 11px.
          // Dim ink (--fg-dim) is 6.40:1 on the page and stays legal on card hover.
          clickable
            ? 'text-[color:var(--fg-dim)] group-hover:text-foreground'
            : 'text-[color:var(--fg-dim)]'
        )}
      >
        {label}
      </span>
      <div className="flex-1" />
      {count != null && (
        <span
          className={cn(
            'text-[10px] transition-colors',
            // Same page-cream ground as the label — dim ink, not --fg-muted.
            clickable
              ? 'text-[color:var(--fg-dim)] group-hover:text-foreground'
              : 'text-[color:var(--fg-dim)]'
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
              ? 'text-muted-foreground group-hover:text-foreground'
              : 'text-muted-foreground',
            collapsed && '-rotate-90'
          )}
          strokeWidth={1.5}
        />
      )}
    </button>
  );
}
