/**
 * TimePicker.hooks — keyboard/click + portal-position effects for TimePicker.
 */
import { useEffect, type RefObject } from 'react';
import { parseHHMM, type TimePickerFormat } from './TimePicker.helpers';

interface KeyboardHookArgs {
  open: boolean;
  value: string;
  step: number;
  format: TimePickerFormat;
  focusedCol: 'h' | 'm' | 'p';
  setFocusedCol: (c: 'h' | 'm' | 'p') => void;
  wrapRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onCommit: (h: number, m: number) => void;
}

export function useTimePickerKeys({
  open, value, step, format, focusedCol, setFocusedCol,
  wrapRef, panelRef, onClose, onCommit,
}: KeyboardHookArgs) {
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        const cur = parseHHMM(value);
        let nh = cur.h ?? 9;
        let nm = cur.m ?? 0;
        if (focusedCol === 'h') nh = (nh + dir + 24) % 24;
        else if (focusedCol === 'm') nm = (nm + dir * step + 60) % 60;
        else if (focusedCol === 'p') nh = (nh + 12) % 24;
        onCommit(nh, nm);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const order: Array<'h' | 'm' | 'p'> = format === '12h' ? ['h', 'm', 'p'] : ['h', 'm'];
        const i = order.indexOf(focusedCol);
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        setFocusedCol(order[(i + dir + order.length) % order.length]);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, value, focusedCol, step, format, setFocusedCol, wrapRef, panelRef, onClose, onCommit]);
}

export function useTimePickerPortalPos(
  open: boolean,
  enabled: boolean,
  format: TimePickerFormat,
  wrapRef: RefObject<HTMLDivElement | null>,
  setPos: (pos: { top: number; left: number }) => void,
) {
  useEffect(() => {
    if (!open || !enabled || !wrapRef.current) return;
    const PANEL_H = 246;
    const PANEL_W = format === '12h' ? 252 : 196;
    const compute = () => {
      const rect = wrapRef.current!.getBoundingClientRect();
      const room = window.innerHeight - rect.bottom;
      const top = room < PANEL_H ? rect.top - PANEL_H - 8 : rect.bottom + 6;
      const left = Math.min(Math.max(8, rect.left), window.innerWidth - PANEL_W - 8);
      setPos({ top, left });
    };
    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, enabled, format, wrapRef, setPos]);
}
