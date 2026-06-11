import type { Page } from '@playwright/test';

/**
 * Switch tabs on a page using either the legacy `ResponsiveTabsList` or the
 * primitive `PaymentManagementTabs` shell.
 *
 * Desktop (≥ md): both shells render `data-testid={prefix}-tab-{value}` Radix-style triggers.
 * Mobile (< md): two layouts exist —
 *   1. Legacy `ResponsiveTabsList`: trigger `${prefix}-tab-trigger-mobile` opens a
 *      Radix Select; per-item testids `${prefix}-tab-${value}-mobile` get clicked.
 *   2. Primitive `PaymentManagementTabs`: a `SelectMenu` (Radix combobox) whose
 *      trigger carries testid `${prefix}-tab-mobile`. Since 2026-06 the native
 *      `<select>` was migrated to `SelectMenu`, so `selectOption` no longer works
 *      (the trigger is a `<button role="combobox">`, not a native `<select>`).
 *      Open the trigger, then click the portaled option `${prefix}-tab-option-${value}`.
 *
 * This helper detects which variant is in the DOM and uses the matching strategy.
 */
export async function switchResponsiveTab(
  page: Page,
  prefix: string,
  value: string,
  opts: { timeout?: number } = {},
) {
  const timeout = opts.timeout ?? 10_000;
  // Use :visible so we don't match the hidden-by-CSS sibling of the responsive
  // trio (mobile trigger renders first in DOM but is `display:none` on desktop;
  // a plain `or()` chain picked the hidden one and waited forever for it to
  // become visible).
  const desktopTab = page.locator(`[data-testid="${prefix}-tab-${value}"]:visible`);
  const mobileCombobox = page.locator(`[data-testid="${prefix}-tab-mobile"]:visible`);
  const radixTrigger = page.locator(`[data-testid="${prefix}-tab-trigger-mobile"]:visible`);

  // Wait for whichever surface the viewport actually rendered to appear.
  await page
    .locator(
      `[data-testid="${prefix}-tab-${value}"]:visible, ` +
        `[data-testid="${prefix}-tab-mobile"]:visible, ` +
        `[data-testid="${prefix}-tab-trigger-mobile"]:visible`,
    )
    .first()
    .waitFor({ state: 'visible', timeout });

  if ((await desktopTab.count()) > 0) {
    await desktopTab.first().click();
    return;
  }
  if ((await mobileCombobox.count()) > 0) {
    // Primitive PaymentManagementTabs mobile — Radix SelectMenu combobox.
    // Open the trigger, then click the portaled option by its per-value testid.
    await mobileCombobox.first().click();
    const option = page.getByTestId(`${prefix}-tab-option-${value}`);
    await option.first().waitFor({ state: 'visible', timeout: 5_000 });
    await option.first().click();
    return;
  }
  // Legacy ResponsiveTabsList — Radix Select with per-item testids.
  await radixTrigger.first().click();
  await page.getByTestId(`${prefix}-tab-${value}-mobile`).click();
}
