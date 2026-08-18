/**
 * MaskContext — the app-wide privacy eye, banking-app style.
 *
 * ONE switch for the whole shell, not one per surface. An advisor who hides the
 * Overview and then opens a customer has not stopped being on a train, so a
 * per-page toggle would be theatre; and a reader who has to hunt for a second
 * eye on every page will simply leave everything revealed.
 *
 * Default is MASKED (`true`). The costly mistake is the one-way one: an
 * unmasked default leaks the book the first time the app is opened in public,
 * while a masked default costs one click. It persists, so an advisor working
 * alone at a desk sets it once.
 *
 * What the flag actually hides is decided by `lib/masking`, not here — this
 * context only carries the switch. Report pages deliberately do NOT read it:
 * `/clients/:id/report` and `/crm-reports` ARE the client-facing artifact, and
 * a printed PDF full of asterisks is not a report.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const MASK_KEY = 'kopi.privacy.masked';

function readMasked(): boolean {
  try {
    // Absent → masked. See the docblock: the default protects, not reveals.
    return window.localStorage.getItem(MASK_KEY) !== 'false';
  } catch {
    return true;
  }
}

interface MaskState {
  masked: boolean;
  toggleMask: () => void;
}

const MaskStateContext = createContext<MaskState | null>(null);

export function MaskProvider({ children }: { children: ReactNode }) {
  const [masked, setMasked] = useState(readMasked);

  useEffect(() => {
    try {
      window.localStorage.setItem(MASK_KEY, String(masked));
    } catch {
      /* private mode — the preference just doesn't persist. */
    }
  }, [masked]);

  const value = useMemo<MaskState>(
    () => ({ masked, toggleMask: () => setMasked((previous) => !previous) }),
    [masked],
  );

  return <MaskStateContext.Provider value={value}>{children}</MaskStateContext.Provider>;
}

/**
 * The switch, or an inert unmasked default.
 *
 * Unmasked is the right fallback for a missing provider: the only surfaces
 * outside the shell are the public profiler wizard and the print reports, and
 * both must render their real values.
 */
export function useMask(): MaskState {
  const context = useContext(MaskStateContext);
  const noop = useCallback(() => {}, []);
  return context ?? { masked: false, toggleMask: noop };
}
