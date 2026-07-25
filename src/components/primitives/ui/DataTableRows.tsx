/**
 * DataTableRows — the desktop row strip rendered inside `DataTable`'s rowgroup.
 *
 * Split out of `DataTable` (2026-07-25) so both files stay under the LOC
 * ceiling. `DataTable` re-exports `DataTableRow`, which stays the public type.
 *
 * Returns a fragment of `<DataRow>`s (plus the optional inline expand panel),
 * so the caller keeps ownership of the `role="rowgroup"` wrapper.
 */

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { DataRow, type DataRowCell, type DataRowDensity, type DataRowState, type DataRowSurface } from './DataRow';

export interface DataTableRow {
  id?: string | number;
  state?: DataRowState;
  selected?: boolean;
  /** When true AND `DataTable.renderExpanded` is set, an inline panel is
   *  rendered immediately below the row (desktop only — mobile cards
   *  manage their own detail surface). Caller owns the open-state. */
  expanded?: boolean;
  cells: DataRowCell[];
  /** Row click handler — fires on row body (checkbox stops propagation). Optional. */
  onClick?: () => void;
  /** Row-level `data-testid` for Playwright. Optional. */
  testId?: string;
}

export interface DataTableRowsProps {
  rows: DataTableRow[];
  density: DataRowDensity;
  selectable: boolean;
  surface: DataRowSurface;
  onRowSelectedChange?: (rowId: string | number | undefined, checked: boolean) => void;
  renderExpanded?: (row: DataTableRow) => React.ReactNode;
}

export function DataTableRows({
  rows,
  density,
  selectable,
  surface,
  onRowSelectedChange,
  renderExpanded,
}: DataTableRowsProps) {
  const bare = surface === 'bare';
  return (
    <>
      {rows.map((row, i) => {
        const isExpanded = row.expanded === true && !!renderExpanded;
        return (
          <Fragment key={row.id ?? i}>
            <DataRow
              density={density}
              state={row.state || 'default'}
              selectable={selectable}
              selected={row.selected}
              cells={row.cells}
              surface={surface}
              onSelectedChange={(checked) => onRowSelectedChange?.(row.id, checked)}
              onClick={row.onClick}
              data-testid={row.testId}
              aria-expanded={renderExpanded ? isExpanded : undefined}
            />
            {isExpanded && (
              <div
                role="row"
                data-row-expanded={row.id}
                className={cn(
                  'border-b border-border',
                  'bg-secondary',
                  // Indent under the checkbox column so the panel aligns with
                  // the first content cell.
                  selectable ? 'pl-[44px]' : bare ? 'pl-2' : 'pl-[14px]',
                  bare ? 'pr-2' : 'pr-[14px]',
                  'py-3',
                )}
              >
                {renderExpanded!(row)}
              </div>
            )}
          </Fragment>
        );
      })}
    </>
  );
}
