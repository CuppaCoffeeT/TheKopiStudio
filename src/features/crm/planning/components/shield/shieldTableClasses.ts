/**
 * Cell classes for `ShieldTable`. Kept out of `ShieldAtoms.tsx` so that file
 * exports components only (react-refresh/only-export-components). Extend one
 * with `cn()`, never a template string, so tailwind-merge settles conflicts.
 */

export const TH =
  'border-b border-foreground px-2.5 py-2 text-right text-[12px] font-semibold text-[color:var(--fg-dim)] first:text-left whitespace-nowrap';
export const TD =
  'border-b border-border px-2.5 py-[7px] text-right whitespace-nowrap first:text-left first:whitespace-normal';
export const TOTAL_ROW = 'font-semibold [&>td]:border-t [&>td]:border-t-foreground';
