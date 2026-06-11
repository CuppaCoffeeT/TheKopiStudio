/**
 * CurrencyCell — W07 Phase 2 cell-level primitive.
 *
 * Renders an SGD currency amount in a table cell using `formatCurrency` from
 * `@/utils/currencyHelper` — the project's canonical SGD display
 * (`"$1,234.56"` via `Intl.NumberFormat('en-SG', …)`).
 *
 * Right-aligned + `tabular-nums` by default so vertically stacked amounts
 * align on the decimal point. Pair with `<TableHead className="text-right">`
 * on the column header.
 *
 * Consume from a DataTable column:
 *   ```tsx
 *   { accessorKey: 'total_amount', cell: (ctx) => <CurrencyCell value={ctx.getValue()} /> }
 *   ```
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatCurrencyValue } from '@/utils/currencyHelper';

export interface CurrencyCellProps {
  /** Numeric amount, or a string like `"1234.56"` from Postgres `numeric`. Null-safe. */
  value: number | string | null | undefined;
  /** Render without the `$` symbol (useful when the column header states the currency). */
  withoutSymbol?: boolean;
  /** Rendered when `value` is null/undefined/NaN. Defaults to an em-dash. */
  fallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function CurrencyCell({
  value,
  withoutSymbol = false,
  fallback = '—',
  className,
  style,
}: CurrencyCellProps) {
  const amount = toNumber(value);
  const rendered =
    amount === null ? null : withoutSymbol ? formatCurrencyValue(amount) : formatCurrency(amount);

  return (
    <span
      className={cn(
        'text-[12.5px] tabular-nums text-right text-zinc-900 dark:text-zinc-50 inline-block min-w-[4ch]',
        amount !== null && amount < 0 && 'text-red-700 dark:text-red-400',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)', ...style }}
    >
      {rendered ?? fallback}
    </span>
  );
}
