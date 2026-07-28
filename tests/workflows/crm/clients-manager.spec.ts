/**
 * Manager + super_admin CRM visibility matrix @p0 @mobile — read-all /
 * write-none on another advisor's client, plus the anonymous /clients + /crm
 * /login redirects.
 *
 * PRD role matrix (CRM_MODULE_PRD.md): manager and super_admin hold the
 * `view_all_clients` capability — the clients/policies/interactions/bank RLS
 * SELECT policies admit them to every advisor's book, but every write policy
 * stays owner-only. The UI mirrors that contract: ClientDetailPage computes
 * `isOwn` from `clients.user_id` and, on a foreign client, renders the
 * ReadOnlyHint and hides EVERY mutation affordance (header Edit/Delete, the
 * per-tab Add buttons, the per-row Edit/Delete pairs) — profiler
 * results-manager precedent.
 *
 * Fixture (request-free path): a beforeAll drives a SEPARATE browser context
 * with the ADVISOR storageState (tests/.auth/advisor.json, minted by
 * tests/auth.setup.ts under playwright.parallel.config.ts) and creates ONE
 * client 'E2E-Mgr-<project>-<ts>' through the real UI, seed balance $4,500 →
 * the 'Initial client onboarding' bank row gives the read-only tabs a
 * populated list to assert against. An afterAll soft-deletes the bank row and
 * the client through the UI as the advisor on every exit path (pass, fail, or
 * beforeAll crash — it falls back to a name search when the id was never
 * captured) and logs LOUDLY + rethrows when it cannot finish, because that is
 * real residue on the LIVE shared DB.
 *
 * Serialisation: creating/deleting a client in the advisor's book mid-run
 * breaks clients-advisor.spec.ts's dashboard-KPI baseline+delta math, so both
 * write windows hold the SAME cross-worker advisor-book lock that spec holds
 * for its whole journey (tests/fixtures/advisorBookLock.ts — the lock path is
 * the contract). The manager/super_admin tests themselves are pure reads on a
 * per-run-unique name and need no lock.
 *
 * Data safety (LIVE shared DB): the only rows touched are the one
 * 'E2E-Mgr-…' client + its seed bank row, created by the e2e advisor and
 * soft-deleted in afterAll. The manager/super_admin sections perform ZERO
 * mutations — the matrix asserts their mutation affordances do not exist.
 * sky/Keane data is never touched.
 *
 * All selectors are real data-testids read from src/features/crm/** via the
 * shared ClientsPage POM (tests/pom/ClientsPage.ts). No new testids needed.
 *
 * Run: npx playwright test tests/workflows/crm/clients-manager.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { resolve } from 'path';
import { test, expect, type Browser, type Page, type TestInfo } from '@playwright/test';
import { acquireAdvisorBookLock, releaseAdvisorBookLock } from '../../fixtures/advisorBookLock';
import { authFileFor } from '../../fixtures/roleAuth';
import { ClientsPage } from '../../pom/ClientsPage';

const SEED_BALANCE_DISPLAY = '$4,500.00';
const SEED_INCOME_DISPLAY = '$45,000.00';

/**
 * Per-worker fixture identity (fullyParallel: false → the whole file runs in
 * ONE worker per project; a retry's fresh worker re-runs beforeAll with a new
 * suffix and cleans up its own client in its own afterAll).
 */
let clientName = '';
let clientId = '';

/**
 * Run `fn` on a page authed as the ADVISOR in an isolated context — the
 * request-free setup path: the storageState file already holds a live session,
 * so no UI sign-in (and no Supabase auth round-trip) happens here.
 */
async function withAdvisorPage(
  browser: Browser,
  testInfo: TestInfo,
  fn: (page: Page) => Promise<void>,
): Promise<void> {
  const baseURL = testInfo.project.use.baseURL;
  if (!baseURL) {
    throw new Error('[clients-manager.spec] no baseURL on the project — run via a repo config');
  }
  const context = await browser.newContext({
    baseURL,
    storageState: resolve(process.cwd(), authFileFor('advisor')),
  });
  const page = await context.newPage();
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

// ── Fixture lifecycle (advisor-owned client, UI-created + UI-soft-deleted) ───

test.beforeAll(async ({ browser }, testInfo) => {
  // clients-advisor may hold the book lock for its full journey (≤300s per
  // project instance) — widen the hook budget well past the lock wait.
  testInfo.setTimeout(testInfo.timeout + 720_000);

  // Per-run unique, retry-safe, parallel-project-safe — and free of every
  // character the list's sanitizeSearchTerm strips, so search matches verbatim.
  clientName = `E2E-Mgr-${testInfo.project.name}-${Date.now()}`;
  clientId = '';

  await acquireAdvisorBookLock(660_000, 'clients-manager.spec beforeAll');
  try {
    await withAdvisorPage(browser, testInfo, async (page) => {
      const crm = new ClientsPage(page);
      await crm.gotoList();
      await crm.openAddClientForm();
      await expect(crm.clientModal).toBeVisible();
      await crm.fillClientForm({
        name: clientName,
        email: `e2e-mgr-${Date.now()}@example.com`,
        phone: '9123 0001',
        riskProfile: 'Conservative',
        annualIncome: '45000',
        notes: 'E2E manager-matrix fixture — safe to soft-delete.',
        // Seeds the 'Initial client onboarding' bank row the read-only
        // assertions need ("Client since" defaults to today).
        totalBankBalance: '4500',
      });
      await crm.submitClientForm();
      await expect(
        page.getByTestId('toast-success').filter({ hasText: 'Client added' }).first(),
      ).toBeVisible({ timeout: 20_000 });
      // Round-trip through the list proves the row landed and captures its id.
      clientId = await crm.openClientByName(clientName);
    });
  } finally {
    releaseAdvisorBookLock();
  }
});

test.afterAll(async ({ browser }, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 720_000);
  await acquireAdvisorBookLock(660_000, 'clients-manager.spec afterAll');
  try {
    await withAdvisorPage(browser, testInfo, async (page) => {
      const crm = new ClientsPage(page);
      if (!clientId) {
        // beforeAll died before capturing the id — fall back to a name search.
        await crm.gotoList();
        await crm.search(clientName);
        try {
          await crm.visibleRows().first().waitFor({ state: 'visible', timeout: 10_000 });
        } catch {
          return; // nothing was created — zero residue
        }
        clientId = await crm.idFromRow(crm.visibleRows().first());
      }
      await page.goto(`/clients/${clientId}`);
      const overview = page.getByTestId('clients-detail-overview');
      const notFound = page.getByTestId('clients-detail-not-found');
      await overview.or(notFound).first().waitFor({ state: 'visible', timeout: 30_000 });
      if (await notFound.count()) return; // already soft-deleted
      // Children first (the seeded bank row), then the client — zero residue.
      await crm.deleteAllChildRows('bank');
      await crm.deleteClientFromDetail();
    });
  } catch (error) {
    console.error(
      `[clients-manager] CLEANUP FAILED — possible residue client "${clientName}" ` +
        `(id: ${clientId || 'unknown'}) on the LIVE shared DB. Soft-delete it via the UI as the e2e advisor.`,
      error,
    );
    throw error;
  } finally {
    releaseAdvisorBookLock();
  }
});

// ── Shared read-all / write-none matrix ──────────────────────────────────────

/**
 * The full matrix for one read-everything role: the /clients list surfaces the
 * advisor-owned fixture (view_all_clients), its detail renders read-only
 * (ReadOnlyHint, header Edit/Delete absent), and every tab exposes the data
 * with ZERO mutation affordances — the UI offers no path to a mutation, which
 * is the in-browser negative for the write-none half (RLS backstops it
 * server-side).
 */
async function assertReadAllWriteNone(page: Page): Promise<void> {
  const crm = new ClientsPage(page);

  await test.step('/clients list shows the advisor-owned client (view_all_clients)', async () => {
    await crm.gotoList();
    const openedId = await crm.openClientByName(clientName);
    expect(openedId, 'the searched row must be the advisor-created fixture').toBe(clientId);
    await expect(page.getByTestId('clients-detail')).toContainText(clientName);
  });

  await test.step('detail header: ReadOnlyHint visible, Edit/Delete not rendered', async () => {
    // The hint renders twice (hero + sticky mobile bar); one visible per viewport.
    await expect(
      page.locator('[data-testid="clients-detail-readonly-hint"]:visible'),
    ).toHaveCount(1);
    // ^= also covers the `-mobile` action-bar variants.
    await expect(page.locator('[data-testid^="clients-detail-edit-btn"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-detail-delete-btn"]')).toHaveCount(0);
  });

  await test.step('Overview: foreign financials readable (read-all intact)', async () => {
    const overview = page.getByTestId('clients-detail-overview');
    await expect(crm.overviewTotalBalance).toHaveText(SEED_BALANCE_DISPLAY);
    await expect(overview).toContainText(SEED_INCOME_DISPLAY);
    await expect(overview).toContainText('Conservative');
  });

  await test.step('Policies tab: read-only empty state, no Add affordance', async () => {
    await crm.switchTab('policies');
    const empty = page.getByTestId('clients-policies-empty');
    await expect(empty).toBeVisible({ timeout: 30_000 });
    // The read-only branch's copy — proves the tab rendered in readOnly mode.
    await expect(empty).toContainText('This client has no recorded policies.');
    await expect(page.getByTestId('clients-policies-add-btn')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-policy-edit-btn-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-policy-delete-btn-"]')).toHaveCount(0);
  });

  await test.step('Interactions tab: read-only empty state, no Add affordance', async () => {
    await crm.switchTab('interactions');
    const empty = page.getByTestId('clients-interactions-empty');
    await expect(empty).toBeVisible({ timeout: 30_000 });
    await expect(empty).toContainText(
      'No meetings, calls or reviews have been logged for this client.',
    );
    await expect(page.getByTestId('clients-interactions-add-btn')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-interaction-edit-btn-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-interaction-delete-btn-"]')).toHaveCount(0);
  });

  await test.step('Bank tab: seeded row readable, zero row/Add affordances (NEGATIVE)', async () => {
    await crm.switchTab('bank');
    // A POPULATED list is the strong negative: the data is fully readable…
    await expect(crm.childRows('bank')).toHaveCount(1, { timeout: 30_000 });
    const seedRow = crm.childRows('bank').first();
    await expect(seedRow).toContainText('Initial client onboarding');
    await expect(seedRow).toContainText(SEED_BALANCE_DISPLAY);
    await expect(crm.bankCurrentTotal).toContainText(SEED_BALANCE_DISPLAY);
    // …but no mutation control exists anywhere on it — a direct UI mutation
    // attempt is impossible because there is nothing to click.
    await expect(page.getByTestId('clients-bank-add-btn')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-bank-edit-btn-"]')).toHaveCount(0);
    await expect(page.locator('[data-testid^="clients-bank-delete-btn-"]')).toHaveCount(0);
  });
}

// ── Manager ──────────────────────────────────────────────────────────────────

test.describe('clients — manager read-all / write-none', () => {
  test.use({ storageState: authFileFor('manager') });

  test('manager sees the advisor-owned client; detail is fully read-only on every tab @p0 @mobile', async ({
    page,
  }) => {
    // Four tab switches + a list round-trip on a cold dev server need headroom.
    test.slow();
    await assertReadAllWriteNone(page);
  });
});

// ── Super admin ──────────────────────────────────────────────────────────────

test.describe('clients — super_admin read-all / write-none', () => {
  test.use({ storageState: authFileFor('super_admin') });

  test('super_admin sees the advisor-owned client; detail is fully read-only on every tab @p0 @mobile', async ({
    page,
  }) => {
    test.slow();
    await assertReadAllWriteNone(page);
  });
});

// ── Anonymous ────────────────────────────────────────────────────────────────

test.describe('clients — anonymous', () => {
  // Genuinely logged out in EVERY project — overrides the parallel config's
  // super_admin storageState (and is a no-op under the serial config).
  test.use({ storageState: { cookies: [], origins: [] } });

  test('anonymous /clients redirects to /login; the list never renders @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/clients');
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('clients-table')).toHaveCount(0);
  });

  test('anonymous /crm redirects to /login; the dashboard never renders @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/crm');
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('crm-dashboard')).toHaveCount(0);
  });
});
