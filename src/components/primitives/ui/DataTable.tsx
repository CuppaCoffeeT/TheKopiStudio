/**
 * DataTable — composition shell: header slot · body slot · pagination slot.
 * Variants: default · empty · loading · error · no-results · mobile.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: rounded-10 shell · subtle shadow · overflow hidden · density compact 44h / cozy 56h.
 * Responsive: when `mobileBody` is provided, desktop rows render on ≥ md and mobile cards render on < md
 *   automatically — no viewport prop needed. Set `variant="mobile"` only for explicit mobile-first override.
 *
 * Row expansion (caller-controlled): pass `renderExpanded` + flip `row.expanded`
 * to render an inline panel below the expanded row. Pattern adopted by JLTT /
 * General Works / OT tables — supersedes the older `ExpandableDataTable`
 * (shell) primitive over time. Caller owns the expanded-id state.
 */

import { Fragment } from 'react';
import { cn } from '@/lib/utils';
import { FileText, AlertCircle } from 'lucide-react';
import { TableHeader, type TableHeaderColumn } from './TableHeader';
import { DataRow, type DataRowCell, type DataRowDensity, type DataRowState } from './DataRow';

export type DataTableVariant =
  | 'default'
  | 'empty'
  | 'loading'
  | 'error'
  | 'no-results'
  | 'mobile';

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

export interface DataTableProps {
  density?: DataRowDensity;
  variant?: DataTableVariant;
  columns: TableHeaderColumn[];
  rows?: DataTableRow[];
  selectable?: boolean;
  selectState?: 'none' | 'some' | 'all';
  onSelectAllChange?: (checked: boolean) => void;
  onSort?: (key: string) => void;
  onRowSelectedChange?: (rowId: string | number | undefined, checked: boolean) => void;
  pagination?: React.ReactNode;
  emptyText?: string;
  emptySubtext?: string;
  errorText?: string;
  errorSubtext?: string;
  noResultsText?: string;
  noResultsSubtext?: string;
  mobileBody?: React.ReactNode;
  /** Optional inline-expand panel renderer. When set, every row whose
   *  `expanded === true` renders this panel beneath it (full-width, indented
   *  to clear the checkbox column). Caller owns expand state — typically a
   *  `useState<string|null>` keyed by row id, toggled in `row.onClick`. */
  renderExpanded?: (row: DataTableRow) => React.ReactNode;
  className?: string;
  /** `data-testid` on the DataTable shell div. */
  testId?: string;
}

function EmptyState({
  variant,
  message,
  sub,
}: {
  variant: 'empty' | 'error' | 'no-results';
  message: string;
  sub: string;
}) {
  const isError = variant === 'error';
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-[10px] text-center',
        'px-5 py-14 bg-card'
      )}
      role={isError ? 'alert' : 'status'}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-full',
          'border border-dashed border-border',
          isError
            ? 'text-red-700 dark:text-red-400'
            : 'text-muted-foreground'
        )}
      >
        {isError ? (
          <AlertCircle className="w-[18px] h-[18px]" aria-hidden />
        ) : (
          <FileText className="w-[18px] h-[18px]" aria-hidden />
        )}
      </span>
      <div
        className="text-[14px] font-medium text-foreground"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {message}
      </div>
      <div
        className="text-[11px] text-muted-foreground"
      >
        {sub}
      </div>
    </div>
  );
}

function LoadingBody({
  density,
  columnCount,
}: {
  density: DataRowDensity;
  columnCount: number;
}) {
  const rows = 6;
  const cols = Math.max(3, columnCount);
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-[14px] px-[14px]',
            density === 'comfortable'
              ? 'min-h-[72px]'
              : density === 'cozy'
                ? 'min-h-[56px]'
                : 'min-h-[44px]',
            'border-b border-border',
            'bg-card'
          )}
        >
          <span className="w-4 h-4 rounded-[4px] bg-secondary animate-pulse" />
          {Array.from({ length: cols }).map((_, j) => (
            <span
              key={j}
              className="flex-1 h-[10px] rounded-[3px] bg-secondary animate-pulse"
              style={{ opacity: 0.9 - j * 0.1 }}
            />
          ))}
        </div>
      ))}
    </>
  );
}

export function DataTable({
  density = 'compact',
  variant = 'default',
  columns,
  rows = [],
  selectable = true,
  selectState = 'none',
  onSelectAllChange,
  onSort,
  onRowSelectedChange,
  pagination,
  emptyText = 'No records yet.',
  emptySubtext = 'Create the first entry to get started.',
  errorText = 'Failed to load.',
  errorSubtext = 'Retry or contact support.',
  noResultsText = 'No matches for your filters.',
  noResultsSubtext = 'Clear filters to see everything.',
  mobileBody,
  renderExpanded,
  className,
  testId,
}: DataTableProps) {
  // Non-default variants (loading / empty / error / no-results / mobile) ignore
  // the responsive split — they render one body full-width on all viewports.
  const fullWidthBody = (() => {
    if (variant === 'loading') return <LoadingBody density={density} columnCount={columns.length} />;
    if (variant === 'empty') return <EmptyState variant="empty" message={emptyText} sub={emptySubtext} />;
    if (variant === 'error') return <EmptyState variant="error" message={errorText} sub={errorSubtext} />;
    if (variant === 'no-results') return <EmptyState variant="no-results" message={noResultsText} sub={noResultsSubtext} />;
    if (variant === 'mobile') return mobileBody;
    return null;
  })();

  const desktopRows = rows.map((row, i) => {
    const isExpanded = row.expanded === true && !!renderExpanded;
    return (
      <Fragment key={row.id ?? i}>
        <DataRow
          density={density}
          state={row.state || 'default'}
          selectable={selectable}
          selected={row.selected}
          cells={row.cells}
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
              selectable ? 'pl-[44px]' : 'pl-[14px]',
              'pr-[14px] py-3',
            )}
          >
            {renderExpanded!(row)}
          </div>
        )}
      </Fragment>
    );
  });

  return (
    <div
      data-testid={testId}
      // Current variant, exposed for E2E: lists whose data is not guaranteed
      // (e.g. an empty advisor book) wait for `default|empty` before an axe
      // scan, so the loading skeleton is never scanned (crm load-a11y.spec).
      data-variant={variant}
      className={cn(
        'rounded-[10px] overflow-hidden',
        'border border-border',
        'bg-card',
        'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        className
      )}
    >
      {variant === 'default' ? (
        // Tabular surface — split into two CSS-responsive subtrees so the
        // role=table only exists when its rowgroup children are visible.
        // Wrapping role=table around hidden rowgroups + a role=list child
        // trips axe `aria-required-children` on mobile viewports.
        <>
          {/* Desktop table: `overflow-x-auto` so columns wider than the viewport
              (medium screens — iPad portrait ~768px / cramped windows) horizontally
              scroll instead of being clipped by the outer rounded-corner overflow.
              Without this, the rightmost columns (actions/status) silently vanish
              on medium widths and supervisors can't reach Resume/Delete buttons. */}
          <div role={renderExpanded ? 'treegrid' : 'table'} className="hidden md:block overflow-x-auto">
            <div role="rowgroup">
              <TableHeader
                columns={columns}
                selectable={selectable}
                selectState={selectState}
                onSelectAllChange={onSelectAllChange}
                onSort={onSort}
              />
            </div>
            <div role="rowgroup">{desktopRows}</div>
          </div>
          {mobileBody && (
            <div role="list" className="md:hidden">{mobileBody}</div>
          )}
        </>
      ) : (
        // Non-tabular surfaces (loading/empty/error/no-results/mobile-only) render as
        // a list region — no role=table because there are no rows/columns to model.
        // mobile variant: cards are list items; loading/empty: status messages.
        <div role={variant === 'mobile' ? 'list' : 'region'} aria-label={variant === 'mobile' ? 'Items' : undefined}>
          {fullWidthBody}
        </div>
      )}

      {pagination}
    </div>
  );
}
