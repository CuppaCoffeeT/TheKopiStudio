import { forwardRef, type ReactNode } from 'react';
import { X, Columns3, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput } from './SearchInput';
import { IconButton } from '../IconButton';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove?: () => void;
}

interface FilterBarProps {
  /** Current search query */
  query: string;
  onQueryChange: (next: string) => void;
  searchPlaceholder?: string;
  /** Render the search field. Defaults to `true`. The 2a list archetype sets
   *  this `false` because search sits on the title row there, leaving this bar
   *  to carry only the filter popovers and the columns/export controls. */
  showSearch?: boolean;
  /** Filter trigger buttons (popovers) rendered after the search input — caller provides. */
  filters?: ReactNode;
  /** Active filters row, each removable. Rendered below main row. */
  activeFilters?: ActiveFilter[];
  /** Optional clear-all button shown when any filter is active. */
  onClearAll?: () => void;
  /** Optional "Clear" link to reset all filter popovers (not just active chips).
   *  Rendered after `filters` slot, before columns/export icons. */
  onClearFilters?: () => void;
  /** Optional column-toggle icon button (right side). */
  onColumnsClick?: () => void;
  /** Optional export icon button (right side). */
  onExportClick?: () => void;
  className?: string;
  /** `data-testid` forwarded to SearchInput's `<input>` — keeps Playwright contracts stable. */
  searchTestId?: string;
  /** `data-testid` forwarded to the Export icon button. */
  exportTestId?: string;
  /** `data-testid` forwarded to the Columns icon button. */
  columnsTestId?: string;
  /** `data-testid` forwarded to the Clear-filters button (rendered when `onClearFilters` set). */
  clearFiltersTestId?: string;
}

/**
 * Horizontal list-view FilterBar. Search input + caller-provided filter popovers
 * (`filters` prop) + optional active-filter chip row below.
 * Caller controls debounce on `onQueryChange`.
 */
export const FilterBar = forwardRef<HTMLInputElement, FilterBarProps>(function FilterBar(
  {
    query,
    onQueryChange,
    searchPlaceholder = 'Search…',
    showSearch = true,
    filters,
    activeFilters = [],
    onClearAll,
    onClearFilters,
    onColumnsClick,
    onExportClick,
    className,
    searchTestId,
    exportTestId,
    columnsTestId,
    clearFiltersTestId,
  },
  ref
) {
  const hasActive = activeFilters.length > 0;
  const hasRightSide = onColumnsClick || onExportClick || onClearFilters;

  return (
    <div className={cn('w-full', className)} style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="flex items-center gap-2 flex-wrap">
        {showSearch && (
          <SearchInput
            ref={ref}
            query={query}
            onQueryChange={onQueryChange}
            placeholder={searchPlaceholder}
            size="md"
            clearable={false}
            inputTestId={searchTestId}
          />
        )}

        {filters}

        {hasActive && onClearAll && (
          <button
            onClick={onClearAll}
            className="h-9 px-2.5 rounded-md text-[12.5px] font-medium text-[color:var(--fg-dim)] hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear all
          </button>
        )}

        {hasRightSide && (
          <>
            <div className="flex-1" />
            {onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="h-9 px-3 rounded-md text-[12px] font-medium text-[color:var(--fg-dim)] hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ fontFamily: 'var(--font-sans)' }}
                data-testid={clearFiltersTestId}
              >
                Clear
              </button>
            )}
            {onColumnsClick && (
              <IconButton aria-label="Toggle columns" onClick={onColumnsClick} data-testid={columnsTestId}>
                <Columns3 className="w-3.5 h-3.5" strokeWidth={1.3} />
              </IconButton>
            )}
            {onExportClick && (
              <IconButton aria-label="Export" onClick={onExportClick} data-testid={exportTestId}>
                <Download className="w-3.5 h-3.5" strokeWidth={1.4} />
              </IconButton>
            )}
          </>
        )}
      </div>

      {hasActive && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-1.5 rounded-full bg-secondary border border-border text-[color:var(--fg-dim)]"
              style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5, fontVariantNumeric: 'tabular-nums' }}
            >
              <span className="text-[color:var(--fg-dim)]">{f.label}:</span>
              <span className="text-foreground">{f.value}</span>
              {f.onRemove && (
                <button
                  onClick={f.onRemove}
                  aria-label={`Remove filter ${f.label}`}
                  className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[color:var(--fg-dim)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="w-2 h-2" strokeWidth={1.5} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
