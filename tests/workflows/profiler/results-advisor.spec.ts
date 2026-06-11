/**
 * Advisor results journey @p0 — REAL save into `public.results`, then the full
 * own-row lifecycle on /profiler-results.
 *
 * Runs as the e2e ADVISOR via the saved storageState (tests/.auth/advisor.json,
 * written by tests/auth.setup.ts under playwright.parallel.config.ts).
 *
 * Flow: wizard run with a per-run unique prospect ('E2E-Adv-' + project/retry/
 * timestamp so parallel projects + retries never collide) → authed auto-save
 * succeeds (success toast + "✓ Saved" status) → /profiler-results → search
 * finds exactly the new row → detail report renders from the STORED row with
 * the same DISC points the wizard showed → edit notes, save, persisted across
 * reload → NEGATIVE: searching 'Bee zhen' (a legacy manager-visible prospect)
 * yields zero rows under the advisor's RLS → DELETE via the detail page's
 * DestructiveConfirmDialog (this IS the cleanup) → list no longer shows it.
 *
 * Data safety: the only row written is the advisor-owned row this spec creates
 * (unique name), deleted through the UI at the end. An afterEach safety net
 * (tests/runners/resultsCleanup.ts) re-deletes by exact prospect_name under
 * the advisor's OWN session, so a mid-flow failure still leaves zero residue —
 * RLS makes it impossible to touch the 8 legacy rows or other accounts' rows.
 *
 * Viewport-agnostic (desktop table rows vs mobile cards, hero actions vs the
 * sticky mobile action bar) — runs under chromium-desktop AND mobile-safari.
 *
 * All selectors are real data-testids read from:
 *   src/features/profiler/pages/{ResultsListPage,ResultDetailPage}.tsx
 *   src/features/profiler/components/detail/{ResultDetailActions,ResultNotesModal,StoredResultReport}.tsx
 *   src/features/profiler/components/wizard/result/* (via the shared WizardPage POM)
 *   src/components/primitives/detail/DestructiveConfirmDialog.tsx (testId support
 *   added with this spec: result-detail-delete-dialog{,-confirm-btn,-cancel-btn})
 */

import { test, expect, type Locator, type Page } from '@playwright/test';
import { WizardPage, type DiscLetter } from '../../pom/WizardPage';
import { authFileFor } from '../../fixtures/roleAuth';
import { deleteOwnResultsByProspect } from '../../runners/resultsCleanup';

test.use({ storageState: authFileFor('advisor') });

const DISC_LETTERS: readonly DiscLetter[] = ['D', 'I', 'S', 'C'];

/** Legacy prospect visible to managers (one of the 8 protected legacy rows). */
const FOREIGN_PROSPECT_SEARCH = 'Bee zhen';

const INTAKE_BASE = {
  advisor: 'E2E Advisor',
  age: '31-35',
  meeting: '2',
  occupation: 'Engineer',
} as const;

/**
 * Set by the test, read by the afterEach safety net. Within-file serial
 * (fullyParallel: false) — never shared across workers.
 */
let prospectName = '';

/**
 * The list mounts BOTH the desktop table and the mobile card list (hidden via
 * CSS at the other breakpoint), so match whichever rendering is visible.
 */
function visibleResultRows(page: Page): Locator {
  return page.locator(
    '[data-testid^="results-row-"]:visible, [data-testid^="results-mobile-card-"]:visible',
  );
}

/**
 * Detail actions render twice (DetailPageFrame hero + sticky mobile bar) with
 * `-mobile`-suffixed testids — target the visible one for this viewport.
 */
function visibleDetailButton(page: Page, base: string): Locator {
  return page.locator(`[data-testid="${base}"]:visible, [data-testid="${base}-mobile"]:visible`);
}

function successToast(page: Page, text: string): Locator {
  return page.getByTestId('toast-success').filter({ hasText: text }).first();
}

/**
 * Drive the list's server-side search and wait until the debounced (350ms)
 * term lands in the URL (`?search=`) — polling row counts before that point
 * would race the debounce and read the UNFILTERED list.
 */
async function searchResults(page: Page, term: string): Promise<void> {
  await page.getByTestId('results-search').fill(term);
  await page.waitForURL((url) => url.searchParams.get('search') === term);
}

test.afterEach(async ({ request }) => {
  if (!prospectName) return;
  // Safety net only — the happy path already deleted the row through the UI,
  // so this matches 0 rows. Scoped to the EXACT per-run name + advisor RLS.
  const removed = await deleteOwnResultsByProspect(request, 'advisor', prospectName);
  if (removed > 0) {
    console.warn(
      `[results-advisor] afterEach removed ${removed} residue row(s) for "${prospectName}" — ` +
        'the spec failed before its UI delete step.',
    );
  }
});

test('advisor wizard save → results list → stored report → notes persist → RLS-scoped search → delete @p0 @mobile', async ({
  page,
}, testInfo) => {
  // Full journey (wizard + 4 list/detail round-trips) on a cold dev server.
  test.slow();

  // Per-run unique, retry-safe, parallel-project-safe — and free of every
  // character `sanitizeSearchTerm` strips (no spaces/underscores/wildcards),
  // so the list search can match it verbatim.
  prospectName = `E2E-Adv-${testInfo.project.name}-r${testInfo.retry}-${Date.now()}`;
  const noteText = `E2E notes for ${prospectName} — persisted across reload`;

  const wizard = new WizardPage(page);
  const wizardScores: Partial<Record<DiscLetter, number>> = {};
  let resultId = '';

  await test.step('run the wizard as the advisor — real save, success toast', async () => {
    await wizard.goto();
    await wizard.fillIntake({ ...INTAKE_BASE, prospect: prospectName });
    await wizard.start();
    await wizard.answerAllQuestions(0);
    await wizard.tickObservations();
    await wizard.advanceThroughObservations();
    await wizard.generate();

    // Authed auto-save hits the live table: toast + "✓ Saved" status line.
    await expect(successToast(page, 'Profile saved to your results')).toBeVisible({
      timeout: 15_000,
    });
    await expect(wizard.saveStatus).toContainText('Saved to your results', { timeout: 15_000 });

    // Capture the generated DISC points to compare against the STORED report.
    for (const letter of DISC_LETTERS) {
      wizardScores[letter] = await wizard.scorePoints(letter);
    }
  });

  await test.step('results list: search finds exactly the saved row', async () => {
    await page.goto('/profiler-results');
    await searchResults(page, prospectName);

    // Server-side search + RLS — poll across the debounced refetch.
    await expect.poll(() => visibleResultRows(page).count(), { timeout: 30_000 }).toBe(1);
    const row = visibleResultRows(page).first();
    await expect(row).toContainText(prospectName);

    const rowTestId = await row.getAttribute('data-testid');
    resultId = rowTestId?.replace(/^results-(?:row|mobile-card)-/, '') ?? '';
    expect(resultId).not.toBe('');
  });

  await test.step('detail report renders from the stored row with the saved scores', async () => {
    await visibleResultRows(page).first().click();
    await page.waitForURL(`**/profiler-results/${resultId}`);

    await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
    await expect(wizard.hero).toBeVisible();
    await expect(wizard.scoreCard).toBeVisible();
    await expect(wizard.playbook).toBeVisible();

    // StoredResultReport reuses the wizard's ScoreCard testids — the stored
    // row must replay the exact points the wizard showed before saving.
    for (const letter of DISC_LETTERS) {
      expect(await wizard.scorePoints(letter)).toBe(wizardScores[letter]);
    }
  });

  await test.step('edit notes → save → persisted after reload', async () => {
    await visibleDetailButton(page, 'result-detail-edit-notes-btn').click();
    await expect(page.getByTestId('result-detail-notes-modal')).toBeVisible();
    await page.getByTestId('result-detail-notes-textarea').fill(noteText);
    await page.getByTestId('result-detail-notes-save-btn').click();

    await expect(successToast(page, 'Notes saved')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('result-detail-notes-modal')).toBeHidden({ timeout: 10_000 });

    // Full reload — the notes must come back from the database, not the cache.
    await page.reload();
    await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('result-notes-card')).toContainText(noteText);
  });

  await test.step(`NEGATIVE: "${FOREIGN_PROSPECT_SEARCH}" (legacy manager-visible row) yields no rows for the advisor`, async () => {
    await page.goto('/profiler-results');
    await searchResults(page, FOREIGN_PROSPECT_SEARCH);

    await expect.poll(() => visibleResultRows(page).count(), { timeout: 30_000 }).toBe(0);
    // The list lands in its no-results state, not an error/empty state.
    await expect(page.getByTestId('results-table')).toContainText(
      `No matches for "${FOREIGN_PROSPECT_SEARCH}"`,
    );
  });

  await test.step('delete via DestructiveConfirmDialog — row gone from the list (cleanup)', async () => {
    await page.goto(`/profiler-results/${resultId}`);
    await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });

    await visibleDetailButton(page, 'result-detail-delete-btn').click();
    await expect(page.getByTestId('result-detail-delete-dialog')).toBeVisible();
    await page.getByTestId('result-detail-delete-dialog-confirm-btn').click();

    await expect(successToast(page, 'Result deleted')).toBeVisible({ timeout: 15_000 });
    // Successful delete navigates back to the list.
    await page.waitForURL(/\/profiler-results(\?.*)?$/);

    await searchResults(page, prospectName);
    await expect.poll(() => visibleResultRows(page).count(), { timeout: 30_000 }).toBe(0);
    await expect(page.getByTestId('results-table')).toContainText(
      `No matches for "${prospectName}"`,
    );
  });
});
