/**
 * FilterCard — shared filter surface for list/queue pages.
 *
 * Wraps a primitive `Card` with optional search row (debounce-friendly via
 * controlled value+onChange) + a responsive grid of additional filter fields
 * + Clear button. Used by the 4 coordinator-review tabs (Trial Trenches ·
 * General Works · Worker OT · Clarifications) so all filter cards look identical.
 *
 * Dark-mode aware: bg-white / dark:bg-zinc-950, no shadow, primitive Input.
 */

import { Search, X } from 'lucide-react';
import { Input } from '../form/Input';
import { Button } from './Button';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface FilterCardProps {
  /** Optional search bar at the top. Omit to show fields only. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchTestId?: string;
  /** Show Clear button when active filters exist. */
  hasActiveFilters?: boolean;
  onClear?: () => void;
  /** Field grid rendered below the search row. */
  children?: React.ReactNode;
  /** Override grid template (default: `grid-cols-1 md:grid-cols-3`). */
  gridClassName?: string;
  className?: string;
}

export function FilterCard({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchTestId,
  hasActiveFilters,
  onClear,
  children,
  gridClassName = 'grid grid-cols-1 md:grid-cols-3 gap-4',
  className,
}: FilterCardProps) {
  const showSearch = onSearchChange !== undefined;
  const showClear = hasActiveFilters && onClear;
  const showFields = !!children;

  return (
    <Card padding="p-4" className={cn(className)}>
      <div className="space-y-4">
        {(showSearch || showClear) && (
          <div className="flex items-center gap-3">
            {showSearch && (
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400 z-10 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-10"
                  aria-label={searchPlaceholder ?? 'Search'}
                  data-testid={searchTestId}
                />
              </div>
            )}
            {showClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                leadingIcon={<X className="h-4 w-4" aria-hidden="true" />}
              >
                Clear
              </Button>
            )}
          </div>
        )}
        {showFields && <div className={gridClassName}>{children}</div>}
      </div>
    </Card>
  );
}
