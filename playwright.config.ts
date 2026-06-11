import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

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
    baseURL: 'http://localhost:8080',
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

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !isCI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
