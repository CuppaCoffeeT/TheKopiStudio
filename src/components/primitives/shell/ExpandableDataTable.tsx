/**
 * ExpandableDataTable — tool-archetype data table with inline row expansion
 * into a multi-section detail popout. Sibling primitive to DataTable (which
 * serves list-archetype routes); the two are siblings, not successors.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-29-aNOsBrg/project/src/EDT.jsx
 * Showcase: docs/99-refactor/_system/design/handoffs/2026-04-29-aNOsBrg/project/ExpandableDataTable.html
 * Composed example: docs/99-refactor/_system/design/handoffs/2026-04-29-aNOsBrg/project/src/PayslipExample.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: focus ring brand-red never silent · selection rail = 2px brand-red
 *         left-inset · expanded rail = 4px brand-red left-inset · header text
 *         text-sm minimum on bg-card (4.5:1 AA enforced).
 *
 * Controlled API — selection, expansion, sort all live in caller state.
 * Skeleton/empty/error states render INSIDE the table card so chrome stays
 * consistent.
 */

import { type ReactNode, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

// ─── Public types ─────────────────────────────────────────────

export type EDTColumnAlign = 'left' | 'center' | 'right';

export interface EDTColumnDef<TRow> {
  id: string;
  header: ReactNode;
  align?: EDTColumnAlign;
  width?: string | number;
  cell: (row: TRow, rowIndex: number) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface EDTSortState {
  columnId: string | null;
  direction: 'asc' | 'desc';
}

export interface EDTSelectionConfig<TRow, TKey extends string | number> {
  ids: Set<TKey>;
  onChange: (next: Set<TKey>) => void;
  rowAriaLabel: (row: TRow) => string;
  allAriaLabel?: string;
}

export interface EDTEmptyState {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export interface EDTErrorState {
  title: string;
  description?: string;
  onRetry?: () => void;
}

export interface ExpandableDataTableProps<TRow, TKey extends string | number> {
  rows: TRow[];
  columns: EDTColumnDef<TRow>[];
  rowKey: (row: TRow) => TKey;

  selection?: EDTSelectionConfig<TRow, TKey>;

  rowActions?: (row: TRow) => ReactNode;
  rowActionsAriaLabel?: (row: TRow) => string;

  expandedRowId: TKey | null;
  onExpandRow: (id: TKey | null) => void;
  renderExpanded?: (row: TRow) => ReactNode;
  expandTrigger?: 'row' | 'chevron' | 'both';

  isLoading?: boolean;
  loadingRowCount?: number;
  emptyState?: EDTEmptyState;
  error?: EDTErrorState;

  sort?: EDTSortState;
  onSortChange?: (sort: EDTSortState) => void;

  density?: 'comfortable' | 'compact';
  className?: string;
  testId?: string;
  /** Optional footer rendered INSIDE the card shell, below the table body.
   *  Use for `<Pagination>` or per-table action bars so the pagination
   *  reads as part of the same surface — not a detached sibling. */
  footerSlot?: ReactNode;
}

// ─── Internal atoms (table-coupled — not exported standalone) ─

interface EDTCheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

function EDTCheckbox({ checked = false, indeterminate = false, disabled = false, ariaLabel }: EDTCheckboxProps) {
  const filled = checked || indeterminate;
  return (
    <span
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 rounded-[4px] border-[1.5px] flex-shrink-0',
        'transition-colors duration-[80ms] ease-linear',
        disabled
          ? 'border-border opacity-50 cursor-not-allowed'
          : filled
            ? 'bg-foreground border-foreground cursor-pointer'
            : 'bg-transparent border-[color:var(--hairline-frame)] cursor-pointer'
      )}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="var(--cta-primary-fg)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && !checked && (
        <span className="w-[7px] h-[1.5px] bg-[color:var(--cta-primary-fg)]" />
      )}
    </span>
  );
}

function EDTSortIcon({ dir }: { dir: 'asc' | 'desc' | null }) {
  if (dir === 'asc') {
    return (
      <svg width="9" height="9" viewBox="0 0 10 10" className="flex-shrink-0" aria-hidden="true">
        <path d="M5 2 L8 7 L2 7 Z" fill="currentColor" />
      </svg>
    );
  }
  if (dir === 'desc') {
    return (
      <svg width="9" height="9" viewBox="0 0 10 10" className="flex-shrink-0" aria-hidden="true">
        <path d="M5 8 L8 3 L2 3 Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" className="flex-shrink-0 opacity-50" aria-hidden="true">
      <path d="M5 1.2 L7.4 4 L2.6 4 Z M5 8.8 L7.4 6 L2.6 6 Z" fill="currentColor" />
    </svg>
  );
}

function EDTChevron({ open, size = 12 }: { open: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="flex-shrink-0 transition-transform duration-200 ease-out"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M2.5 4.5 L6 8 L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EDTSkeleton({ w = '60%', h = 10, style }: { w?: number | string; h?: number; style?: CSSProperties }) {
  return (
    <span
      className="inline-block animate-pulse rounded-[3px] bg-secondary"
      style={{ width: w, height: h, ...style }}
    />
  );
}

function EDTAlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function EDTFileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6V3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function EDTRefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 8a5 5 0 11-1.5-3.5M13 3v2.5h-2.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Header row ────────────────────────────────────────────────

interface HeaderRowProps<TRow> {
  columns: EDTColumnDef<TRow>[];
  hasSelection: boolean;
  hasActions: boolean;
  hasExpand: boolean;
  selectionState: 'none' | 'some' | 'all';
  sort?: EDTSortState;
  onSortChange?: (sort: EDTSortState) => void;
  allAriaLabel?: string;
  onToggleAll?: () => void;
}

function HeaderRow<TRow>({
  columns,
  hasSelection,
  hasActions,
  hasExpand,
  selectionState,
  sort,
  onSortChange,
  allAriaLabel,
  onToggleAll,
}: HeaderRowProps<TRow>) {
  return (
    <thead
      className="sticky top-0 z-[2]"
      style={{
        background: 'var(--surface)',
        boxShadow: 'inset 0 -1px 0 hsl(var(--border))',
      }}
    >
      <tr>
        {hasSelection && (
          <th
            scope="col"
            className="px-3 py-[10px] text-center align-middle"
            style={{ width: 50, fontFamily: 'var(--font-sans)', cursor: onToggleAll ? 'pointer' : 'default' }}
            onClick={onToggleAll}
            onKeyDown={(e) => {
              if (!onToggleAll) return;
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onToggleAll();
              }
            }}
            tabIndex={onToggleAll ? 0 : undefined}
          >
            <span className="inline-flex">
              <EDTCheckbox
                checked={selectionState === 'all'}
                indeterminate={selectionState === 'some'}
                ariaLabel={allAriaLabel || 'Select all rows'}
              />
            </span>
          </th>
        )}
        {columns.map((col) => {
          const dir = sort && sort.columnId === col.id ? sort.direction : null;
          const ariaSort = dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : col.sortable ? 'none' : undefined;
          return (
            <th
              key={col.id}
              scope="col"
              aria-sort={ariaSort}
              className="px-3 py-[10px] align-middle whitespace-nowrap"
              style={{
                width: col.width,
                textAlign: col.align || 'left',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--fg-muted)',
                letterSpacing: 0.2,
              }}
            >
              {col.sortable ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!onSortChange) return;
                    const next: EDTSortState = {
                      columnId: col.id,
                      direction: dir === 'asc' ? 'desc' : 'asc',
                    };
                    onSortChange(next);
                  }}
                  className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 m-0 cursor-pointer"
                  style={{
                    color: 'inherit',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                  }}
                >
                  {col.header}
                  <EDTSortIcon dir={dir} />
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5">{col.header}</span>
              )}
            </th>
          );
        })}
        {hasActions && (
          <th
            scope="col"
            className="px-3 py-[10px] text-right"
            style={{
              width: 132,
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--fg-muted)',
              letterSpacing: 0.2,
            }}
          >
            Actions
          </th>
        )}
        {hasExpand && (
          <th
            scope="col"
            aria-label="Expand row"
            className="px-2 py-[10px]"
            style={{ width: 44 }}
          />
        )}
      </tr>
    </thead>
  );
}

// ─── Body row + expanded panel ─────────────────────────────────

interface BodyRowProps<TRow, TKey extends string | number> {
  row: TRow;
  rowIndex: number;
  rowKey: (row: TRow) => TKey;
  columns: EDTColumnDef<TRow>[];
  selection?: EDTSelectionConfig<TRow, TKey>;
  rowActions?: (row: TRow) => ReactNode;
  rowActionsAriaLabel?: (row: TRow) => string;
  expandedRowId: TKey | null;
  onExpandRow: (id: TKey | null) => void;
  renderExpanded?: (row: TRow) => ReactNode;
  expandTrigger: 'row' | 'chevron' | 'both';
  density: 'comfortable' | 'compact';
}

function BodyRow<TRow, TKey extends string | number>({
  row,
  rowIndex,
  rowKey,
  columns,
  selection,
  rowActions,
  rowActionsAriaLabel,
  expandedRowId,
  onExpandRow,
  renderExpanded,
  expandTrigger,
  density,
}: BodyRowProps<TRow, TKey>) {
  const id = rowKey(row);
  const isSelected = selection ? selection.ids.has(id) : false;
  const isExpanded = expandedRowId === id;
  const panelId = `edt-panel-${String(id)}`;

  const hasExpand = !!renderExpanded;
  const colSpan = columns.length + (selection ? 1 : 0) + (rowActions ? 1 : 0) + (hasExpand ? 1 : 0);

  const triggersOnRowClick = hasExpand && (expandTrigger === 'row' || expandTrigger === 'both');
  const triggersOnChevron = hasExpand && (expandTrigger === 'chevron' || expandTrigger === 'both');

  const padY = density === 'compact' ? 8 : 14;

  const rowBg = isSelected
    ? 'var(--row-selected)'
    : 'var(--surface)';

  const handleRowToggle = () => {
    if (!triggersOnRowClick) return;
    onExpandRow(isExpanded ? null : id);
  };

  const toggleSelection = () => {
    if (!selection) return;
    const next = new Set(selection.ids);
    if (isSelected) next.delete(id);
    else next.add(id);
    selection.onChange(next);
  };

  return (
    <>
      <tr
        data-edt-row-id={String(id)}
        data-edt-selected={isSelected || undefined}
        data-edt-expanded={isExpanded || undefined}
        onClick={handleRowToggle}
        className="transition-colors duration-[80ms] ease-linear hover:bg-secondary"
        style={{
          background: rowBg,
          borderBottom: isExpanded ? 'none' : '1px solid var(--border-faint)',
          cursor: triggersOnRowClick ? 'pointer' : 'default',
          boxShadow: isExpanded
            ? 'inset 4px 0 0 var(--brand-red)'
            : isSelected
              ? 'inset 2px 0 0 var(--brand-red)'
              : 'none',
        }}
      >
        {selection && (
          <td
            className="px-3 text-center align-middle"
            style={{ width: 50, padding: '10px 12px' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSelection();
            }}
          >
            <EDTCheckbox checked={isSelected} ariaLabel={selection.rowAriaLabel(row)} />
          </td>
        )}
        {columns.map((col) => (
          <td
            key={col.id}
            className={col.className}
            style={{
              padding: `${padY}px 12px`,
              textAlign: col.align || 'left',
              verticalAlign: 'middle',
              width: col.width,
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--fg)',
            }}
          >
            {col.cell(row, rowIndex)}
          </td>
        ))}
        {rowActions && (
          <td
            className="text-right align-middle"
            style={{ width: 132, padding: '8px 12px' }}
            onClick={(e) => e.stopPropagation()}
            aria-label={rowActionsAriaLabel ? rowActionsAriaLabel(row) : 'Row actions'}
          >
            <span className="inline-flex items-center justify-end gap-1">
              {rowActions(row)}
            </span>
          </td>
        )}
        {hasExpand && (
          <td
            className="text-center align-middle"
            style={{ width: 44, padding: '8px 8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {triggersOnChevron && (
              <button
                type="button"
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => onExpandRow(isExpanded ? null : id)}
                className="inline-flex w-7 h-7 items-center justify-center rounded-md border-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[color:hsl(var(--ring))]"
                style={{
                  background: isExpanded ? 'hsl(var(--muted))' : 'transparent',
                  color: 'var(--fg-muted)',
                }}
              >
                <EDTChevron open={isExpanded} />
              </button>
            )}
          </td>
        )}
      </tr>

      {isExpanded && hasExpand && (
        <tr>
          <td
            id={panelId}
            colSpan={colSpan}
            style={{
              padding: 0,
              background: 'var(--surface-subtle)',
              borderTop: '1px solid hsl(var(--border))',
              borderBottom: '1px solid var(--border-faint)',
              boxShadow: 'inset 4px 0 0 var(--brand-red)',
            }}
          >
            <div
              className="motion-safe:animate-[fade-in-up_200ms_cubic-bezier(0.19,1,0.22,1)_backwards]"
              style={{ padding: '20px 24px 24px 28px' }}
            >
              {renderExpanded?.(row)}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Skeleton row ──────────────────────────────────────────────

function SkeletonRow<TRow>({
  columns,
  hasSelection,
  hasActions,
  hasExpand,
}: {
  columns: EDTColumnDef<TRow>[];
  hasSelection: boolean;
  hasActions: boolean;
  hasExpand: boolean;
}) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
      {hasSelection && (
        <td className="px-3 py-[14px] text-center">
          <EDTSkeleton w={14} h={14} style={{ borderRadius: 4 }} />
        </td>
      )}
      {columns.map((col, i) => (
        <td
          key={col.id}
          className="px-3 py-[14px]"
          style={{ textAlign: col.align || 'left' }}
        >
          <EDTSkeleton w={i % 3 === 0 ? '50%' : i % 3 === 1 ? '78%' : '38%'} h={10} />
        </td>
      ))}
      {hasActions && (
        <td className="px-3 py-[14px] text-right">
          <EDTSkeleton w={88} h={10} />
        </td>
      )}
      {hasExpand && (
        <td className="px-2 py-[14px] text-center">
          <EDTSkeleton w={14} h={14} style={{ borderRadius: 4 }} />
        </td>
      )}
    </tr>
  );
}

// ─── Empty / error panels ──────────────────────────────────────

function StatePanel({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0, background: 'var(--surface)' }}>
        <div style={{ padding: '64px 24px' }}>{children}</div>
      </td>
    </tr>
  );
}

function EmptyPanel({ icon, title, description, action }: EDTEmptyState) {
  return (
    <div className="flex flex-col items-center gap-[14px] text-center max-w-[420px] mx-auto">
      <div
        className="flex items-center justify-center w-14 h-14 rounded-[14px] border border-dashed"
        style={{
          background: 'var(--surface-subtle)',
          borderColor: 'hsl(var(--border))',
          color: 'var(--fg-muted)',
        }}
      >
        {icon || <EDTFileIcon />}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>{title}</div>
        {description && (
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}

function ErrorPanel({ title, description, onRetry }: EDTErrorState) {
  return (
    <div className="flex flex-col items-center gap-3 text-center max-w-[420px] mx-auto">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full"
        style={{
          background: 'var(--red-soft)',
          color: 'var(--brand-red)',
        }}
      >
        <EDTAlertIcon />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg)', marginBottom: 4 }}>{title}</div>
        {description && (
          <div style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.5 }}>{description}</div>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg border-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            background: 'var(--cta-primary-bg)',
            color: 'var(--cta-primary-fg)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12.5,
            fontWeight: 500,
          }}
        >
          <EDTRefreshIcon /> Retry
        </button>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────

export function ExpandableDataTable<TRow, TKey extends string | number>({
  rows,
  columns,
  rowKey,
  selection,
  rowActions,
  rowActionsAriaLabel,
  expandedRowId,
  onExpandRow,
  renderExpanded,
  expandTrigger = 'both',
  isLoading = false,
  loadingRowCount = 5,
  emptyState,
  error,
  sort,
  onSortChange,
  density = 'comfortable',
  className,
  testId,
  footerSlot,
}: ExpandableDataTableProps<TRow, TKey>) {
  if (
    process.env.NODE_ENV !== 'production' &&
    selection &&
    (typeof selection.rowAriaLabel !== 'function')
  ) {
    console.warn('[ExpandableDataTable] selection.rowAriaLabel is required when selection is enabled');
  }

  const hasSelection = !!selection;
  const hasActions = !!rowActions;
  const hasExpand = !!renderExpanded;

  const colSpan = columns.length + (hasSelection ? 1 : 0) + (hasActions ? 1 : 0) + (hasExpand ? 1 : 0);

  let selectionState: 'none' | 'some' | 'all' = 'none';
  if (selection) {
    const selCount = selection.ids.size;
    if (selCount === 0) selectionState = 'none';
    else if (selCount >= rows.length && rows.length > 0) selectionState = 'all';
    else selectionState = 'some';
  }

  const handleToggleAll = selection && rows.length > 0
    ? () => {
        if (selectionState === 'all') {
          selection.onChange(new Set());
        } else {
          selection.onChange(new Set(rows.map(rowKey)));
        }
      }
    : undefined;

  return (
    <div
      data-testid={testId}
      className={cn('overflow-hidden rounded-xl', className)}
      style={{
        background: 'var(--surface)',
        border: '1px solid hsl(var(--border))',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div className="overflow-x-auto" tabIndex={0}>
        <table
          className="w-full border-separate"
          style={{ borderSpacing: 0, tableLayout: 'auto' }}
        >
          <HeaderRow
            columns={columns}
            hasSelection={hasSelection}
            hasActions={hasActions}
            hasExpand={hasExpand}
            selectionState={selectionState}
            sort={sort}
            onSortChange={onSortChange}
            allAriaLabel={selection ? selection.allAriaLabel : undefined}
            onToggleAll={handleToggleAll}
          />
          <tbody>
            {isLoading &&
              Array.from({ length: loadingRowCount }).map((_, i) => (
                <SkeletonRow
                  key={i}
                  columns={columns}
                  hasSelection={hasSelection}
                  hasActions={hasActions}
                  hasExpand={hasExpand}
                />
              ))}

            {!isLoading && error && (
              <StatePanel colSpan={colSpan}>
                <ErrorPanel title={error.title} description={error.description} onRetry={error.onRetry} />
              </StatePanel>
            )}

            {!isLoading && !error && rows.length === 0 && emptyState && (
              <StatePanel colSpan={colSpan}>
                <EmptyPanel
                  icon={emptyState.icon}
                  title={emptyState.title}
                  description={emptyState.description}
                  action={emptyState.action}
                />
              </StatePanel>
            )}

            {!isLoading &&
              !error &&
              rows.length > 0 &&
              rows.map((row, idx) => (
                <BodyRow
                  key={String(rowKey(row))}
                  row={row}
                  rowIndex={idx}
                  rowKey={rowKey}
                  columns={columns}
                  selection={selection}
                  rowActions={rowActions}
                  rowActionsAriaLabel={rowActionsAriaLabel}
                  expandedRowId={expandedRowId}
                  onExpandRow={onExpandRow}
                  renderExpanded={renderExpanded}
                  expandTrigger={expandTrigger}
                  density={density}
                />
              ))}
          </tbody>
        </table>
      </div>
      {footerSlot && (
        <div
          className="border-t"
          style={{
            background: 'var(--surface-subtle)',
            borderColor: 'hsl(var(--border))',
          }}
        >
          {footerSlot}
        </div>
      )}
    </div>
  );
}
