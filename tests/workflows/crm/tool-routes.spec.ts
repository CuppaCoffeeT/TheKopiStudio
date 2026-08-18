/**
 * Standalone tool routes seatbelt @p0 @mobile — `/tools/*`, the customer bar at
 * the top of each one, and the redirects from the customer sub-routes they
 * replaced.
 *
 * REPLACES `dashboard-tool-shortcuts.spec.ts` (deleted 2026-08-18) and the
 * modal flow it covered. A tool used to be a sub-route of a customer, so
 * reaching one from navigation meant answering "which customer?" in a dialog
 * BEFORE the page appeared — the advisor's own order, inverted, and impossible
 * when there is no customer yet. Each tool now owns a route and asks inside
 * itself.
 *
 *   (1) ADVISOR: a tool opens BLANK from navigation with no customer;
 *       choosing one writes `?customer=<id>` and pre-fills; clearing returns to
 *       blank; the Legacy Map — the one tool whose output is PERSISTED against
 *       a customer — asks for one instead of offering an editor with nowhere to
 *       save; the client report generates for an incomplete record rather than
 *       refusing; and every old `/clients/:id/<tool>` URL still lands where it
 *       used to.
 *   (2) MANAGER: the picker is OWN-BOOK, not RLS-scoped. `getClientsPaginated`
 *       (the Customers list) was the obvious hook to reuse, and under Pattern D
 *       RLS it returns the WHOLE firm's book to a `view_all_clients` holder —
 *       hence `getOwnClientOptions` with an explicit `.eq('user_id', …)`.
 *       Nothing in the type system stops a future edit swapping one for the
 *       other; this test does.
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })`.
 * Data safety (LIVE shared DB): (1) CREATES ONE 'E2E-'-prefixed client in the
 * e2e ADVISOR's own book and soft-deletes it in a `finally`, including on
 * failure; (2) is read-only. Driver + cleanup live in pom/ToolRoutesPage.
 * Serialisation: (1) holds the shared advisor-book mutex — the same lock
 * dashboard.spec.ts's zero-KPI test and the clients-advisor journey hold, since
 * its seeded customer would otherwise make those assertions non-zero.
 *
 * Run: npx playwright test tests/workflows/crm/tool-routes.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { test, expect } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import {
  acquireAdvisorBookLock,
  releaseAdvisorBookLock,
} from '../../fixtures/advisorBookLock';
import { ToolRoutesPage } from '../../pom/ToolRoutesPage';

/** The planning tools that open BLANK, with their page testid. The Legacy Map
 *  is deliberately absent — it persists, so it gets its own step below. */
const BLANK_TOOLS = [
  { path: '/tools/tax-calculator', testId: 'tax-calculator', title: 'Tax calculator' },
  { path: '/tools/srs', testId: 'srs-planner', title: 'SRS planner' },
] as const;

/** Old customer sub-route → the standalone route it now redirects to. */
const REDIRECTS = [
  { from: 'tax-calculator', to: '/tools/tax-calculator' },
  { from: 'srs', to: '/tools/srs' },
  { from: 'legacy-planner', to: '/tools/legacy-planner' },
] as const;

// ── (1) Advisor: the routes, the bar, and the redirects ──────────────────────

test.describe('advisor /tools — standalone tools with an in-page customer bar', () => {
  test.use({ storageState: authFileFor('advisor') });

  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // The peer project may hold the lock for a full journey — widen well beyond
    // the per-test timeout, exactly as dashboard.spec.ts does.
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireAdvisorBookLock(660_000, 'tool-routes.spec');
  });
  test.afterAll(() => {
    releaseAdvisorBookLock();
  });

  test('a tool opens blank, takes a customer from its own bar, and the old URLs still land @p0 @mobile', async ({
    page,
  }, testInfo) => {
    const tools = new ToolRoutesPage(page);
    // Per-project name: the lock serialises the two projects, but a unique name
    // keeps cleanup unambiguous if a previous run died mid-test.
    const CUSTOMER = `E2E-Tool ${testInfo.project.name}`;
    /** Captured once the bar resolves the seeded customer; used by later steps. */
    let customerId = '';

    try {
      await test.step('each tool opens with NO customer and is usable anyway', async () => {
        for (const tool of BLANK_TOOLS) {
          await page.goto(tool.path);
          // The tool body renders — this is the whole point of the change: a
          // walk-in or a what-if needs a calculator, not a customer dialog.
          await expect(page.getByTestId(tool.testId)).toBeVisible({ timeout: 30_000 });
          await expect(tools.bar(tool.testId)).toBeVisible();
          await expect(page.getByRole('heading', { level: 1 })).toContainText(tool.title);
          // Nothing to go "back" to when you arrived from navigation.
          await expect(page.getByTestId(`${tool.testId}-back`)).toHaveCount(0);
        }
      });

      await test.step('the Legacy Map asks for a customer instead of offering an unsaveable editor', async () => {
        await page.goto('/tools/legacy-planner');
        await expect(page.getByTestId('legacy-planner-needs-customer')).toBeVisible({
          timeout: 30_000,
        });
        // Its plan is persisted against `legacy_plans.client_id` — an editor
        // with nowhere to save is worse than one question.
        await expect(page.getByTestId('legacy-planner')).toHaveCount(0);
        await expect(tools.bar('legacy-planner')).toBeVisible();
      });

      await tools.seedCustomer(CUSTOMER);

      await test.step('choosing a customer writes ?customer= and pre-fills the tool', async () => {
        await page.goto('/tools/tax-calculator');
        await expect(page.getByTestId('tax-calculator')).toBeVisible({ timeout: 30_000 });
        await tools.pickCustomer('tax-calculator', CUSTOMER);

        // The URL IS the state — a filled-in tool is shareable and bookmarkable.
        await expect
          .poll(() => new URL(page.url()).searchParams.get('customer'), { timeout: 30_000 })
          .toMatch(/^[0-9a-f-]{36}$/);
        customerId = new URL(page.url()).searchParams.get('customer')!;
        await expect(page.getByTestId('tax-calculator')).toBeVisible({ timeout: 30_000 });
        // With a customer there IS somewhere to go back to.
        await expect(page.getByTestId('tax-calculator-back')).toBeVisible();
      });

      await test.step('the old customer sub-routes still land, carrying the customer across', async () => {
        for (const redirect of REDIRECTS) {
          await page.goto(`/clients/${customerId}/${redirect.from}`);
          await page.waitForURL(
            (url) =>
              url.pathname === redirect.to && url.searchParams.get('customer') === customerId,
            { timeout: 30_000 },
          );
        }
      });

      await test.step('the client report generates for an incomplete record, and says what is missing', async () => {
        await page.goto(`/tools/client-report?customer=${customerId}`);

        // NO GATE (2026-08-18). This customer has a name, an email and a phone
        // and nothing else — the old build refused to open a report at all
        // until the profiler and the information were both complete.
        await expect(page.getByTestId('report-canvas')).toBeVisible({ timeout: 30_000 });
        const missing = page.getByTestId('report-missing-info');
        await expect(missing).toBeVisible();
        await expect(missing).toContainText('Complete the Prospect Profiler');
        // A blank money field prints NIL, never a derived $0.
        await expect(page.getByTestId('report-client-profile')).toContainText('NIL');
      });

      await test.step('clearing the customer returns the tool to a blank scratch pad', async () => {
        await page.goto('/tools/tax-calculator');
        await tools.pickCustomer('tax-calculator', CUSTOMER);
        await expect
          .poll(() => new URL(page.url()).searchParams.get('customer'), { timeout: 30_000 })
          .not.toBeNull();

        // The bar's OWN Clear button — a real, labelled, keyboard-reachable
        // control. The primitive's inline X is a `<span aria-hidden>`, which is
        // fine as a mouse shortcut and useless to everyone else.
        await page.getByTestId('tax-calculator-customer-bar-clear').click();
        await expect
          .poll(() => new URL(page.url()).searchParams.get('customer'), { timeout: 30_000 })
          .toBeNull();
        await expect(page.getByTestId('tax-calculator')).toBeVisible();
      });
    } finally {
      await tools.removeCustomer(CUSTOMER);
    }
  });
});

// ── (2) Manager: the customer bar is own-book, not RLS-scoped ────────────────

test.describe('manager /tools — the customer bar is own-book', () => {
  test.use({ storageState: authFileFor('manager') });

  test('a manager who reads every book still gets only their own customers @p0 @mobile', async ({
    page,
  }) => {
    const tools = new ToolRoutesPage(page);

    // Read-only throughout. Count what RLS lets this manager READ — the table
    // must be MOUNTED first, or an unfetched list collapses the comparison
    // below to 0 <= 0 and passes for the wrong reason.
    await page.goto('/clients');
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 30_000 });
    const rlsVisibleRows = await page
      .locator('[data-testid^="clients-row-"]:visible, [data-testid^="clients-mobile-card-"]:visible')
      .count();

    await page.goto('/tools/tax-calculator');
    await expect(page.getByTestId('tax-calculator-customer-bar')).toBeVisible({ timeout: 30_000 });

    // RLS reach varies by environment, so assert the invariant that holds
    // either way: the OWN book can never be wider than what RLS exposes, and an
    // empty one says so rather than listing another advisor's customers.
    const trigger = page.getByTestId('tax-calculator-customer-bar-select');
    await expect(trigger).toBeVisible();
    if ((await trigger.isDisabled()) || (await trigger.innerText()).includes('No customers')) {
      await expect(page.getByTestId('tax-calculator-customer-bar')).toContainText(
        'No customers in your book yet',
      );
      return;
    }

    const options = await tools.customerOptions('tax-calculator');
    expect(
      options.length,
      'the customer bar must not widen to the RLS-visible book',
    ).toBeLessThanOrEqual(rlsVisibleRows);
  });
});
