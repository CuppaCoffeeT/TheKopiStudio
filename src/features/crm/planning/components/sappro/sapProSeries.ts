/**
 * SAP PRO — the four income series and their marks.
 *
 * COLOUR MAPPING (2026-09-25). The source sheet used a navy→sky ramp for the
 * three COMMISSION series and a separate green for income support. Kopi has no
 * navy/blue (.claude/rules/light-theme.md), so the same structure maps onto:
 *
 *   base commission  → --chart-ramp-1 #8B6A47 (brown anchor, 4.58:1 on card)
 *   monthly bonus    → --chart-ramp-2 #A58868 (3.08:1)
 *   quarterly bonus  → --chart-ramp-3 #C0A68C (2.15:1 — decorative)
 *   income support   → --brand-sage   #5A7A5E (4.45:1)
 *
 * The three commission series are ONE family (a sequential brown ramp, as the
 * sheet's blues were); support is a different KIND of money — an allowance,
 * not earnings — so it takes the one other positive fill, sage. Terracotta is
 * negative-only and is not a series. Every segment is paired with its legend
 * label and every figure also prints as text (the year breakdown line), which
 * is the chart tokens' condition for the lighter steps. Fills only — never text.
 */

export type SapSeries = 'base' | 'bonus' | 'quarterly' | 'support';

export const SAP_SERIES: readonly { key: SapSeries; label: string }[] = [
  { key: 'base', label: 'Base commission' },
  { key: 'bonus', label: 'Monthly bonus' },
  { key: 'quarterly', label: 'Quarterly bonus' },
  { key: 'support', label: 'Income support' },
];

export const SERIES_FILL: Record<SapSeries, string> = {
  base: 'bg-[color:var(--chart-ramp-1)]',
  bonus: 'bg-[color:var(--chart-ramp-2)]',
  quarterly: 'bg-[color:var(--chart-ramp-3)]',
  support: 'bg-[color:var(--brand-sage)]',
};

export const SERIES_RULE: Record<SapSeries, string> = {
  base: 'border-t-[color:var(--chart-ramp-1)]',
  bonus: 'border-t-[color:var(--chart-ramp-2)]',
  quarterly: 'border-t-[color:var(--chart-ramp-3)]',
  support: 'border-t-[color:var(--brand-sage)]',
};

/** The pressed/unpressed look every SAP PRO choice button shares. */
export const CHOICE_BASE =
  'rounded-lg border font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
export const CHOICE_ON = 'border-foreground bg-foreground text-background';
export const CHOICE_OFF = 'border-border bg-popover text-foreground hover:bg-secondary';
