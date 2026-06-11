import { useEffect } from 'react';

/**
 * Registers global ⌘K / Ctrl+K to toggle the palette. Caller owns the `open`
 * state so the palette can also open programmatically (e.g. from an AppHeader
 * pill or a custom `open-command-palette` event).
 */
export function useCommandPaletteHotkey(toggle: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle]);
}
