# W22 — CI gates (Husky pre-commit + pre-push, GitHub Actions post-push)

**Created**: 2026-04-18 SGT
**Last Updated**: 2026-06-01 SGT (3-tier E2E model + Mac-Mini comprehensive runner — see bottom section)
**Status**: 🟢 CLOSED 2026-04-19 · `ci_enforced` ✅ · all structural done-when items pass, including WF-0019 re-add + ubuntu-latest headroom fixes. · reopened-for-3-tier-update 2026-06-01

**The WF-0019 root-cause fix** (commit `e10fb25`): trace analysis of a failed run showed every synology-nas edge function call returned `success:true` — the rename DID work on Synology. The test assertion failed because `fs.existsSync` on the local SMB mount still reported `_pending/<ref>/` as present. **macOS caches SMB directory listings for 10-60s**; the local mount lied. Fix = authoritative Synology check via edge function `verify-folder`:
 - `tests/runners/nasChecks.ts` — new `verifyNasPathOnSynology()` + `waitUntilNasPathGone()` poll Synology directly; `hardDeleteNasFolder` tolerates `ENOENT` (same cache class: mount says exists, Synology says gone, rmSync errors — treat as already-deleted).
 - `tests/workflows/quotation/confirm-assign-ai.spec.ts` — happy-path assertion uses `waitUntilNasPathGone(pendingFolderRemote, 10s)`; system-comment assertion polls 15s for async writes.
 - Local verification: `npm run test:e2e:p0` 10/10 green (5.5min) both projects both WF-0019 cases + WF-0001 + WF-0012 + WF-9000.
 - CI verification: run `24623467020` green — WF-0012 and WF-0019 both auto-skipped via `assertNasMountAvailable()` CI branch (no SMB mount on ubuntu-latest).

**Earlier that day**: end-to-end green confirmed run `24622695791`. 4 jobs: TypeScript+ESLint ✅ · Playwright @p0 chromium-desktop ✅ · Playwright @p0 mobile-safari ✅ · Sync Last CI green ✅ (bot commit `a33d6c2`).
 - ✅ **Ledger auto-sync** shipped as `sync-ledger` job in `.github/workflows/seatbelt.yml`. Python-sed rewrites `**Last CI green**: <TODAY> SGT · run <ID>` on every green run, commits with `[skip ci]`, push-race retry built in. Verified working `2026-04-19 → 24622695791`.
 - ✅ **Pre-commit** runs `tsc --noEmit --incremental` + `lint-staged` (`eslint --fix --quiet` on staged `.ts/.tsx` — errors block, warnings pass through since existing debt is tracked at the global ceiling).
 - ✅ **Pre-push** runs full `tsc --noEmit` + `npm run lint --max-warnings=1610` + `@p0` Playwright (WF-0001 · WF-0012 · WF-9000 × chromium-desktop + mobile-safari = 6 runs, ~3.7min).
 - ✅ **CI typecheck-lint job** runs `tsc` + `npm run lint` with the same `--max-warnings=1610` cap. New code can't grow the count; legacy debt passes.
 - ✅ **CI e2e job** runs full `@p0` grep; `assertNasMountAvailable()` auto-skips WF-0012 (+ WF-0019 when re-added) when no SMB mount on ubuntu-latest. WF-9000 capped at `SMOKE_MAX_ROUTES=10` + page-heap-reclaim every 5 routes (20 → 10 after `ERR_INSUFFICIENT_RESOURCES` on `/nce-dashboard`/`/salary`/`/payment-management`).
 - ✅ **WF-0019 back on `@p0`** (commit `e10fb25`). Root cause was NOT a retry/flake — it was the macOS SMB directory-listing cache lying about `_pending/<ref>/` still existing after Synology renamed it away. Fixed by swapping `fs.existsSync` → edge-function `verify-folder` for authoritative checks. 10/10 green locally on full @p0 suite, 4/4 green in CI (auto-skipped via CI-aware `assertNasMountAvailable`, which is a legit skip not a silent pass).
 - ⚠️ **Anti-pattern log** (6 `SKIP_E2E=1` bypasses during the W22 shipping day): 5 docs-only pushes, 1 agent-collision (W08 Tailwind v4 dev-server breakage). Zero-bypass observation window opens 2026-04-19 eod; future bypasses must add a one-line `[SKIP_E2E=1] <commit> <reason>` entry to RECENT_CHANGES.md.
 - **Debt tracked but not gating** 🟢: 1326 `no-explicit-any` (W09 per-module) · 50 inline useMutation (W21-5) · 4 rules-of-hooks (W09) · 13 legacy style rules downgraded to warn — all promoted back to `error` as each owning card closes.
**Status**: 🟢 CLOSED — Phase 8 of [W03_04_EXECUTION_PROTOCOL.md](W03_04_EXECUTION_PROTOCOL.md)
**Priority**: 🔴 Critical
**Tier**: Now (S2→S3) · **Automation**: 🤖 scripted
**Blocked by**: ~~W04 multi-tool harness + ≥1 green P0 spec~~ — both satisfied 2026-04-19.
**Blocks**: G4 `seatbelt_live` flag (CI enforcement is part of "seatbelt live")

## Progress log

- **2026-04-19** — scaffolding shipped:
  - Dev deps: `husky@^9` · `lint-staged@^16`
  - Hooks:
    - `.husky/pre-commit` — `tsc --noEmit --incremental` + `lint-staged` (ESLint on staged `.ts/.tsx` files)
    - `.husky/pre-push` — full `tsc --noEmit` + `npm run lint` + `npm run test:e2e:p0`. Bypass with `SKIP_E2E=1 git push` for docs-only emergencies.
  - `package.json` — `lint-staged` config added + `prepare: husky` script.
  - GH Actions: `.github/workflows/seatbelt.yml` — runs on push + PR to `main`. Two jobs: typecheck-lint → matrix(chromium-desktop, mobile-safari) @p0 Playwright. Concurrency group cancels superseded runs. Uploads `playwright-report/` on failure.
  - P0 tagging: `@p0` appended to `test.describe()` titles in WF-0001 (login-admin) · WF-0012 (create-quotation) · WF-9000 (smoke). `npx playwright test --grep @p0 --list` confirms 3 describe blocks → **6 test runs** (3 × 2 projects).
  - **WF-0019 excluded from @p0 (2026-04-19)** — Confirm & Assign hits intermittent Synology SMB code-119 / ENOTEMPTY flakes on `_pending/<ref>/` migration + cleanup. 8/10 push-gate runs passed; 2 failed. Still runs in the full local suite. Re-add `@p0` once W04 NAS retry is hardened — tracked in W04's **Phase 5 hardening backlog** (ships alongside X10 Path A baseline in Week 5).
- **User actions to complete before W22 → 🟢**:
  1. Set GitHub repo secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PLAYWRIGHT_TEST_USER_EMAIL`, `PLAYWRIGHT_TEST_USER_PASSWORD`. Without these, GH Actions e2e job fails with env errors.
  2. Push to main → observe the first GH Actions seatbelt run (should be green). If NAS/Gmail assertions fail on the runner (no SMB mount available in ubuntu-latest), the runner-only e2e may need to exclude WF-0012/WF-0019 in favor of UI-only smoke (WF-0001 + WF-9000). Confirmed pre-push works locally.
  3. After the first green push, flip W22 → 🟢 and mark `seatbelt_live` flag ON.

## Why this exists

A local green spec doesn't matter if nobody enforces it. User pushes direct to `main` (per `feedback_no_pr_workflow.md`) — so the enforcement layer has to sit:
1. **Before push leaves laptop** (Husky pre-push hook — blocks bad pushes at source)
2. **After push lands on GitHub** (GH Actions — catches anything that slipped through)

Without this, the W03+W04 harness is advisory, not mandatory. Every refactor PR becomes "I ran the tests on my laptop, trust me."

## Scope

**In — Husky (local)**:
- `.husky/pre-commit`: runs on every `git commit`
  - `tsc --noEmit --incremental` (~5-10s)
  - `lint-staged` — ESLint + Prettier on staged files only (~5-15s)
  - Fails → commit rejected
- `.husky/pre-push`: runs on every `git push`
  - Full `tsc --noEmit`
  - Full ESLint
  - Playwright P0 suite only (`npx playwright test --grep @p0`) — ~5-8 min
  - Fails → push rejected
- Bypass mechanism: `git push --no-verify` (documented; should be rare)

**In — GitHub Actions (cloud)**:
- `.github/workflows/ci.yml`
- Trigger: `push` to `main` (no PRs needed per user workflow)
- Jobs:
  - `typecheck` — `npm run build` (includes tsc)
  - `lint` — full ESLint
  - `playwright-p0` — P0 suite + post-checks (Supabase/NAS/Gmail/ghost-os via GH Actions secrets)
  - `playwright-full` — full 200-workflow suite (only on success of p0; can run in parallel matrix)
  - `knip` — orphan detection (W05 input)
  - `dep-cruiser` — boundary violations (W05 input)
- Report: fail → Telegram alert (optional, can defer to W20)

**In — GH Actions infrastructure**:
- Secrets: `SUPABASE_SERVICE_ROLE`, `TEST_USER_PASSWORD`, `NAS_SSH_KEY`, `GOOGLE_WORKSPACE_TOKEN`
- Test-data isolation: `is_test_data=true` filter (W01 decision)
- Cleanup job: nightly `DELETE FROM * WHERE is_test_data=true AND created_at < now() - interval '24h'`
- Concurrency control: cancel prior runs on new push to same branch

**Out:**
- PR-based gating (user pushes direct to main — not relevant)
- Branch protection rules (user is solo dev — self-enforce via hooks)
- Percy/Chromatic visual regression (separate workflow)
- Load testing
- Release tagging automation (manual for now)

## Timing / cost

| Gate | Tool | Runs | Time | Blocks? |
|---|---|---|---|---|
| Pre-commit | Husky + lint-staged | every `git commit` | ~10-30s | yes (locally) |
| Pre-push | Husky + Playwright P0 | every `git push` | ~5-8 min | yes (locally) |
| Post-push typecheck | GH Actions | every push to main | ~1-2 min | no — alerts |
| Post-push P0 | GH Actions | every push | ~8-10 min | no — alerts |
| Post-push full suite | GH Actions | every push (after P0) | ~20-30 min | no — alerts |
| Nightly full + extras | Mac Mini cron (W20) | 2am SGT | ~40 min | no — alerts |

## Dependencies

- **Hard**: W04 multi-tool harness; ≥1 P0 spec green (else pre-push has nothing to run)
- **Soft**: W20 watchdog for Telegram alerting (nice-to-have, not blocking)
- **Soft**: W05 drift detector for knip + dep-cruise integration

## Implementation sequence

1. Install Husky + lint-staged
2. Add `.husky/pre-commit` with tsc + lint-staged
3. Add `.husky/pre-push` with full tsc + ESLint (Playwright step comes after W04)
4. After WF-0001 green → add Playwright P0 grep to pre-push
5. Write `.github/workflows/ci.yml` — start with just typecheck + lint
6. Add Playwright P0 job once CI secrets are configured
7. Add full-suite job as matrix after P0 stable
8. Document bypass convention: `--no-verify` only for emergencies, log in SESSION_NOTES

## Guardrails

- **No skip-hooks by default**: `HUSKY=0` env var not to be set in the repo; only per-invocation `--no-verify`
- **CI secrets never logged** — use GH Actions secret masking
- **Test-data cleanup is idempotent** — running cleanup twice never breaks anything
- **Pre-push time budget**: P0 suite must stay under 10 min total, else devs bypass constantly

## Done-when

- Pre-commit hook blocks broken commits (proven by intentional break)
- Pre-push hook blocks red Playwright push (proven by intentional break)
- `.github/workflows/ci.yml` runs on push, blocks nothing but reports status
- At least one full cycle observed: green P0 → green CI → merge to main
- Ledger header `Last CI green` field updates on CI success
- Telegram alert fires on red (if W20 integration enabled) OR email fallback

## Anti-patterns

- ❌ Bypassing hooks "just this once" without logging — becomes habit
- ❌ Pre-push taking 20 min — devs will `--no-verify` every time
- ❌ CI secrets in repo config — always use GH Actions secrets
- ❌ Running full suite pre-push — pre-push is for P0 only

## Related

- [W03_04_EXECUTION_PROTOCOL.md](W03_04_EXECUTION_PROTOCOL.md) — Phase 8 context
- [W04_PLAYWRIGHT_SEATBELT.md](W04_PLAYWRIGHT_SEATBELT.md) — harness this enforces
- [W20_CRON_WATCHDOG.md](W20_CRON_WATCHDOG.md) — nightly full-suite + alerting
- [W05_DRIFT_DETECTOR.md](W05_DRIFT_DETECTOR.md) — knip + dep-cruise inputs
- [WORKFLOW_LEDGER.md](../ledgers/WORKFLOW_LEDGER.md) — what the gates enforce
- `feedback_no_pr_workflow.md` (user memory) — push-to-main preference

---

## 2026-06-01 update — 3-tier E2E model + Mac-Mini comprehensive runner

Supersedes the single-`@p0`-pre-push model above. The original body stays intact as history; this section records the current shape.

### Pre-push gate: `@p0` → `@pushgate`

- Husky `.husky/pre-push` now runs `npm run test:e2e:pushgate` instead of the `@p0` grep.
- `@pushgate` is a **dedicated tag on 6 fast read-only specs** — split out because `@smoke` was already taken in this repo for heavier on-demand journeys, so it couldn't be reused for the fast gate.
- Static gates are **unchanged**: `tsc --noEmit` + ESLint (`--max-warnings`) + drift (knip/dep-cruiser) + build + LOC checks still run pre-push, and `SKIP_E2E=1 git push` still short-circuits **only** the Playwright step (static gates stay live).

### The 3 tiers

| Tier | Command | Scope | Where |
|---|---|---|---|
| Inner-loop | `test:e2e:failed` | `--last-failed` only | dev laptop, on demand |
| Push gate | `test:e2e:pushgate` | `@pushgate` — 6 fast read-only specs, ~3-5 min | husky pre-push |
| Comprehensive | `test:e2e:comprehensive` | `playwright.comprehensive.config.ts` — both browsers, real NAS, all routes, traces on | Mac Mini (see below) |

### Comprehensive + self-heal runs LOCALLY on the Mac Mini — NOT GitHub Actions

- The comprehensive run is driven by the **cron-manager** (launchd) on the Mac Mini: **nightly 02:00 SGT + on-demand**. It is not a GitHub Actions workflow.
- `.github/workflows/seatbelt.yml` is **UNCHANGED** — it remains the ubuntu-latest push-smoke gate. The Mac-Mini runner is additive, not a replacement.
- **Self-heal**: on red, `scripts/ci/comprehensive-run.sh` (`SELF_HEAL=1`) launches a `claude -p` `/self-heal-e2e` loop → opens a fix branch → **ff-merges to `main` ONLY on full-suite green** (hard ceiling: ≤5 iterations / ≤240 min) → otherwise escalates to Telegram. `main` never receives a red commit.

### Cross-links

- [docs/06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md](../../../06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md) — launchd schedule + on-demand trigger + escalation
- [docs/05-implementation/active/SELF_HEALING_E2E_PIPELINE_PRD.md](../../../05-implementation/active/SELF_HEALING_E2E_PIPELINE_PRD.md) — self-heal loop design + ceilings + ff-merge gate
