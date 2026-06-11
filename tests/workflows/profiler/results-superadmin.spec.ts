/**
 * Super-admin results visibility (UNTIL-CUTOVER) @p0 @mobile —
 * /profiler-results as the SUPER_ADMIN e2e account (skytwech+e2e-superadmin,
 * storageState tests/.auth/super_admin.json minted by tests/auth.setup.ts).
 *
 * Per the PRD role matrix the super_admin test account keeps
 * `profiles.role='advisor'` until cutover, and the legacy `public.results`
 * RLS scopes ADVISORS to their OWN rows only. So unlike the manager
 * (results-manager.spec.ts), this account must NOT see the 8 legacy rows —
 * searching for the Keane-owned legacy prospect 'Bee zhen' yields nothing,
 * and deep-linking its detail resolves not-found. This spec DOCUMENTS that
 * until-cutover behaviour; when cutover flips the role, these assertions are
 * the canary that visibility changed.
 *
 * STRICTLY READ-ONLY: zero mutations on the shared live DB — navigation and
 * search only. Nothing to clean up; legacy rows untouched.
 *
 * Selectors are real data-testids from ResultsListPage / ResultDetailPage
 * (the lone copy assertion targets the list's no-results message, allowed by
 * the house rules when asserting copy). No new testids were required.
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

test('super_admin (profiles.role=advisor until cutover) sees only own rows — "Bee zhen" search yields nothing @p0 @mobile', async ({
  page,
}) => {
  await gotoResults(page);

  // Server-side search (350ms debounce → ilike round-trip).
  await page.getByTestId('results-search').fill('Bee zhen');

  // The no-results copy is the deterministic signal that the searched query
  // round-tripped AND matched zero RLS-visible rows.
  await expect(page.getByText('No matches for "Bee zhen"')).toBeVisible({ timeout: 20_000 });

  // The Keane-owned legacy row never renders — neither desktop row nor mobile card.
  await expect(page.locator(`[data-testid="results-row-${BEE_ZHEN.id}"]`)).toHaveCount(0);
  await expect(page.locator(`[data-testid="results-mobile-card-${BEE_ZHEN.id}"]`)).toHaveCount(0);
});

test('deep-link to the Keane-owned legacy row resolves not-found under RLS @p0 @mobile', async ({
  page,
}) => {
  await page.goto(`/profiler-results/${BEE_ZHEN.id}`);

  // getResultById → maybeSingle() resolves null for RLS-invisible rows → the
  // detail page renders its not-found card, never the stored report.
  await expect(page.getByTestId('result-detail-not-found')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('result-detail-report')).toHaveCount(0);
  await expect(page.getByTestId('result-detail-back-link')).toBeVisible();
});
