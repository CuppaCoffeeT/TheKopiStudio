/**
 * TableHeader — sortable column header row with Geist Mono uppercase labels.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: 40h · zinc-100/zinc-900 bg · 10.5px Geist Mono uppercase · 28px checkbox slot.
 */

import { cn } from '@/lib/utils';
import { SortIcon, type SortDir } from './SortIcon';
import { TableCheckbox } from './TableCheckbox';

export interface TableHeaderColumn {
  key: string;
  label: string;
  sortable?: boolean;
  sortDir?: SortDir;
  align?: 'left' | 'right';
  /** Flex basis / preferred px width. Acts as the column's resting size. */
  width?: number;
  /** Hard minimum px width. Defaults to `width` (no shrink) when grow is unset. */
  minWidth?: number;
  /** Flex grow weight. Defaults to 0 when `width` is set, 1 otherwise. */
  grow?: number;
  /** `data-testid` for Playwright targeting (e.g. sortable column header). */
  testId?: string;
}

export interface TableHeaderProps {
  columns: TableHeaderColumn[];
  selectable?: boolean;
  selectState?: 'none' | 'some' | 'all';
  onSelectAllChange?: (checked: boolean) => void;
  onSort?: (key: string) => void;
  className?: string;
}

export function TableHeader({
  columns,
  selectable = true,
  selectState = 'none',
  onSelectAllChange,
  onSort,
  className,
}: TableHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-stretch h-10 px-[14px]',
        'bg-secondary',
        'border-b border-border',
        'text-[10.5px] font-semibold uppercase tracking-[0.08em]',
        'text-muted-foreground',
        className
      )}
      role="row"
    >
      {selectable && (
        <div role="columnheader" aria-label="Select all rows" className="w-7 inline-flex items-center shrink-0">
          <TableCheckbox
            checked={selectState === 'all'}
            indeterminate={selectState === 'some'}
            onCheckedChange={onSelectAllChange}
          />
        </div>
      )}
      {columns.map((col) => {
        const isSorted = !!col.sortDir;
        const grow = col.grow ?? (col.width ? 0 : 1);
        const allowShrink = col.minWidth !== undefined || !col.width;
        const shrink = allowShrink ? 1 : 0;
        const basis = col.width ?? 0;
        const minWidth = col.minWidth ?? col.width ?? 0;
        const flexStyle = {
          flex: `${grow} ${shrink} ${basis}px`,
          minWidth,
        };
        const labelText = col.label?.trim() || col.key;
        const showLabel = !!col.label;
        const baseClasses = cn(
          'inline-flex items-center gap-[6px] px-2',
          col.align === 'right' ? 'justify-end' : 'justify-start',
          isSorted
            ? 'text-foreground'
            : 'text-muted-foreground',
        );
        if (!col.sortable) {
          return (
            <div
              key={col.key}
              role="columnheader"
              aria-label={showLabel ? undefined : labelText}
              data-testid={col.testId}
              className={cn(baseClasses, 'cursor-default')}
              style={flexStyle}
            >
              {showLabel && <span className="whitespace-nowrap">{col.label}</span>}
            </div>
          );
        }
        return (
          <button
            key={col.key}
            type="button"
            role="columnheader"
            aria-label={showLabel ? undefined : `Sort by ${labelText}`}
            aria-sort={
              col.sortDir === 'asc'
                ? 'ascending'
                : col.sortDir === 'desc'
                ? 'descending'
                : 'none'
            }
            data-testid={col.testId}
            onClick={() => onSort?.(col.key)}
            tabIndex={0}
            className={cn(
              baseClasses,
              'cursor-pointer',
              'hover:bg-secondary hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'bg-transparent border-0',
            )}
            style={flexStyle}
          >
            {showLabel && <span className="whitespace-nowrap">{col.label}</span>}
            <SortIcon dir={col.sortDir ?? null} />
          </button>
        );
      })}
    </div>
  );
}
