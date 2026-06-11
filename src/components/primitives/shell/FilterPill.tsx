/**
 * FilterPill — sits in FilterBar. default · active · focus · with-count.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 30h · 10px radius 6 · active bg red-50 + border red-700 · count badge 18×18 pill.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  value?: React.ReactNode;
  count?: number;
  active?: boolean;
  hasChevron?: boolean;
}

export const FilterPill = forwardRef<HTMLButtonElement, FilterPillProps>(function FilterPill(
  { label, value, count, active = false, hasChevron = true, className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-[6px] whitespace-nowrap',
        'h-[30px] px-[10px] rounded-md border',
        'text-[12px]',
        active
          ? 'bg-red-50 border-red-700 text-red-700 dark:bg-red-500/[0.10] dark:border-red-400 dark:text-red-400'
          : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 dark:focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      <span
        className={cn(
          'text-[10.5px] font-semibold uppercase tracking-[0.08em]',
          active
            ? 'text-red-700 dark:text-red-400'
            : 'text-zinc-500 dark:text-zinc-400'
        )}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </span>
      {value && (
        <span
          className={cn(
            'font-medium',
            active ? 'text-red-700 dark:text-red-400' : 'text-zinc-900 dark:text-zinc-50'
          )}
        >
          · {value}
        </span>
      )}
      {count != null && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'min-w-[18px] h-[18px] px-[5px]',
            'text-[10px] font-semibold',
            active
              ? 'bg-red-700 text-white dark:bg-red-400 dark:text-zinc-900'
              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
          )}
          style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
        >
          {count}
        </span>
      )}
      {hasChevron && (
        <svg
          width="8"
          height="8"
          viewBox="0 0 10 10"
          className="opacity-70"
          aria-hidden
        >
          <path
            d="M2 4 L5 7 L8 4"
            stroke="currentColor"
            strokeWidth="1.3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
});
