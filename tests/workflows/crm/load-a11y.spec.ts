/**
 * CRM load + axe a11y seatbelt @p0 @mobile — every CRM surface loads (key
 * testid visible, real data rendered — never a skeleton) and then passes an
 * axe-core WCAG 2.0 A/AA scan with ZERO critical/serious violations
 * (moderate/minor are reported by axe but don't gate; `includedImpacts`
 * filters the assertion). Mirrors tests/workflows/profiler/load-a11y.spec.ts.
 *
 * Surfaces × roles (one test per surface so failures localize):
 *   (a) advisor  /crm          — dashboard (KPI tiles, empty-book CTA or
 *       quick-link — whichever the live book renders)
 *   (b) advisor  /clients      — list (rows or the empty state; the advisor
 *       book is NOT guaranteed to have rows, so the spec waits for the
 *       DataTable to settle into `data-variant` default|empty, never loading)
 *   (c) advisor  /clients/:id  — detail: a THROWAWAY client is created via
 *       the ClientsPage POM first (name/email/phone only — no seed balance →
 *       no bank-history side-row), the Overview and Policies tabs are
 *       scanned, then the client is soft-deleted through the UI in `finally`
 *       (plus an afterEach safety net that survives a test TIMEOUT, where the
 *       in-test finally only sees a dead page — clients-advisor.spec pattern)
 *   (d) advisor  ClientFormModal open (add mode) — scanned with the modal
 *       open, then dismissed via Cancel: zero DB writes on this surface
 *   (e) manager  /clients      — all-book RLS list (rows or empty)
 *
 * DB residue (LIVE shared DB): only test (c) writes — exactly ONE `clients`
 * row, named 'E2E-A11y-<project>-r<retry>-<ts>' (per-run/per-project unique,
 * so the two Playwright projects never contend), soft-deleted via the UI as
 * the final step. Reads filter is_deleted, so UI soft-delete = clean. All
 * other tests are read-only. sky/Keane data is never touched.
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })` — the
 * parallel config's setup project (tests/auth.setup.ts) mints tests/.auth/
 * <role>.json once per run. Run via playwright.parallel.config.ts.
 *
 * Added with this spec: `data-variant` attribute on the DataTable shell
 * (src/components/primitives/ui/DataTable.tsx) — lets specs await the
 * default|empty variant on lists whose data is not guaranteed.
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { ClientsPage } from '../../pom/ClientsPage';
// Both helpers used to live here in full; they are now shared with
// profiler/load-a11y and reports/access-a11y. expectWcag2aaClean settles the
// page's animations itself — see the note in the runner for why every scan
// needs that, not just the modal ones.
import { expectWcag2aaClean, settleAnimations } from '../../runners/a11yChecks';

/**
 * Wait for a ListPageFrame table to settle into REAL content: rows (default)
 * or the genuine empty state — never the loading skeleton (which carries
 * `data-variant="loading"`). Returns once rows/empty rendered.
 */
async function waitForListSettled(page: Page, tableTestId: string): Promise<void> {
  const table = page.getByTestId(tableTestId);
  await expect(table).toBeVisible({ timeout: 30_000 });
  await expect(table).toHaveAttribute('data-variant', /^(default|empty)$/, { timeout: 30_000 });
}

/** Visible list rows — desktop table rows OR mobile cards (one hidden per viewport). */
function visibleClientRows(page: Page) {
  return page.locator(
    '[data-testid^="clients-row-"]:visible, [data-testid^="clients-mobile-card-"]:visible',
  );
}

// ── (a)+(b)+(c)+(d) Advisor CRM surfaces ─────────────────────────────────────

/**
 * Cleanup state for test (c)'s throwaway client. Within-file serial
 * (fullyParallel: false), never shared across workers. `cleanedUp` starts
 * true so the afterEach safety net no-ops for every other test.
 */
let clientName = '';
let clientId = '';
let cleanedUp = true;

/**
 * Soft-delete the throwaway client through the UI (idempotent): by id when
 * known (a not-found detail means it is already gone), else by name search
 * (zero matches means it was never created). Shared by the in-test `finally`
 * and the afterEach timeout safety net.
 */
async function removeThrowawayClient(page: Page): Promise<void> {
  const crm = new ClientsPage(page);
  if (!clientId) {
    await crm.gotoList();
    await crm.search(clientName);
    try {
      await crm.visibleRows().first().waitFor({ state: 'visible', timeout: 10_000 });
    } catch {
      cleanedUp = true; // nothing was created — zero residue
      return;
    }
    clientId = await crm.idFromRow(crm.visibleRows().first());
  }
  await page.goto(`/clients/${clientId}`);
  const overview = page.getByTestId('clients-detail-overview');
  const notFound = page.getByTestId('clients-detail-not-found');
  await overview.or(notFound).first().waitFor({ state: 'visible', timeout: 30_000 });
  if (await notFound.count()) {
    cleanedUp = true; // already soft-deleted
    return;
  }
  await crm.deleteClientFromDetail();
  cleanedUp = true;
}

test.describe('advisor CRM surfaces', () => {
  test.use({ storageState: authFileFor('advisor') });

  // Safety net for test (c): an in-test `finally` cannot drive a DEAD page
  // after a test timeout, so the hook re-runs the UI cleanup with a fresh
  // budget. No-op on the happy path and for every other test in this file.
  test.afterEach(async ({ page }, testInfo) => {
    if (cleanedUp) return;
    testInfo.setTimeout(testInfo.timeout + 120_000);
    try {
      await removeThrowawayClient(page);
      console.warn(
        `[crm load-a11y] afterEach safety net removed residue client "${clientName}" — ` +
          'the test failed before its finally-cleanup could run.',
      );
    } catch (error) {
      console.error(
        `[crm load-a11y] EMERGENCY CLEANUP FAILED — possible residue client "${clientName}" ` +
          `(id: ${clientId || 'unknown'}) on the LIVE shared DB. Soft-delete it via the UI as the e2e advisor.`,
        error,
      );
    }
  });

  test('/crm dashboard loads + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    await page.goto('/crm');
    await expect(page.getByTestId('crm-dashboard')).toBeVisible({ timeout: 30_000 });
    // Never scan the KPI skeleton — wait for the stats query to resolve into
    // the four real tiles (the loading grid carries its own testid).
    await expect(page.getByTestId('crm-dashboard-loading')).toHaveCount(0, { timeout: 30_000 });
    for (const tile of [
      'crm-kpi-total-clients',
      'crm-kpi-active-policies',
      'crm-kpi-annual-premium',
      'crm-kpi-upcoming-follow-ups',
    ]) {
      await expect(page.getByTestId(tile)).toBeVisible({ timeout: 30_000 });
    }
    await expectWcag2aaClean(page);
  });

  test('/clients list loads (rows or empty) + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    const crm = new ClientsPage(page);
    await crm.gotoList();
    // The advisor book is empty-or-not — settle into rows OR the true empty
    // state (both are real content; only the skeleton is excluded).
    await waitForListSettled(page, 'clients-table');
    if ((await page.getByTestId('clients-table').getAttribute('data-variant')) === 'default') {
      await expect(visibleClientRows(page).first()).toBeVisible();
    }
    await expect(crm.addClientButton).toBeVisible();
    await expectWcag2aaClean(page);
  });

  test('client detail Overview + Policies tabs load + axe wcag2aa clean @p0 @mobile', async ({
    page,
  }, testInfo) => {
    // Create + 2 scans + UI soft-delete on a cold dev server needs headroom.
    test.slow();

    // Per-run unique, retry-safe, parallel-project-safe — and free of every
    // character the list's sanitizeSearchTerm strips, so search matches verbatim.
    const suffix = `${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;
    clientName = `E2E-A11y-${suffix}`;
    clientId = '';
    cleanedUp = false;

    const crm = new ClientsPage(page);
    try {
      // Throwaway client: name/email/phone only (the modal's required set).
      // No seed balance → createClient writes NO bank-history side-row, so
      // soft-deleting the client below is the COMPLETE cleanup.
      await crm.gotoList();
      await crm.openAddClientForm();
      await expect(crm.clientModal).toBeVisible();
      await crm.fillClientForm({
        name: clientName,
        email: `e2e-a11y-${Date.now()}@example.com`,
        phone: '9123 0000',
      });
      await crm.submitClientForm();

      // Open the detail via the list search (also proves the row landed).
      clientId = await crm.openClientByName(clientName);

      // Overview (default tab) — real client data rendered, then scan.
      await expect(page.getByTestId('clients-detail')).toContainText(clientName);
      await expect(page.getByTestId('clients-detail-overview')).toBeVisible();
      // Let the 'Client added' toast dismiss first: while ANY toast is
      // visible, sonner's `<li role="status">` inside its `<ol>` trips axe's
      // `list` rule (serious) — third-party structure, not this surface.
      await page.getByTestId('toast-success').waitFor({ state: 'detached', timeout: 15_000 });
      await expectWcag2aaClean(page);

      // Policies tab — a fresh client settles into the section's empty state
      // (real content, not the `clients-policies-loading` skeleton), then scan.
      await crm.switchTab('policies');
      await expect(page.getByTestId('clients-policies-empty')).toBeVisible({ timeout: 30_000 });
      await expectWcag2aaClean(page);
    } finally {
      // Soft-delete the throwaway client even when a scan failed. A thrown
      // cleanup error here would MASK the test's own failure — log loudly and
      // let the afterEach safety net retry with a fresh budget instead.
      try {
        await removeThrowawayClient(page);
      } catch (error) {
        console.warn(
          `[crm load-a11y] in-test finally could not soft-delete "${clientName}" — ` +
            'deferring to the afterEach safety net.',
          error,
        );
      }
    }
  });

  test('ClientFormModal open (add mode) + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    const crm = new ClientsPage(page);
    await crm.gotoList();
    await crm.openAddClientForm();
    await expect(crm.clientModal).toBeVisible();
    // The form is fully rendered (first field mounted) before the scan.
    await expect(page.getByTestId('crm-client-name-input')).toBeVisible();
    await expect(page.getByTestId('crm-client-save-btn')).toBeVisible();
    // Never scan mid fade-in/zoom-in — axe reads alpha-blended colors.
    await settleAnimations(crm.clientModal);
    await expectWcag2aaClean(page);
    // Dismiss WITHOUT saving — this surface writes nothing to the DB.
    await page.getByTestId('crm-client-cancel-btn').click();
    await expect(crm.clientModal).toBeHidden();
  });
});

// ── (e) Manager /clients ─────────────────────────────────────────────────────

test.describe('manager /clients', () => {
  test.use({ storageState: authFileFor('manager') });

  test('all-book clients list loads + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    const crm = new ClientsPage(page);
    await crm.gotoList();
    // Manager RLS reads every advisor's book, but the CRM import may not have
    // landed yet — rows OR the genuine empty state both count as loaded.
    await waitForListSettled(page, 'clients-table');
    if ((await page.getByTestId('clients-table').getAttribute('data-variant')) === 'default') {
      await expect(visibleClientRows(page).first()).toBeVisible();
    }
    await expectWcag2aaClean(page);
  });
});
