/**
 * TableCheckbox — 16×16 checkbox for row selection (smaller than form Checkbox, same formula).
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 16×16 box · CTA slate-800 when on · border zinc-300 / hover zinc-400.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TableCheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const TableCheckbox = forwardRef<HTMLButtonElement, TableCheckboxProps>(
  function TableCheckbox(
    { checked = false, indeterminate = false, onCheckedChange, disabled, className, ...props },
    ref
  ) {
    const on = checked || indeterminate;
    // Default an aria-label so axe-playwright button-name passes when the
    // caller doesn't pass one. Callers may still override via `...props`
    // (e.g. "Select row" / "Select all rows") to be more specific.
    const ariaLabel = (props as { 'aria-label'?: string })['aria-label'] ?? 'Toggle selection';
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'inline-flex items-center justify-center shrink-0',
          'w-4 h-4 rounded-[4px] border-[1.5px] transition-colors',
          on
            ? 'bg-slate-800 border-slate-800 dark:bg-slate-100 dark:border-slate-100'
            : 'bg-white border-zinc-300 hover:border-zinc-400 dark:bg-zinc-950 dark:border-zinc-700 dark:hover:border-zinc-600',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
          disabled && 'opacity-40 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {checked && !indeterminate && (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path
              d="M2 5.2 L4.2 7.4 L8 3.2"
              className="stroke-white dark:stroke-slate-900"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {indeterminate && (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
            <path
              d="M2.5 5 H7.5"
              className="stroke-white dark:stroke-slate-900"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
    );
  }
);
