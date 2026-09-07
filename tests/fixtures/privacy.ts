/**
 * The privacy eye, from a spec's point of view.
 *
 * `MaskContext` defaults to MASKED and remembers the choice in localStorage —
 * and a fresh Playwright context has no localStorage, so every spec starts
 * masked: names print as "E2***", three of the four /crm KPI tiles print no
 * digits at all. A spec that READS the book (a KPI baseline, a residue marker)
 * has to reveal it first, or it reads nothing and calls that zero.
 *
 * Specs that only check the page renders (load-a11y, the rail) stay masked on
 * purpose: masked is what a first visit looks like, and the masked contrast
 * fix of 2026-08-19 is only exercised when nobody reveals.
 */

import type { Page } from '@playwright/test';

/** Same key as `src/contexts/MaskContext.tsx` — the ONE switch for the shell. */
const MASK_KEY = 'kopi.privacy.masked';

/**
 * Reveal masked values for every page this context navigates to from now on.
 * Call before the first `goto` of a spec that asserts on names or figures.
 */
export async function revealMaskedValues(page: Page): Promise<void> {
  await page.addInitScript((key: string) => {
    try {
      window.localStorage.setItem(key, 'false');
    } catch {
      /* private mode — the page then runs masked and the assertion says so. */
    }
  }, MASK_KEY);
}
