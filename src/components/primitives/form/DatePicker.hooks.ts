/**
 * DatePicker.hooks — outside-click closer + portal-position effect.
 */
import { useEffect, type RefObject } from 'react';

export function useDatePickerOutsideClick(
  open: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, rootRef, panelRef, onClose]);
}

export function useDatePickerPortalPos(
  open: boolean,
  portalled: boolean,
  rootRef: RefObject<HTMLDivElement | null>,
  setPos: (pos: { top: number; left: number }) => void,
) {
  useEffect(() => {
    if (!open || !portalled || !rootRef.current) return;
    const PANEL_H = 340;
    const PANEL_W = 296;
    const compute = () => {
      const rect = rootRef.current!.getBoundingClientRect();
      const room = window.innerHeight - rect.bottom;
      const top = room < PANEL_H ? rect.top - PANEL_H - 8 : rect.bottom + 8;
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
  }, [open, portalled, rootRef, setPos]);
}
