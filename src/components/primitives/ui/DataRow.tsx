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
 *
 * Interactivity is opt-in via `onClick`: only a row that has a handler becomes a
 * tab stop and takes the pointer/hover/focus affordances. Rows without one (e.g.
 * the read-only ManageAccounts table) stay inert so keyboard users don't walk a
 * run of focusable rows that do nothing.
 *
 * `surface="bare"` (2a list archetype, 2026-07-25): the row drops its own fill
 * and sits straight on the page cream, so the ONLY thing separating one row
 * from the next is the `--border-faint` hairline — carried as `border-top` per
 * the comp, which is why the bare TableHeader drops its bottom rule (otherwise
 * the two double up). Hover then has to be a solid step (card cream), because
 * the 6%-brown wash is invisible against the page ground. Meta cells shift from
 * `--fg-muted` to a 12px `--fg-dim`: #7d6b5b is 4.12:1 on the page and fails AA,
 * so the meta step is carried by size instead of by a lighter ink.
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { TableCheckbox } from './TableCheckbox';
import { DataRowCells, type DataRowCell } from './DataRowCells';

export type { DataRowCell, DataRowCellTone } from './DataRowCells';

export type DataRowDensity = 'compact' | 'cozy' | 'comfortable';
export type DataRowState = 'default' | 'hover' | 'selected' | 'focused' | 'disabled';
/** `card` — row paints card cream inside a bordered shell. `bare` — row sits
 *  directly on the page cream, separated only by the repetition hairline. */
export type DataRowSurface = 'card' | 'bare';

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
  /** Defaults to `card`. `bare` drops the fill + gutters for the 2a list. */
  surface?: DataRowSurface;
}

export const DataRow = forwardRef<HTMLDivElement, DataRowProps>(function DataRow(
  {
    density = 'compact',
    state = 'default',
    selectable = true,
    selected = false,
    cells,
    onSelectedChange,
    surface = 'card',
    className,
    onClick,
    onKeyDown,
    ...props
  },
  ref
) {
  const bare = surface === 'bare';
  const disabled = state === 'disabled';
  // Interactivity is derived from the handler, never assumed. A row with no
  // `onClick` is inert: it must not be a tab stop (Enter/Space would be no-ops,
  // stranding keyboard users in a run of dead `role="row"` elements) and must
  // not advertise a click affordance the row does not honour.
  const clickable = !disabled && !!onClick;
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
      tabIndex={clickable ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex items-center',
        bare ? 'px-0' : 'px-[14px]',
        DENSITY_MIN_H[density],
        DENSITY_PY[density],
        // Repetition hairline. Bare rows carry it on TOP so the header rule and
        // the first row rule can't double up (2a comp).
        bare
          ? 'border-t border-[color:var(--border-faint)]'
          : 'border-b border-[color:var(--border-faint)]',
        // Surface default
        bare ? 'bg-transparent' : 'bg-card',
        // Hover — translucent brown wash on card cream; a solid card-cream step
        // on the page ground, where a 6% wash would be invisible. Only clickable
        // rows take it, so the fill never promises an interaction that isn't there.
        clickable &&
          effectiveState !== 'selected' &&
          (bare ? 'hover:bg-card active:bg-secondary' : 'hover:bg-[color:var(--row-hover)]'),
        effectiveState === 'hover' && 'bg-[color:var(--row-hover)]',
        effectiveState === 'selected' &&
          'bg-[color:var(--row-selected)] hover:bg-primary/[0.16]',
        effectiveState === 'focused' &&
          'shadow-[inset_0_0_0_2px_var(--cta-primary-bg)]',
        disabled ? 'opacity-50 cursor-not-allowed' : clickable ? 'cursor-pointer' : 'cursor-default',
        'text-[13px] text-[color:var(--fg-dim)]',
        // Bare rows butt straight against their neighbours, so the focus ring is
        // drawn INSIDE the row — an outward ring would sit on the hairlines
        // above and below (KOPI_2A_SPEC → "Rows are interactive"). Scoped to
        // clickable rows; if an adopter forces a tabIndex of its own, the global
        // :focus-visible rule in index.css still paints a brown ring, never silent.
        clickable && 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        clickable &&
          (bare
            ? 'focus-visible:ring-inset'
            : 'focus-visible:ring-offset-2 focus-visible:ring-offset-background'),
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
      <DataRowCells cells={cells} bare={bare} selectable={selectable} />
    </div>
  );
});
