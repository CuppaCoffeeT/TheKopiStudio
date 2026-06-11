/**
 * playwright.comprehensive.config.ts — FULL comprehensive run for the Mac Mini
 * nightly self-heal pipeline.
 *
 * Purpose: the broadest, most diagnosable E2E pass. Runs the entire suite — all
 * 50 routes, every project (setup · chromium-desktop · mobile-safari ·
 * chromium-auth-flow · mobile-auth-flow), and the 3 NAS/AI specs (WF-0012
 * create-quotation, WF-0016 nas-folder-always-created, WF-1001 nda-scenario-a)
 * with traces ALWAYS on so a nightly failure is reproducible without a re-run.
 *
 * Extends playwright.parallel.config; the only overrides are:
 *   - workers: 6   (NAS + prod-DB stability; parallel defaults to 10)
 *   - retries: 2   (absorb transient NAS/SMB + prod-DB flakiness)
 *   - trace: 'on'  (always-on for diagnosability, not just on-retry)
 *   - video: 'retain-on-failure'
 *
 * Inherited via the spread (do NOT redefine here):
 *   - projects (setup + 4 browser projects)
 *   - reporter (json → test-results/parallel-results.json, the path the
 *     self-heal pipeline parses)
 *   - webServer (command 'npm run dev', url http://localhost:8080) — so the dev
 *     server AUTO-STARTS for this config too; the runner shell script must NOT
 *     start/stop a server.
 *   - fullyParallel:false (within-file serial, parallelise across files)
 *
 * NOT a route cap: SMOKE_MAX_ROUTES is deliberately NOT set/forwarded — all 50
 * routes run.
 *
 * NOT for laptop pre-push (@pushgate) — that gate keeps the serial
 * playwright.config.ts. NOT for CI — CI has no SMB mount for the NAS specs.
 * This config is Mac-Mini-only (the NAS volume is mounted there).
 *
 * Driven by: scripts/ci/comprehensive-run.sh
 * Runbook:   docs/06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md
 *
 * Run:   npx playwright test --config=playwright.comprehensive.config.ts
 *        E2E_WORKERS=4 npx playwright test --config=playwright.comprehensive.config.ts
 */
import { defineConfig } from '@playwright/test';
import parallel from './playwright.parallel.config';

const WORKERS = process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : 6;

export default defineConfig({
  ...parallel,
  workers: WORKERS,
  retries: 2,
  use: { ...parallel.use, trace: 'on', video: 'retain-on-failure' },
});
