/**
 * CRM dashboard seatbelt @p0 @mobile — three read-mostly surfaces:
 *
 *   (1) ADVISOR, empty book: pre-sweep any 'E2E-' residue clients out of the
 *       advisor's book via the UI (soft-delete children → client — leftovers
 *       from a crashed clients-advisor journey), then /crm shows all four KPI
 *       tiles at ZERO plus the empty-book "Go to clients" CTA, which navigates
 *       to /clients rendering the empty-state "Add your first client".
 *   (2) MANAGER: /crm renders (manager RLS scope = ALL books, incl. real
 *       production data — strictly read-only) — the four KPI tiles settle to
 *       finite numbers and neither the loading skeleton nor the error state
 *       remains.
 *   (3) ADVISOR, /dashboard home: the module grid lists the CRM Dashboard
 *       (/crm) and Clients (/clients) tiles; the /crm tile navigates.
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })` — the
 * parallel config's setup project (tests/auth.setup.ts) mints tests/.auth/
 * <role>.json once per run (mirrors profiler load-a11y.spec.ts).
 *
 * Data safety (LIVE shared DB): this spec CREATES ZERO rows. Its only writes
 * are UI soft-deletes of 'E2E-'-prefixed residue inside the e2e ADVISOR's own
 * RLS-scoped book (rows only an earlier failed e2e run could have left), each
 * guarded by an explicit E2E-marker check before deletion. sky/Keane data is
 * untouchable by design (advisor RLS) and never matched. Manager/home tests
 * are navigation + assertion only.
 *
 * Serialisation: the empty-book test reads the WHOLE advisor book (zero-KPI
 * assertions), so it holds the same cross-worker advisor-book mkdir lock as
 * tests/workflows/crm/clients-advisor.spec.ts (identical tmpdir path —
 * 'crm-e2e-advisor-book.lock' — so the two files mutually exclude across the
 * chromium-desktop and mobile-safari projects; pattern from profiler
 * account-settings.spec.ts).
 *
 * Selectors: real data-testids from src/features/crm/pages/CrmDashboardPage
 * (crm-dashboard, crm-kpi-*, crm-add-first-client-btn, crm-quick-link-clients,
 * crm-dashboard-loading), ClientsListPage (clients-table via the ClientsPage
 * POM) and src/features/crm/pages/DashboardHomePage.tsx (home-module-grid + home-module-tile-<path> —
 * ADDED with this spec).
 *
 * Run: npx playwright test tests/workflows/crm/dashboard.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { test, expect, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { ClientsPage } from '../../pom/ClientsPage';

// ── Cross-worker advisor-book lock (same path as clients-advisor.spec.ts) ────

/**
 * Mutex for the e2e advisor's CRM book. The zero-KPI assertions read the whole
 * RLS-scoped book, so this test must not interleave with the clients-advisor
 * journey (which creates clients mid-run) or with this file's own instance on
 * the peer Playwright project. The lock PATH is byte-identical to the one in
 * clients-advisor.spec.ts — mkdir is atomic per host, exactly the scope of one
 * suite invocation's workers.
 */
const ADVISOR_BOOK_LOCK = join(tmpdir(), 'crm-e2e-advisor-book.lock');

function bookLockIsStale(): boolean {
  try {
    const pid = Number(readFileSync(join(ADVISOR_BOOK_LOCK, 'pid'), 'utf8'));
    process.kill(pid, 0); // throws if the holder process is gone
    return false;
  } catch {
    // No live holder — but a JUST-created lock may not have written its pid
    // yet. Only treat it as stale once it has had ample time to do so.
    try {
      return Date.now() - statSync(ADVISOR_BOOK_LOCK).mtimeMs > 10_000;
    } catch {
      return false; // lock dir vanished — the next mkdir attempt resolves it
    }
  }
}

async function acquireBookLock(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      mkdirSync(ADVISOR_BOOK_LOCK); // atomic — exactly one worker wins
      writeFileSync(join(ADVISOR_BOOK_LOCK, 'pid'), String(process.pid));
      return;
    } catch {
      if (bookLockIsStale()) {
        rmSync(ADVISOR_BOOK_LOCK, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error(
          `[dashboard.spec] timed out waiting for the advisor-book lock (${ADVISOR_BOOK_LOCK}) — ` +
            'is another worker/invocation stuck mid-journey?',
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

function releaseBookLock(): void {
  rmSync(ADVISOR_BOOK_LOCK, { recursive: true, force: true });
}

// ── KPI tile helpers (mirrors clients-advisor.spec.ts) ───────────────────────

const KPI_TILES = [
  'crm-kpi-total-clients',
  'crm-kpi-active-policies',
  'crm-kpi-annual-premium',
  'crm-kpi-upcoming-follow-ups',
] as const;

/**
 * Numeric value of one KPI tile. The label/subtitle carry no digits, so the
 * first number-ish token IS the value. NumberTicker quirks handled: the tile
 * must be scrolled into view to start ticking, and a value of 0 never writes
 * text at all — an empty ticker reads as 0.
 */
async function kpiValue(page: Page, testId: string): Promise<number> {
  const tile = page.getByTestId(testId);
  await tile.scrollIntoViewIfNeeded();
  const text = await tile.innerText();
  const match = text.match(/[\d,]+(?:\.\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : 0;
}

/** Tile value once the count-up animation has settled (two stable samples). */
async function settledKpiValue(page: Page, testId: string): Promise<number> {
  await expect(page.getByTestId(testId)).toBeVisible({ timeout: 30_000 });
  let prev = await kpiValue(page, testId);
  await expect
    .poll(
      async () => {
        const next = await kpiValue(page, testId);
        const settled = next === prev;
        prev = next;
        return settled;
      },
      { timeout: 20_000, intervals: [500, 500, 500, 1_000] },
    )
    .toBe(true);
  return prev;
}

/** Open /crm and wait for the dashboard shell (KPI grid renders post-stats). */
async function gotoCrmDashboard(page: Page): Promise<void> {
  await page.goto('/crm');
  await page.getByTestId('crm-dashboard').waitFor({ state: 'visible', timeout: 30_000 });
}

// ── Advisor residue sweep ────────────────────────────────────────────────────

/** Every entity any CRM spec creates carries this marker (cleanup contract). */
const E2E_PREFIX = 'E2E-';

/**
 * Server-side search for residue and wait for the filter to round-trip:
 * settled = matching rows render OR the list shows the no-results state for
 * the exact term (counting before that would read the unfiltered list).
 */
async function searchResidueSettled(crm: ClientsPage, page: Page): Promise<number> {
  await crm.search(E2E_PREFIX);
  await expect
    .poll(
      async () => {
        if ((await crm.visibleRows().count()) > 0) return 'rows';
        const tableText = await page.getByTestId('clients-table').innerText();
        return tableText.includes(`No matches for "${E2E_PREFIX}"`) ? 'clean' : 'pending';
      },
      { timeout: 30_000, message: 'E2E- residue search must settle (rows or no-results)' },
    )
    .not.toBe('pending');
  return crm.visibleRows().count();
}

/**
 * Soft-delete every leftover 'E2E-' client (children first, then the client)
 * through the UI — residue can only come from an earlier crashed CRM journey
 * in THIS advisor's own book (RLS). Refuses (throws) on any matched row that
 * does not visibly carry the e2e marker, rather than touching unknown data.
 */
async function sweepAdvisorResidue(crm: ClientsPage, page: Page): Promise<number> {
  let removed = 0;
  await crm.gotoList();
  while ((await searchResidueSettled(crm, page)) > 0) {
    const row = crm.visibleRows().first();
    const rowText = await row.innerText();
    if (!/e2e-/i.test(rowText)) {
      throw new Error(
        `[dashboard.spec] residue search matched a row WITHOUT a visible e2e marker — refusing to delete: ${JSON.stringify(rowText)}`,
      );
    }
    const id = await crm.idFromRow(row);
    await row.click();
    await page.waitForURL(`**/clients/${id}`, { timeout: 30_000 });
    await crm.waitForDetail();
    for (const kind of ['policies', 'interactions', 'bank'] as const) {
      await crm.deleteAllChildRows(kind);
    }
    await crm.deleteClientFromDetail(); // lands back on /clients
    removed += 1;
    console.warn(
      `[dashboard.spec] swept residue client ${id} from the e2e advisor's book ` +
        '(leftover from an earlier failed CRM run).',
    );
  }
  return removed;
}

// ── (1) Advisor: empty book → zero KPIs + Go-to-clients CTA ─────────────────

test.describe('advisor /crm dashboard — empty book', () => {
  test.use({ storageState: authFileFor('advisor') });

  // Hold the advisor-book lock for the whole describe: the zero-KPI reads must
  // not interleave with the clients-advisor journey (or this file's peer-
  // project instance) writing into the same book.
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // The peer project may hold the lock for a full journey (≤300s) — widen
    // this hook's budget well beyond the per-test timeout.
    testInfo.setTimeout(testInfo.timeout + 700_000);
    await acquireBookLock(660_000);
  });
  test.afterAll(() => {
    releaseBookLock();
  });

  test('zero KPIs + "Go to clients" CTA → /clients empty state "Add your first client" @p0 @mobile', async ({
    page,
  }) => {
    // Residue sweep is unbounded UI work (normally a no-op) — give it headroom.
    test.setTimeout(240_000);

    await test.step("sweep 'E2E-' residue out of the advisor's book (UI soft-delete)", async () => {
      await sweepAdvisorResidue(new ClientsPage(page), page);
    });

    await test.step('/crm: all four KPI tiles read 0', async () => {
      await gotoCrmDashboard(page);
      for (const testId of KPI_TILES) {
        // Poll to the exact value — refetch + NumberTicker race-proof; a zero
        // ticker never writes text, so an empty tile correctly reads as 0.
        await expect
          .poll(() => kpiValue(page, testId), { timeout: 30_000, message: `KPI tile "${testId}"` })
          .toBe(0);
      }
    });

    await test.step('empty book swaps the quick-link card for the "Go to clients" CTA', async () => {
      const cta = page.getByTestId('crm-add-first-client-btn');
      await expect(cta).toBeVisible({ timeout: 30_000 });
      await expect(cta).toContainText('Go to clients');
      // The populated-book quick-link card must NOT render alongside the CTA.
      await expect(page.getByTestId('crm-quick-link-clients')).toHaveCount(0);
    });

    await test.step('CTA navigates to /clients showing the "Add your first client" empty state', async () => {
      await page.getByTestId('crm-add-first-client-btn').click();
      await page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
      const table = page.getByTestId('clients-table');
      await table.waitFor({ state: 'visible', timeout: 30_000 });
      // Empty variant (no search term) — emptyText + emptySubtext render once
      // the list query resolves to zero rows.
      await expect(table).toContainText('Add your first client', { timeout: 30_000 });
      await expect(table).toContainText('Your book is empty');
    });
  });
});

// ── (2) Manager: /crm renders across ALL books (read-only) ──────────────────

test.describe('manager /crm dashboard — scope: all books', () => {
  test.use({ storageState: authFileFor('manager') });

  test('all four KPI tiles settle to finite numbers without error @p0 @mobile', async ({
    page,
  }) => {
    await gotoCrmDashboard(page);

    // Tiles only render once useDashboardStats resolved (the loading skeleton
    // and the error state replace the grid entirely) — so visibility of all
    // four tiles already proves an error-free stats load.
    for (const testId of KPI_TILES) {
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 30_000 });
    }
    await expect(page.getByTestId('crm-dashboard-loading')).toHaveCount(0);

    // Manager scope spans every book (live production data included) — assert
    // only that each tile carries a settled, finite, non-negative number; no
    // value assumptions about a shared live dataset.
    for (const testId of KPI_TILES) {
      const value = await settledKpiValue(page, testId);
      expect(Number.isFinite(value), `KPI tile "${testId}" must render a number`).toBe(true);
      expect(value, `KPI tile "${testId}" must be non-negative`).toBeGreaterThanOrEqual(0);
    }

    // The stats branch rendered to completion: exactly one of the two footer
    // cards (empty-book CTA / clients quick-link) follows the KPI grid.
    await expect(
      page
        .locator(
          '[data-testid="crm-quick-link-clients"], [data-testid="crm-add-first-client-btn"]',
        )
        .first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});

// ── (3) Advisor: /dashboard home module grid lists the CRM tiles ─────────────

test.describe('advisor /dashboard home — module grid', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('/crm and /clients module tiles render; the /crm tile navigates @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('home-module-grid')).toBeVisible({ timeout: 30_000 });

    // Module access is role-driven (AuthContext.modules) — the advisor's grant
    // set must include both CRM routes.
    await expect(page.getByTestId('home-module-tile-crm')).toBeVisible();
    await expect(page.getByTestId('home-module-tile-clients')).toBeVisible();

    // The tile is a real navigation into the module (read-only — no KPI value
    // assertions here; the advisor-book lock is not held).
    await page.getByTestId('home-module-tile-crm').click();
    await page.waitForURL('**/crm', { timeout: 30_000 });
    await page.getByTestId('crm-dashboard').waitFor({ state: 'visible', timeout: 30_000 });
  });
});

// ── (4) Advisor: /dashboard home KPI row + client-progress widget ────────────

test.describe('advisor /dashboard home — KPI row + client progress', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('KPI row renders all four labels; client-progress shows rows or the empty state @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('home-module-grid')).toBeVisible({ timeout: 30_000 });

    await test.step('KPI row (advisor holds /crm) renders the four KpiTile labels', async () => {
      const kpiRow = page.getByTestId('home-kpi-row');
      // Row only mounts once useDashboardStats resolves (skeleton replaces it).
      await expect(kpiRow).toBeVisible({ timeout: 30_000 });
      for (const label of [
        'Total clients',
        'Active policies',
        'Annual premium',
        'Upcoming follow-ups',
      ]) {
        await expect(kpiRow).toContainText(label);
      }
    });

    await test.step('client-progress widget settles to rows OR the empty state', async () => {
      const widget = page.getByTestId('home-client-progress');
      await widget.scrollIntoViewIfNeeded();
      await expect(widget).toBeVisible({ timeout: 30_000 });

      // Read-only: no book lock held, so the advisor's book may be empty OR
      // hold rows left mid-run by the clients-advisor journey — both are valid.
      const rows = widget.locator('[data-testid^="home-client-progress-row-"]');
      const empty = page.getByTestId('home-client-progress-empty');
      await expect
        .poll(
          async () => {
            if ((await rows.count()) > 0) return 'rows';
            return (await empty.count()) > 0 ? 'empty' : 'pending';
          },
          { timeout: 30_000, message: 'client-progress widget must settle (rows or empty state)' },
        )
        .not.toBe('pending');

      if ((await rows.count()) === 0) {
        await expect(empty).toContainText('No clients yet');
        const cta = empty.getByRole('button', { name: 'Go to clients' });
        await expect(cta).toBeVisible();
        await cta.click();
        await page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
        await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 30_000 });
      }
    });
  });
});

// ── (5) Advisor: /dashboard home module search filter ────────────────────────

test.describe('advisor /dashboard home — module search', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('non-matching query shows the no-results state; clearing restores the grid @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    const grid = page.getByTestId('home-module-grid');
    await expect(grid).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('home-module-tile-crm')).toBeVisible();

    const searchInput = page.getByPlaceholder('Search modules...');
    const noMatchQuery = 'zzz-no-module-matches-this';

    await test.step('non-matching query filters every tile out → NoResultsState', async () => {
      await searchInput.fill(noMatchQuery);
      await expect(grid).toContainText(`No matches for "${noMatchQuery}"`, { timeout: 30_000 });
      await expect(page.getByTestId('home-module-tile-crm')).toHaveCount(0);
    });

    await test.step('clearing the query restores the module grid', async () => {
      await searchInput.fill('');
      await expect(page.getByTestId('home-module-tile-crm')).toBeVisible({ timeout: 30_000 });
      await expect(page.getByTestId('home-module-tile-clients')).toBeVisible();
      await expect(grid).not.toContainText(`No matches for "${noMatchQuery}"`);
    });
  });
});
