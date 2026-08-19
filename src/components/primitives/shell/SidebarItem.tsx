/**
 * SidebarItem — one navigation row, and the class tokens the rail is built from.
 *
 * Split out of `AppSidebarNav` so the nav's consumers (the nav itself, the
 * "Tools" band, the "Others" disclosure, and any future band) share ONE
 * definition of what a rail row looks like. Two copies of these class strings
 * would drift the first time a state is retuned.
 *
 * Colour note: idle items are `--fg-muted` `#7D6B5B`, which clears AA on card
 * cream (4.72) and FAILS on page cream (4.12). Both homes paint card cream
 * (`bg-sidebar`) behind this list — a future home on the page ground must
 * re-measure rather than reuse (KOPI_2A_SPEC → "Open item — muted on page").
 */

import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Visible brown focus ring, inset by design — an outer ring collides with the
 *  rail's right hairline (KOPI_2A_SPEC → "Sidebar items"). */
export const FOCUS_RING = cn(
  'focus-visible:outline-2 focus-visible:outline-[color:hsl(var(--sidebar-ring))]',
  'focus-visible:outline-offset-[-2px]',
);

/**
 * Shared item box. `border-l-2` sits on every item — including idle ones — so
 * nothing shifts horizontally when the active marker appears.
 * `pointer-coarse:min-h-11` lifts the 36px comp row to the 44px touch floor on
 * coarse pointers (.claude/rules/mobile-web.md §5).
 */
export const ITEM_BASE = cn(
  'flex items-center border-l-2 px-[22px] py-[9px] text-[13px] leading-[1.4]',
  'transition-colors pointer-coarse:min-h-11',
);

/** Hover text takes `--brown-text`, not raw brand brown — 13px is under AA. */
export const IDLE = cn(
  'border-l-transparent text-muted-foreground',
  'hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--brown-text)]',
  'active:bg-[color:var(--tint-pressed)]',
);

/**
 * A band heading — "Tools", "Others". `BAND_TEXT` is the type alone, for the
 * "Others" button, which needs `ITEM_BASE` + `IDLE` around it; `BAND_LABEL` is
 * the whole box, for the "Tools" heading, which is a static label rather than a
 * control. Both keep the item box's left edge so a heading and its rows align.
 * No touch floor on the label — it is not a target (.claude/rules/mobile-web.md
 * §5). `--fg-muted` at 10px clears AA on the card cream this list is painted on
 * (4.72) — the same measurement the row colours above are held to.
 */
export const BAND_TEXT = 'text-[10px] font-semibold uppercase tracking-[0.14em]';

export const BAND_LABEL = cn(
  'flex items-center border-l-2 border-l-transparent px-[22px] py-[9px] text-muted-foreground',
  BAND_TEXT,
);

export const ACTIVE =
  'border-l-sidebar-primary bg-[color:var(--surface-subtle)] font-semibold text-sidebar-foreground';

interface SidebarItemProps {
  to: string;
  label: string;
  /** Exact match only — used by Overview so every child route doesn't light it. */
  end?: boolean;
  /** Tool entries sit one step in from their group heading. */
  nested?: boolean;
  onNavigate?: () => void;
}

/** All five comp states: idle · hover · pressed · focus · current. */
export function SidebarItem({ to, label, end, nested, onNavigate }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(ITEM_BASE, FOCUS_RING, nested && 'pl-[34px]', isActive ? ACTIVE : IDLE)
      }
    >
      {label}
    </NavLink>
  );
}
