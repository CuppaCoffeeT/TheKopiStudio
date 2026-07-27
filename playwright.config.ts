import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import { authFileFor } from './tests/fixtures/roleAuth';

// E2E_PORT lets parallel worktrees/agent runs use a non-default dev-server port
// (8080 may be held by another project's dev server). Default unchanged.
const E2E_PORT = process.env.E2E_PORT ?? '8080';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/workflows',
  // Verify env once per suite invocation (no fixtures are seeded — the profiler
  // suite runs against live tables with pre-provisioned e2e accounts). Teardown
  // is a logging no-op kept for symmetry/future cleanup.
  // See: tests/global-setup.ts · tests/global-teardown.ts
  globalSetup: './tests/global-setup',
  globalTeardown: './tests/global-teardown',
  // Specs sign in through the UI with shared per-role accounts (testUsers).
  // Multiple workers performing parallel sign-ins cause Supabase session-token
  // conflicts and cascading auth failures, so we keep `fullyParallel: false` +
  // 1 local worker. CI uses 2 workers because the 2 Playwright projects
  // (chromium + mobile-safari) can shard cleanly across them.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : 1,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  // CI runners saturate under the 2-project matrix — sign-in redirect alone can
  // burn 25-45s. Widen the per-test budget on CI so the longer waitForURL
  // ceiling (45s, see tests/*) still leaves room for page load + axe scan.
  timeout: isCI ? 90_000 : 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    // Headless by default so test runs (incl. pre-push) don't steal macOS focus.
    // Opt in to a visible browser with `HEADED=1 npx playwright test ...`.
    headless: !process.env.HEADED,
    // CI ubuntu-latest has ~14GB disk total; Playwright traces+videos fill it
    // within ~10 tests (seen as ENOSPC on WF-9000 route 5-6). Keep local
    // artifacts for debugging, drop them on CI.
    trace: isCI ? 'off' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: isCI ? 'off' : 'retain-on-failure',
    // Mobile-safari render on ubuntu-latest is ~2-3x slower than desktop.
    // Widen both timeouts on CI so slow initial React Query fetches don't
    // race individual-assertion timeouts.
    actionTimeout: isCI ? 25_000 : 15_000,
    navigationTimeout: isCI ? 30_000 : 20_000,
    // slowMo dropped 2026-04-28 to cut suite runtime ~30%. Specs that race
    // (WF-0099 cache-staleness was the canary) should use explicit waits —
    // `page.waitForLoadState`, `expect(...).toHaveValue`, etc. — rather than
    // pausing the whole suite. Re-introduce per-spec only if a flake recurs.
    launchOptions: {},
  },

  // The `setup` project mints tests/.auth/<role>.json once per invocation; the
  // browser projects depend on it. This wiring lives here — not only in
  // playwright.parallel.config.ts — so a bare `npx playwright test` works.
  // Before 2026-07-27 it existed only in the parallel config, so any run that
  // omitted `--config` (including CI) produced no auth files and every spec
  // using `test.use({ storageState: authFileFor(...) })` failed with
  // ENOENT tests/.auth/advisor.json. Green locally, red in CI, same command.
  // The parallel config replaces `projects` wholesale, so it is unaffected.
  projects: [
    {
      name: 'setup',
      testDir: './tests',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], storageState: authFileFor('super_admin') },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'], storageState: authFileFor('super_admin') },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${E2E_PORT} --strictPort`,
    url: `http://localhost:${E2E_PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
