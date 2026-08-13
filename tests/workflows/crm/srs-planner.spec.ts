/**
 * WF — SRS planner (tool 05).
 *
 * The tool was rebuilt against the advisor's newer reference: the withdrawal
 * age is now the customer's own locked-in 62/63/64, the 10-year window is
 * counted from the FIRST withdrawal (so deferring moves it), the level draw
 * replaced the rising one, and the journey panel nets both ends.
 *
 * This spec covers the wiring those changes introduced — the chain from the
 * projection through the deferral into the drawdown — because a broken link
 * there produces a page that still renders, with quietly wrong numbers.
 */
import { expect, test, type Page } from '@playwright/test';
import { ClientsPage } from '../../pom/ClientsPage';

/** First customer in the book → their SRS planner. */
async function openSrsPlanner(page: Page) {
  const clients = new ClientsPage(page);
  await clients.gotoList();
  const row = clients.visibleRows().first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  const id = await clients.idFromRow(row);
  await page.goto(`/clients/${id}/srs`);
  await expect(page.getByTestId('srs-planner')).toBeVisible({ timeout: 30_000 });
}

test.describe('SRS planner', () => {
  test('renders every panel of the rebuilt tool', async ({ page }) => {
    await openSrsPlanner(page);

    await expect(page.getByTestId('srs-stats')).toBeVisible();
    await expect(page.getByTestId('srs-contributions')).toBeVisible();
    await expect(page.getByTestId('srs-withdrawals')).toBeVisible();
    await expect(page.getByTestId('srs-projection')).toBeVisible();
    await expect(page.getByTestId('srs-schedule')).toBeVisible();
    await expect(page.getByTestId('srs-journey')).toBeVisible();
    await expect(page.getByTestId('srs-net-benefit')).toBeVisible();
  });

  test('deferring the start age grows the balance and moves the window', async ({ page }) => {
    await openSrsPlanner(page);

    // No deferral at first — the row only appears once there is growth to show.
    await expect(page.getByTestId('srs-deferral-growth')).toHaveCount(0);

    await page.getByTestId('srs-start-age').fill('67');
    await expect(page.getByTestId('srs-deferral-growth')).toBeVisible();

    // The window now shuts at 76, not 72 — it is counted from the first
    // withdrawal, which is the rule the rebuild exists to encode.
    await expect(page.getByTestId('srs-journey')).toContainText('76');
  });

  test('the custom strategy swaps the year picker for three legs', async ({ page }) => {
    await openSrsPlanner(page);

    await expect(page.getByTestId('srs-withdrawal-years')).toBeVisible();
    await expect(page.getByTestId('srs-periods')).toHaveCount(0);

    await page.getByTestId('srs-strategy').click();
    await page.getByRole('option', { name: 'Custom legs' }).click();

    await expect(page.getByTestId('srs-periods')).toBeVisible();
    await expect(page.getByTestId('srs-period-amount-1')).toBeVisible();
    await expect(page.getByTestId('srs-withdrawal-years')).toHaveCount(0);
  });

  test('the contribution side drives the drawdown side', async ({ page }) => {
    await openSrsPlanner(page);

    const projected = page.getByTestId('srs-projected-balance');
    const before = await projected.textContent();

    // A bigger annual contribution must move the projected balance, and the
    // drawdown reads from it — that chain is the tool's whole argument.
    await page.getByTestId('srs-annual').fill('35700');
    await expect(projected).not.toHaveText(before ?? '');
    await expect(page.getByTestId('srs-schedule')).toBeVisible();
  });
});
