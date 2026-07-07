/**
 * NumberCell — W07 Phase 2 cell-level primitive.
 *
 * Renders a numeric amount with thousands separators via `formatNumberWithCommas`
 * from `@/utils/numberFormatter`. Right-aligned + `tabular-nums` so stacked
 * numbers align on the decimal point.
 *
 * For SGD money, use `<CurrencyCell>` instead. For dates, use `<DateCell>`.
 *
 * Consume from a DataTable column:
 *   ```tsx
 *   { accessorKey: 'quantity', cell: (ctx) => <NumberCell value={ctx.getValue()} decimals={0} /> }
 *   ```
 */

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { formatNumberWithCommas } from '@/utils/numberFormatter';

export interface NumberCellProps {
  value: number | string | null | undefined;
  /** Decimal places — defaults to `2`. Use `0` for integer counts. */
  decimals?: number;
  /** Optional unit suffix (e.g. `"m²"`, `"hrs"`). Rendered with a half-space. */
  unit?: string;
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

export function NumberCell({
  value,
  decimals = 2,
  unit,
  fallback = '—',
  className,
  style,
}: NumberCellProps) {
  const amount = toNumber(value);
  const rendered = amount === null ? null : formatNumberWithCommas(amount, decimals);

  return (
    <span
      className={cn(
        'text-[12.5px] tabular-nums text-right text-foreground inline-block min-w-[3ch]',
        className,
      )}
      style={{ fontFamily: 'var(--font-sans)', ...style }}
    >
      {rendered !== null ? (unit ? `${rendered}\u2009${unit}` : rendered) : fallback}
    </span>
  );
}
