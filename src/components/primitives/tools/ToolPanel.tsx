/**
 * ToolPanel — the cream panel every tool section sits in, opening with the 2a
 * uppercase tracked label.
 *
 * HOISTED 2026-08-19 from `features/crm/planning/components/PlanningAtoms`,
 * then split out of `ToolAtoms.tsx` when that file crossed the 200-LOC ceiling.
 * Written for the three planning tools, but `src/lib/toolRoutes` has always
 * presented the profiler as tool 01 of the same set while the profiler page
 * rendered none of this — one rail, two visual languages. The profiler is a
 * feature workspace of its own and may not import from `crm`
 * (.dependency-cruiser `no-cross-feature-imports`), so the MARKUP lives in a
 * shared lane and the DATA stays in each feature. See `tools/CONTEXT.md`.
 *
 * This is the 2a spec's panel treatment, not an invention — KOPI_2A_SPEC →
 * "Archetype — detail" → Panels: `#faf6ee`, 1px `#d9ccc0`, radius 12px,
 * padding 22px, opening with the uppercase 11px `.12em` muted label.
 */

import { forwardRef, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToolPanelProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  /**
   * Override the label colour. The default `text-muted-foreground` is AA on
   * the two flat cream grounds (4.72:1 on card cream) and ONLY there. A panel
   * that paints its own tint — the profiler's DISC-tinted report sections —
   * drops it to 3.73–3.83:1, so those pass `text-[color:var(--fg-dim)]`
   * (5.78–5.95:1 on the same tints). Never widen the default instead.
   */
  labelClassName?: string;
  /**
   * Escape hatch for a panel whose surface is computed at runtime — the
   * profiler's report sections tint themselves with the winning DISC hue, which
   * no static utility can express. Pair it with `labelClassName`: a tint is a
   * new ground, and the default label colour is calibrated for flat cream.
   */
  style?: CSSProperties;
  /**
   * `-1` makes the panel programmatically focusable — for a control elsewhere
   * that must move the reader here when scrolling alone would not (the
   * profiler's "See how it works", which targets a panel already on screen).
   */
  tabIndex?: number;
  testId?: string;
}

/**
 * Forwards its ref — `Card`, the primitive it replaces on the tool pages, does
 * too, and the profiler's intake screen scrolls one of these into view.
 */
export const ToolPanel = forwardRef<HTMLElement, ToolPanelProps>(function ToolPanel(
  { label, children, className, labelClassName, style, tabIndex, testId },
  ref,
) {
  return (
    <section
      ref={ref}
      data-testid={testId}
      style={style}
      tabIndex={tabIndex}
      className={cn(
        'rounded-xl border border-border bg-card px-[22px] py-5 shadow-[var(--card-shadow-rest)]',
        className,
      )}
    >
      <h2
        className={cn(
          'm-0 mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground',
          labelClassName,
        )}
      >
        {label}
      </h2>
      {children}
    </section>
  );
});
