/**
 * WF — SRS planner (tool 05).
 *
 * The tool tracks the advisor's own reference: the withdrawal age is the
 * customer's locked-in 62/63/64, the 10-year window is counted from the FIRST
 * withdrawal (so deferring moves it), the level draw replaced the rising one,
 * and the journey panel nets both ends.
 *
 * Since the 2026-08-19 update the PLANNED first withdrawal drives accumulation
 * too — it sits on the paying-in side, contributions run until it, and there is
 * no separate deferral step. This spec covers that chain, because a broken link
 * in it produces a page that still renders, with quietly wrong numbers.
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
  // The canonical route since 2026-08-18 — `/clients/:id/srs` still redirects
  // here (covered by tool-routes.spec), but a spec about the PLANNER should not
  // spend its first assertion on a redirect.
  await page.goto(`/tools/srs?customer=${id}`);
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

  test('deferring the first withdrawal grows the balance and moves the window', async ({ page }) => {
    await openSrsPlanner(page);

    const projected = page.getByTestId('srs-projected-balance');
    const before = await projected.textContent();
    // No deferral at first — the row only appears once the start age is past
    // the locked-in one.
    await expect(page.getByTestId('srs-deferral-years')).toHaveCount(0);

    // The start age lives on the PAYING-IN side now: it ends accumulation, so
    // pushing it out has to move the projected balance, not just the drawdown.
    await page.getByTestId('srs-start-age').fill('67');
    await expect(projected).not.toHaveText(before ?? '');
    await expect(page.getByTestId('srs-deferral-years')).toBeVisible();

    // The window now shuts at 76, not 72 — it is counted from the first
    // withdrawal, which is the rule the tool exists to encode.
    await expect(page.getByTestId('srs-journey')).toContainText('76');
  });

  test('contributions cannot outlast the first withdrawal', async ({ page }) => {
    await openSrsPlanner(page);

    // Relief runs until the first dollar comes out, so the cut-off may sit
    // past the locked-in age — but never at or after the withdrawal itself.
    await page.getByTestId('srs-start-age').fill('67');
    await page.getByTestId('srs-until').fill('66');
    await expect(page.getByTestId('srs-until')).toHaveValue('66');

    // Pulling the start age back in front of it drags the cut-off down.
    await page.getByTestId('srs-start-age').fill('64');
    await expect(page.getByTestId('srs-until')).toHaveValue('63');
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
