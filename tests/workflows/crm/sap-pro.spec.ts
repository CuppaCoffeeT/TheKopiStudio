/**
 * WF — SAP PRO (tool 08): what a new advisor could earn in their first 3 years.
 *
 * Reachable from the TOOLS band, opens on the sheet's own defaults ($5k tier,
 * $3,000 a month, 20%), and quotes the figures the advisor's
 * `income-illustrator2.html` quotes. The arithmetic is golden-locked in
 * src/features/crm/planning/lib/__tests__/sapPro.test.ts; this proves the page
 * renders THAT arithmetic, wired to the right controls.
 *
 * Read-only throughout: no customer (the tool has none), nothing is saved.
 * The rail is `hidden` below lg, so the rail click skips on mobile.
 */
import { expect, test } from '@playwright/test';

test.describe('SAP PRO', () => {
  test('opens from the rail and illustrates the sheet’s figures', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/tools/sap-pro');
    } else {
      await page.goto('/dashboard');
      await page.getByTestId('app-sidebar').getByRole('link', { name: 'SAP PRO' }).click();
      await page.waitForURL('**/tools/sap-pro');
    }

    await expect(page.getByTestId('sap-pro')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText('SAP PRO');

    // Defaults: $5k tier, $3,000 a month, 20% quarterly.
    await expect(page.getByTestId('sap-pro-flat-input')).toHaveValue('3000');
    await expect(page.getByTestId('sap-pro-pay-hint')).toHaveText('Unlocks 48% of the support: $2,400 a month.');
    await expect(page.getByTestId('sap-pro-eq-total')).toContainText('$5,400');
    await expect(page.getByTestId('sap-pro-year-total-1')).toHaveText('$72,000');
    await expect(page.getByTestId('sap-pro-year-total-2')).toHaveText('$81,000');
    await expect(page.getByTestId('sap-pro-year-total-3')).toHaveText('$52,200');
    await expect(page.getByTestId('sap-pro-grand')).toHaveText('$205,200');

    // $8k tier, 40%, $12,000 a month — full support unlocked.
    await page.getByTestId('sap-pro-tier-8000').click();
    await page.getByTestId('sap-pro-rate-0.4').click();
    await page.getByTestId('sap-pro-flat-input').fill('12000');
    await expect(page.getByTestId('sap-pro-pay-hint')).toHaveText('Full income support unlocked.');
    await expect(page.getByTestId('sap-pro-grand')).toHaveText('$868,800');

    await page.getByTestId('sap-pro-year-3').click();
    await expect(page.getByTestId('sap-pro-eq-title')).toHaveText('A month in Year 3');
    await expect(page.getByTestId('sap-pro-eq-total')).toContainText('$15,000');

    // Month by month: switching on seeds every month at the flat amount, so
    // nothing moves until a month is edited.
    // The switch's input is sr-only; its label is the real hit area.
    await page.getByText('Set each month separately').click();
    await expect(page.getByTestId('sap-pro-custom-toggle')).toBeChecked();
    await expect(page.getByTestId('sap-pro-eq-title')).toHaveText('An average month in Year 3');
    await expect(page.getByTestId('sap-pro-month-36')).toHaveValue('12000');
    await expect(page.getByTestId('sap-pro-grand')).toHaveText('$868,800');

    // The fine print opens the scheme notes.
    await page.getByTestId('sap-pro-to-notes').click();
    await expect(page.getByTestId('sap-pro-notes')).toBeVisible();
    await expect(page.getByTestId('sap-pro-notes')).toContainText('If you leave early');
  });
});
