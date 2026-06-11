/**
 * Manager results visibility @p0 @mobile — /profiler-results as the MANAGER
 * role (skytwech+e2e-manager, storageState tests/.auth/manager.json minted by
 * tests/auth.setup.ts under playwright.parallel.config.ts).
 *
 * Legacy `public.results` RLS: managers READ all rows — including the 8
 * pre-cutover legacy rows (golden-mastered in
 * src/features/profiler/lib/__fixtures__/legacy-results.ts, byte-identical to
 * the live DB) — but can only MUTATE their own. The detail page therefore
 * shows foreign (Keane-owned 'Bee zhen') and NULL-owner ('James', anonymous
 * save) rows as read-only: lock hint visible, Edit notes / Delete absent.
 *
 * STRICTLY READ-ONLY: this spec performs ZERO mutations on the shared live DB
 * (navigation, search and row-open only), so there is nothing to clean up and
 * the protected legacy rows are never touched.
 *
 * Selectors are real data-testids from ResultsListPage / ResultDetailPage /
 * ResultDetailActions / StoredResultReport. No new testids were required.
 *
 * Run: npx playwright test tests/workflows/profiler/results-manager.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { LEGACY_RESULTS } from '../../../src/features/profiler/lib/__fixtures__/legacy-results';

type LegacyRow = (typeof LEGACY_RESULTS)[number];

function legacyRowByProspect(prospect: string): LegacyRow {
  const row = LEGACY_RESULTS.find((r) => r.prospect_name === prospect);
  if (!row) {
    throw new Error(`[results-manager.spec] no legacy fixture row with prospect_name=${JSON.stringify(prospect)}`);
  }
  return row;
}

/** NULL-owner legacy row — saved anonymously, shows the "unclaimed" badge. */
const JAMES = legacyRowByProspect('James');
/** Keane-owned legacy row — foreign to the manager account. */
const BEE_ZHEN = legacyRowByProspect('Bee zhen');

// Manager session everywhere — overrides the parallel config's project-level
// super_admin storageState (per-spec test.use wins).
test.use({ storageState: authFileFor('manager') });

/**
 * The list row for one result. Desktop DataRow (`results-row-<id>`) and mobile
 * card (`results-mobile-card-<id>`) are BOTH in the DOM (CSS-responsive
 * split), so the :visible filter resolves to exactly the one for the current
 * viewport/project.
 */
function visibleResultRow(page: Page, id: string): Locator {
  return page.locator(
    `[data-testid="results-row-${id}"]:visible, [data-testid="results-mobile-card-${id}"]:visible`,
  );
}

async function gotoResults(page: Page): Promise<void> {
  await page.goto('/profiler-results');
  // Generous ceiling: full SPA remount → auth + modules hydration first.
  await expect(page.getByTestId('results-table')).toBeVisible({ timeout: 30_000 });
}

/** Type into the server-side search (350ms debounce → ilike round-trip). */
async function searchResults(page: Page, term: string): Promise<void> {
  await page.getByTestId('results-search').fill(term);
}

/**
 * Search for a legacy row, open its detail, and assert the read-only contract:
 * report renders, lock hint visible, Edit notes / Delete absent, exports kept.
 *
 * `settledWhenGoneId` is a row that does NOT match the search term — waiting
 * for it to unmount proves the server-side filter round-tripped before we
 * click (clicking mid-refilter can race the row detaching).
 */
async function openLegacyDetailReadOnly(
  page: Page,
  row: LegacyRow,
  settledWhenGoneId: string,
): Promise<void> {
  await searchResults(page, row.prospect_name);
  await expect(page.locator(`[data-testid="results-row-${settledWhenGoneId}"]`)).toHaveCount(0, {
    timeout: 20_000,
  });

  const listRow = visibleResultRow(page, row.id);
  await expect(listRow).toBeVisible({ timeout: 20_000 });
  await listRow.click();
  await page.waitForURL(`**/profiler-results/${row.id}`);

  // Full stored report renders for the manager (read access intact).
  await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });

  // Read-only hint renders in BOTH the desktop hero actions and the mobile
  // action bar (2 nodes in DOM); exactly one is visible per viewport.
  await expect(page.locator('[data-testid="result-detail-readonly-hint"]:visible')).toHaveCount(1);

  // Edit notes / Delete are not rendered AT ALL on foreign/NULL-owner rows —
  // the ^= prefix also covers the `-mobile` action-bar variants.
  await expect(page.locator('[data-testid^="result-detail-edit-notes-btn"]')).toHaveCount(0);
  await expect(page.locator('[data-testid^="result-detail-delete-btn"]')).toHaveCount(0);

  // Read-only still allows exports — CSV + PDF stay available (one visible).
  await expect(page.locator('[data-testid^="result-detail-csv-btn"]:visible')).toHaveCount(1);
  await expect(page.locator('[data-testid^="result-detail-pdf-btn"]:visible')).toHaveCount(1);
}

test('manager sees the legacy rows: total ≥ 8 and "Bee zhen" search returns the Keane row @p0 @mobile', async ({
  page,
}) => {
  await gotoResults(page);

  // Desktop rows are attached on every viewport (hidden md:block on mobile),
  // so their count is the page-1 row count regardless of project.
  const allRows = page.locator('[data-testid^="results-row-"]');
  await expect(allRows.first()).toBeAttached({ timeout: 30_000 });
  expect(await allRows.count(), 'manager page 1 must include at least the 8 legacy rows').toBeGreaterThanOrEqual(
    LEGACY_RESULTS.length,
  );

  // Server-side search surfaces the Keane-owned legacy row.
  await searchResults(page, 'Bee zhen');
  // Filter round-tripped once a non-matching legacy row unmounts.
  await expect(page.locator(`[data-testid="results-row-${JAMES.id}"]`)).toHaveCount(0, { timeout: 20_000 });

  const beeZhenRow = visibleResultRow(page, BEE_ZHEN.id);
  await expect(beeZhenRow).toBeVisible({ timeout: 20_000 });
  await expect(beeZhenRow).toContainText('Bee zhen');
  await expect(beeZhenRow).toContainText('Keane');
  // Owned row → no "unclaimed" badge.
  await expect(beeZhenRow).not.toContainText('unclaimed');
});

test('NULL-owner legacy row (James) opens read-only for the manager — no edit/delete @p0 @mobile', async ({
  page,
}) => {
  await gotoResults(page);

  // The anonymous legacy save carries the "unclaimed" badge in the list.
  await searchResults(page, JAMES.prospect_name);
  const jamesRow = visibleResultRow(page, JAMES.id);
  await expect(jamesRow).toBeVisible({ timeout: 20_000 });
  await expect(jamesRow).toContainText('unclaimed');

  await openLegacyDetailReadOnly(page, JAMES, BEE_ZHEN.id);
});

test('Keane-owned legacy row (Bee zhen) is read-only for the manager — not their own @p0 @mobile', async ({
  page,
}) => {
  await gotoResults(page);
  await openLegacyDetailReadOnly(page, BEE_ZHEN, JAMES.id);
});
