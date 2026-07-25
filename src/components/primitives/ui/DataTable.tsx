/**
 * DataTable — composition shell: header slot · body slot · pagination slot.
 * Variants: default · empty · loading · error · no-results · mobile.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: rounded-10 shell · flat at rest (2a lifts by the cream-on-page colour
 *   step, not a shadow) · overflow hidden · density compact 44h / cozy 56h.
 * Responsive: when `mobileBody` is provided, desktop rows render on ≥ md and mobile cards render on < md
 *   automatically — no viewport prop needed. Set `variant="mobile"` only for explicit mobile-first override.
 *
 * `surface="bare"` (2a list archetype, 2026-07-25): the shell disappears
 * entirely — no border, no radius, no fill — and the rows sit straight on the
 * page cream, held together by the `--border-faint` row hairlines alone. The
 * comp's List page has no card around its table; a card there would re-introduce
 * the boxed sub-card the 2a layout language forbids.
 *
 * Row expansion (caller-controlled): pass `renderExpanded` + flip `row.expanded`
 * to render an inline panel below the expanded row. Pattern adopted by JLTT /
 * General Works / OT tables — supersedes the older `ExpandableDataTable`
 * (shell) primitive over time. Caller owns the expanded-id state.
 *
 * The row strip lives in `DataTableRows`, the non-default bodies in
 * `DataTableStates` — both split out 2026-07-25 for the LOC ceiling.
 */

import { cn } from '@/lib/utils';
import { TableHeader, type TableHeaderColumn } from './TableHeader';
import { type DataRowDensity, type DataRowSurface } from './DataRow';
import { DataTableRows, type DataTableRow } from './DataTableRows';
import { DataTableLoadingBody, DataTableState, type DataTableStateAction } from './DataTableStates';

export type { DataTableStateAction } from './DataTableStates';
export type { DataTableRow } from './DataTableRows';

export type DataTableVariant = 'default' | 'empty' | 'loading' | 'error' | 'no-results' | 'mobile';

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
  /** Defaults to `card`. `bare` drops the shell for the 2a list archetype. */
  surface?: DataRowSurface;
  /** The one quiet action offered by the empty / no-results / error state. */
  stateAction?: DataTableStateAction;
  className?: string;
  /** `data-testid` on the DataTable shell div. */
  testId?: string;
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
  surface = 'card',
  stateAction,
  className,
  testId,
}: DataTableProps) {
  const bare = surface === 'bare';
  // Non-default variants (loading / empty / error / no-results / mobile) ignore
  // the responsive split — they render one body full-width on all viewports.
  const fullWidthBody = (() => {
    if (variant === 'loading') return <DataTableLoadingBody density={density} columnCount={columns.length} bare={bare} selectable={selectable} />;
    if (variant === 'empty') return <DataTableState variant="empty" message={emptyText} sub={emptySubtext} action={stateAction} bare={bare} />;
    if (variant === 'error') return <DataTableState variant="error" message={errorText} sub={errorSubtext} action={stateAction} bare={bare} />;
    if (variant === 'no-results') return <DataTableState variant="no-results" message={noResultsText} sub={noResultsSubtext} action={stateAction} bare={bare} />;
    if (variant === 'mobile') return mobileBody;
    return null;
  })();

  return (
    <div
      data-testid={testId}
      // Current variant, exposed for E2E: lists whose data is not guaranteed
      // (e.g. an empty advisor book) wait for `default|empty` before an axe
      // scan, so the loading skeleton is never scanned (crm load-a11y.spec).
      data-variant={variant}
      className={cn(
        bare
          ? 'bg-transparent'
          : 'rounded-xl overflow-hidden border border-border bg-card shadow-[var(--card-shadow-rest)]',
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
                surface={surface}
              />
            </div>
            <div role="rowgroup">
              <DataTableRows
                rows={rows}
                density={density}
                selectable={selectable}
                surface={surface}
                onRowSelectedChange={onRowSelectedChange}
                renderExpanded={renderExpanded}
              />
            </div>
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
