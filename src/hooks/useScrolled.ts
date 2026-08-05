import { useEffect, useState } from 'react';

/**
 * True once the window has scrolled past `threshold` px. For sticky bars that
 * gain a shadow / deepen their glass when content slides beneath them —
 * pair with `transition-shadow` so the change eases in (2026-08-05 motion
 * pass). Passive listener; state flips only on threshold crossings.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}
