import { forwardRef } from 'react';
import { ChevronRight, Pin, Star, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CountBadge } from './CountBadge';

export type ModuleCardSize = 'default' | 'compact';

interface ModuleCardProps {
  /** Module display name */
  name: string;
  /** Icon component (from lucide-react) */
  icon: LucideIcon;
  /** One-line description — only shown on 'default' size */
  description?: string;
  /** Optional count badge (new items, pending, etc.) */
  count?: number | string | null;
  /** Override count-critical detection (forces the terracotta error tone) */
  urgent?: boolean;
  /** Whether module is pinned (filled pin icon) */
  pinned?: boolean;
  /** Show pin icon at all (hides if user can't pin) */
  showPin?: boolean;
  /** Starred favourite (filled dim-ink star overlay) */
  starFav?: boolean;
  /** Disabled state (insufficient permissions) */
  disabled?: boolean;
  size?: ModuleCardSize;
  /** Click handler — typically navigate to module route */
  onClick?: () => void;
  /** Pin toggle handler (only called if showPin) */
  onTogglePin?: () => void;
  className?: string;
}

/**
 * ModuleCard — the launcher tile for /dashboard's DashboardCompactRow + DashboardCategorySection.
 * Two sizes: `compact` (Favourites / Recent row, 56px, icon + name + chevron) and
 * `default` (grid, 92px, icon + name + description + count + pin).
 *
 * Pin is rendered as a sibling button (absolutely positioned), not nested inside
 * the card button — keeps WCAG 2.1 nested-interactive + aria-command-name happy.
 */
export const ModuleCard = forwardRef<HTMLButtonElement, ModuleCardProps>(function ModuleCard(
  {
    name,
    icon: Icon,
    description,
    count,
    urgent = false,
    pinned = false,
    showPin = true,
    starFav = false,
    disabled = false,
    size = 'default',
    onClick,
    onTogglePin,
    className,
  },
  ref
) {
  const compact = size === 'compact';
  const showDesc = !compact && description;
  const pinButtonVisible = !compact && showPin && !!onTogglePin;

  return (
    <div className={cn('relative', className)}>
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'group relative w-full rounded-[10px] border text-left',
          'bg-card',
          'border-border',
          'transition-all duration-[120ms] ease-out',
          // Interactive card hover per 2a: warm-ink lift + --border-hover.
          // Brown is punctuation, so the border does NOT go to the CTA brown.
          !disabled && 'hover:-translate-y-px hover:shadow-[var(--card-shadow-hover)] hover:bg-secondary hover:border-[color:var(--border-hover)]',
          compact ? 'h-14 px-3.5 flex items-center gap-2.5' : 'min-h-[92px] py-3.5 px-4 flex flex-col items-start gap-2',
          disabled && 'opacity-50 cursor-not-allowed',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {compact ? (
          <>
            <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.6} />
            <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-foreground">
              {name}
            </span>
            {starFav && <Star className="w-[13px] h-[13px] text-[color:var(--fg-dim)] fill-[color:var(--fg-dim)] flex-shrink-0" strokeWidth={1} />}
            {count != null && <CountBadge count={count} urgent={urgent} compact />}
            <ChevronRight className="w-2.5 h-2.5 text-muted-foreground flex-shrink-0" strokeWidth={1.3} />
          </>
        ) : (
          <>
            <div className="flex items-start w-full gap-2.5">
              <Icon className="w-[18px] h-[18px] text-muted-foreground" strokeWidth={1.6} />
              <div className="flex-1" />
              {starFav && <Star className="w-[13px] h-[13px] text-[color:var(--fg-dim)] fill-[color:var(--fg-dim)]" strokeWidth={1} />}
              {/* Reserve space when a pin button will be rendered as a sibling */}
              {pinButtonVisible && <span className="w-3 h-3 flex-shrink-0" aria-hidden />}
              {count != null && <CountBadge count={count} urgent={urgent} />}
            </div>
            <div className="text-[14px] font-medium text-foreground leading-tight">
              {name}
            </div>
            {/* Dim ink, not --fg-muted — muted is 4.72:1 at rest on the card but
                drops to 4.37:1 the moment the hover swaps in the secondary tint. */}
            {showDesc && (
              <div className="w-full truncate text-[11.5px] text-[color:var(--fg-dim)] leading-tight">
                {description}
              </div>
            )}
          </>
        )}
      </button>
      {pinButtonVisible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.();
          }}
          aria-label={pinned ? `Unpin ${name}` : `Pin ${name}`}
          aria-pressed={pinned}
          className={cn(
            'absolute top-3 right-4 z-10 flex items-center justify-center w-5 h-5 rounded',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            !pinned && 'opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity',
          )}
        >
          <Pin
            className={cn(
              'w-3 h-3',
              pinned ? 'text-foreground fill-foreground' : 'text-muted-foreground',
            )}
            strokeWidth={1.3}
          />
        </button>
      )}
    </div>
  );
});
