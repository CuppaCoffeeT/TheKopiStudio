/**
 * AppSidebarOthers — the collapsible tool group in the rail.
 *
 * Split from `AppSidebarNav` so that file stays about the BANDS (Overview,
 * Customers, Others, Account Settings) while this owns the disclosure: the
 * button, its `aria-expanded`/`aria-controls` pairing, and the rule that a
 * CLOSED group must not leave focusable links behind for a keyboard to tab
 * into.
 *
 * Open/closed state is shared (`SidebarContext`), not local, because this list
 * is rendered TWICE — once in the >= lg rail, once in `AppNavDrawer`. Below lg
 * the rail is `hidden`, not unmounted, so two local states would drift the
 * moment both are mounted.
 */

import { ChevronRight } from 'lucide-react';
import { useSidebarState } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { SidebarItem, FOCUS_RING, IDLE, ITEM_BASE } from './SidebarItem';

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

  if (entries.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={toggleOthers}
        aria-expanded={othersOpen}
        aria-controls="app-sidebar-others"
        data-testid={toggleTestId}
        className={cn(ITEM_BASE, FOCUS_RING, IDLE, 'mt-[18px] w-full justify-between gap-2 text-left')}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">Others</span>
        <ChevronRight
          aria-hidden="true"
          className={cn('h-3.5 w-3.5 flex-none transition-transform', othersOpen && 'rotate-90')}
        />
      </button>

      {/* Mounted-when-open rather than hidden-when-closed: a collapsed group
          must not hold links a keyboard can still tab into. */}
      {othersOpen && (
        <div id="app-sidebar-others" className="flex flex-col gap-0.5">
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
