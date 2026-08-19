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
 *       Serif greeting, the Start-a-Profiler launcher band, and the four queue
 *       figures — the band navigates into the profiler wizard.
 *   (4) ADVISOR, /dashboard Overview: each of the three queue bands settles to
 *       rows OR its empty state (the book stays empty until the CRM import
 *       lands, so BOTH are valid outcomes), and "+ New customer" opens the fork
 *       modal whose empty-profile branch reaches the client form.
 *   (5) ADVISOR: the sidebar rail — the primary navigation since the masthead
 *       and the launcher were retired — leads with Overview + Customers, marks
 *       the current route via aria-current, and navigates. Below lg it stands
 *       down.
 *
 * RETIRED with the 2a redesign (2026-07-25): the /dashboard module-launcher
 * grid (home-module-grid / home-module-tile-*) and its "Search modules..."
 * filter. Those two describes were DELETED, not re-pointed — the rail (5) and
 * the ⌘K palette own module routing now, and no shallow stand-in was written
 * for them. The ⌘K palette itself still has no spec anywhere under tests/.
 *
 * RETIRED with the customer-centred IA (2026-07-28): the /dashboard "Latest
 * additions" feed and its two index KPI cards (home-kpi-row / home-kpi-profiler
 * / home-kpi-clients / home-latest-*). /dashboard is now an ACTION QUEUE, not a
 * record inventory, so (3) and (4) were re-pointed at the queue rather than
 * deleted. The /crm module dashboard in (1) and (2) is untouched — it keeps its
 * own four-figure KPI row, which is why (3) still asserts that /dashboard does
 * not grow one.
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
 * POM), DashboardHomePage + its children (home-daily-quote, home-queue-reviews,
 * home-queue-unfinished, home-queue-quiet, <band>-row-<id>, <band>-empty,
 * home-add-customer-btn), AddCustomerChoiceModal
 * (crm-add-customer-choice-modal, crm-add-customer-choice-empty),
 * ClientFormModal (crm-client-form-modal, crm-client-cancel-btn) and
 * AppSidebar (app-sidebar, app-sidebar-others-toggle, app-sidebar-hide) and
 * AppChromeControls (app-sidebar-show, privacy-toggle-chrome).
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

  test('zero KPIs + "Go to clients" CTA → /clients empty state "Add your first customer" @p0 @mobile', async ({
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

    await test.step('CTA navigates to /clients showing the "Add your first customer" empty state', async () => {
      await page.getByTestId('crm-add-first-client-btn').click();
      await page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
      const table = page.getByTestId('clients-table');
      await table.waitFor({ state: 'visible', timeout: 30_000 });
      // Empty variant (no search term) — emptyText + emptySubtext render once
      // the list query resolves to zero rows.
      await expect(table).toContainText('Add your first customer', { timeout: 30_000 });
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

// ── (3) Advisor: /dashboard Overview dateline + launcher band + queue figures ─

test.describe('advisor /dashboard Overview — dateline + quote of the day', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('SGT dateline greeting; a deterministic daily quote; every retired surface stays retired @p0 @mobile', async ({
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
      // The kicker closes on the queue's headline once it resolves. Both
      // branches are valid on a shared book — an advisor with an empty (or a
      // fully-tended) book legitimately has nobody waiting.
      await expect(hero).toContainText(
        /(\d+ customers? (is|are) waiting on you|nobody is waiting on you)/,
        { timeout: 30_000 },
      );
    });

    await test.step('the quote of the day renders, and is the same on a reload', async () => {
      const quote = page.getByTestId('home-daily-quote');
      await expect(quote).toBeVisible({ timeout: 30_000 });

      // Deterministic per SG calendar date (lib/dailyQuote) — a `Math.random()`
      // pick would reshuffle here and the block would read as noise.
      const first = (await quote.innerText()).trim();
      expect(first.length).toBeGreaterThan(0);
      await page.reload();
      await expect(page.getByTestId('home-daily-quote')).toBeVisible({ timeout: 30_000 });
      expect((await page.getByTestId('home-daily-quote').innerText()).trim()).toBe(first);
    });

    await test.step('every retired Overview surface stays retired', async () => {
      // The 2a module grid and the index KPI cards the customer-centred IA
      // replaced with the queue — plus, since 2026-08-18, the profiler launcher
      // band, the tool-shortcut row and the four queue figures. The Overview is
      // people, not tools, and not a count of the rows printed below it.
      for (const retired of [
        'home-module-grid',
        'home-kpi-row',
        'home-start-profiler-band',
        'home-start-profiler-btn',
        'home-queue-stats',
        'home-tool-shortcuts',
      ] as const) {
        await expect(page.getByTestId(retired)).toHaveCount(0);
      }
    });
  });
});

// ── (4) Advisor: /dashboard Overview action queue ────────────────────────────

test.describe('advisor /dashboard Overview — the action queue', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('each band settles to rows OR its empty state; "+ New customer" forks to the form @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // The three bands are MUTUALLY EXCLUSIVE by construction (deriveAttention
    // assigns one reason per customer), so a customer can appear in at most one.
    // DOM ORDER IS THE PRIORITY ORDER (2026-08-18): the band with a deadline
    // reads first, "gone quiet" last. Asserted below, because reading order is
    // priority whether or not anyone intends it to be.
    const BANDS = ['home-queue-reviews', 'home-queue-unfinished', 'home-queue-quiet'] as const;

    await test.step('every band settles — rows or its empty state, never a stuck skeleton', async () => {
      for (const band of BANDS) {
        const section = page.getByTestId(band);
        await expect(section).toBeVisible({ timeout: 30_000 });

        // Read-only: the book is empty until the CRM import lands, but the
        // clients-advisor journey may hold rows mid-run. BOTH are valid.
        const rows = section.locator(`[data-testid^="${band}-row-"]`);
        const empty = page.getByTestId(`${band}-empty`);
        await expect
          .poll(
            async () => {
              if ((await rows.count()) > 0) return 'rows';
              return (await empty.count()) > 0 ? 'empty' : 'pending';
            },
            { timeout: 30_000, message: `${band} must settle (rows or the empty state)` },
          )
          .not.toBe('pending');

        if ((await rows.count()) > 0) {
          // Each row's name carries the real <Link> into the customer record
          // (keyboard/AT path), plus exactly one trailing action button.
          const first = rows.first();
          await expect(first.getByRole('link')).toBeVisible();
          await expect(first.getByRole('button')).toHaveCount(1);
        }
      }
    });

    await test.step('the bands read most-urgent-first', async () => {
      // Runs AFTER the settle step above, which is what guarantees the three
      // sections are mounted — read straight after `goto` this returned [].
      const order = (
        await page.locator('section[data-testid^="home-queue-"] h2').allInnerTexts()
      ).map((text) => text.trim());
      expect(order).toEqual([
        'Reviews coming up',
        'Unfinished work',
        'No contact in 14 days',
      ]);
    });

    await test.step('the queue rule is stated on the page', async () => {
      await expect(page.getByText(/Queue rule —/)).toBeVisible();
    });

    await test.step('"+ New customer" forks; the empty-profile branch opens the form', async () => {
      const addBtn = page.getByTestId('home-add-customer-btn');
      await addBtn.scrollIntoViewIfNeeded();
      await expect(addBtn).toBeVisible();
      await addBtn.click();

      // Under the customer-centred IA the primary path is "profile them" — the
      // plain form is the SECOND branch, so the fork comes first.
      const fork = page.getByTestId('crm-add-customer-choice-modal');
      await expect(fork).toBeVisible({ timeout: 30_000 });
      await expect(fork).toContainText('Start with the Prospect Profiler');
      await page.getByTestId('crm-add-customer-choice-empty').click();

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

  test('the rail leads with Overview + Customers, marks the route, navigates; below lg it stands down @p0 @mobile', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('home-daily-quote')).toBeVisible({ timeout: 30_000 });

    const rail = page.getByTestId('app-sidebar');

    if (isMobile) {
      // AppSidebar is `hidden lg:flex` — at phone width the rail must not paint
      // over the content column. Navigation there is the ⌘K palette, reached
      // from the mobile bar's search icon (the hotkey was removed 2026-08-05).
      await expect(rail).toBeHidden();

      // ...so the bar MUST be there. /dashboard composes no archetype frame, so
      // it renders the bar itself; when it did not, this page was the one route
      // in the app with zero navigation on a phone.
      const menu = page.getByTestId('app-header-mobile-menu');
      await expect(menu).toBeVisible({ timeout: 30_000 });

      // The menu button is the DISCOVERABLE path — the search icon opens the
      // same modules but reads as "search this page". Walk the whole escape
      // route, not just the button: menu → drawer → another module.
      await menu.click();
      const drawer = page.getByTestId('app-nav-drawer');
      await expect(drawer).toBeVisible({ timeout: 30_000 });

      // The drawer renders AppSidebarNav — the rail's own list — so it uses the
      // comp label "Customers", not the DB module name.
      await drawer.getByRole('link', { name: 'Customers', exact: true }).click();
      await page.waitForURL(/\/clients(\?.*)?$/, { timeout: 30_000 });
      await expect(page.getByTestId('clients-table')).toBeVisible({ timeout: 30_000 });
      // Choosing a destination closes the drawer — it must not sit over the page.
      await expect(drawer).toHaveCount(0);

      // The search icon still opens the palette — the fast path is not removed.
      const search = page.getByTestId('app-header-mobile-search');
      await expect(search).toBeVisible();
      await search.click();
      // The palette lists modules under their DB `name` ("Clients"), not the
      // rail's relabel, and each option's accessible name carries its
      // description too — hence the anchored regex.
      await expect(
        page.getByRole('dialog').getByRole('option', { name: /^Clients\b/ }),
      ).toBeVisible({ timeout: 30_000 });
      return;
    }

    await expect(rail).toBeVisible({ timeout: 30_000 });

    // Items come from useAuth().modules — no role strings
    // (.claude/rules/module-access.md). The customer-centred IA pulls exactly
    // two of them to the front: Overview and Customers.
    const overview = rail.getByRole('link', { name: 'Overview', exact: true });
    const clients = rail.getByRole('link', { name: 'Customers', exact: true });
    await expect(overview).toBeVisible();
    await expect(clients).toBeVisible();

    // The tools sit under a "Tools" heading, LISTED and never collapsed
    // (2026-08-19, superseding the 2026-08-18 shape that hid them inside
    // "Others"). No click should be needed to read what the toolbox holds.
    const nav = rail.getByRole('navigation', { name: 'Primary' });

    // Scope to the nav landmark, NOT the whole rail — the wordmark above it is
    // also a link and would shift every index by one.
    const labels = await nav.getByRole('link').allInnerTexts();
    expect(labels.slice(0, 2)).toEqual(['Overview', 'Customers']);

    // The heading is a real group label, not decoration — an AT user gets the
    // same grouping the eye does.
    const toolsGroup = nav.getByRole('group', { name: 'Tools' });
    await expect(toolsGroup).toBeVisible({ timeout: 30_000 });
    await expect(
      toolsGroup.getByRole('link', { name: 'Tax calculator', exact: true }),
    ).toBeVisible();
    await expect(toolsGroup.getByRole('link', { name: 'Client Report', exact: true })).toBeVisible();
    await expect(
      toolsGroup.getByRole('link', { name: 'Prospect Profiler', exact: true }),
    ).toBeVisible();

    // "Others" survives only as the catch-all for modules no band above claimed,
    // and renders nothing when that set is empty — so its presence depends on
    // what this advisor is granted. When it IS there it must still collapse,
    // and collapsed it must leave no focusable link behind.
    const othersToggle = rail.getByTestId('app-sidebar-others-toggle');
    if ((await othersToggle.count()) > 0) {
      if ((await othersToggle.getAttribute('aria-expanded')) === 'true') {
        await othersToggle.click();
      }
      await expect(othersToggle).toHaveAttribute('aria-expanded', 'false');
      // Collapsing the leftovers must never take a TOOL with it — that is the
      // regression this pins.
      await expect(
        toolsGroup.getByRole('link', { name: 'Tax calculator', exact: true }),
      ).toBeVisible();
    }

    // Account Settings sits last, whatever the group is doing.
    const withGroup = await nav.getByRole('link').allInnerTexts();
    expect(withGroup[withGroup.length - 1]).toBe('Account Settings');

    // The rail hides and comes back, leaving its hamburger behind.
    const eye = page.getByTestId('privacy-toggle-chrome');
    await expect(eye).toBeVisible();

    await rail.getByTestId('app-sidebar-hide').click();
    await expect(rail).toHaveCount(0);
    const show = page.getByTestId('app-sidebar-show');
    await expect(show).toBeVisible({ timeout: 30_000 });

    // THE REGRESSION THIS PINS (2026-08-19): the privacy eye used to live in
    // the rail footer, so collapsing the rail took the eye with it and left a
    // masked page with no way to unmask. Both controls are chrome now, and
    // neither may depend on the other being open.
    await expect(eye).toBeVisible();
    await expect(eye).toHaveAttribute('aria-pressed', /true|false/);

    await show.click();
    await expect(page.getByTestId('app-sidebar')).toBeVisible({ timeout: 30_000 });
    await expect(eye).toBeVisible();

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
