/**
 * SidebarContext — whether the >= lg rail is showing, and whether the "Others"
 * group inside it is expanded.
 *
 * Two pieces of chrome state that have to be shared rather than local:
 *
 * - **Rail visibility** is read by `AppSidebar` (does it render?) AND by
 *   `DashboardLayout` (does the content pane carry the 200px offset?). Those
 *   are siblings, so the state cannot live in either.
 * - **The "Others" group** is rendered twice — once in the rail, once in
 *   `AppNavDrawer` — from the same `AppSidebarNav`. Local state would let the
 *   two copies disagree the moment both are mounted (below lg the rail is
 *   `hidden`, not unmounted).
 *
 * Both persist to localStorage: a navigation preference the advisor set once
 * should survive a reload, the same way the theme does. Reads are wrapped
 * because Safari private mode throws on `localStorage` access, and chrome that
 * cannot render is worse than chrome that forgets.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const RAIL_KEY = 'kopi.sidebar.railHidden';
const OTHERS_KEY = 'kopi.sidebar.othersOpen';

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === 'true';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* private mode — the preference just doesn't persist. */
  }
}

interface SidebarState {
  /** True while the advisor has collapsed the rail away on >= lg. */
  railHidden: boolean;
  toggleRail: () => void;
  /** True while the "Others" tool group is expanded. */
  othersOpen: boolean;
  toggleOthers: () => void;
  /** Opens the group without toggling — used when a route inside it is active. */
  openOthers: () => void;
}

const SidebarStateContext = createContext<SidebarState | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [railHidden, setRailHidden] = useState(() => readFlag(RAIL_KEY, false));
  const [othersOpen, setOthersOpen] = useState(() => readFlag(OTHERS_KEY, false));

  useEffect(() => writeFlag(RAIL_KEY, railHidden), [railHidden]);
  useEffect(() => writeFlag(OTHERS_KEY, othersOpen), [othersOpen]);

  const value = useMemo<SidebarState>(
    () => ({
      railHidden,
      toggleRail: () => setRailHidden((previous) => !previous),
      othersOpen,
      toggleOthers: () => setOthersOpen((previous) => !previous),
      openOthers: () => setOthersOpen(true),
    }),
    [railHidden, othersOpen],
  );

  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>;
}

/**
 * Chrome state, or a safe inert default.
 *
 * The fallback is not defensive padding — `AppSidebarNav` is also rendered by
 * `GlobalCommandPalette`-adjacent surfaces and by tests that mount it bare. A
 * throw there would turn a missing provider into a blank app rather than a rail
 * that simply doesn't remember its group state.
 */
export function useSidebarState(): SidebarState {
  const context = useContext(SidebarStateContext);
  const noop = useCallback(() => {}, []);
  return (
    context ?? {
      railHidden: false,
      toggleRail: noop,
      othersOpen: true,
      toggleOthers: noop,
      openOthers: noop,
    }
  );
}
