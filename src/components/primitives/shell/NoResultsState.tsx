import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface NoResultsStateProps {
  query?: string;
  /** Active filter labels shown as removable chips below actions. */
  activeFilters?: Array<{ label: string; onRemove?: () => void }>;
  onClearSearch?: () => void;
  onResetFilters?: () => void;
  className?: string;
}

/**
 * Compact no-results surface for list/search pages.
 * Smaller than ErrorState (no pixel-grid code hero) — meant to live inside a list container.
 */
export function NoResultsState({
  query,
  activeFilters = [],
  onClearSearch,
  onResetFilters,
  className,
}: NoResultsStateProps) {
  return (
    <div
      className={cn('max-w-[460px] mx-auto py-10 px-7 text-center', className)}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="w-11 h-11 mx-auto mb-5 rounded-full bg-zinc-100 dark:bg-zinc-900 inline-flex items-center justify-center text-zinc-500 dark:text-zinc-400">
        <Search className="w-5 h-5" strokeWidth={1.5} />
      </div>
      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
        {query ? (
          <>
            No matches for{' '}
            <span
              className="font-medium"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              "{query}"
            </span>
          </>
        ) : (
          'No results'
        )}
      </div>
      <div className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-5">
        Try a broader search or clear active filters
      </div>

      <div className="inline-flex gap-2 justify-center mb-5">
        {onClearSearch && (
          <Button size="sm" variant="primary" onClick={onClearSearch}>
            Clear search
          </Button>
        )}
        {onResetFilters && (
          <Button size="sm" variant="outline" onClick={onResetFilters}>
            Reset filters
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div>
          <div
            className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-[0.1em] uppercase mb-2"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            ACTIVE FILTERS
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {activeFilters.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-2 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}
              >
                {f.label}
                {f.onRemove && (
                  <button
                    onClick={f.onRemove}
                    aria-label={`Remove ${f.label}`}
                    className="w-3 h-3 inline-flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X className="w-2 h-2" strokeWidth={1.5} />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
