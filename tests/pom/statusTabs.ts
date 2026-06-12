/**
 * StatusTabs test helper — responsive-aware tab activation.
 *
 * The `StatusTabs` primitive (src/components/primitives/ui/StatusTabs.tsx) swaps
 * the underline tab strip for a dropdown when the strip overflows its container
 * (narrow / mobile viewports). In that mode the strip stays mounted but
 * off-screen (`opacity-0 pointer-events-none -z-10`) purely for overflow
 * measurement, and a Popover trigger button replaces it visually. The portaled
 * popover list carries the SAME `data-testid` / `role="tab"` items.
 *
 * So a test that just clicks `getByTestId('…-status-x')` hits the hidden strip
 * button on mobile → "subtree intercepts pointer events" (the dropdown trigger
 * sits on top). This helper detects the dropdown trigger that belongs to the
 * SAME StatusTabs (via the tab's `role="tablist"` ancestor) and, when present,
 * opens it and clicks the option inside the popover. On desktop (no overflow,
 * no trigger) it clicks the tab directly.
 *
 * The caller's post-click assertions (e.g. `aria-selected="true"` on the strip
 * tab) keep working in BOTH modes — the always-mounted strip reflects the
 * active key regardless of which surface was clicked.
 */
import type { Page, Locator } from '@playwright/test';

/**
 * @param page         Playwright page.
 * @param stripTab     Locator that resolves the tab in the (always-mounted)
 *                     strip — e.g. `page.getByTestId('…-status-all')` or
 *                     `page.getByRole('tab', { name: /Users/ })`.
 * @param optionInPopover  Given the open popover container, return the matching
 *                     option locator — usually the same query scoped to it.
 */
export async function selectStatusTab(
  page: Page,
  stripTab: Locator,
  optionInPopover: (popover: Locator) => Locator,
): Promise<void> {
  // Desktop: the strip tab is directly clickable — try it first. We can't
  // reliably pre-detect overflow mode because `useTabsOverflow` flips to the
  // dropdown asynchronously (mount effect + ResizeObserver), so a synchronous
  // "is the trigger visible?" check races that measurement. Instead we attempt
  // the direct click with a short timeout; in overflow mode the strip is
  // hidden (`pointer-events-none`) behind the Popover trigger, so the click is
  // intercepted and throws — then we fall back to the dropdown path.
  try {
    await stripTab.first().click({ timeout: 3000 });
    return;
  } catch {
    // Overflow / mobile — route through the responsive dropdown below.
  }

  // The StatusTabs root is the tab's `role="tablist"` ancestor's parent; the
  // dropdown trigger is a descendant button with aria-haspopup="dialog".
  const root = stripTab.first().locator('xpath=ancestor::*[@role="tablist"][1]/..');
  const trigger = root.locator('button[aria-haspopup="dialog"]');
  // The overflow hook re-measures asynchronously (count pills / webfonts land
  // after mount), so the direct click can fail DURING the strip→dropdown flip
  // while no trigger exists yet — and on a wide-enough container it never
  // will. Give the trigger a short window; when it doesn't materialise the
  // strip is the interactive surface after all, so retry the direct click
  // instead of timing out on a dropdown that isn't coming (2026-06-12).
  try {
    await trigger.first().waitFor({ state: 'visible', timeout: 5000 });
  } catch {
    await stripTab.first().click();
    return;
  }
  await trigger.first().click();

  const popover = page.locator('[data-radix-popper-content-wrapper]');
  await optionInPopover(popover).click();
  // The popover carries a duplicate of the tab (same testid / role). Wait for
  // it to unmount on close so the caller's post-click assertions resolve to a
  // single element — the always-mounted strip tab (which reflects the active
  // key in both modes).
  await popover.first().waitFor({ state: 'detached' }).catch(() => {});
}

/** Convenience for the common per-tab-testid case. */
export function selectStatusTabByTestId(page: Page, testId: string): Promise<void> {
  return selectStatusTab(
    page,
    page.getByTestId(testId),
    (popover) => popover.getByTestId(testId),
  );
}

/** Convenience for tabs selected by accessible name (no per-tab testid). */
export function selectStatusTabByName(page: Page, name: RegExp | string): Promise<void> {
  return selectStatusTab(
    page,
    page.getByRole('tab', { name }),
    (popover) => popover.getByRole('tab', { name }),
  );
}
