/**
 * WF — Shield comparison (tool 07) + the rail's "Others" group on /profiler.
 *
 * (1) The tool: reachable from the TOOLS band, opens blank at the sheet's own
 *     age 36, and quotes the figures the advisor's `shield-comparison.html`
 *     quotes (the arithmetic is golden-locked in lib/__tests__/shield.test.ts;
 *     this proves the page renders THAT arithmetic, not a stale copy).
 * (2) The rail bug fixed 2026-09-24: /profiler renders `AppSidebar` outside
 *     `DashboardLayout`, and with no `SidebarProvider` above it the rail fell
 *     back to "Others" forced OPEN with an inert toggle — so it popped open on
 *     the profiler and stayed shut on every other tool.
 *
 * Read-only throughout: no customer is chosen, nothing is saved.
 * The rail is `hidden` below lg, so (2) and the rail click skip on mobile.
 */
import { expect, test } from '@playwright/test';

const OTHERS_KEY = 'kopi.sidebar.othersOpen';

test.describe('Shield comparison', () => {
  test('opens from the rail and quotes the sheet at age 36', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/tools/shield-comparison');
    } else {
      await page.goto('/dashboard');
      await page.getByTestId('app-sidebar').getByRole('link', { name: 'Shield comparison' }).click();
      await page.waitForURL('**/tools/shield-comparison');
    }

    await expect(page.getByTestId('shield-comparison')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Shield comparison');

    await expect(page.getByTestId('shield-age-input')).toHaveValue('36');
    await expect(page.getByTestId('shield-singlife-cash')).toContainText('$827.51');
    await expect(page.getByTestId('shield-income-cash')).toContainText('$1,113.00');

    // The stepper re-prices: age 41 is Income's next band.
    await page.getByTestId('shield-age-input').fill('41');
    await expect(page.getByTestId('shield-singlife-cash')).toContainText('$1,484.51');
    await expect(page.getByTestId('shield-income-cash')).toContainText('$1,573.00');

    // Fit finder: a child with cancer-drug worries leans Income.
    await page.getByTestId('shield-tab-fit').click();
    await page.getByRole('button', { name: 'Cancer drug bills' }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).first().click();
    await expect(page.getByTestId('shield-fit-score')).toContainText('Leans Income');

    // Compare: the area filter narrows the rows.
    await page.getByTestId('shield-tab-compare').click();
    const rows = page.getByTestId('shield-compare-rows').locator('tr');
    await expect(rows).toHaveCount(53);
    await page.getByRole('button', { name: 'Overseas', exact: true }).click();
    await expect(rows).toHaveCount(2);
  });
});

test.describe('rail — "Others" on /profiler', () => {
  test('stays as the advisor left it, and toggles, like on every other tool', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the rail is hidden below lg');

    // Start collapsed, the provider's own default.
    await page.goto('/dashboard');
    await page.evaluate((key) => window.localStorage.setItem(key, 'false'), OTHERS_KEY);

    const toggle = page.getByTestId('app-sidebar-others-toggle');

    await page.goto('/tools/tax-calculator');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false', { timeout: 30_000 });

    await page.goto('/profiler');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false', { timeout: 30_000 });

    // And the toggle is live here — it used to be a no-op.
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
