/**
 * Account Settings @p0 — advisor self-service profile + security.
 *
 * Runs as the e2e ADVISOR via the saved storageState (tests/.auth/advisor.json,
 * written by tests/auth.setup.ts under playwright.parallel.config.ts).
 *
 * Flow: /account-settings → Profile tab identity facts (email + role badge) →
 * rename → save → success toast → reload → persisted → restore baseline →
 * phone set/save → cleared/save (cleanup) → Security tab mismatch validation
 * (client-only, asserted to NEVER reach the auth endpoint). A separate
 * anonymous test asserts the /login redirect.
 *
 * Data safety: the ONLY row touched is the e2e advisor's own public.users row
 * (name/phone), and every test restores the live baseline (name 'e2e-advisor',
 * phone NULL — verified against the DB on 2026-06-11). An afterEach residue
 * guard re-asserts the baseline even when an assertion fails mid-flow, so the
 * shared LIVE table never keeps a renamed row. Email/password are NEVER
 * actually changed.
 *
 * All selectors are real data-testids read from:
 *   src/features/account-settings/pages/AccountSettingsPage.tsx
 *   src/features/account-settings/components/{ProfileTab,SecurityPasswordForm}.tsx
 *   src/components/primitives/detail/TabNav.tsx (testId support added with
 *   this spec: account-settings-tab-{profile,security})
 */

import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { test, expect, type Page } from '@playwright/test';
import { authFileFor } from '../../fixtures/roleAuth';
import { testUsers } from '../../fixtures/testUsers';

const ADVISOR_EMAIL = testUsers.advisor.email;

/**
 * Cross-worker mutex for the advisor's public.users row. The parallel config
 * runs this file CONCURRENTLY under chromium-desktop AND mobile-safari, and
 * both mutate the SAME live row — one project's save/restore clobbers the
 * other's in-flight edit (confirmed: 3 flaky at workers=10, 11/11 first-try
 * green at workers=1; see tests/lessons.md 2026-06-02 shared-fixture entry).
 * `mkdirSync` is atomic on a single host, which is exactly the scope of one
 * suite invocation's workers.
 */
const ADVISOR_ROW_LOCK = join(tmpdir(), 'profiler-e2e-advisor-row.lock');

function advisorRowLockIsStale(): boolean {
  try {
    const pid = Number(readFileSync(join(ADVISOR_ROW_LOCK, 'pid'), 'utf8'));
    process.kill(pid, 0); // throws if the holder process is gone
    return false;
  } catch {
    // No live holder — but a JUST-created lock may not have written its pid
    // yet. Only treat it as stale once it has had ample time to do so.
    try {
      return Date.now() - statSync(ADVISOR_ROW_LOCK).mtimeMs > 10_000;
    } catch {
      return false; // lock dir vanished — the next mkdir attempt resolves it
    }
  }
}

async function acquireAdvisorRowLock(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      mkdirSync(ADVISOR_ROW_LOCK); // atomic — exactly one worker wins
      writeFileSync(join(ADVISOR_ROW_LOCK, 'pid'), String(process.pid));
      return;
    } catch {
      if (advisorRowLockIsStale()) {
        rmSync(ADVISOR_ROW_LOCK, { recursive: true, force: true });
        continue;
      }
      if (Date.now() > deadline) {
        throw new Error(
          `[account-settings.spec] timed out waiting for the advisor-row lock (${ADVISOR_ROW_LOCK}) — ` +
            'is another worker/invocation stuck mid-describe?',
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

function releaseAdvisorRowLock(): void {
  rmSync(ADVISOR_ROW_LOCK, { recursive: true, force: true });
}

/** Live baseline of the e2e advisor's public.users row — restored on cleanup. */
const BASELINE_NAME = 'e2e-advisor';
const BASELINE_PHONE = ''; // DB NULL renders as an empty input; '' saves back as NULL.

const RENAMED = 'E2E Advisor Renamed';
const TEST_PHONE = '+65 8000 0001';

/**
 * Open /account-settings on the (default) Profile tab and wait until the form
 * is HYDRATED: the name/phone inputs are filled by a useEffect after the
 * profile query lands — editing before that would be clobbered by the effect.
 * The name input is never legitimately empty (required field, non-empty in DB),
 * so non-empty ⇒ hydrated.
 */
async function openProfileTab(page: Page): Promise<void> {
  await page.goto('/account-settings');
  await page.getByTestId('account-profile-tab').waitFor({ state: 'visible', timeout: 30_000 });
  await expect(page.getByTestId('account-profile-name-input')).not.toHaveValue('', {
    timeout: 15_000,
  });
  // Observed flake: a TRAILING profile/auth query can settle after the first
  // hydration, re-run the effect, and clobber an in-flight edit (the form
  // snaps back to baseline and Save flips disabled under the click). Let the
  // network go quiet before any test touches the form.
  await page.waitForLoadState('networkidle');
}

/**
 * Click "Save changes" and wait for the full success cycle: toast → post-save
 * refetch re-syncs the inputs (form goes non-dirty, button disables) → toast
 * auto-dismisses (so a later save's toast lookup can't hit a strict-mode
 * duplicate — sonner stacks identical toasts).
 */
async function saveProfile(page: Page): Promise<void> {
  const saveBtn = page.getByTestId('account-profile-save-btn');
  // Enabled ⇒ the form is still dirty with OUR edit (a hydration clobber
  // disables it) — fail here with a clear message instead of a toast timeout.
  await expect(saveBtn).toBeEnabled();
  await saveBtn.click();
  // The toast only fires AFTER invalidate + refreshAuth complete — give the
  // full chain headroom under parallel-suite load.
  await expect(
    page.getByTestId('toast-success').filter({ hasText: 'Profile updated' }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(saveBtn).toBeDisabled({ timeout: 15_000 });
  // Park the cursor away from the toast stack before waiting for auto-dismiss.
  // Playwright leaves the virtual mouse wherever it last clicked, the Toaster
  // renders bottom-right (App.tsx / Toaster.tsx), and sonner PAUSES a toast's
  // 4s dismiss timer for as long as it is hovered — so a Save button that sits
  // under the toast stack holds the toast open forever and this count-0 wait
  // can never resolve. Failed on CI at 14×"resolved to 1 element" over the full
  // 10s, identically against production (main, run 31679318758) and against the
  // ephemeral local DB, which is what rules out a data cause.
  await page.mouse.move(0, 0);
  await expect(page.getByTestId('toast-success')).toHaveCount(0, { timeout: 10_000 });
}

test.describe('account settings — advisor', () => {
  test.use({ storageState: authFileFor('advisor') });

  // Serialise the WHOLE describe across projects/workers — every test here
  // (incl. the afterEach residue guard) reads or writes the one advisor row.
  // eslint-disable-next-line no-empty-pattern -- Playwright requires the fixture slot to access testInfo
  test.beforeAll(async ({}, testInfo) => {
    // The peer project may hold the lock for its full describe (~60-90s on a
    // loaded machine) — widen this hook's budget beyond the per-test timeout.
    testInfo.setTimeout(testInfo.timeout + 240_000);
    await acquireAdvisorRowLock(220_000);
  });
  test.afterAll(() => {
    releaseAdvisorRowLock();
  });

  // Residue guard: both profile tests restore the baseline in-flow, but a
  // mid-test assertion failure would otherwise strand a renamed row on the
  // LIVE shared users table (other specs assert the baseline identity).
  // No-op (one read-only navigation) when the test already cleaned up.
  test.afterEach(async ({ page }) => {
    await openProfileTab(page);
    const nameInput = page.getByTestId('account-profile-name-input');
    const phoneInput = page.getByTestId('account-profile-phone-input');
    const residue =
      (await nameInput.inputValue()) !== BASELINE_NAME ||
      (await phoneInput.inputValue()) !== BASELINE_PHONE;
    if (residue) {
      await nameInput.fill(BASELINE_NAME);
      await phoneInput.fill(BASELINE_PHONE);
      await saveProfile(page);
    }
  });

  test('profile shows identity facts; rename persists across reload, then restored @p0', async ({
    page,
  }) => {
    await openProfileTab(page);
    const nameInput = page.getByTestId('account-profile-name-input');

    await test.step('identity facts: email + role badge', async () => {
      await expect(page.getByTestId('account-profile-email')).toHaveText(ADVISOR_EMAIL);
      await expect(page.getByTestId('account-profile-role-badge')).toContainText('Advisor');
    });

    await test.step('rename → save → success toast', async () => {
      await nameInput.fill(RENAMED);
      await saveProfile(page);
    });

    await test.step('reload → rename persisted', async () => {
      await page.reload();
      await page.getByTestId('account-profile-tab').waitFor({ state: 'visible', timeout: 30_000 });
      await expect(nameInput).toHaveValue(RENAMED, { timeout: 15_000 });
      // Same trailing-query settle as openProfileTab before the restore edit.
      await page.waitForLoadState('networkidle');
    });

    await test.step('restore baseline name (cleanup)', async () => {
      await nameInput.fill(BASELINE_NAME);
      await saveProfile(page);
      await expect(nameInput).toHaveValue(BASELINE_NAME);
    });
  });

  test('phone saves and clears back to empty @p0', async ({ page }) => {
    await openProfileTab(page);
    const phoneInput = page.getByTestId('account-profile-phone-input');

    await test.step('set phone → save → success toast', async () => {
      await phoneInput.fill(TEST_PHONE);
      await saveProfile(page);
      await expect(phoneInput).toHaveValue(TEST_PHONE);
    });

    await test.step('clear phone → save (cleanup)', async () => {
      await phoneInput.fill(BASELINE_PHONE);
      await saveProfile(page);
      await expect(phoneInput).toHaveValue(BASELINE_PHONE);
    });
  });

  test('security tab: mismatched passwords fail client-side, auth endpoint never hit @p0', async ({
    page,
  }) => {
    // Spy BEFORE any interaction: supabase.auth.updateUser PUTs **/auth/v1/user.
    // The app never calls supabase.auth.getUser() (grep-verified), so ZERO
    // requests of ANY method must reach this endpoint during the whole test.
    const authUserHits: string[] = [];
    await page.route('**/auth/v1/user**', async (route) => {
      authUserHits.push(`${route.request().method()} ${route.request().url()}`);
      await route.continue();
    });

    await openProfileTab(page);

    await test.step('switch to the Security tab', async () => {
      await page.getByTestId('account-settings-tab-security').click();
      await page.getByTestId('account-security-tab').waitFor({ state: 'visible', timeout: 15_000 });
      await expect(page.getByTestId('account-security-password-form')).toBeVisible();
    });

    await test.step('mismatched confirm → inline error + submit disabled', async () => {
      await page.getByTestId('account-security-password-input').fill('E2e-mismatch-Aa1');
      await page.getByTestId('account-security-password-confirm-input').fill('E2e-mismatch-Bb2');
      // Copy assertion (allowed): the client validation message itself.
      await expect(page.getByText('Passwords do not match.', { exact: true })).toBeVisible();
      await expect(page.getByTestId('account-security-password-btn')).toBeDisabled();
    });

    await test.step('no request ever reached the auth user endpoint', async () => {
      expect(authUserHits).toEqual([]);
    });
  });
});

test.describe('account settings — anonymous', () => {
  // Genuinely logged out in EVERY project — overrides the parallel config's
  // super_admin storageState (and is a no-op under the serial config).
  test.use({ storageState: { cookies: [], origins: [] } });

  test('anonymous visitor is redirected to /login @p0', async ({ page }) => {
    await page.goto('/account-settings');
    await page.waitForURL('**/login', { timeout: 30_000 });
    await expect(page.getByTestId('login-email-input')).toBeVisible({ timeout: 15_000 });
  });
});
