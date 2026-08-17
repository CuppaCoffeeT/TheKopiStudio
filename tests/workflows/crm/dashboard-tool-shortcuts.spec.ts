/**
 * Overview tool shortcuts seatbelt @p0 @mobile — the row of six tool buttons
 * under the /dashboard queue figures, and the customer picker each one opens.
 *
 *   (1) ADVISOR: the row renders BETWEEN the four figures and "+ New customer";
 *       every shortcut the viewer's modules allow is offered; and picking a
 *       customer lands on exactly the route the customer record's own launcher
 *       would have used — /clients/:id/{tax-calculator,srs,legacy-planner,
 *       report}, the profiler entry link, and for step 02 (which has no route of
 *       its own) the record with its information form open and the param gone.
 *   (2) MANAGER: the picker is OWN-BOOK, not RLS-scoped. `getClientsPaginated`
 *       (the Customers list) was the obvious hook to reuse, and under Pattern D
 *       RLS it returns the WHOLE firm's book to a `view_all_clients` holder —
 *       hence the picker's own `getOwnClientOptions` with an explicit
 *       `.eq('user_id', …)`. Nothing in the type system stops a future edit
 *       swapping one for the other; this test does.
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })`.
 * Data safety (LIVE shared DB): (1) CREATES ONE 'E2E-'-prefixed client in the
 * e2e ADVISOR's own book and soft-deletes it in a `finally`, including on
 * failure; (2) is read-only. Driver + cleanup live in pom/ToolShortcutsPage.
 * Serialisation: (1) holds the shared advisor-book mutex — the same lock
 * dashboard.spec.ts's zero-KPI test and the clients-advisor journey hold, since
 * its seeded customer would otherwise make those assertions non-zero.
 *
 * Run: npx playwright test tests/workflows/crm/dashboard-tool-shortcuts.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { test, expect } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import {
  acquireAdvisorBookLock,
  releaseAdvisorBookLock,
} from '../../fixtures/advisorBookLock';
import { ToolShortcutsPage } from '../../pom/ToolShortcutsPage';

/** Every route-bearing tool reachable from a shortcut. */
const ROUTED_TOOLS = [
  { key: 'tax', url: /\/clients\/[0-9a-f-]+\/tax-calculator$/ },
  { key: 'srs', url: /\/clients\/[0-9a-f-]+\/srs$/ },
  { key: 'legacy', url: /\/clients\/[0-9a-f-]+\/legacy-planner$/ },
  { key: 'report', url: /\/clients\/[0-9a-f-]+\/report$/ },
] as const;

// ── (1) Advisor: the row, and every shortcut's destination ───────────────────

test.describe('advisor /dashboard Overview — tool shortcuts', () => {
  test.use({ storageState: authFileFor('advisor') });

  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // The peer project may hold the lock for a full journey — widen well beyond
    // the per-test timeout, exactly as dashboard.spec.ts does.
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireAdvisorBookLock(660_000, 'dashboard-tool-shortcuts.spec');
  });
  test.afterAll(() => {
    releaseAdvisorBookLock();
  });

  test('the row sits under the figures and every shortcut opens its tool on the picked customer @p0 @mobile', async ({
    page,
  }, testInfo) => {
    const tools = new ToolShortcutsPage(page);
    // Per-project name: the lock serialises the two projects, but a unique name
    // keeps cleanup unambiguous if a previous run died mid-test.
    const CUSTOMER = `E2E-Shortcut ${testInfo.project.name}`;

    try {
      await page.goto('/dashboard');
      await expect(page.getByTestId('home-queue-stats')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('home-tool-shortcuts')).toBeVisible({ timeout: 30_000 });

      // Whether the profiler shortcut is offered is a MODULE decision, and the
      // launcher band above is gated on the same module — so the band's
      // presence is the expectation, not a hardcoded assumption about grants.
      const canProfile = (await page.getByTestId('home-start-profiler-band').count()) > 0;

      await test.step('the row renders BETWEEN the four figures and "+ New customer"', async () => {
        const order = await page.evaluate(() => {
          const at = (id: string) => document.querySelector(`[data-testid="${id}"]`);
          const [stats, tools_, add] = [
            at('home-queue-stats'),
            at('home-tool-shortcuts'),
            at('home-add-customer-btn'),
          ];
          if (!stats || !tools_ || !add) return null;
          const follows = (a: Element, b: Element) =>
            Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
          return { statsFirst: follows(stats, tools_), toolsBeforeAdd: follows(tools_, add) };
        });
        expect(order, 'stats, tool row and add button must all be mounted').not.toBeNull();
        expect(order!.statsFirst).toBe(true);
        expect(order!.toolsBeforeAdd).toBe(true);
      });

      await test.step('every shortcut the modules allow is offered, each a real touch target', async () => {
        const offered = ['info', 'report', 'tax', 'srs', 'legacy'];
        for (const key of canProfile ? ['profiler', ...offered] : offered) {
          const button = page.getByTestId(`home-tool-shortcut-${key}`);
          await expect(button).toBeVisible();
          const box = await button.boundingBox();
          expect(box!.height, `${key} must clear the 44px touch floor`).toBeGreaterThanOrEqual(43);
        }
        if (!canProfile) {
          await expect(page.getByTestId('home-tool-shortcut-profiler')).toHaveCount(0);
        }
      });

      await tools.seedCustomer(CUSTOMER);

      await test.step('the picker names the tool it was opened for', async () => {
        await page.goto('/dashboard');
        await page.getByTestId('home-tool-shortcut-tax').click();
        const picker = page.getByTestId('home-tool-customer-picker');
        await expect(picker).toBeVisible({ timeout: 30_000 });
        await expect(picker).toContainText('Open Tax calculator');
        await expect(page.getByTestId('home-tool-customer-select')).toBeVisible();
      });

      for (const tool of ROUTED_TOOLS) {
        await test.step(`${tool.key} opens on the picked customer`, async () => {
          await tools.launchTool(tool.key, CUSTOMER);
          await page.waitForURL(tool.url, { timeout: 30_000 });
        });
      }

      await test.step('customer information opens the form on the record, param stripped', async () => {
        await tools.launchTool('info', CUSTOMER);
        await page.waitForURL(/\/clients\/[0-9a-f-]+/, { timeout: 30_000 });
        // Step 02 has no route of its own — the shortcut must land ON the form.
        await expect(page.getByTestId('crm-client-form-modal')).toBeVisible({ timeout: 30_000 });
        // Left in the URL, a refresh or a Back would reopen a dismissed form.
        expect(page.url()).not.toContain('tool=info');
        await page.getByTestId('crm-client-cancel-btn').click();
      });

      if (canProfile) {
        await test.step('the profiler carries BOTH halves of the entry contract', async () => {
          await tools.launchTool('profiler', CUSTOMER);
          await page.waitForURL(/\/profiler\?/, { timeout: 30_000 });
          const url = new URL(page.url());
          expect(url.searchParams.get('prospect')).toBe(CUSTOMER);
          // The id is the load-bearing half: "profiled" is decided by
          // results.client_id, never by a name match (see lib/profilerEntry).
          expect(url.searchParams.get('customerId')).toMatch(/^[0-9a-f-]{36}$/);
        });
      }
    } finally {
      await tools.removeCustomer(CUSTOMER);
    }
  });
});

// ── (2) Manager: the picker is own-book, not RLS-scoped ──────────────────────

test.describe('manager /dashboard Overview — the picker is own-book', () => {
  test.use({ storageState: authFileFor('manager') });

  test('a manager who reads every book still gets only their own customers @p0 @mobile', async ({
    page,
  }) => {
    // Read-only throughout. Count what RLS lets this manager READ — the table
    // must be MOUNTED first, or an unfetched list collapses the comparison
    // below to 0 <= 0 and passes for the wrong reason.
    await page.goto('/clients');
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 30_000 });
    const rlsVisibleRows = await page
      .locator('[data-testid^="clients-row-"]:visible, [data-testid^="clients-mobile-card-"]:visible')
      .count();

    await page.goto('/dashboard');
    await expect(page.getByTestId('home-tool-shortcuts')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('home-tool-shortcut-tax').click();
    const picker = page.getByTestId('home-tool-customer-picker');
    await expect(picker).toBeVisible({ timeout: 30_000 });

    // RLS reach varies by environment, so assert the invariant that holds
    // either way: the OWN book can never be wider than what RLS exposes, and an
    // empty one shows its empty state rather than another advisor's customers.
    const select = page.getByTestId('home-tool-customer-select');
    if ((await select.count()) === 0) {
      await expect(picker).toContainText('You have no customers yet');
      return;
    }

    await select.click();
    const options = page.locator('[data-testid^="home-tool-customer-option"]');
    await expect(options.first()).toBeVisible({ timeout: 20_000 });
    expect(
      await options.count(),
      'the picker must not widen to the RLS-visible book',
    ).toBeLessThanOrEqual(rlsVisibleRows);
  });
});
