/**
 * FilterDropdown — trigger button like "Status · 2 selected ▾" that opens a `<Popover>`.
 * Caller owns the popover body (checkbox list, date range picker, etc.).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/ListAtoms.jsx#L220 (PopoverButton)
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: h-9 · leading calendar icon opt-in · red circular count badge when count>0 · chevron-down · focus-visible red-700.
 * Renamed from PopoverButton for clarity — this is a dropdown trigger composing `<Popover>`.
 */

import { forwardRef, useState, type ReactNode } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '../overlays/Popover';

export interface FilterDropdownProps {
  label: string;
  /** Human-readable current value — e.g. `"2 selected"`, `"Last 30 days"`, `"All companies"`. */
  value?: string;
  /** Active filter count shown as red badge (omit or 0 → no badge). */
  count?: number;
  /** Show leading calendar icon (date filters). */
  isDate?: boolean;
  /** Popover body — caller provides options / calendar / combobox. */
  children?: ReactNode;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  'aria-label'?: string;
  /** Testid for the trigger button (e.g. `"emaillogs-status-filter"`). */
  triggerTestId?: string;
  /** Testid for the popover content wrapper. */
  contentTestId?: string;
}

export const FilterDropdown = forwardRef<HTMLButtonElement, FilterDropdownProps>(function FilterDropdown(
  { label, value, count = 0, isDate = false, children, open, onOpenChange, disabled, className, contentClassName, 'aria-label': ariaLabel, triggerTestId, contentTestId },
  ref
) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const hasCount = count > 0;

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? `${label} filter`}
          data-testid={triggerTestId}
          className={cn(
            'h-9 px-2.5 inline-flex items-center gap-2 rounded-md whitespace-nowrap cursor-pointer',
            'bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800',
            'text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300',
            'hover:bg-zinc-100 dark:hover:bg-zinc-900',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-900',
            className
          )}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {isDate && <Calendar className="w-3 h-3 text-zinc-500 dark:text-zinc-400" strokeWidth={1.3} aria-hidden />}
          <span>{label}</span>
          {value && (
            <span className="text-zinc-500 dark:text-zinc-400">· {value}</span>
          )}
          {hasCount && (
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-full bg-red-700 dark:bg-red-400 text-white dark:text-zinc-900 text-[10px] font-semibold"
              style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
              aria-label={`${count} selected`}
            >
              {count}
            </span>
          )}
          <ChevronDown
            className={cn('w-3 h-3 text-zinc-500 dark:text-zinc-400 transition-transform', isOpen && 'rotate-180')}
            strokeWidth={1.4}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      {children && (
        <PopoverContent align="start" className={cn('min-w-[14rem] p-2', contentClassName)} data-testid={contentTestId}>
          {children}
        </PopoverContent>
      )}
    </Popover>
  );
});
