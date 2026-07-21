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
      {/* 1a Masthead: glyph is outlined gold, never filled. */}
      <div className="w-11 h-11 mx-auto mb-5 rounded-full border border-[color:var(--brand-red)] inline-flex items-center justify-center text-[color:var(--brand-red)]">
        <Search className="w-5 h-5" strokeWidth={1.5} />
      </div>
      {/* 1a Masthead: serif italic empty-state line. */}
      <div
        className="text-[17px] italic text-[color:var(--fg-dim)] mb-2"
        style={{ fontFamily: 'var(--font-prose, Georgia, serif)' }}
      >
        {query ? <>No matches for "{query}".</> : 'No results.'}
      </div>
      <div className="text-[13px] text-muted-foreground leading-relaxed mb-5">
        Try a broader search or clear active filters
      </div>

      <div className="inline-flex gap-2 justify-center mb-5">
        {/* 1a Masthead: ONE quiet (outline) action — no filled CTA in empty states. */}
        {onClearSearch && (
          <Button size="sm" variant="outline" onClick={onClearSearch}>
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
            className="text-[10px] text-muted-foreground tracking-[0.1em] uppercase mb-2"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            ACTIVE FILTERS
          </div>
          <div className="flex gap-1.5 flex-wrap justify-center">
            {activeFilters.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 h-6 pl-2.5 pr-2 rounded-full bg-secondary border border-border text-muted-foreground"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 10.5 }}
              >
                {f.label}
                {f.onRemove && (
                  <button
                    onClick={f.onRemove}
                    aria-label={`Remove ${f.label}`}
                    className="w-3 h-3 inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
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
