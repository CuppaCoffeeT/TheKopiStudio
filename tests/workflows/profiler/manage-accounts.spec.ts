/**
 * Manage Accounts module @p0 — module gating, list rendering, and the
 * role-sync ROUND-TRIP on the e2e-advisor account.
 *
 *  (1) advisor  — /manage-accounts has no module grant for advisors →
 *      ProtectedRoute bounces to /dashboard (URL asserted).
 *  (2) manager  — the users list renders; searching 'e2e' surfaces all three
 *      e2e accounts; the caller's own row carries the "This is you" chip with
 *      its controls disabled; the Pending tab renders and its pill count
 *      matches the rendered pending rows (READ-ONLY — nobody is (un)approved).
 *  (3) manager  — role round-trip on the e2e-advisor user ONLY: row SelectMenu
 *      advisor→manager (success toast + select label updates), then BACK
 *      manager→advisor. Restoration is guaranteed by an afterAll that calls
 *      the role-sync edge function directly with the manager's access token
 *      from tests/.auth/manager.json — it runs even when an assertion fails
 *      mid-flight, so the shared account never leaks a 'manager' role.
 *
 * SHARED-DB SAFETY (live DB, shared with production):
 *  - NEVER touches sky/Keane accounts or the 8 legacy results rows — the only
 *    mutated row is skytwech+e2e-advisor@gmail.com's public.users.role, and it
 *    is restored to 'advisor' on every exit path.
 *  - The round-trip runs on ONE Playwright project only (chromium-desktop);
 *    the e2e-advisor row is shared, so a concurrent mobile-safari instance
 *    would race it (tests/lessons.md 2026-05-20 / 2026-06-02).
 *
 * Auth: per-describe `test.use({ storageState: authFileFor(role) })` — the
 * parallel config's setup project (tests/auth.setup.ts) mints tests/.auth/
 * <role>.json once per run. Run via playwright.parallel.config.ts.
 */

import { test, expect, request, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { authFileFor } from '../../fixtures/roleAuth';
import { testUsers } from '../../fixtures/testUsers';
import { chooseSelectMenuOption } from '../../pom/selectMenu';
import { selectStatusTabByTestId } from '../../pom/statusTabs';

// Mirrors tests/runners/supabaseChecks.ts URL resolution (.env is loaded by
// playwright.config.ts's `import 'dotenv/config'`; .env.secrets by testUsers).
const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  'https://mymzcbalyqqgdmzsfmam.supabase.co';

const ADVISOR = testUsers.advisor;
const MANAGER = testUsers.manager;
const SUPER_ADMIN = testUsers.super_admin;

/**
 * The DataTable mounts BOTH the desktop row subtree (`hidden md:block`) and
 * the mobile card subtree (`md:hidden`), so per-user testids exist twice in
 * the DOM. `:visible` resolves to whichever subtree the viewport shows.
 */
function visibleByTestIds(page: Page, testIds: readonly string[]): Locator {
  return page
    .locator(testIds.map((id) => `[data-testid="${id}"]:visible`).join(', '))
    .first();
}

/** The visible row (desktop) or card (mobile) for one user id. */
function userRow(page: Page, userId: string): Locator {
  return visibleByTestIds(page, [
    `manage-accounts-row-${userId}`,
    `manage-accounts-card-${userId}`,
  ]);
}

/** The visible role SelectMenu trigger for one user id. */
function roleSelect(page: Page, userId: string): Locator {
  return page
    .locator(`[data-testid="manage-accounts-role-select-${userId}"]:visible`)
    .first();
}

async function gotoManageAccounts(page: Page): Promise<void> {
  await page.goto('/manage-accounts');
  await expect(page.getByTestId('manage-accounts-table')).toBeVisible({ timeout: 30_000 });
}

// ── (1) Advisor: module-gated off the page ───────────────────────────────────

test.describe('advisor /manage-accounts gating', () => {
  test.use({ storageState: authFileFor('advisor') });

  test('navigating to /manage-accounts redirects to /dashboard (no module grant) @p0 @mobile', async ({
    page,
  }) => {
    await page.goto('/manage-accounts');
    // ProtectedRoute redirects client-side once AuthContext hydration lands.
    await page.waitForURL('**/dashboard', { timeout: 45_000 });
    expect(new URL(page.url()).pathname).toBe('/dashboard');
    // The gated surface never rendered.
    await expect(page.getByTestId('manage-accounts-table')).toHaveCount(0);
  });
});

// ── (2)+(3) Manager: list rendering + role round-trip ────────────────────────

test.describe('manager /manage-accounts', () => {
  test.use({ storageState: authFileFor('manager') });

  // Set the moment the round-trip test STARTS (before any mutation) so the
  // afterAll restore fires on every exit path — pass, assertion failure, or
  // mid-flight crash — but never from a project where the test was skipped
  // (a skipped project's restore POST would race the running one).
  let roleRoundTripStarted = false;

  test.afterAll(async () => {
    if (!roleRoundTripStarted) return;
    // Direct role-sync call (the ONLY sanctioned mutation path — direct
    // `users` UPDATEs are blocked by RLS + the protect_user_privileges
    // trigger), authed as the manager via the storageState session. The
    // setup project re-mints tests/.auth/manager.json each suite run, so the
    // access token is fresh for the lifetime of a run.
    const ctx = await request.newContext();
    try {
      const response = await ctx.post(`${SUPABASE_URL}/functions/v1/role-sync`, {
        headers: {
          Authorization: `Bearer ${managerAccessToken()}`,
          'Content-Type': 'application/json',
        },
        data: { user_id: ADVISOR.id, role: 'advisor' },
      });
      if (!response.ok()) {
        throw new Error(
          `[manage-accounts.spec] role restore for ${ADVISOR.email} failed: ` +
            `HTTP ${response.status()} ${await response.text()} — ` +
            `re-run via playwright.parallel.config.ts (its setup project re-mints tests/.auth/manager.json), ` +
            `or restore manually: role-sync { user_id: '${ADVISOR.id}', role: 'advisor' }.`,
        );
      }
    } finally {
      await ctx.dispose();
    }
  });

  test('renders user rows; self row is read-only; Pending tab renders and counts @p0 @mobile', async ({
    page,
  }) => {
    await gotoManageAccounts(page);

    await test.step("search 'e2e' surfaces the three e2e accounts", async () => {
      await page.getByTestId('manage-accounts-search-input').fill('e2e');
      for (const user of [ADVISOR, MANAGER, SUPER_ADMIN]) {
        await expect(userRow(page, user.id)).toBeVisible({ timeout: 30_000 });
      }
      // Bind one row id to its real account (search matched name OR email).
      await expect(userRow(page, MANAGER.id)).toContainText(MANAGER.email);
    });

    await test.step("manager's own row shows 'This is you' with controls disabled", async () => {
      const selfChip = visibleByTestIds(page, [
        'manage-accounts-self-chip',
        'manage-accounts-self-chip-mobile',
      ]);
      await expect(selfChip).toBeVisible();
      await expect(selfChip).toHaveText('This is you');
      await expect(roleSelect(page, MANAGER.id)).toBeDisabled();
      // Approved self row exposes no Approve action either.
      await expect(
        page.getByTestId(`manage-accounts-approve-btn-${MANAGER.id}`),
      ).toHaveCount(0);
      // Contrast: another user's role select IS operable for a manager.
      await expect(roleSelect(page, ADVISOR.id)).toBeEnabled();
    });

    await test.step('Pending tab renders and its count matches the rows (read-only)', async () => {
      // Clear the search first — the tab's pill ignores search, but the row
      // list doesn't, and the two must agree for the count assertion.
      await page.getByTestId('manage-accounts-search-input').fill('');

      // The strip tab is always mounted (hidden but measurable in overflow
      // mode), and its count pill renders once the users query resolves.
      const pendingTab = page.getByTestId('manage-accounts-tab-pending').first();
      await expect(pendingTab).toContainText('Pending approval');
      await expect(pendingTab).toContainText(/\d/, { timeout: 30_000 });
      const pillMatch = ((await pendingTab.textContent()) ?? '').trim().match(/(\d[\d,]*)$/);
      expect(pillMatch, 'Pending tab must end with its count pill').not.toBeNull();
      const pendingCount = Number(pillMatch![1].replace(/,/g, ''));
      expect(pendingCount).toBeGreaterThanOrEqual(0);

      await selectStatusTabByTestId(page, 'manage-accounts-tab-pending');
      await expect(pendingTab).toHaveAttribute('aria-selected', 'true');

      // Rendered pending rows agree with the pill (default page size 25;
      // zero pending renders the no-results body → zero rows). NOTHING is
      // approved or un-approved here — pure read.
      const visibleRows = page.locator(
        '[data-testid^="manage-accounts-row-"]:visible, [data-testid^="manage-accounts-card-"]:visible',
      );
      await expect
        .poll(() => visibleRows.count(), { timeout: 30_000 })
        .toBe(Math.min(pendingCount, 25));
    });
  });

  test('role round-trip on the e2e-advisor row: advisor→manager→advisor @p0', async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'DB-mutating round-trip runs on ONE project only — the e2e-advisor row is shared, ' +
        'and a second project instance would race it (tests/lessons.md 2026-05-20 / 2026-06-02).',
    );
    roleRoundTripStarted = true;
    // Two edge-function round-trips + list refetches need headroom cold.
    test.slow();

    await gotoManageAccounts(page);

    await test.step('narrow the list to the e2e-advisor row', async () => {
      await page.getByTestId('manage-accounts-search-input').fill('e2e-advisor');
      await expect(userRow(page, ADVISOR.id)).toBeVisible({ timeout: 30_000 });
      await expect(userRow(page, ADVISOR.id)).toContainText(ADVISOR.email);
      // Precondition tripwire: a leftover 'Manager' here means a previous
      // run's restore failed — fix the data before trusting this test.
      await expect(roleSelect(page, ADVISOR.id)).toContainText('Advisor');
    });

    await test.step('advisor → manager: toast + select label update', async () => {
      await chooseSelectMenuOption(page, {
        trigger: `manage-accounts-role-select-${ADVISOR.id}`,
        optionTestId: 'manage-accounts-role-option-manager',
      });
      await expect(
        page.getByTestId('toast-success').filter({ hasText: 'Role updated to Manager' }),
      ).toBeVisible({ timeout: 15_000 });
      // Label flips once the invalidated users query refetches (also proves
      // the row's busy state cleared before the change back).
      await expect(roleSelect(page, ADVISOR.id)).toContainText('Manager', { timeout: 15_000 });
    });

    await test.step('manager → advisor: round-trip back (cleanup half)', async () => {
      await chooseSelectMenuOption(page, {
        trigger: `manage-accounts-role-select-${ADVISOR.id}`,
        optionTestId: 'manage-accounts-role-option-advisor',
      });
      await expect(
        page.getByTestId('toast-success').filter({ hasText: 'Role updated to Advisor' }),
      ).toBeVisible({ timeout: 15_000 });
      await expect(roleSelect(page, ADVISOR.id)).toContainText('Advisor', { timeout: 15_000 });
    });
  });
});

// ── storageState session extraction ──────────────────────────────────────────

interface StorageStateFile {
  origins: Array<{
    origin: string;
    localStorage: Array<{ name: string; value: string }>;
  }>;
}

/**
 * The manager's Supabase access token, straight from the storageState the
 * setup project saved (`sb-<ref>-auth-token` localStorage entry holds the
 * serialized session). Used ONLY by the afterAll restore.
 */
function managerAccessToken(): string {
  const statePath = resolve(process.cwd(), authFileFor('manager'));
  const state = JSON.parse(readFileSync(statePath, 'utf8')) as StorageStateFile;
  for (const origin of state.origins) {
    for (const entry of origin.localStorage) {
      if (!entry.name.endsWith('-auth-token')) continue;
      const session = JSON.parse(entry.value) as { access_token?: string };
      if (session.access_token) return session.access_token;
    }
  }
  throw new Error(
    `[manage-accounts.spec] no Supabase session found in ${statePath} — ` +
      'run via playwright.parallel.config.ts so the setup project mints it.',
  );
}
