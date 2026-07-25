/**
 * DataTableStates — the non-default bodies `DataTable` swaps in for its
 * empty / no-results / error / loading variants.
 *
 * Split out of `DataTable` (2026-07-25) so both files stay under the LOC
 * ceiling. `DataTable` remains the only import path adopters need.
 *
 * 2a "Kopi House" state block (KOPI_2A_SPEC → States): an Instrument Serif 20px
 * *italic* line, a 12.5px explanatory line, and at most ONE quiet outline
 * action. No illustration and no icon — the spec rules both out. The error case
 * tints only its headline (`--negative-text`) instead of flooding the surface
 * with a red panel, because 2a errors are row-level, never card-level.
 *
 * The explanatory line is `--fg-dim`, not `--fg-muted`: bare list states render
 * on the page cream where `#7d6b5b` measures 4.12:1 and fails AA.
 *
 * Skeleton blocks paint `--skeleton` `#E0D3C3` — the token `LoadingSkeleton`
 * already uses. They previously used `bg-secondary` `#F3EDE3`, which is
 * 1.06:1 on the page cream and 1.08:1 on card cream: invisible, then dimmed
 * further by the per-column opacity ramp. `--skeleton-hi` is the *highlight*
 * end of that pair, not the block fill.
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/primitives/shell/Button';
import { type DataRowDensity } from './DataRow';

/** The single quiet action a non-default state may offer (2a allows exactly one). */
export interface DataTableStateAction {
  label: string;
  onClick: () => void;
}

export interface DataTableStateProps {
  variant: 'empty' | 'error' | 'no-results';
  message: string;
  sub: string;
  action?: DataTableStateAction;
  /** True when the table sits on the page cream with no card wrapper. */
  bare: boolean;
}

export function DataTableState({ variant, message, sub, action, bare }: DataTableStateProps) {
  const isError = variant === 'error';
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center py-14',
        bare ? 'px-0 bg-transparent' : 'px-5 bg-card'
      )}
      role={isError ? 'alert' : 'status'}
    >
      {/* Instrument Serif 20px italic — 20px clears the 18px serif floor. */}
      <div
        className={cn(
          'text-[20px] italic',
          isError ? 'text-[color:var(--negative-text)]' : 'text-foreground'
        )}
        style={{ fontFamily: 'var(--font-pixel)' }}
      >
        {message}
      </div>
      <div className="mt-1.5 text-[12.5px] text-[color:var(--fg-dim)]">{sub}</div>
      {action && (
        <Button variant="secondary" size="md" className="mt-3.5" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export interface DataTableLoadingBodyProps {
  density: DataRowDensity;
  columnCount: number;
  bare: boolean;
  /** Mirrors `DataTable.selectable` so the skeleton is exactly as wide as the
   *  real table — without it, non-selectable lists load a phantom checkbox
   *  column and the rows visibly shift left when the data arrives. */
  selectable: boolean;
}

export function DataTableLoadingBody({
  density,
  columnCount,
  bare,
  selectable,
}: DataTableLoadingBodyProps) {
  const rows = 6;
  const cols = Math.max(3, columnCount);
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-[14px]',
            bare ? 'px-0' : 'px-[14px]',
            density === 'comfortable'
              ? 'min-h-[72px]'
              : density === 'cozy'
                ? 'min-h-[56px]'
                : 'min-h-[44px]',
            // Bare skeletons keep the same top-hairline rhythm as bare rows.
            bare
              ? 'border-t border-[color:var(--border-faint)] bg-transparent'
              : 'border-b border-border bg-card'
          )}
        >
          {selectable && (
            <span className="w-4 h-4 rounded-[4px] bg-[color:var(--skeleton)] animate-pulse" />
          )}
          {Array.from({ length: cols }).map((_, j) => (
            <span
              key={j}
              className="flex-1 h-[10px] rounded-[3px] bg-[color:var(--skeleton)] animate-pulse"
              style={{ opacity: 0.9 - j * 0.1 }}
            />
          ))}
        </div>
      ))}
    </>
  );
}
