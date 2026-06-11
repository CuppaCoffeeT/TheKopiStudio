import { useLayoutEffect, useRef, useState } from 'react';

/**
 * useTabsOverflow — detects whether a horizontal tab strip's natural content
 * width exceeds its container, so a tab primitive can swap itself for a
 * dropdown fallback on narrow screens.
 *
 * Usage:
 *
 *   const { stripRef, overflow } = useTabsOverflow();
 *
 *   return (
 *     <div className="relative">
 *       <div
 *         ref={stripRef}
 *         className={cn(
 *           'flex flex-nowrap',
 *           overflow && 'absolute inset-x-0 opacity-0 pointer-events-none -z-10',
 *         )}
 *       >
 *         {tabs.map(...)}
 *       </div>
 *       {overflow && <Dropdown ... />}
 *     </div>
 *   );
 *
 * The strip stays mounted at all times — when `overflow` flips to true we
 * move it out of layout flow with `absolute opacity-0 -z-10` so the
 * ResizeObserver keeps getting `scrollWidth` / `clientWidth` reads. When the
 * container widens enough to fit the natural content again, the strip flips
 * back into normal flow.
 */
export function useTabsOverflow() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;

    const measure = () => {
      // Compare strip's natural scrollWidth against the parent's clientWidth
      // (the available horizontal space). Using the strip's own clientWidth
      // would silently miss overflow when the strip is `inline-flex` — those
      // grow to their content size, so scrollWidth always equals clientWidth.
      const parent = strip.parentElement;
      const naturalWidth = strip.scrollWidth;
      const availableWidth = parent ? parent.clientWidth : strip.clientWidth;
      const next = naturalWidth > availableWidth + 1;
      setOverflow((prev) => (prev === next ? prev : next));
    };

    // Two-phase measurement: useLayoutEffect runs pre-paint with sometimes-stale
    // layout numbers. requestAnimationFrame gives the browser one paint tick to
    // finalize layout, then we re-measure. Both ResizeObserver entries (mount +
    // future resizes) keep the value fresh.
    measure();
    const raf = requestAnimationFrame(measure);

    const ro = new ResizeObserver(measure);
    ro.observe(strip);
    // Also observe the parent — when the page-level layout settles (e.g. a
    // sidebar collapses, the wizard mounts), the strip's clientWidth changes
    // but its own box-size may not, so a single observation on the strip can
    // miss the transition.
    if (strip.parentElement) ro.observe(strip.parentElement);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return { stripRef, overflow };
}
