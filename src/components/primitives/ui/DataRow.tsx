/**
 * DataRow — list row with default/hover/selected/focused/disabled states.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/DataTablePrimitives.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-nl73fwyg/project/ui_kits/appbase/src/table/DataTablePrimitives.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: compact 44h · cozy 56h · rows sit on card cream and separate with the
 * --border-faint repetition hairline; hover/selected are translucent brown
 * washes (--row-hover / --row-selected) so the state reads on BOTH the page
 * cream (dashboard table) and the card cream (list table) — a solid tint would
 * vanish on one of them. Focus is the inset 2px brown ring.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { TableCheckbox } from './TableCheckbox';

export type DataRowDensity = 'compact' | 'cozy' | 'comfortable';
export type DataRowState = 'default' | 'hover' | 'selected' | 'focused' | 'disabled';

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
  mono?: boolean;
  muted?: boolean;
}

const DENSITY_MIN_H: Record<DataRowDensity, string> = {
  compact: 'min-h-[44px]',
  cozy: 'min-h-[56px]',
  comfortable: 'min-h-[72px]',
};

const DENSITY_PY: Record<DataRowDensity, string> = {
  compact: 'py-1',
  cozy: 'py-2',
  comfortable: 'py-3',
};

export interface DataRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  density?: DataRowDensity;
  state?: DataRowState;
  selectable?: boolean;
  selected?: boolean;
  cells: DataRowCell[];
  onSelectedChange?: (checked: boolean) => void;
}

export const DataRow = forwardRef<HTMLDivElement, DataRowProps>(function DataRow(
  {
    density = 'compact',
    state = 'default',
    selectable = true,
    selected = false,
    cells,
    onSelectedChange,
    className,
    onClick,
    onKeyDown,
    ...props
  },
  ref
) {
  const disabled = state === 'disabled';
  // `selected` prop promotes visual state to 'selected' so checkbox-selection and
  // state-driven selection share one code path (--row-selected brown wash).
  const effectiveState = selected && state === 'default' ? 'selected' : state;
  // Keyboard activation for clickable rows (WCAG 2.1.1): a row with an onClick
  // is focusable, so Enter/Space must trigger it too — mouse-only would strand
  // keyboard users. No-op when the row isn't clickable.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!disabled && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  };
  return (
    <div
      ref={ref}
      role="row"
      aria-selected={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex items-center px-[14px]',
        DENSITY_MIN_H[density],
        DENSITY_PY[density],
        'border-b border-[color:var(--border-faint)]',
        // Surface default
        'bg-card',
        // Hover — translucent brown wash; reads on page cream AND card cream
        !disabled &&
          effectiveState !== 'selected' &&
          'hover:bg-[color:var(--row-hover)]',
        effectiveState === 'hover' && 'bg-[color:var(--row-hover)]',
        effectiveState === 'selected' &&
          'bg-[color:var(--row-selected)] hover:bg-primary/[0.16]',
        effectiveState === 'focused' &&
          'shadow-[inset_0_0_0_2px_var(--cta-primary-bg)]',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        'text-[13px] text-[color:var(--fg-dim)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0 top-0 bottom-0 w-[2px]',
          effectiveState === 'selected' || effectiveState === 'focused'
            ? 'bg-primary'
            : 'bg-transparent'
        )}
      />
      {selectable && (
        <div
          role="cell"
          aria-label="Select row"
          className="w-7 inline-flex items-center shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <TableCheckbox
            checked={selected}
            onCheckedChange={onSelectedChange}
            disabled={disabled}
          />
        </div>
      )}
      {cells.map((cell, i) => {
        const grow = cell.grow ?? (cell.width ? 0 : 1);
        const allowShrink = cell.minWidth !== undefined || !cell.width;
        const shrink = allowShrink ? 1 : 0;
        const basis = cell.width ?? 0;
        const minWidth = cell.minWidth ?? cell.width ?? 0;
        return (
          <div
            key={cell.key || i}
            role="cell"
            className={cn(
              'flex gap-2 px-2',
              cell.wrap ? 'items-start' : 'items-center',
              cell.align === 'right' ? 'justify-end' : 'justify-start',
              cell.wrap
                ? 'whitespace-normal break-words min-w-0'
                : 'whitespace-nowrap overflow-hidden text-ellipsis',
              // 2a ink ladder: primary (first) cell --fg, remaining cells
              // --fg-dim, meta --fg-muted. Hierarchy is carried by these steps
              // and the hairlines — never by brown.
              cell.muted
                ? 'text-muted-foreground'
                : i === 0
                  ? 'text-foreground'
                  : 'text-[color:var(--fg-dim)]'
            )}
            style={{
              flex: `${grow} ${shrink} ${basis}px`,
              minWidth,
              fontFamily: cell.mono ? 'var(--font-mono)' : 'var(--font-sans)',
              fontVariantNumeric: cell.mono ? 'tabular-nums' : 'normal',
            }}
          >
            {cell.content}
          </div>
        );
      })}
    </div>
  );
});
