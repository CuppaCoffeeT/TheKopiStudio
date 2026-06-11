/**
 * playwright.parallel.config.ts — HIGH-PARALLELISM config for fast LOCAL full-suite runs.
 *
 * The default `playwright.config.ts` is deliberately `workers: 1` because the suite's
 * specs each do a UI sign-in with a single shared account, and N parallel
 * sign-ins race on Supabase auth. This config removes that bottleneck:
 *
 *   1. A `setup` project (tests/auth.setup.ts) signs in ONCE PER ROLE and saves each
 *      session to tests/.auth/<role>.json (advisor · manager · super_admin).
 *   2. The authed projects reuse the super_admin session via `storageState`, so the
 *      in-spec `LoginPage.signIn(...)` calls become instant no-ops (LoginPage.signIn
 *      detects the /login → /dashboard auto-redirect and returns early). Zero repeat
 *      sign-ins → no race.
 *   3. With auth solved, we run many workers. Default 10 (override with E2E_WORKERS=N).
 *
 * PER-ROLE SESSIONS
 * -----------------
 * A spec that must run as a NON-super_admin role has two options:
 *   (a) Per-spec storageState (preferred — instant, no UI sign-in):
 *         import { authFileFor } from '../../fixtures/roleAuth';
 *         test.use({ storageState: authFileFor('advisor') });
 *       The `setup` project already wrote that file, so the spec starts authed as
 *       the advisor. Add `tests/workflows/<area>` under a role-scoped project
 *       below if you want a whole folder pinned to one role.
 *   (b) In-spec UI sign-in via `loginAs(page, role)` (roleAuth.ts) — for the rare
 *       within-spec role SWITCH, or specs under tests/workflows/auth/** which run
 *       WITHOUT storageState (they exercise the login UI itself).
 *
 * The logged-out auth-flow specs (tests/workflows/auth/**) test the login/register/reset
 * UI + per-role login + role-gating, so they run in SEPARATE projects with NO storageState
 * and sign in through the UI (LoginPage / loginAs).
 *
 * This config is for local runs only — it does NOT touch the pre-push @p0 gate or CI
 * (both keep using the serial playwright.config.ts). See docs/06-operations/PARALLEL_E2E_TESTING.md.
 *
 * Run:   npx playwright test --config=playwright.parallel.config.ts
 *        E2E_WORKERS=12 npx playwright test --config=playwright.parallel.config.ts
 */
import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';
import { authFileFor } from './tests/fixtures/roleAuth';

const SUPER_ADMIN_AUTH_FILE = authFileFor('super_admin');
const WORKERS = process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 10;

export default defineConfig({
  ...base,
  // Keep within-file tests serial (data-isolation safety); parallelise ACROSS files/workers.
  fullyParallel: false,
  workers: WORKERS,
  retries: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/parallel-results.json' }], ['html', { open: 'never' }]],

  projects: [
    // 1. Sign in once PER ROLE → tests/.auth/<role>.json (advisor/manager/super_admin)
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /auth\.setup\.ts/,
    },
    // 2. Authed suite (everything EXCEPT the logged-out auth-flow specs) — super_admin session.
    {
      name: 'chromium-desktop',
      testDir: './tests/workflows',
      testIgnore: '**/auth/**',
      use: { ...devices['Desktop Chrome'], storageState: SUPER_ADMIN_AUTH_FILE },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      testDir: './tests/workflows',
      testIgnore: '**/auth/**',
      use: { ...devices['iPhone 13'], storageState: SUPER_ADMIN_AUTH_FILE },
      dependencies: ['setup'],
    },
    // 3. Logged-out auth-flow specs (NO saved session — they test login/register/reset,
    //    per-role login, and capability-gating, signing in through the UI per spec).
    {
      name: 'chromium-auth-flow',
      testDir: './tests/workflows',
      testMatch: '**/auth/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-auth-flow',
      testDir: './tests/workflows',
      testMatch: '**/auth/**/*.spec.ts',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
    },
  ],
});
