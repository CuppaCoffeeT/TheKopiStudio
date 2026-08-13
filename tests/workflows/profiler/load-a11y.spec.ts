/**
 * Load + axe a11y seatbelt @p0 @mobile — every page surface loads (key testid
 * visible, real data rendered — never a skeleton) and then passes an axe-core
 * WCAG 2.0 A/AA scan with ZERO critical/serious violations (moderate/minor are
 * reported by axe but don't gate; `includedImpacts` filters the assertion).
 *
 * Surfaces × roles:
 *   (a) anonymous  /profiler                 — wizard intake screen
 *   (b) anonymous  /profiler                 — RESULT screen (full wizard drive;
 *       the anonymous auto-save POST to **\/rest\/v1\/results* is intercepted
 *       and fulfilled with a synthetic 201 → live `results` is never touched)
 *   (c) manager    /profiler-results         — results list (legacy rows render)
 *   (d) manager    /profiler-results/:id     — legacy "Bee zhen" detail. That row
 *       belongs to a LEGACY user, so the manager view is READ-ONLY (no notes /
 *       delete affordances — asserted). Strictly no mutations.
 *   (e) advisor    /account-settings         — Profile tab (default tab)
 *   (f) manager    /manage-accounts          — users list
 *
 * ZERO DB residue: every test is read-only; the only write the app would make
 * (the wizard's anonymous save) is route-intercepted. Nothing to clean up.
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })` — the
 * parallel config's setup project (tests/auth.setup.ts) mints tests/.auth/
 * <role>.json once per run. Run via playwright.parallel.config.ts.
 */

import { test, expect, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { WizardPage } from '../../pom/WizardPage';
import { expectWcag2aaClean } from '../../runners/a11yChecks';

// expectWcag2aaClean lived here in full until 2026-08-13; it is now shared with
// crm/load-a11y and reports/access-a11y, and settles page animations before
// scanning (see the runner for why).

/** Legacy seed row "Bee zhen" — read-only reference data, NEVER mutated. */
const BEE_ZHEN_RESULT_ID = '883d2eca-e09a-4dc8-957c-b1a84bf15e5d';

/** Intake for the result-screen drive (payload is intercepted, not asserted). */
const A11Y_INTAKE = {
  advisor: 'E2E A11y Advisor',
  prospect: 'E2E A11y Prospect',
  age: '31-35',
  meeting: '2',
  // 'Engineer' hits the legacy occNudge bucket → the occupation chip renders,
  // so the scan covers the fullest result-report DOM.
  occupation: 'Engineer',
} as const;

// ── (a)+(b) Anonymous public wizard ──────────────────────────────────────────

test.describe('anonymous /profiler', () => {
  // Genuinely anonymous in every project — overrides the parallel config's
  // super_admin storageState (no-op under the serial config).
  test.use({ storageState: { cookies: [], origins: [] } });

  test('intake screen loads + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    const wizard = new WizardPage(page);
    await wizard.goto(); // waits for wizard-intake-screen
    await expect(page.getByTestId('wizard-intake-screen')).toBeVisible();
    await expect(page.getByTestId('wizard-start-btn')).toBeVisible();
    await expectWcag2aaClean(page);
  });

  test('result screen loads + axe wcag2aa clean (save intercepted) @p0 @mobile', async ({
    page,
  }) => {
    // Full wizard journey on a cold dev server (webkit especially) needs headroom.
    test.slow();

    // Intercept the anonymous auto-save BEFORE the flow starts — the live
    // `results` table is never written (fire-and-forget 201, empty body).
    await page.route('**/rest/v1/results*', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 201, body: '' });
    });

    const wizard = new WizardPage(page);
    await wizard.goto();
    await wizard.fillIntake(A11Y_INTAKE);
    await wizard.start();
    await wizard.answerAllQuestions(0);
    await wizard.tickObservations();
    await wizard.advanceThroughObservations();
    await wizard.generate(); // waits for wizard-result-report

    await expect(wizard.resultReport).toBeVisible();
    await expect(wizard.hero).toBeVisible();
    await expect(wizard.scoreCard).toBeVisible();
    await expect(wizard.playbook).toBeVisible();
    // The post-save login CTA is part of the anonymous result surface — let it
    // settle so the scan covers the final DOM.
    await expect(wizard.loginCta).toBeVisible();
    await expectWcag2aaClean(page);
  });
});

// ── (c)+(d) Manager results surfaces ─────────────────────────────────────────

test.describe('manager results surfaces', () => {
  test.use({ storageState: authFileFor('manager') });

  test('/profiler-results list loads + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    await page.goto('/profiler-results');
    await expect(page.getByTestId('results-table')).toBeVisible({ timeout: 30_000 });
    // Don't scan the loading skeleton — wait for real rows (desktop) or cards
    // (mobile). Manager RLS sees every row incl. legacy, so data is guaranteed.
    await expect(
      page
        .locator('[data-testid^="results-row-"]:visible, [data-testid^="results-mobile-card-"]:visible')
        .first(),
    ).toBeVisible({ timeout: 30_000 });
    await expectWcag2aaClean(page);
  });

  test('legacy result detail (Bee zhen) loads read-only + axe wcag2aa clean @p0 @mobile', async ({
    page,
  }) => {
    await page.goto(`/profiler-results/${BEE_ZHEN_RESULT_ID}`);
    await expect(page.getByTestId('profiler-result-detail')).toBeVisible({ timeout: 30_000 });
    // Loaded = the stored report body rendered (not the loading skeleton).
    await expect(page.getByTestId('result-detail-report')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('profiler-result-detail')).toContainText('Bee zhen');

    // Foreign-owned legacy row → READ-ONLY for the manager: no notes/delete
    // affordances may render (desktop or mobile action bar). Guards this spec's
    // no-mutation contract on a shared-with-production row.
    for (const testId of [
      'result-detail-edit-notes-btn',
      'result-detail-edit-notes-btn-mobile',
      'result-detail-delete-btn',
      'result-detail-delete-btn-mobile',
    ]) {
      await expect(page.getByTestId(testId)).toHaveCount(0);
    }

    await expectWcag2aaClean(page);
  });
});

// ── (e) Advisor account settings ─────────────────────────────────────────────

test.describe('advisor /account-settings', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('Profile tab loads + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    await page.goto('/account-settings');
    await expect(page.getByTestId('account-settings-page')).toBeVisible({ timeout: 30_000 });
    // Profile is the default tab; its container only renders once the profile
    // query resolved (the loading skeleton carries a different testid).
    await expect(page.getByTestId('account-profile-tab')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('account-profile-name-input')).toBeVisible();
    await expect(page.getByTestId('account-signout-btn')).toBeVisible();
    await expectWcag2aaClean(page);
  });
});

// ── (f) Manager manage accounts ──────────────────────────────────────────────

test.describe('manager /manage-accounts', () => {
  test.use({ storageState: authFileFor('manager') });

  test('users list loads + axe wcag2aa clean @p0 @mobile', async ({ page }) => {
    await page.goto('/manage-accounts');
    await expect(page.getByTestId('manage-accounts-table')).toBeVisible({ timeout: 30_000 });
    // Real user rows (desktop) or cards (mobile) — the live user pool always
    // has rows (the e2e accounts themselves), so this never scans a skeleton.
    await expect(
      page
        .locator(
          '[data-testid^="manage-accounts-row-"]:visible, [data-testid^="manage-accounts-card-"]:visible',
        )
        .first(),
    ).toBeVisible({ timeout: 30_000 });
    await expectWcag2aaClean(page);
  });
});
