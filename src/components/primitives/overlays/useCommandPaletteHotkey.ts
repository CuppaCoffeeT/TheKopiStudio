import { useEffect } from 'react';

/**
 * Registers global ⌘K / Ctrl+K to toggle the palette. Caller owns the `open`
 * state so the palette can also open programmatically — e.g. via the
 * `open-command-palette` event `AppHeaderMobileBar`'s search button dispatches,
 * which is the only touch route to the palette.
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
