/**
 * useRowReorder — the LineItemsEditor pointer-drag reorder state machine.
 *
 * Extracted verbatim from the former single-file primitive (2026-05-31 sub-module
 * split). Behaviour is byte-identical:
 *  - All drag tracking stays in refs (NOT state) so the pointer loop's
 *    add/removeEventListener lifecycle does not churn every frame.
 *  - The pointer-loop `useEffect` lives INSIDE this hook, which the composition
 *    root calls unconditionally above its empty-state early-return — so React
 *    hook order stays stable as `items.length` changes.
 *  - `moveRow` is shared by both the pointer-up commit and the keyboard handler.
 */

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { LineItem } from './types';

export function useRowReorder(items: LineItem[], onChange?: (next: LineItem[]) => void) {
  // ── Pointer-based drag state (desktop mouse + touch) ───────────────────
  // pDragIndex: original index of the row being dragged.
  // pTargetIndex: current drop slot (where the row would land if released).
  // pDeltaY: vertical translation to apply to the lifted row (follows cursor).
  // rowRectsRef / rowHeightRef: captured on pointerdown so math doesn't need
  //   to re-measure every pointermove (which would also re-measure the mid-
  //   translation rows and feed garbage back into the calc).
  const [pDragIndex, setPDragIndex] = useState<number | null>(null);
  const [pTargetIndex, setPTargetIndex] = useState<number | null>(null);
  const [pDeltaY, setPDeltaY] = useState(0);
  const rowsContainerRef = useRef<HTMLDivElement | null>(null);
  const rowRectsRef = useRef<Array<{ top: number; height: number }>>([]);
  const rowHeightRef = useRef(0);
  const pointerStartYRef = useRef(0);
  const pointerLastYRef = useRef(0);
  const initialScrollYRef = useRef(0);
  // Mirrors of pDragIndex/pTargetIndex so onUp can read the latest without
  // needing them in the effect deps (would churn listeners every frame).
  const pDragIndexRef = useRef<number | null>(null);
  const pTargetIndexRef = useRef<number | null>(null);

  function moveRow(from: number, to: number) {
    if (!onChange) return;
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  }

  // Pointer-drag: lifted row + sibling gap animation.
  // Declared above the early-return so hook order stays stable as items length changes.
  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>, index: number) => {
      if (!onChange) return;
      if (items[index]?.kind === 'notes') return;
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const container = rowsContainerRef.current;
      if (!container) return;
      e.preventDefault();
      const rowEls = Array.from(container.querySelectorAll<HTMLElement>('[data-row-index]'));
      const rects = rowEls.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, height: r.height };
      });
      rowRectsRef.current = rects;
      rowHeightRef.current = rects[index]?.height ?? 0;
      pointerStartYRef.current = e.clientY;
      pointerLastYRef.current = e.clientY;
      initialScrollYRef.current = window.scrollY;
      pDragIndexRef.current = index;
      pTargetIndexRef.current = index;
      setPDragIndex(index);
      setPTargetIndex(index);
      setPDeltaY(0);
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    },
    [items, onChange],
  );

  // Pointer-drag loop: follow cursor, re-pick target on pointermove/scroll,
  // auto-scroll near viewport edges, commit reorder on pointerup.
  useEffect(() => {
    if (pDragIndex === null) return;

    // translateY = cursorDelta + scrollDelta keeps the lifted row glued to the pointer.
    const recompute = (clientY: number) => {
      const rects = rowRectsRef.current;
      if (rects.length === 0) return;
      const scrollDelta = window.scrollY - initialScrollYRef.current;
      setPDeltaY(clientY - pointerStartYRef.current + scrollDelta);
      const adjustedY = clientY + scrollDelta;
      let target = rects.length - 1;
      for (let i = 0; i < rects.length; i++) {
        if (adjustedY < rects[i].top + rects[i].height / 2) { target = i; break; }
      }
      pTargetIndexRef.current = target;
      setPTargetIndex(target);
    };

    // Auto-scroll when cursor enters a 60px zone near top/bottom of viewport.
    const EDGE = 60;
    const MAX_SPEED = 18;
    let rafId = requestAnimationFrame(function tick() {
      const y = pointerLastYRef.current;
      const vh = window.innerHeight;
      const over = y < EDGE ? -(EDGE - y) : y > vh - EDGE ? y - (vh - EDGE) : 0;
      if (over) window.scrollBy(0, Math.ceil((over / EDGE) * MAX_SPEED) * Math.sign(over));
      rafId = requestAnimationFrame(tick);
    });

    const onMove = (ev: PointerEvent) => { pointerLastYRef.current = ev.clientY; recompute(ev.clientY); };
    const onScroll = () => recompute(pointerLastYRef.current);
    const onUp = () => {
      const from = pDragIndexRef.current;
      const to = pTargetIndexRef.current;
      pDragIndexRef.current = null;
      pTargetIndexRef.current = null;
      if (from !== null && to !== null && from !== to) moveRow(from, to);
      setPDragIndex(null);
      setPTargetIndex(null);
      setPDeltaY(0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('scroll', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pDragIndex]);

  return {
    pDragIndex,
    pTargetIndex,
    pDeltaY,
    rowsContainerRef,
    rowHeightRef,
    handlePointerDown,
    moveRow,
  };
}
