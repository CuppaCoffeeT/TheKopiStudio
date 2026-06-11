# Parallel E2E Testing (Fast Local Playwright Runs)

**Created**: 2026-05-29 14:30:00 SGT
**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

The default `npm run test:e2e` runs the Playwright suite with **1 worker** (serial) on purpose — every spec signs in through the UI with the single shared admin account, and N simultaneous sign-ins race on Supabase auth. A full serial run can take hours.

`playwright.parallel.config.ts` removes that bottleneck the way the [Playwright auth docs](https://playwright.dev/docs/auth) recommend — **authenticate once, reuse the session** — so the suite can run many workers and finish in roughly `wall-clock ÷ workers`. This guide is for **local** runs; the pre-push `@p0` gate and CI keep using the serial `playwright.config.ts`.

```bash
# Full suite, ~10 workers, headless, desktop + mobile:
npx playwright test --config=playwright.parallel.config.ts

# Tune worker count to your machine:
E2E_WORKERS=12 npx playwright test --config=playwright.parallel.config.ts
```

## 3-tier E2E model

Three commands, three jobs. Pick by where you are in the loop.

| Tier | Command | When | Scope |
|------|---------|------|-------|
| Inner loop | `npm run test:e2e:failed` (`--last-failed`) | while fixing | only specs that just failed — iterate fast |
| Fast push gate | `npm run test:e2e:pushgate` (`--grep @pushgate`) | pre-push (husky) | 6 fast read-only specs, ~3-5 min |
| Comprehensive | `npm run test:e2e:comprehensive` (`playwright.comprehensive.config.ts`) | Mac Mini nightly 2am + on-demand | full `@p0` both browsers, real NAS, all 50 routes, traces on |

- `npm run test:e2e:smoke` (`--grep @smoke`) = broader on-demand smoke bucket — includes heavier DB-writing journey specs (e.g. `prod-recovery-journey`) deliberately kept OUT of the push gate.
- Husky pre-push now runs **`@pushgate`** (the 6 fast specs); `@smoke` is the broader on-demand bucket.
- `SKIP_E2E=1 git push` still bypasses the pre-push hook entirely.
- Inner loop: fail → `test:e2e:failed` → fix → repeat; widen to `test:e2e:pushgate` before pushing.
- Trust `@p0` only after the comprehensive run; the push gate is signal, not proof.

> The comprehensive config + Mini runbook ship in later phases. Runbook (forthcoming): [MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md](./MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md).

## How it works

1. A **`setup` project** (`tests/auth.setup.ts`) signs in **once per role** and saves each session to `tests/.auth/<role>.json` — `admin` (super_admin) + `coordinator` · `supervisor` · `storeman`. Each role uses its own isolated `browser.newContext()`.
2. The authed projects load the **admin** session via `storageState`, so the in-spec `LoginPage.signIn(...)` calls become **instant no-ops** — `signIn` detects the `/login → /dashboard` auto-redirect (`useLoginRedirect`) and returns early. Zero repeat sign-ins → no race → safe to parallelise.
3. With auth solved, we run many workers. Default **10** (override with `E2E_WORKERS=N`).
4. The logged-out **auth-flow specs** (`tests/workflows/auth/**` — login / register / reset / bad-credentials / per-role login / role-gating) run in **separate projects with NO `storageState`**, because they exercise the login UI itself; they sign in through the UI (`LoginPage` / `loginAs`).

## Per-role sessions (multi-role harness)

Per-role tests use **real Supabase logins**, never the in-app View-As (which is a client-only UI preview and can't exercise RLS). The accounts are plus-addressed onto one inbox — `admin@example.com` (admin) + `aigent+coordinator@`, `aigent+supervisor@`, `aigent+storeman@` — and Supabase treats each as a distinct user. See [PER_ROLE_E2E_TEST_HARNESS_PLAN.md](../05-implementation/completed/PER_ROLE_E2E_TEST_HARNESS_PLAN.md).

A spec that must run as a non-admin role has two options:

```ts
// (a) PREFERRED — per-spec storageState (instant; the setup project pre-wrote the file)
import { authFileFor } from '../../fixtures/roleAuth';
test.use({ storageState: authFileFor('coordinator') });

// (b) In-spec UI sign-in (for a within-spec role SWITCH, or auth-flow specs with no storageState)
import { loginAs } from '../../fixtures/roleAuth';
await loginAs(page, 'storeman'); // throws clearly if that role's password isn't configured
```

`authFileFor(role)` (`tests/fixtures/roleAuth.ts`) is the single source of truth for the `tests/.auth/<role>.json` paths — used by both the setup writer and any role-scoped reader. Add a whole-folder role pin by giving that folder its own project with `storageState: authFileFor('<role>')` + `dependencies: ['setup']` in `playwright.parallel.config.ts`.

### Credentials — two `.env.secrets` files

The keys are split across two files, so `testUsers.ts` loads **both** (each guarded by `existsSync`; dotenv won't override an already-set var, and the files hold disjoint keys, so order is safe):

| File | Keys |
|------|------|
| `/Volumes/YourVolume/.env.secrets` (volume) | `AIGENT_*` (admin login) · `SUPABASE_*` (service-role for DB evidence) |
| `<repo>/.env.secrets` (local) | `TEST_COORDINATOR_*` · `TEST_SUPERVISOR_*` · `TEST_STOREMAN_*` (email + password per role) |

A role whose password isn't set fails loudly via `requireTestUser(role)` at first use — never a silent anonymous session.

## Commands

| Goal | Command |
|------|---------|
| Full suite, parallel | `npx playwright test --config=playwright.parallel.config.ts` |
| Pick worker count | `E2E_WORKERS=8 npx playwright test --config=playwright.parallel.config.ts` |
| Desktop only | `… --config=playwright.parallel.config.ts --project=chromium-desktop` |
| Mobile only | `… --config=playwright.parallel.config.ts --project=mobile-safari` |
| One folder | `… --config=playwright.parallel.config.ts tests/workflows/quotation` |
| One spec | `… --config=playwright.parallel.config.ts tests/workflows/quotation/create-quotation.spec.ts` |
| Watch it run (visible) | `HEADED=1 npx playwright test --config=playwright.parallel.config.ts` |
| HTML report after a run | `npx playwright show-report` |

`--project=…` automatically runs its `setup` dependency first, so the auth session is always fresh.

> **Headless by default.** Runs are headless unless you set `HEADED=1`. No browser windows steal focus.

## How many workers?

Match your CPU. A 14-core (10 performance) Mac → **10 is the sweet spot**.

| Workers | When |
|--------|------|
| `4–6` | laptop on battery / doing other work |
| `8–10` | plugged-in desktop run (default `10`) |
| `> perf-core count` | **don't** — browsers oversubscribe the CPU, tests time out, and you get **false failures** that look like real bugs |

More workers ≠ always faster: past the perf-core count, contention slows every test and inflates flakes. Playwright prints the worker count it picked at the start of a run.

## Auth session files

- Paths: `tests/.auth/<role>.json` — `admin.json` · `coordinator.json` · `supervisor.json` · `storeman.json`, all created automatically by the `setup` project.
- **Gitignored** (`tests/.auth/`). They contain live session tokens (incl. a `super_admin` one) — **never commit them**.
- Stale/expired session causing weird redirects or 401s? Delete it and re-run:
  ```bash
  rm -rf tests/.auth && npx playwright test --config=playwright.parallel.config.ts
  ```
- The session JWT is valid ~1 hour and is re-minted at the start of every run, so a single run is fine. If one run exceeds ~1 h, split it (`--project=chromium-desktop` then `--project=mobile-safari`).

## Data safety

Specs run against the **production DB** (the only DB) but are **data-isolated**: each uses unique timestamped names (e.g. `[test] WF-0012 <ts>`) and hard-deletes its own rows on teardown (zero-residue rule). `fullyParallel: false` keeps tests **within one file** serial; only different files run concurrently — so two workers never share a spec's data. The shared `TEST_INVOICE_AUTOMATION` fixture is seeded once by `globalSetup` and only read.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Many auth/redirect failures at once | stale `tests/.auth/admin.json`, or auth specs got a session | `rm -rf tests/.auth`; confirm `auth/**` ran under `*-auth-flow` projects |
| Random timeouts that pass on re-run | too many workers for the CPU | lower `E2E_WORKERS` |
| `setup` fails: "AIGENT_PASSWORD not set" | secrets not loaded | source `/Volumes/YourVolume/.env.secrets` or set the project-local `.env.secrets` |
| `auth/**` spec "already logged in" | it ran with `storageState` | it must run under `chromium-auth-flow` / `mobile-auth-flow` (no session) — check the config project split |
| Need the serial known-good run | — | `npm run test:e2e` (gate config, `workers: 1`) |

## 📚 Related Documentation

- `playwright.parallel.config.ts` (repo root) — this config
- `playwright.config.ts` (repo root) — serial gate config (pre-push + CI)
- `tests/auth.setup.ts` — the one-time sign-in
- `tests/pom/LoginPage.ts` — idempotent `signIn` (skips when already authed)
- [tests/CONTEXT.md](../../tests/CONTEXT.md) — suite overview
- [CODE_HYGIENE_STRATEGY.md](./CODE_HYGIENE_STRATEGY.md) — related dev-workflow operations guide
