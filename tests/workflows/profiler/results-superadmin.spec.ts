/**
 * Super-admin results visibility @p0 @mobile — /profiler-results as the
 * SUPER_ADMIN e2e account (skytwech+e2e-superadmin, storageState
 * tests/.auth/super_admin.json minted by tests/auth.setup.ts).
 *
 * POST-CUTOVER (2026-10-26, migration 20261026154319_retire_legacy_profiles):
 * `results` SELECT is Pattern D — owner OR `has_capability('view_all_results')`,
 * which manager and super_admin both hold. Until then this spec asserted the
 * opposite: super_admin read through the legacy `get_my_role()` →
 * `profiles.role='advisor'` and could NOT see the 8 legacy rows. It was written
 * as the canary for exactly this flip.
 *
 * So the super_admin now finds the Keane-owned legacy prospect 'Bee zhen' —
 * and, like the manager (results-manager.spec.ts), opens it READ-ONLY: writes
 * stay owner-only, so Edit notes / Delete never render on a row it does not own.
 *
 * STRICTLY READ-ONLY: zero mutations on the shared live DB — navigation, search
 * and row-open only. Nothing to clean up; legacy rows untouched.
 *
 * Selectors are real data-testids from ResultsListPage / ResultDetailPage /
 * ResultDetailActions. No new testids were required.
 *
 * Run: npx playwright test tests/workflows/profiler/results-superadmin.spec.ts \
 *        --config=playwright.parallel.config.ts
 */

import { test, expect, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { LEGACY_RESULTS } from '../../../src/features/profiler/lib/__fixtures__/legacy-results';

const BEE_ZHEN = LEGACY_RESULTS.find((r) => r.prospect_name === 'Bee zhen');
if (!BEE_ZHEN) {
  throw new Error('[results-superadmin.spec] legacy fixture row "Bee zhen" missing');
}

// Super-admin session — matches the parallel config's project default, pinned
// explicitly here so the spec stays correct if the project default changes.
test.use({ storageState: authFileFor('super_admin') });

async function gotoResults(page: Page): Promise<void> {
  await page.goto('/profiler-results');
  // Generous ceiling: full SPA remount → auth + modules hydration first.
  await expect(page.getByTestId('results-table')).toBeVisible({ timeout: 30_000 });
}

test('super_admin (view_all_results) finds the Keane-owned legacy row — "Bee zhen" search returns it @p0 @mobile', async ({
  page,
}) => {
  await gotoResults(page);

  // Server-side search (350ms debounce → ilike round-trip).
  await page.getByTestId('results-search').fill('Bee zhen');

  // Desktop row and mobile card are both in the DOM; :visible picks this viewport's.
  const row = page.locator(
    `[data-testid="results-row-${BEE_ZHEN.id}"]:visible, [data-testid="results-mobile-card-${BEE_ZHEN.id}"]:visible`,
  );
  await expect(row).toBeVisible({ timeout: 20_000 });
  await expect(row).toContainText('Bee zhen');
  await expect(row).toContainText('Keane');
});

test('deep-link to the Keane-owned legacy row opens read-only for the super_admin @p0 @mobile', async ({
  page,
}) => {
  await page.goto(`/profiler-results/${BEE_ZHEN.id}`);

  // Read access: the stored report renders, never the not-found card.
  await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('result-detail-not-found')).toHaveCount(0);

  // Writes stay owner-only — lock hint shown, Edit notes / Delete never rendered
  // (^= also covers the `-mobile` action-bar variants).
  await expect(page.locator('[data-testid="result-detail-readonly-hint"]:visible')).toHaveCount(1);
  await expect(page.locator('[data-testid^="result-detail-edit-notes-btn"]')).toHaveCount(0);
  await expect(page.locator('[data-testid^="result-detail-delete-btn"]')).toHaveCount(0);
});
