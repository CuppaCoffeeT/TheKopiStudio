/**
 * Signed-out auth screens @p0 @mobile — /login, /signup, /forgot-password and
 * /reset-password load, cross-link to each other, validate client-side, and
 * pass an axe WCAG 2.0 A/AA scan with zero critical/serious violations.
 *
 * ZERO DB residue by design: no test submits the signup or reset-request form.
 * Submitting either would write to `auth.users` / mail a real address on the
 * live shared project, and neither backend call is ours to assert — Supabase
 * owns them. What IS ours is everything up to the request: the routes exist,
 * the fields validate, the buttons gate, the links go where they claim. The
 * one submit-path assertion is /reset-password with no recovery token, which
 * is a pure client-side branch (no session ⇒ "Link expired").
 *
 * The empty storageState overrides the parallel config's super_admin session
 * so the visitor is genuinely signed out in every project — without it,
 * useLoginRedirect bounces /login and /signup to /dashboard and every
 * assertion here fails on the wrong page.
 *
 * The axe scan MUST wait for the entrance animations to finish. These screens
 * enter on `.motion-rise*`, which animates opacity from 0, and axe-core folds
 * ancestor opacity into its contrast maths — scanning mid-fade reported three
 * phantom colour-contrast failures on the masthead that the settled page does
 * not have. `settleAnimations` awaits the real Animation objects rather than
 * sleeping. (`test.use({ reducedMotion: 'reduce' })` does NOT work here — the
 * emulation never reaches the context under this config; a probe measured
 * `matchMedia('(prefers-reduced-motion: reduce)').matches === false` with both
 * animations still running. Don't swap the wait for it.)
 *
 * That paragraph turned out to describe a SUITE-WIDE bug, not a quirk of these
 * four screens: the same race was latent in five other specs, hidden only by
 * remote-Supabase latency, and it went red the moment CI moved to an ephemeral
 * local database. The settle now lives inside the shared `expectWcag2aaClean`
 * (tests/runners/a11yChecks.ts) so no scan can forget it. Everything above
 * still holds — it is why that runner exists.
 */

import { test, expect } from '@playwright/test';
// Both helpers were local to this file until 2026-08-13, when the ephemeral CI
// database made the same mid-fade race fail across five OTHER specs and the
// four scattered copies were consolidated. The shared expectWcag2aaClean
// settles animations itself, so callers no longer have to remember to — which
// is exactly how the other specs came to be missing it.
import { expectWcag2aaClean } from '../../runners/a11yChecks';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('signed-out auth screens', () => {
  test('/login offers both ways out — reset and create account @p0 @mobile', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-email-input')).toBeVisible();

    await page.getByTestId('login-forgot-link').click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByTestId('forgot-email-input')).toBeVisible();

    await page.getByTestId('forgot-login-link').click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByTestId('login-signup-link').click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByTestId('signup-email-input')).toBeVisible();

    await page.getByTestId('signup-login-link').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('/signup gates submit until the form is complete and consistent @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/signup');
    const submit = page.getByTestId('signup-submit-btn');
    await expect(submit).toBeDisabled();

    await page.getByTestId('signup-name-input').fill('E2E Signup Probe');
    await page.getByTestId('signup-email-input').fill('e2e-signup-probe@example.com');

    // Too short — still gated.
    await page.getByTestId('signup-password-input').fill('short');
    await page.getByTestId('signup-confirm-input').fill('short');
    await expect(page.getByText('Password must be at least 8 characters.')).toBeVisible();
    await expect(submit).toBeDisabled();

    // Long enough but mismatched — still gated.
    await page.getByTestId('signup-password-input').fill('a-long-enough-password');
    await page.getByTestId('signup-confirm-input').fill('a-different-password');
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(submit).toBeDisabled();

    // Consistent — enabled. NOT clicked: that would create a real auth user.
    await page.getByTestId('signup-confirm-input').fill('a-long-enough-password');
    await expect(submit).toBeEnabled();
  });

  test('/reset-password without a recovery token says the link is dead @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/reset-password');
    await expect(page.getByTestId('reset-invalid')).toBeVisible();
    await expect(page.getByTestId('reset-request-again-link')).toBeVisible();

    await page.getByTestId('reset-request-again-link').click();
    await expect(page).toHaveURL(/\/forgot-password$/);
  });

  test('every signed-out screen is axe-clean @p0 @mobile', async ({ page }) => {
    for (const path of ['/login', '/signup', '/forgot-password', '/reset-password']) {
      await page.goto(path);
      // Anchor on each screen's own card so the scan never races the render.
      await expect(
        page.getByTestId(
          {
            '/login': 'login-card',
            '/signup': 'signup-card',
            '/forgot-password': 'forgot-card',
            '/reset-password': 'reset-invalid',
          }[path]!,
        ),
      ).toBeVisible();
      // No explicit settle — expectWcag2aaClean does it for every scan now.
      await expectWcag2aaClean(page);
    }
  });
});
