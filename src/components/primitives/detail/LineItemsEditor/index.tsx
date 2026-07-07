/**
 * LineItemsEditor — Editable line-items grid (qty · unit · price · tax · line total) with
 * keyboard-accessible row reorder, notes rows, protectedIds, and subtotal/tax/total footer.
 *
 * Spec: docs/99-refactor/_system/design/handoffs/2026-04-20-iV8W8LYb/project/preview/component-line-items.html
 * JSX source: docs/99-refactor/_system/design/handoffs/2026-04-20-iV8W8LYb/project/ui_kits/appbase/src/detail/LineItemsEditor.jsx
 * Adopters: tracked in DESIGN_CATALOG.md.
 *
 * Locked: drag handle must be keyboard-accessible — Space picks up, arrows move, Space drops.
 * Mouse HTML5 drag is a WCAG violation and intentionally NOT used here.
 * Protected (locked) rows cannot be deleted and render a `locked` chip.
 * Notes rows span the full label cell and show `note` chip (no qty/price/tax).
 *
 * Editable mode (W09 P3 · M-line-items): when `editable` + `onPatchItem` provided,
 * qty/price/tax/description become inline inputs and item/unit cells accept render slots
 * (so feature code can inject product autocomplete + unit select without hosting the grid).
 *
 * 2026-05-31 sub-module split: the former single-file primitive (~1023 LOC) was
 * decomposed into co-located sub-modules (types · cells · useRowReorder · LineItemRow)
 * with this composition root. Public API is byte-identical and BOTH import paths still
 * resolve: the barrel `@/components/primitives/detail` AND the deep path
 * `@/components/primitives/detail/LineItemsEditor` (→ this folder's index).
 */

import { type KeyboardEvent, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from '../../overlays/Kbd';
import { useRowReorder } from './useRowReorder';
import { LineItemRow } from './LineItemRow';
import type { LineItem, LineItemsEditorProps } from './types';

// Re-export the public types from the folder index so BOTH import paths
// (barrel + deep path) keep surfacing them verbatim.
export type { LineItemKind, LineItem, LineItemField, LineItemRenderContext, LineItemNumberField, LineItemFieldTestId } from './types';

const fmt = (n: number) =>
  n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function LineItemsEditor({
  items,
  onChange,
  onAddItem,
  onAddNote,
  onClearAll,
  onRemoveItem,
  taxLabel = 'Tax · GST 8%',
  currency = 'SGD',
  showEmpty = false,
  className,
  editable = false,
  onPatchItem,
  renderItemCell,
  renderUnitCell,
  fieldTestId,
  footerExtras,
}: LineItemsEditorProps) {
  const [dragRowIndex, setDragRowIndex] = useState<number | null>(null);
  const descriptionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // Pointer-based drag state machine (refs + the pointer-loop effect live INSIDE
  // this hook, which is called unconditionally above the empty-state early-return
  // below — so React hook order stays stable as items.length changes).
  const { pDragIndex, pTargetIndex, pDeltaY, rowsContainerRef, rowHeightRef, handlePointerDown, moveRow } =
    useRowReorder(items, onChange);

  const patch = (id: string, p: Partial<LineItem>) => onPatchItem?.(id, p);

  const { subtotal, taxTotal, total } = useMemo(() => {
    const itemRows = items.filter((i) => i.kind !== 'notes');
    const sub = itemRows.reduce((s, i) => s + (i.qty ?? 0) * (i.price ?? 0), 0);
    const tax = itemRows.reduce((s, i) => s + (i.qty ?? 0) * (i.price ?? 0) * ((i.tax ?? 0) / 100), 0);
    return { subtotal: sub, taxTotal: tax, total: sub + tax };
  }, [items]);

  // Line-item numbering for view mode: 1-based over non-notes rows.
  const itemNumberById = useMemo(() => {
    const m = new Map<string, number>();
    let n = 0;
    for (const it of items) {
      if (it.kind !== 'notes') { n++; m.set(it.id, n); }
    }
    return m;
  }, [items]);

  // Auto-size the unit-price + line-price columns to the widest value across all rows
  // (grid templates are per-row, so we can't rely on CSS max-content for cross-row sizing).
  // Width = maxChars * 9px (mono char) + 24px padding, floored at 80px.
  // Trailing 28px col (remove/lock) only in edit mode.
  const gridTemplate = useMemo(() => {
    const itemRows = items.filter((i) => i.kind !== 'notes');
    const maxPriceLen = Math.max(6, ...itemRows.map((i) => `$${fmt(i.price ?? 0)}`.length));
    const maxLineLen = Math.max(6, ...itemRows.map((i) => `$${fmt((i.qty ?? 0) * (i.price ?? 0))}`.length));
    const priceW = Math.max(80, maxPriceLen * 9 + 24);
    const lineW = Math.max(80, maxLineLen * 9 + 24);
    return `28px 160px 1fr 56px 100px ${priceW}px 70px ${lineW}px${editable ? ' 28px' : ''}`;
  }, [items, editable]);

  if (showEmpty || items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-[10px] border border-dashed border-border',
          'bg-secondary',
          'p-10 text-center',
          className
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <div
          className="text-[18px] text-muted-foreground lowercase"
          style={{
            fontFamily: 'var(--font-pixel)',
            letterSpacing: '-0.01em',
            WebkitFontSmoothing: 'none',
            imageRendering: 'pixelated',
          }}
        >
          no line items yet
        </div>
        <div className="text-[12.5px] text-muted-foreground mt-1">
          Add your first line to start building this quotation.
        </div>
        {onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            data-testid="line-items-add-item"
            className={cn(
              'mt-3.5 h-8 px-3.5 rounded-md inline-flex items-center gap-1.5 cursor-pointer',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'text-[13px] font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <Plus className="w-2.5 h-2.5" />
            Add item
          </button>
        )}
      </div>
    );
  }

  function handleHandleKey(e: KeyboardEvent<HTMLButtonElement>, rowIndex: number) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setDragRowIndex((prev) => (prev === rowIndex ? null : rowIndex));
      return;
    }
    if (dragRowIndex === rowIndex) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveRow(rowIndex, rowIndex - 1);
        setDragRowIndex(rowIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveRow(rowIndex, rowIndex + 1);
        setDragRowIndex(rowIndex + 1);
      } else if (e.key === 'Escape') {
        setDragRowIndex(null);
      }
    }
  }

  return (
    <div
      className={cn(
        'rounded-[10px] overflow-hidden',
        'border border-border',
        'bg-card',
        className
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {/* Header row — desktop only */}
      <div
        className={cn(
          'hidden md:grid gap-2.5 px-3 py-2',
          'border-b border-border',
          'bg-secondary',
          'text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'
        )}
        style={{
          fontFamily: 'var(--font-mono)',
          gridTemplateColumns: gridTemplate,
        }}
      >
        <div />
        <div>item</div>
        <div>description</div>
        <div className="text-center">qty</div>
        <div className="text-center">unit</div>
        <div className="text-center">unit price</div>
        <div className="text-center">tax %</div>
        <div className="text-center">line price</div>
        {editable && <div />}
      </div>

      {/* Rows */}
      <div ref={rowsContainerRef}>
        {items.map((item, ri) => (
          <LineItemRow
            key={item.id}
            item={item}
            ri={ri}
            isLast={ri === items.length - 1}
            editable={editable}
            itemNumber={itemNumberById.get(item.id)}
            gridTemplate={gridTemplate}
            isDrag={dragRowIndex === ri}
            pDragIndex={pDragIndex}
            pTargetIndex={pTargetIndex}
            pDeltaY={pDeltaY}
            rowHeight={rowHeightRef.current}
            patch={patch}
            onRemoveItem={onRemoveItem}
            renderItemCell={renderItemCell}
            renderUnitCell={renderUnitCell}
            fieldTestId={fieldTestId}
            onHandleKey={handleHandleKey}
            onPointerDown={handlePointerDown}
            registerDescriptionRef={(k, el) => { descriptionRefs.current[k] = el; }}
          />
        ))}
      </div>

      {/* Add row + clear all */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-zinc-50/40 dark:bg-white/[0.015]">
        {onAddItem && (
          <button
            type="button"
            onClick={onAddItem}
            data-testid="line-items-add-item"
            className={cn(
              'h-7 px-2.5 rounded-[5px] inline-flex items-center gap-1.5 cursor-pointer',
              'text-[12px] font-medium text-muted-foreground',
              'bg-transparent border border-dashed border-border',
              'hover:bg-secondary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            <Plus className="w-2.5 h-2.5" />
            Add item
          </button>
        )}
        {onAddNote && (
          <button
            type="button"
            onClick={onAddNote}
            className="h-7 px-2.5 rounded-[5px] text-[12px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            + Note row
          </button>
        )}
        <div className="flex-1" />
        {onClearAll && (
          <button
            type="button"
            onClick={onClearAll}
            className="h-7 px-2.5 rounded-[5px] text-[12px] font-medium text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
      {footerExtras && (
        <div className="border-t border-border">
          {footerExtras}
        </div>
      )}

      {/* Totals */}
      <div
        className={cn(
          'px-4 py-3.5 grid gap-x-2.5 gap-y-1 justify-items-end',
          'border-t border-border',
          'bg-secondary',
          'tabular-nums'
        )}
        style={{ gridTemplateColumns: '1fr 120px', fontFamily: 'var(--font-mono)' }}
      >
        <span className="text-[10.5px] uppercase tracking-widest text-muted-foreground">Subtotal</span>
        <span className="text-[12.5px] text-muted-foreground">${fmt(subtotal)}</span>

        <span className="text-[10.5px] uppercase tracking-widest text-muted-foreground">{taxLabel}</span>
        <span className="text-[12.5px] text-muted-foreground">${fmt(taxTotal)}</span>

        <span className="w-full text-right pt-1.5 border-t border-border text-[11px] font-semibold uppercase tracking-widest text-foreground">
          Total · {currency}
        </span>
        <span className="pt-1.5 border-t border-border text-[15px] font-semibold text-foreground">
          ${fmt(total)}
        </span>
      </div>

      {/* Keyboard hint */}
      <div
        className="hidden md:flex items-center gap-3 px-3 py-1.5 border-t border-border bg-card text-[10.5px] text-muted-foreground tracking-wide"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <Kbd>↑ ↓ ← →</Kbd> move cell
        <span className="text-muted-foreground" aria-hidden>·</span>
        <Kbd>Space</Kbd> pick up row
        <span className="text-muted-foreground" aria-hidden>·</span>
        <Kbd>⌘ ⏎</Kbd> new row
        <span className="text-muted-foreground" aria-hidden>·</span>
        <Kbd>⌘ ⌫</Kbd> delete row
      </div>
    </div>
  );
}
