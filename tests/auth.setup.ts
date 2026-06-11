/**
 * Playwright auth setup — signs in ONCE per role per suite invocation and saves
 * each authenticated session to tests/.auth/<role>.json. Authed projects reuse
 * that storageState (see playwright.parallel.config.ts), so the in-spec
 * `LoginPage.signIn(...)` calls become instant no-ops (LoginPage.signIn detects
 * the /login → /dashboard auto-redirect and returns early).
 *
 * Why this exists: the suite used to force `workers: 1` because N parallel UI
 * sign-ins of a single shared account raced on Supabase auth. Reusing one saved
 * session per role removes every repeat sign-in, so the suite can run many
 * workers — AND lets specs assert real per-role RLS/capability behaviour
 * (the View-As preview is client-only and can't exercise RLS).
 *
 * Runs as a Playwright "setup" project that the authed projects `dependencies`
 * on, so it executes before any worker starts. NOT matched by the default
 * *.spec.ts glob — only by the setup project's explicit testMatch.
 *
 * Idempotent: each role gets a fresh isolated browser context; re-running just
 * re-mints the saved sessions. A role whose password isn't configured fails
 * loudly (requireTestUser) rather than silently saving an anonymous session.
 */
import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pom/LoginPage';
import { requireTestUser } from './fixtures/testUsers';
import { AUTH_ROLES, authFileFor } from './fixtures/roleAuth';

// Back-compat: existing config + docs reference ADMIN_AUTH_FILE by name.
export const ADMIN_AUTH_FILE = authFileFor('admin');
export const COORDINATOR_AUTH_FILE = authFileFor('coordinator');
export const SUPERVISOR_AUTH_FILE = authFileFor('supervisor');
export const STOREMAN_AUTH_FILE = authFileFor('storeman');

for (const role of AUTH_ROLES) {
  setup(`authenticate as ${role}`, async ({ browser }) => {
    const user = requireTestUser(role);

    // Fresh, isolated context per role so saved sessions never bleed together.
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await new LoginPage(page).signIn(user.email, user.password);
      // Confirm the session actually landed before snapshotting it.
      await page.waitForURL('**/dashboard', { timeout: 45_000 });
      expect(page.url()).toMatch(/\/dashboard$/);
      await context.storageState({ path: authFileFor(role) });
    } finally {
      await context.close();
    }
  });
}
