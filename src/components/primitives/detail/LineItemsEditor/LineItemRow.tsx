/**
 * LineItemRow — one row of the LineItemsEditor grid (desktop grid row + mobile
 * stacked card). Extracted verbatim from the former single-file primitive
 * (2026-05-31 sub-module split). Pure presentation: every piece of drag/edit
 * state and every callback is passed in, so behaviour is unchanged.
 */

import { type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { GripVertical, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../overlays/Tooltip';
import type { LineItem, LineItemRenderContext, LineItemFieldTestId } from './types';
import { Cell, DescriptionCell, EditableCellWrap, MobileField, NumberCell } from './cells';

const fmt = (n: number) =>
  n.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface LineItemRowProps {
  item: LineItem;
  ri: number;
  isLast: boolean;
  editable: boolean;
  itemNumber: number | undefined;
  gridTemplate: string;
  // Keyboard-drag pickup state (owned by the composition root).
  isDrag: boolean;
  // Pointer-drag state (from useRowReorder).
  pDragIndex: number | null;
  pTargetIndex: number | null;
  pDeltaY: number;
  rowHeight: number;
  // Callbacks.
  patch: (id: string, p: Partial<LineItem>) => void;
  onRemoveItem?: (id: string) => void;
  renderItemCell?: (ctx: LineItemRenderContext) => React.ReactNode;
  renderUnitCell?: (ctx: LineItemRenderContext) => React.ReactNode;
  fieldTestId?: LineItemFieldTestId;
  onHandleKey: (e: KeyboardEvent<HTMLButtonElement>, rowIndex: number) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>, index: number) => void;
  registerDescriptionRef: (key: string, el: HTMLTextAreaElement | null) => void;
}

export function LineItemRow({
  item,
  ri,
  isLast,
  editable,
  itemNumber,
  gridTemplate,
  isDrag,
  pDragIndex,
  pTargetIndex,
  pDeltaY,
  rowHeight,
  patch,
  onRemoveItem,
  renderItemCell,
  renderUnitCell,
  fieldTestId,
  onHandleKey,
  onPointerDown,
  registerDescriptionRef,
}: LineItemRowProps) {
  const isNotes = item.kind === 'notes';
  const lineTotal = isNotes ? 0 : (item.qty ?? 0) * (item.price ?? 0);
  const displayLabel = item.label ?? item.description ?? item.name ?? '';

  const ctx: LineItemRenderContext = { item, index: ri, editable };

  // Pointer-drag visual: lifted row follows cursor; sibling rows shift
  // to open a gap at the current target index.
  const isPLifted = pDragIndex === ri;
  let siblingShiftY = 0;
  if (pDragIndex !== null && pTargetIndex !== null && !isPLifted) {
    const h = rowHeight;
    if (pDragIndex < ri && ri <= pTargetIndex) siblingShiftY = -h;
    else if (pTargetIndex <= ri && ri < pDragIndex) siblingShiftY = h;
  }
  const rowTransform = isPLifted
    ? `translateY(${pDeltaY}px) scale(1.01)`
    : siblingShiftY
      ? `translateY(${siblingShiftY}px)`
      : undefined;

  return (
    <div
      key={item.id}
      data-row-index={ri}
      className={cn(
        'grid gap-1 md:gap-2.5',
        'px-3 py-2 md:py-2',
        !isLast && 'border-b border-border',
        // Drag/lift are in-progress states, so they read brown; the lifted row
        // is a floating surface and takes the cream glass + `--floating-shadow`.
        isDrag
          ? 'bg-[color:var(--row-selected)] shadow-[0_0_0_1.5px_var(--cta-primary-bg)]'
          : isPLifted
          ? 'bg-[color:var(--surface-translucent-bg)] backdrop-blur-md shadow-[var(--floating-shadow)] ring-1 ring-[color:var(--border-hover)]'
          : isNotes
          ? 'bg-secondary'
          : 'hover:bg-[color:var(--row-hover)]',
        pDragIndex !== null && !isPLifted && 'transition-transform duration-200 ease-out',
      )}
      style={{
        gridTemplateColumns: 'var(--row-cols)',
        // @ts-expect-error — CSS custom property
        '--row-cols': undefined,
        transform: rowTransform,
        zIndex: isPLifted ? 50 : undefined,
        position: isPLifted ? 'relative' : undefined,
      }}
    >
      <div
        className="group/row hidden md:grid items-stretch gap-2.5 col-span-full py-1.5"
        style={{ gridTemplateColumns: gridTemplate, gridColumn: '1 / -1' }}
      >
        {/* Drag handle (editable) OR line-item number (view mode) */}
        {editable ? (
          <button
            type="button"
            disabled={isNotes}
            onKeyDown={(e) => onHandleKey(e, ri)}
            onPointerDown={!isNotes ? (e) => onPointerDown(e, ri) : undefined}
            aria-label={isDrag ? 'Dragging — arrows move, space to drop' : 'Reorder row'}
            title={isDrag ? 'Dragging · arrows move · space to drop' : 'Drag or Space to pick up'}
            className={cn(
              'w-5 h-5 mx-auto rounded inline-flex items-center justify-center',
              isNotes
                ? 'cursor-default text-muted-foreground'
                : isPLifted
                  ? 'cursor-grabbing text-[color:var(--brand-brown)]'
                  : 'cursor-grab text-muted-foreground hover:text-muted-foreground',
              isDrag && 'text-[color:var(--brand-brown)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'touch-none select-none',
            )}
          >
            <GripVertical className="w-3 h-3" />
          </button>
        ) : (
          <span
            className="w-5 h-5 mx-auto inline-flex items-center justify-center text-[11px] tabular-nums text-muted-foreground"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {isNotes ? '' : itemNumber}
          </span>
        )}

        {/* Item cell — default display OR custom slot (e.g. product autocomplete) */}
        {isNotes ? (
          <div className="flex items-start gap-1.5">
            <span
              className="mt-[3px] text-[9.5px] uppercase tracking-widest px-1 py-px rounded-[3px] bg-secondary text-muted-foreground flex-shrink-0"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              note
            </span>
          </div>
        ) : renderItemCell ? (
          renderItemCell(ctx)
        ) : (
          <div className="text-[13px] text-foreground leading-snug flex items-start gap-1.5 min-w-0">
            {item.protected && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="mt-[3px] text-[9.5px] uppercase tracking-wider px-1 py-px rounded-[3px] bg-[color:var(--status-sent-bg)] text-[color:var(--status-sent-fg)] flex-shrink-0 cursor-help"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      locked
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] whitespace-normal text-center">
                    Linked to an invoice, progress claim, or advance payment — can't be deleted.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <div className="flex-1 min-w-0">
              {item.code && (
                <div
                  className="text-[10.5px] text-muted-foreground tracking-wider uppercase break-words"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {item.code}
                </div>
              )}
              {(item.name || item.label) && (
                <div className="font-medium break-words">{item.name ?? item.label}</div>
              )}
              {!item.code && !item.name && !item.label && ' '}
            </div>
          </div>
        )}

        {/* Description cell — full-height clickable area · click anywhere → textarea focuses.
            Row uses `items-stretch` so this wrapper fills the entire row height (which itself
            grows via autoGrow when description wraps to multiple lines). Eliminates dead-click
            zones above/below the textarea. */}
        {editable && !isNotes ? (
          <div
            className="w-full h-full min-h-[32px] flex items-stretch cursor-text rounded hover:bg-secondary"
            onClick={(e) => {
              const ta = (e.currentTarget.querySelector('textarea') as HTMLTextAreaElement | null);
              if (ta && document.activeElement !== ta) ta.focus();
            }}
          >
            <DescriptionCell
              textareaRef={(el) => { registerDescriptionRef(item.id, el); }}
              value={item.description ?? ''}
              onCommit={(v) => patch(item.id, { description: v })}
              placeholder="Description…"
              rows={1}
              className={cn(
                'w-full resize-none bg-transparent outline-none cursor-text',
                'text-[12.5px] leading-snug text-muted-foreground',
                'whitespace-pre-wrap break-words',
                'px-2 py-1.5 rounded',
                // Focus: full-opacity brown ring (4.58:1 on card — an alpha ring
                // composites under SC 1.4.11's 3:1) + raised white input surface.
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-popover',
              )}
            />
          </div>
        ) : (
          <div
            className={cn(
              'text-[12.5px] leading-snug min-w-0 whitespace-pre-wrap break-words py-1',
              isNotes
                ? 'italic text-muted-foreground'
                : 'text-muted-foreground'
            )}
          >
            {isNotes
              ? item.label ?? item.description ?? ''
              : item.description ?? ''}
          </div>
        )}

        {/* qty · click anywhere in cell to focus the input */}
        {editable && !isNotes && !item.protected ? (
          <EditableCellWrap kind="number">
            <NumberCell
              value={item.qty}
              step={0.1}
              min={0}
              align="center"
              onCommit={(v) => patch(item.id, { qty: v })}
              placeholder={item.unit ? '1.0' : 'Rate'}
              testId={fieldTestId?.({ field: 'qty', index: ri, item })}
            />
          </EditableCellWrap>
        ) : (
          <Cell align="center">{isNotes ? '—' : item.qty}</Cell>
        )}
        {/* unit · click anywhere in cell to open the dropdown */}
        {editable && !isNotes && !item.protected && renderUnitCell ? (
          <EditableCellWrap kind="dropdown">{renderUnitCell(ctx)}</EditableCellWrap>
        ) : (
          <Cell align="center">{isNotes ? '—' : item.unit}</Cell>
        )}
        {/* price · click anywhere in cell to focus the input */}
        {editable && !isNotes && !item.protected ? (
          <EditableCellWrap kind="number">
            <NumberCell
              value={item.price}
              step={0.01}
              align="center"
              prefix="$"
              onCommit={(v) => patch(item.id, { price: v })}
              placeholder="0.00"
              testId={fieldTestId?.({ field: 'price', index: ri, item })}
            />
          </EditableCellWrap>
        ) : (
          <Cell align="center">{isNotes ? '—' : fmt(item.price ?? 0)}</Cell>
        )}
        {/* tax · click anywhere in cell to focus the input */}
        {editable && !isNotes && !item.protected ? (
          <EditableCellWrap kind="number">
            <NumberCell
              value={item.tax}
              step={0.01}
              align="center"
              suffix="%"
              onCommit={(v) => patch(item.id, { tax: v })}
              placeholder="9"
              testId={fieldTestId?.({ field: 'tax', index: ri, item })}
            />
          </EditableCellWrap>
        ) : (
          <Cell align="center">{isNotes ? '—' : `${item.tax ?? 0}%`}</Cell>
        )}
        {/* line total — read-only · cells stretch via items-stretch row */}
        <div
          className={cn(
            'flex items-center justify-center',
            'text-center text-[12.5px] font-medium tabular-nums',
            isNotes ? 'text-muted-foreground' : 'text-foreground'
          )}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {isNotes ? '$ —' : `$${fmt(lineTotal)}`}
        </div>
        {/* Remove — edit mode only · hidden until row hover or button focus to avoid in-row visual clutter.
            Locked rows show the lock icon at full opacity (status indicator, not an action). */}
        {editable && (
          <div className="flex items-center justify-center pt-1.5">
            {!item.protected ? (
              onRemoveItem && (
                <button
                  type="button"
                  aria-label="Remove row"
                  onClick={() => onRemoveItem(item.id)}
                  className={cn(
                    'w-5 h-5 rounded inline-flex items-center justify-center cursor-pointer',
                    'text-muted-foreground hover:text-[color:var(--negative-text)] hover:bg-secondary',
                    'opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100',
                    'transition-opacity duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )
            ) : (
              <Lock className="w-2.5 h-2.5 text-muted-foreground" aria-label="Locked" />
            )}
          </div>
        )}
      </div>

      {/* Mobile row — stacked card. Editable variant shows inline number inputs + slot cells. */}
      <div className="md:hidden text-[13px] text-foreground leading-snug">
        {isNotes ? (
          editable ? (
            <DescriptionCell
              value={item.label ?? item.description ?? ''}
              onCommit={(v) => patch(item.id, { label: v })}
              placeholder="Note text…"
              rows={2}
              className="w-full resize-none bg-transparent outline-none italic text-muted-foreground text-[12.5px] px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-popover"
            />
          ) : (
            <div className="italic text-muted-foreground">{displayLabel}</div>
          )
        ) : editable ? (
          <div className="space-y-2">
            {/* Item picker slot OR default name */}
            {renderItemCell ? renderItemCell(ctx) : (
              <div className="min-w-0">
                {item.code && (
                  <div className="text-[10.5px] text-muted-foreground tracking-wider uppercase truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                    {item.code}
                  </div>
                )}
                {(item.name || item.label) && (
                  <div className="font-medium truncate">{item.name ?? item.label}</div>
                )}
              </div>
            )}
            {/* Description — textarea (auto-grows on mount so full text shows without scrolling in the tiny row) */}
            {!item.protected && (
              <DescriptionCell
                textareaRef={(el) => { registerDescriptionRef(`m-${item.id}`, el); }}
                value={item.description ?? ''}
                onCommit={(v) => patch(item.id, { description: v })}
                placeholder="Description…"
                rows={2}
                className="w-full resize-none bg-transparent outline-none text-[12.5px] leading-snug text-muted-foreground px-2 py-1 rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring focus-visible:bg-popover border border-border"
              />
            )}
            {/* 4-col grid: qty · unit · price · tax */}
            {!item.protected && (
              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <MobileField label="qty">
                  <NumberCell value={item.qty} step={0.1} min={0} align="left" onCommit={(v) => patch(item.id, { qty: v })} placeholder={item.unit ? '1.0' : 'Rate'} dense testId={fieldTestId?.({ field: 'qty', index: ri, item })} />
                </MobileField>
                <MobileField label="unit">
                  {renderUnitCell ? renderUnitCell(ctx) : <div className="text-[12px] text-muted-foreground px-2">{item.unit ?? '—'}</div>}
                </MobileField>
                <MobileField label="unit $">
                  <NumberCell value={item.price} step={0.01} align="left" prefix="$" onCommit={(v) => patch(item.id, { price: v })} placeholder="0.00" dense testId={fieldTestId?.({ field: 'price', index: ri, item })} />
                </MobileField>
                <MobileField label="tax %">
                  <NumberCell value={item.tax} step={0.01} align="left" suffix="%" onCommit={(v) => patch(item.id, { tax: v })} placeholder="9" dense testId={fieldTestId?.({ field: 'tax', index: ri, item })} />
                </MobileField>
              </div>
            )}
            {/* Totals + actions row */}
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-[10.5px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>line $</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold tabular-nums" style={{ fontFamily: 'var(--font-mono)' }}>${fmt(lineTotal)}</span>
                {!item.protected && onRemoveItem && (
                  <button
                    type="button"
                    aria-label="Remove row"
                    onClick={() => onRemoveItem(item.id)}
                    className="w-6 h-6 rounded text-muted-foreground hover:text-[color:var(--negative-text)] hover:bg-secondary inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                {item.protected && <Lock className="w-3 h-3 text-muted-foreground" aria-label="Locked" />}
              </div>
            </div>
          </div>
        ) : (
          <>
            {item.code && (
              <div
                className="text-[10.5px] text-muted-foreground tracking-wider uppercase"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {item.code}
              </div>
            )}
            {(item.name || item.label) && (
              <div className="font-medium">{item.name ?? item.label}</div>
            )}
            {item.description && (
              <div className="text-[12px] text-muted-foreground mt-0.5">{item.description}</div>
            )}
            <div
              className="mt-0.5 text-[11px] text-muted-foreground tracking-wide"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {item.qty} {item.unit} × ${fmt(item.price ?? 0)}
              <span className="text-muted-foreground mx-1.5">·</span>
              <span className="text-foreground font-medium">${fmt(lineTotal)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
