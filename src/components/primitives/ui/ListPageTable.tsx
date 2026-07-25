/**
 * ListPageTable — the bare 2a table + its pagination footer.
 *
 * Split out of `ListPageFrame` (2026-07-25) so both files stay under the LOC
 * ceiling; `ListPageFrameProps` extends this file's props, so adopters keep one
 * flat prop bag on the frame.
 *
 * `surface="bare"`: no card wrapper. The rows sit straight on the page cream and
 * are held apart by the `--border-faint` hairlines alone (KOPI_2A_SPEC →
 * "Archetype — list"). Pagination keeps the same flush ground — only its
 * `border-top` closes the table off — and is NON-optional: every list in this
 * codebase is server-bounded by `.range()`, so the page control must always be
 * reachable.
 */

import { type ReactNode } from 'react';
import { DataTable, type DataTableRow, type DataTableStateAction, type DataTableVariant } from './DataTable';
import { type DataRowDensity } from './DataRow';
import { type TableHeaderColumn } from './TableHeader';
import { Pagination } from './Pagination';

export interface ListPageTableProps {
  columns: TableHeaderColumn[];
  rows: DataTableRow[];
  variant?: DataTableVariant;
  /** Custom copy for the `empty` variant — forwarded to DataTable (additive, 2026-06-11). */
  emptyText?: string;
  emptySubtext?: string;
  /** Custom copy for the `no-results` variant — forwarded to DataTable (additive, 2026-06-11). */
  noResultsText?: string;
  noResultsSubtext?: string;
  density?: DataRowDensity;
  selectable?: boolean;
  selectState?: 'none' | 'some' | 'all';
  onSelectAllChange?: (checked: boolean) => void;
  onRowSelectedChange?: (id: string | number | undefined, checked: boolean) => void;
  onSort?: (key: string) => void;
  mobileBody?: ReactNode;
  /** Optional inline row-expand renderer — forwarded to DataTable. Caller
   *  flips `row.expanded` to toggle. Pattern adopted by JLTT/GW/OT tables. */
  renderExpanded?: (row: DataTableRow) => ReactNode;
  page: number;
  totalPages: number;
  totalItems: number;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onPageChange: (page: number) => void;
  onRowsPerPageChange?: (n: number) => void;
  /** `data-testid` forwarded to DataTable shell — e.g. "quotations-table-body". */
  tableTestId?: string;
}

interface InternalProps extends ListPageTableProps {
  /** The one quiet action the empty / no-results state offers. Frame-computed. */
  stateAction?: DataTableStateAction;
}

export function ListPageTable({
  columns, rows, variant = 'default', density = 'compact',
  emptyText, emptySubtext, noResultsText, noResultsSubtext,
  selectable = true, selectState = 'none', onSelectAllChange, onRowSelectedChange, onSort,
  mobileBody, renderExpanded, stateAction,
  page, totalPages, totalItems, rowsPerPage, rowsPerPageOptions, onPageChange, onRowsPerPageChange,
  tableTestId,
}: InternalProps) {
  const pageSize = rowsPerPage ?? 100;
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <DataTable
      surface="bare"
      density={density}
      variant={variant}
      emptyText={emptyText}
      emptySubtext={emptySubtext}
      noResultsText={noResultsText}
      noResultsSubtext={noResultsSubtext}
      stateAction={stateAction}
      columns={columns}
      rows={rows}
      selectable={selectable}
      selectState={selectState}
      onSelectAllChange={onSelectAllChange}
      onRowSelectedChange={onRowSelectedChange}
      onSort={onSort}
      mobileBody={mobileBody}
      renderExpanded={renderExpanded}
      testId={tableTestId}
      pagination={
        <Pagination
          className="bg-transparent px-0"
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          total={totalItems}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={rowsPerPageOptions}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      }
    />
  );
}
