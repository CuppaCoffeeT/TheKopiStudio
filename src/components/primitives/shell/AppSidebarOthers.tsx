/**
 * AppSidebarOthers — the collapsible LEFTOVER group in the rail.
 *
 * Split from `AppSidebarNav` so that file stays about the BANDS (Overview,
 * Customers, Tools, Others, Account Settings) while this owns the disclosure:
 * the button, its `aria-expanded`/`aria-controls` pairing, and the rule that a
 * CLOSED group must not leave focusable links behind for a keyboard to tab
 * into.
 *
 * It held the TOOLS until 2026-08-19; tools are now a permanent band above it
 * and this group carries only what no band above has claimed (Results, CRM
 * Dashboard, Manage Accounts, anything registered later). It renders nothing
 * when that set is empty, so most viewers never see it.
 *
 * Open/closed state is shared (`SidebarContext`), not local, because this list
 * is rendered TWICE — once in the >= lg rail, once in `AppNavDrawer`. Below lg
 * the rail is `hidden`, not unmounted, so two local states would drift the
 * moment both are mounted.
 */

import { useId } from 'react';
import { ChevronRight } from 'lucide-react';
import { useSidebarState } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { SidebarItem, BAND_TEXT, FOCUS_RING, IDLE, ITEM_BASE } from './SidebarItem';

/** One entry in the collapsed group. */
export interface NavEntry {
  path: string;
  label: string;
}

interface AppSidebarOthersProps {
  entries: NavEntry[];
  onNavigate?: () => void;
  /** Distinct per home — the rail and the drawer both mount this list, and a
   *  shared testid would match two nodes and trip Playwright strict mode. */
  toggleTestId?: string;
}

export function AppSidebarOthers({ entries, onNavigate, toggleTestId }: AppSidebarOthersProps) {
  const { othersOpen, toggleOthers } = useSidebarState();
  /** Per-instance: this list is mounted TWICE below lg (rail hidden, drawer
   *  open), and the hard-coded id this used to carry appeared twice in the
   *  document — an `aria-controls` that resolves to the wrong copy. */
  const panelId = useId();

  if (entries.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggleOthers}
        aria-expanded={othersOpen}
        aria-controls={panelId}
        data-testid={toggleTestId}
        className={cn(ITEM_BASE, FOCUS_RING, IDLE, 'mt-[18px] w-full justify-between gap-2 text-left')}
      >
        <span className={BAND_TEXT}>Others</span>
        <ChevronRight
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 flex-none transition-transform', othersOpen && 'rotate-90')}
        />
      </button>

      {/* Mounted-when-open rather than hidden-when-closed: a collapsed group
          must not hold links a keyboard can still tab into. */}
      {othersOpen && (
        <div id={panelId} className="flex flex-col gap-0.5">
          {entries.map((entry) => (
            <SidebarItem
              key={entry.path}
              to={entry.path}
              label={entry.label}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </>
  );
}
