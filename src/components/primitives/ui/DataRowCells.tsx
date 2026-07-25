/**
 * DataRowCells — the cell strip rendered inside `DataRow`.
 *
 * Split out of `DataRow` (2026-07-25) so both files stay under the LOC ceiling.
 * The cell contract (`DataRowCell`) lives here and is re-exported from
 * `DataRow`, which remains the public import path for adopters.
 *
 * 2a ink ladder: the primary (first) cell is `--fg`, the rest `--fg-dim`, and a
 * `muted` meta cell steps down to `--fg-muted` — except on the bare list, where
 * `#7d6b5b` measures 4.12:1 against the page cream and fails AA; there the meta
 * step is carried by size (12px) at the AA-safe `--fg-dim` instead.
 *
 * `tone` covers plain-text status — the comp's Report column reads sage for
 * "Generated" and muted for "Pending", and an overdue date reads terracotta.
 * All three resolve to the AA-safe text variants, never the raw brand fills,
 * because a table cell is always well under 18px.
 *
 * Every cell is IBM Plex Sans. 2a has no monospace role, so numeric columns get
 * their alignment from `tabular-nums` (see `numeric` below), not from a mono family.
 */

import { cn } from '@/lib/utils';

/** Semantic ink for status / meta cells — always an AA-safe text variant. */
export type DataRowCellTone = 'positive' | 'neutral' | 'negative';

const CELL_TONE: Record<DataRowCellTone, string> = {
  positive: 'text-[color:var(--sage-text)] font-semibold',
  neutral: 'text-[color:var(--fg-dim)]',
  negative: 'text-[color:var(--negative-text)] font-medium',
};

export interface DataRowCell {
  key?: string;
  content: React.ReactNode;
  align?: 'left' | 'right';
  /** Flex basis / preferred px width. Acts as the column's resting size. */
  width?: number;
  /** Hard minimum px width. Defaults to `width` (no shrink) when grow is unset. */
  minWidth?: number;
  /** Flex grow weight. Defaults to 0 when `width` is set, 1 otherwise. */
  grow?: number;
  /** Allow content to wrap onto multiple lines. Defaults to false (truncate). */
  wrap?: boolean;
  /** Opts the cell into tabular figures. Named `mono` for historical reasons —
   *  2a uses no monospace stack, so this no longer changes the family. */
  mono?: boolean;
  muted?: boolean;
  /** Plain-text status ink — sage for "Generated", muted for "Pending",
   *  terracotta for overdue. Wins over `muted` when both are set. */
  tone?: DataRowCellTone;
}

export interface DataRowCellsProps {
  cells: DataRowCell[];
  /** True when the row sits on the page cream with no card wrapper. */
  bare: boolean;
  /** True when a checkbox occupies the first slot, so cell 0 is not flush-left. */
  selectable: boolean;
}

export function DataRowCells({ cells, bare, selectable }: DataRowCellsProps) {
  return (
    <>
      {cells.map((cell, i) => {
        const grow = cell.grow ?? (cell.width ? 0 : 1);
        const allowShrink = cell.minWidth !== undefined || !cell.width;
        const shrink = allowShrink ? 1 : 0;
        const basis = cell.width ?? 0;
        const minWidth = cell.minWidth ?? cell.width ?? 0;
        // Right-aligned columns are the numeric ones by convention — they get
        // tabular figures so the digits line up down the column.
        const numeric = cell.align === 'right' || cell.mono === true;
        return (
          <div
            key={cell.key || i}
            role="cell"
            className={cn(
              'flex gap-2 px-2',
              // Bare rows run flush to the page gutter at both ends.
              bare && i === 0 && !selectable && 'pl-0',
              bare && i === cells.length - 1 && 'pr-0',
              cell.wrap ? 'items-start' : 'items-center',
              cell.align === 'right' ? 'justify-end' : 'justify-start',
              cell.wrap
                ? 'whitespace-normal break-words min-w-0'
                : 'whitespace-nowrap overflow-hidden text-ellipsis',
              cell.tone
                ? CELL_TONE[cell.tone]
                : cell.muted
                  ? bare
                    ? 'text-[12px] text-[color:var(--fg-dim)]'
                    : 'text-muted-foreground'
                  : i === 0
                    ? 'text-foreground'
                    : 'text-[color:var(--fg-dim)]'
            )}
            style={{
              flex: `${grow} ${shrink} ${basis}px`,
              minWidth,
              fontFamily: 'var(--font-sans)',
              fontVariantNumeric: numeric ? 'tabular-nums' : 'normal',
            }}
          >
            {cell.content}
          </div>
        );
      })}
    </>
  );
}
