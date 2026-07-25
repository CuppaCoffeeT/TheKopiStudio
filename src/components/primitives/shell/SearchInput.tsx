/**
 * SearchInput — W07 Phase 2 cell-level primitive.
 *
 * The bare search input extracted from `<FilterBar>`. Use wherever you need a
 * consistent, accessible search field that is smaller than the full list-view
 * toolbar (e.g. inside a `<Modal>`, a `<Drawer>`, a nested panel, or a
 * narrow sub-page filter).
 *
 * Spec parity: matches the left half of `<FilterBar>` (S-shell ListAtoms) —
 * same type ramp, same brown focus ring (`--ring` at 50%), same mag-glass icon.
 * Difference: the ⌘K hint is hidden by default (most cell-level places
 * don't wire up a palette hotkey); set `showKbd` to re-enable it.
 *
 * If you need active-filter chips + filter popovers alongside the search,
 * reach for `<FilterBar>` instead — this primitive is the atom inside it.
 *
 * Consume:
 *   ```tsx
 *   <SearchInput
 *     query={search}
 *     onQueryChange={setSearch}
 *     placeholder="Search people…"
 *   />
 *   ```
 */

import { forwardRef, useId } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from '../overlays/Kbd';

export type SearchInputSize = 'sm' | 'md';

interface SearchInputProps {
  /** Current search query (controlled). */
  query: string;
  /** Called on every keystroke — caller owns debouncing. */
  onQueryChange: (next: string) => void;
  /** Defaults to `"Search…"`. */
  placeholder?: string;
  /** `md` (default, h-9 320px — FilterBar parity) · `sm` (h-8 240px — cell/modal). */
  size?: SearchInputSize;
  /** Show the `⌘K` hint on the right. Defaults to `false` for cell-level use. */
  showKbd?: boolean;
  /** Show a clear (X) button when `query` is non-empty. Defaults to `true`. */
  clearable?: boolean;
  /** Fix the width. Overrides the size preset. */
  className?: string;
  /** Accessible name — forwarded to the input. */
  ariaLabel?: string;
  /** Disabled state. */
  disabled?: boolean;
  /** `autoFocus` for modal flows. */
  autoFocus?: boolean;
  /** `name` for forms — search boxes usually omit this. */
  name?: string;
  /** `data-testid` for the <input> element — pages preserving Playwright contracts. */
  inputTestId?: string;
}

/**
 * Accessible search input with mag-glass icon, optional ⌘K hint, and a clear
 * button. Uncontrolled callers should hold their own state + debounce.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    query,
    onQueryChange,
    placeholder = 'Search…',
    size = 'md',
    showKbd = false,
    clearable = true,
    className,
    ariaLabel,
    disabled,
    autoFocus,
    name,
    inputTestId,
  },
  ref,
) {
  const id = useId();
  const hasQuery = query.length > 0;

  const heightClass = size === 'sm' ? 'h-8' : 'h-9';
  const widthClass = size === 'sm' ? 'w-[240px]' : 'w-[320px]';
  const iconTop = size === 'sm' ? 'top-2' : 'top-2.5';

  return (
    <div
      className={cn(
        'relative inline-flex items-center max-w-full',
        heightClass,
        widthClass,
        'px-2.5 pl-9 rounded-md',
        'bg-card',
        'border border-border',
        'focus-within:border-ring',
        'focus-within:ring-[3px] focus-within:ring-ring/50',
        'transition-colors',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      <Search
        aria-hidden="true"
        className={cn('absolute left-3 w-3.5 h-3.5 text-muted-foreground', iconTop)}
        strokeWidth={1.3}
      />
      <input
        id={id}
        ref={ref}
        type="search"
        name={name}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={ariaLabel ?? placeholder}
        data-testid={inputTestId}
        className="flex-1 bg-transparent border-none outline-none text-[12.5px] pointer-coarse:text-[16px] text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        style={{ fontFamily: 'var(--font-sans)' }}
      />
      {clearable && hasQuery && !disabled && (
        <button
          type="button"
          onClick={() => onQueryChange('')}
          aria-label="Clear search"
          className="ml-1 w-4 h-4 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-2.5 h-2.5" strokeWidth={1.5} />
        </button>
      )}
      {showKbd && !hasQuery && <Kbd className="ml-1.5">⌘K</Kbd>}
    </div>
  );
});
