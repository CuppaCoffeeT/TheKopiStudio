import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X, Plus } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import { showInfo } from '@/utils/toastHelper';
import { Badge } from '../shell/Badge';
import { GLASS_SURFACE } from './shared';
import { Kbd } from './Kbd';

export interface SMSOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  /** Toast message shown when a user taps a disabled option. (Added 2026-04-27 to preserve `ui/searchable-select` parity.) */
  disabledMessage?: string;
  /** Group key — when ANY option has a group, options render under sticky uppercase mono section headers. Group order is first-seen. (Added 2026-04-27 to support `unit-select` category-grouped catalogue.) */
  group?: string;
}

interface SearchableMultiSelectProps {
  options: SMSOption[];
  /** Single-select value. Mutually exclusive with `values`. */
  value?: string | null;
  onValueChange?: (next: string | null) => void;
  /** Multi-select values. Mutually exclusive with `value`. */
  values?: string[];
  onValuesChange?: (next: string[]) => void;

  placeholder?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  /** Show "Create new <label>" row at bottom when non-empty query doesn't match. */
  onCreateNew?: (query: string) => void;
  createLabelPrefix?: string;
  /** Optional `data-testid` forwarded to the trigger button (preserves Playwright contracts on swapped legacy callsites). */
  triggerTestId?: string;
  /** Optional prefix for per-option `data-testid` (rendered as `${prefix}-${option.value}`). Preserves the `${triggerTestId}-option-${id}` contract from legacy `ui/searchable-select`. */
  optionTestIdPrefix?: string;
  /**
   * `bare` — strips the trigger's border + background + min-height, hides the inline clearable X.
   * Use inside grid cells (e.g. `LineItemsEditor` unit column) where the surrounding cell already
   * provides the frame and a row-level delete action exists. Default = framed input look.
   * (Added 2026-04-27 for `LineItemsEditor` unit-cell parity with neighboring qty/price inputs.)
   */
  variant?: 'default' | 'bare';

  /**
   * Multi-select only: when true, the trigger renders a single summary line
   * (`{n} selected` or the placeholder) instead of inline selected-pill Badges.
   * Use this when an outer composer (e.g. `StarredMultiSelect`) already renders
   * its own selected-pill row above the picker, so pills don't double up.
   * (Added 2026-05-25 for `StarredMultiSelect`.)
   */
  hideSelectedPills?: boolean;

  /**
   * Fires whenever the internal search input changes. Use this to drive
   * server-side filtering (debounce in the parent and feed the result
   * into your data hook). Optional — when omitted, the picker filters its
   * `options` prop client-side as before.
   */
  onQueryChange?: (q: string) => void;

  className?: string;
}

/**
 * SearchableMultiSelect — THE universal AppBase picker primitive (W08 Session 2).
 *
 * Replaces ~18 bespoke combobox/multi-select patterns. Props-driven:
 *   single vs multi · searchable · addNew · disabled.
 *
 * Spec-critical: search input auto-focuses when the panel opens (the reason this
 * primitive exists — shadcn's SearchableSelect cannot reliably focus inside Dialogs
 * due to Radix's default `onOpenAutoFocus` behavior. We override with `onOpenAutoFocus`
 * preventing default and manually focusing the input next tick).
 */
export function SearchableMultiSelect({
  options,
  value,
  onValueChange,
  values,
  onValuesChange,
  placeholder,
  label,
  disabled = false,
  searchable = true,
  clearable = true,
  onCreateNew,
  createLabelPrefix = 'Create new',
  triggerTestId,
  optionTestIdPrefix,
  variant = 'default',
  hideSelectedPills = false,
  onQueryChange,
  className,
}: SearchableMultiSelectProps) {
  const isMulti = values !== undefined;
  const isBare = variant === 'bare';
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Fire `onQueryChange` whenever the internal query changes so a parent can
  // drive server-side filtering. Skip the initial empty-string emission to
  // keep parents that don't care unaffected.
  useEffect(() => {
    onQueryChange?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const selectedValues = useMemo(
    () => (isMulti ? (values ?? []) : value ? [value] : []),
    [isMulti, values, value]
  );
  const selectedOptions = useMemo(
    () => selectedValues.map((v) => options.find((o) => o.value === v)).filter(Boolean) as SMSOption[],
    [selectedValues, options]
  );

  const q = query.toLowerCase().trim();
  const filtered = useMemo(() => {
    const base = !q ? options : options.filter((o) => o.label.toLowerCase().includes(q));
    return [...base].sort((a, b) => Number(!!a.disabled) - Number(!!b.disabled));
  }, [options, q]);

  // Group keys in first-seen order. Empty array = options are flat (no group rendering).
  const groupOrder = useMemo(() => {
    const seen: string[] = [];
    for (const o of filtered) {
      if (o.group && !seen.includes(o.group)) seen.push(o.group);
    }
    return seen;
  }, [filtered]);
  const isGrouped = groupOrder.length > 0;

  const hasExactMatch = filtered.some((o) => o.label.toLowerCase() === q);
  const showCreate = !!onCreateNew && q.length > 0 && !hasExactMatch;

  useEffect(() => {
    setActiveIndex(0);
  }, [q]);

  function toggle(option: SMSOption) {
    if (option.disabled) {
      if (option.disabledMessage) showInfo(option.disabledMessage);
      return;
    }
    if (isMulti) {
      const next = selectedValues.includes(option.value)
        ? selectedValues.filter((v) => v !== option.value)
        : [...selectedValues, option.value];
      onValuesChange?.(next);
    } else {
      onValueChange?.(option.value === value ? null : option.value);
      setOpen(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1 + (showCreate ? 1 : 0), i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex < filtered.length) {
        toggle(filtered[activeIndex]);
      } else if (showCreate) {
        onCreateNew?.(query);
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const visibleBadges = selectedOptions.slice(0, 3);
  const overflow = selectedOptions.length - visibleBadges.length;

  return (
    <div className={className}>
      {label && (
        <div
          className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1.5"
          style={{ fontFamily: 'var(--font-pixel)' }}
        >
          {label}
        </div>
      )}
      <PopoverPrimitive.Root open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            data-testid={triggerTestId}
            aria-label={placeholder ?? (isMulti ? 'Select options' : 'Select option')}
            className={cn(
              'w-full text-left',
              isBare
                ? 'rounded flex items-center gap-1 flex-wrap px-2 py-1 h-7'
                : 'min-h-9 rounded-md border flex items-center gap-1.5 flex-wrap px-2.5',
              !isBare && selectedOptions.length > 0 && isMulti ? 'py-1' : '',
              disabled
                ? isBare
                  ? 'cursor-not-allowed opacity-60'
                  : 'bg-secondary border-border cursor-not-allowed opacity-70'
                : isBare
                  ? open
                    ? 'bg-card ring-2 ring-ring/30 cursor-pointer'
                    : 'bg-transparent hover:bg-secondary cursor-pointer'
                  : open
                    ? 'bg-card border-ring ring-[3px] ring-ring/15 cursor-pointer'
                    : 'bg-card border-border hover:border-border cursor-pointer'
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {selectedOptions.length === 0 && (
              <span className="flex-1 min-w-0 truncate text-[13px] text-muted-foreground">
                {placeholder ?? (isMulti ? 'Select…' : 'Select one…')}
              </span>
            )}
            {selectedOptions.length > 0 && !isMulti && (
              <span
                className="flex-1 min-w-0 truncate text-[13px] text-foreground"
                title={selectedOptions[0].label}
              >
                {selectedOptions[0].label}
              </span>
            )}
            {selectedOptions.length > 0 && isMulti && hideSelectedPills && (
              <span className="flex-1 min-w-0 truncate text-[13px] text-muted-foreground">
                {placeholder ?? `${selectedOptions.length} selected`}
              </span>
            )}
            {selectedOptions.length > 0 && isMulti && !hideSelectedPills && (
              <>
                {visibleBadges.map((o) => (
                  <SMSBadge
                    key={o.value}
                    label={o.label}
                    onRemove={
                      disabled
                        ? undefined
                        : (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onValuesChange?.(selectedValues.filter((v) => v !== o.value));
                          }
                    }
                  />
                ))}
                {overflow > 0 && (
                  <span
                    className="text-[12px] px-2 py-[3px] rounded-full bg-secondary text-muted-foreground"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    +{overflow} more
                  </span>
                )}
                {/* Spacer pushes the clearable-X (if any) + chevron to the right edge. */}
                <span className="flex-1" aria-hidden />
              </>
            )}
            {clearable && !isBare && !disabled && selectedOptions.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMulti) onValuesChange?.([]);
                  else onValueChange?.(null);
                }}
                className="w-[18px] h-[18px] flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-hidden
              >
                <X className="w-[10px] h-[10px]" />
              </span>
            )}
            <ChevronDown className="w-[10px] h-[10px] shrink-0 text-muted-foreground ml-0.5" />
          </button>
        </PopoverPrimitive.Trigger>

        {/*
         * NOT Portal'd. Portal-rendered content escapes the Radix Dialog's
         * `react-remove-scroll` shard → iOS Safari blocks touch events on
         * options. See .claude/rules/ui-components.md (verified 2026-03-20).
         */}
        <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            collisionPadding={8}
            onOpenAutoFocus={(e) => {
              // Override Radix default — manually focus the search field
              // so users can type immediately. Critical UX fix (reason this primitive exists).
              e.preventDefault();
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className={cn(
              'z-[9999] pointer-events-auto w-[var(--radix-popover-trigger-width)] min-w-[21.25rem] rounded-lg overflow-hidden',
              // Mobile-safety: cap height to Radix's reported available space (post
              // virtual keyboard + viewport-edge collision). Flex column lets the
              // option list scroll while the search input + footer stay pinned —
              // fixes "popover flips above trigger inside Drawer and crops search"
              // on iOS Safari. See docs/01-system-architecture/MOBILE_WEB_STANDARDS.md.
              'max-h-[var(--radix-popover-content-available-height)] flex flex-col',
              GLASS_SURFACE,
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95'
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {searchable && (
              <div className="flex-shrink-0 border-b border-border px-3 py-2.5 flex items-center gap-2">
                <Search className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Search…"
                  className="flex-1 text-[13px] pointer-coarse:text-[16px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  style={{ fontFamily: 'var(--font-sans)' }}
                />
              </div>
            )}

            <div className="flex-1 min-h-0 max-h-[300px] overflow-y-auto overscroll-contain p-1">
              {filtered.length === 0 && !showCreate && (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  {q ? `No matches for "${q}"` : 'No results'}
                </div>
              )}
              {(() => {
                const renderOption = (o: SMSOption, i: number) => {
                  const sel = selectedValues.includes(o.value);
                  const active = i === activeIndex;
                  return (
                    <div
                      key={o.value}
                      role="option"
                      aria-selected={sel}
                      data-testid={optionTestIdPrefix ? `${optionTestIdPrefix}-${o.value}` : undefined}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => toggle(o)}
                      className={cn(
                        'flex items-start gap-2.5 px-2.5 py-2 rounded',
                        active && !o.disabled ? 'bg-secondary' : '',
                        o.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'
                      )}
                    >
                      <Indicator multi={isMulti} selected={sel} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground leading-snug">
                          {highlight(o.label, q)}
                        </div>
                        {o.description && (
                          <div
                            className="text-[11px] text-muted-foreground mt-0.5 leading-snug"
                          >
                            {o.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };

                if (!isGrouped) return filtered.map(renderOption);

                // Grouped render — section header per group, options under, in first-seen order.
                // `globalIndex` keeps activeIndex semantics consistent with flat mode.
                let globalIndex = 0;
                return groupOrder.map((g) => {
                  const groupOptions = filtered.filter((o) => o.group === g);
                  if (groupOptions.length === 0) return null;
                  return (
                    <div key={g}>
                      <div
                        className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                        style={{ fontFamily: 'var(--font-pixel)' }}
                      >
                        {g}
                      </div>
                      {groupOptions.map((o) => {
                        const node = renderOption(o, globalIndex);
                        globalIndex += 1;
                        return node;
                      })}
                    </div>
                  );
                });
              })()}
            </div>

            {showCreate && (
              <div className="flex-shrink-0 border-t border-border p-1">
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew?.(query);
                    setOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded',
                    'text-[13px] font-medium text-blue-700 dark:text-blue-400',
                    'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                  )}
                >
                  <Plus className="w-3 h-3 flex-shrink-0" />
                  <span className="flex-1 text-left">
                    {createLabelPrefix} {q && <>&ldquo;{query}&rdquo;</>}
                  </span>
                  <Kbd>⏎</Kbd>
                </button>
              </div>
            )}

            <div className="flex-shrink-0 border-t border-border bg-secondary px-3 py-2 flex gap-3 items-center">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
                <Kbd>↑↓</Kbd> navigate
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
                <Kbd>⏎</Kbd> {isMulti ? 'toggle' : 'select'}
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1" style={{ fontFamily: 'var(--font-mono)' }}>
                <Kbd>esc</Kbd> close
              </span>
            </div>
          </PopoverPrimitive.Content>
      </PopoverPrimitive.Root>
    </div>
  );
}

function Indicator({ multi, selected }: { multi: boolean; selected: boolean }) {
  if (multi) {
    return (
      <span
        className={cn(
          'w-3.5 h-3.5 mt-[3px] rounded-[3px] border-[1.5px] flex-shrink-0 inline-flex items-center justify-center',
          selected
            ? 'bg-primary border-primary'
            : 'border-border bg-transparent'
        )}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M2 5 L4.5 7.5 L8 3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </span>
    );
  }
  return (
    <span className="w-3.5 h-3.5 mt-[3px] flex-shrink-0 inline-flex items-center justify-center text-primary">
      {selected && (
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M2 7 L6 11 L12 3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

/**
 * SMSBadge — selected-pill inside the trigger. Composes primitive `Badge variant="secondary" tone="neutral"`
 * (which is `inline-flex flex-row flex-nowrap items-center` after 2026-04-27 Badge refactor) so children
 * label + X stay on one row by default. Only overrides padding (tighter pl/pr for inline-pill density).
 */
function SMSBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove?: (e: React.MouseEvent) => void;
}) {
  return (
    <Badge variant="secondary" tone="neutral" className="pl-2 pr-1 py-[2px] text-[12px]">
      <span className="truncate">{label}</span>
      {onRemove && (
        <span
          onClick={onRemove}
          className="inline-flex w-3.5 h-3.5 items-center justify-center text-muted-foreground hover:text-foreground rounded cursor-pointer flex-shrink-0"
          aria-hidden
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M2 2 L6 6 M6 2 L2 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </Badge>
  );
}

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-200 rounded px-[1px]">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}
