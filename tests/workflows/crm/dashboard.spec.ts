/**
 * CRM dashboard seatbelt @p0 @mobile — the /crm module dashboard plus the Kopi
 * 2a /dashboard "Overview" that replaced the module launcher:
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
 *   (3) ADVISOR, /dashboard Overview: the true-SGT dateline over the Instrument
 *       Serif greeting, and the TWO index KPI cards ("Prospect Profiler" and
 *       "Clients · CRM") — the clients card navigates into /clients.
 *   (4) ADVISOR, /dashboard Overview: "Latest additions" settles to feed rows
 *       OR its empty state (the book stays empty until the CRM import lands, so
 *       BOTH are valid outcomes), and "+ New client" opens the client form.
 *   (5) ADVISOR: the sidebar rail — the primary navigation since the masthead
 *       and the launcher were retired — marks the current route via
 *       aria-current and navigates into a module. Below lg it stands down.
 *
 * RETIRED with the 2a redesign (2026-07-25): the /dashboard module-launcher
 * grid (home-module-grid / home-module-tile-*) and its "Search modules..."
 * filter. Those two describes were DELETED, not re-pointed — the rail (5) and
 * the ⌘K palette own module routing now, and no shallow stand-in was written
 * for them. The ⌘K palette itself still has no spec anywhere under tests/.
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })` — the
 * parallel config's setup project (tests/auth.setup.ts) mints tests/.auth/
 * <role>.json once per run (mirrors profiler load-a11y.spec.ts).
 *
 * Data safety (LIVE shared DB): this spec CREATES ZERO rows. Its only writes
 * are UI soft-deletes of 'E2E-'-prefixed residue inside the e2e ADVISOR's own
 * RLS-scoped book (rows only an earlier failed e2e run could have left), each
 * guarded by an explicit E2E-marker check before deletion. sky/Keane data is
 * untouchable by design (advisor RLS) and never matched. The manager and
 * Overview tests are navigation + assertion only — (4) opens the client form
 * and cancels out of it without ever submitting.
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
 * POM), DashboardHomePage + its children (home-kpi-row, home-kpi-profiler,
 * home-kpi-clients, home-latest-additions, home-latest-row-<id>,
 * home-latest-empty, home-add-client-btn), ClientFormModal
 * (crm-client-form-modal, crm-client-cancel-btn) and AppSidebar (app-sidebar).
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

// ── (3) Advisor: /dashboard Overview dateline + the two index KPI cards ──────

test.describe('advisor /dashboard Overview — dateline + KPI row', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('SGT dateline greeting; the two index KPI cards render and navigate @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    await test.step('dateline kicker carries the true-SGT date under the serif greeting', async () => {
      // The greeting is the page's only h1 (GreetingHeader).
      const greeting = page.getByRole('heading', {
        level: 1,
        name: /^Good (morning|afternoon|evening), /,
      });
      await expect(greeting).toBeVisible({ timeout: 30_000 });

      // The date must be SGT, not the runner's locale/zone. Assert the weekday
      // and the day/month/year as separate parts so the assertion survives ICU
      // pattern differences between Node, Chromium and WebKit.
      const parts = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Singapore',
      }).formatToParts(new Date());
      const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? '';

      const hero = greeting.locator('..'); // GreetingHeader root: kicker + h1
      await expect(hero).toContainText(part('weekday'));
      await expect(hero).toContainText(`${part('day')} ${part('month')} ${part('year')}`);
      // The kicker closes on one live stat once useDashboardStats resolves.
      await expect(hero).toContainText(/\d+ follow-ups? upcoming/, { timeout: 30_000 });
    });

    await test.step('exactly TWO index KPI cards, with the shipped labels', async () => {
      const kpiRow = page.getByTestId('home-kpi-row');
      await expect(kpiRow).toBeVisible({ timeout: 30_000 });

      // One card per RECORD module the advisor holds (/profiler-results,
      // /clients). Each mounts a skeleton first, so poll for the settled pair.
      const profiler = page.getByTestId('home-kpi-profiler');
      const clients = page.getByTestId('home-kpi-clients');
      await expect(profiler).toBeVisible({ timeout: 30_000 });
      await expect(clients).toBeVisible({ timeout: 30_000 });
      await expect(profiler).toContainText('Prospect Profiler');
      await expect(clients).toContainText('Clients · CRM');
      // The four-figure KPI row belongs to /crm — this page must not grow one.
      await expect(kpiRow.locator('[data-testid^="home-kpi-"]')).toHaveCount(2);

      // The launcher grid the 2a redesign deleted must not come back.
      await expect(page.getByTestId('home-module-grid')).toHaveCount(0);
    });

    await test.step('the clients card is the real navigation into /clients', async () => {
      await page.getByTestId('home-kpi-clients').click();
      await page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
      await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 30_000 });
    });
  });
});

// ── (4) Advisor: /dashboard Overview "Latest additions" feed ─────────────────

test.describe('advisor /dashboard Overview — Latest additions', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('feed settles to rows OR the empty state; "+ New client" opens the form @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    const feed = page.getByTestId('home-latest-additions');
    await expect(page.getByRole('heading', { name: 'Latest additions' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(feed).toBeVisible();

    await test.step('the feed settles — rows or the empty state, never a stuck skeleton', async () => {
      // Read-only: the book is empty until the CRM import lands, but the
      // clients-advisor journey may hold rows mid-run. BOTH must pass, and
      // neither may be asserted as a populated table.
      const rows = feed.locator('[data-testid^="home-latest-row-"]');
      const empty = page.getByTestId('home-latest-empty');
      await expect
        .poll(
          async () => {
            if ((await rows.count()) > 0) return 'rows';
            return (await empty.count()) > 0 ? 'empty' : 'pending';
          },
          { timeout: 30_000, message: 'Latest additions must settle (rows or the empty state)' },
        )
        .not.toBe('pending');

      if ((await rows.count()) === 0) {
        await expect(empty).toContainText('Your book is empty.');
        // The single quiet action the 2a empty state is allowed to offer.
        await expect(empty.getByRole('button', { name: 'Go to clients' })).toBeVisible();
      } else {
        // Each row's name cell carries the real <Link> (keyboard/AT path).
        await expect(rows.first().getByRole('link')).toBeVisible();
      }
    });

    await test.step('"+ New client" opens the client form; cancelling writes nothing', async () => {
      const addBtn = page.getByTestId('home-add-client-btn');
      await addBtn.scrollIntoViewIfNeeded();
      await expect(addBtn).toBeVisible();
      await addBtn.click();

      const modal = page.getByTestId('crm-client-form-modal');
      await expect(modal).toBeVisible({ timeout: 30_000 });
      await expect(modal).toContainText('Add client');

      // This spec creates ZERO rows — never submit.
      await page.getByTestId('crm-client-cancel-btn').click();
      await expect(modal).toHaveCount(0);
    });
  });
});

// ── (5) Advisor: the sidebar rail is the primary navigation ──────────────────

test.describe('advisor shell — sidebar rail navigation', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('the rail marks the current route and navigates; below lg it stands down @p0 @mobile', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('home-kpi-row')).toBeVisible({ timeout: 30_000 });

    const rail = page.getByTestId('app-sidebar');

    if (isMobile) {
      // AppSidebar is `hidden lg:flex` — at phone width the rail must not paint
      // over the content column. Navigation there is the ⌘K palette, reached
      // from the frames' mobile bar.
      await expect(rail).toBeHidden();
      return;
    }

    await expect(rail).toBeVisible({ timeout: 30_000 });

    // Items come from useAuth().modules, plus the explicit Overview entry —
    // no role strings (.claude/rules/module-access.md).
    const overview = rail.getByRole('link', { name: 'Overview', exact: true });
    const clients = rail.getByRole('link', { name: 'Clients', exact: true });
    await expect(overview).toBeVisible();
    await expect(clients).toBeVisible();

    // NavLink stamps aria-current="page" on the matched item ONLY — that is the
    // active marker the 2px brown left border renders from.
    await expect(overview).toHaveAttribute('aria-current', 'page');
    await expect(clients).not.toHaveAttribute('aria-current', 'page');

    await clients.click();
    await page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
    await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 30_000 });

    // The marker tracks the route, and Overview's `end` keeps it exact-match.
    await expect(clients).toHaveAttribute('aria-current', 'page');
    await expect(overview).not.toHaveAttribute('aria-current', 'page');
  });
});
