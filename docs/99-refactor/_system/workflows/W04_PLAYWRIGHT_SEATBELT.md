# W04 — Playwright seatbelt harness

**Goal**: Stand up a **multi-tool evidence harness** (Playwright UI + Supabase DB + Synology NAS + Google Workspace Gmail + ghost-os desktop) verifying each workflow in [WORKFLOW_LEDGER.md](../ledgers/WORKFLOW_LEDGER.md). Each workflow only counts as "captured" when every applicable tool returns expected evidence. Paired with W03 — full pipeline spec at **[W03_04_EXECUTION_PROTOCOL.md](W03_04_EXECUTION_PROTOCOL.md)**.
**Tier**: Now (S2) · **Status**: 🟡 IN PROGRESS (UI + DB + NAS runners live; Gmail + ghost-os pending) · **Automation**: HITL capture → scripted spec + multi-tool post-check generation
**Blocked by**: W01 ✅ · **Blocks**: all W09 merges · W22 CI gates (needs ≥1 green spec)

## Phase 5 hardening backlog (Week 5, alongside X10 Path A baseline)

Deferred runner-quality work grouped for Week 5 execution — ships with the Supabase CLI exception + `pre-refactor-baseline` tag so that the "seatbelt + baseline" ship together.

1. **NAS runner flake hardening — WF-0019 root cause** (2026-04-19). `confirm-assign-ai` happy-path fails intermittently on `_pending/<ref>/` migration + `hardDeleteNasFolder` cleanup. Error class: Synology SMB code-119 / ENOTEMPTY. Already have 1s retry in `migratePendingFiles` (commit 4c2c00d); insufficient when SMB connection is cold. Actions:
   - Widen `tests/runners/nasChecks.ts` retry budget (3 attempts with 2s → 5s → 10s backoff) for `rmSync` + `existsSync` polling.
   - Audit `migratePendingFiles` in `src/services/quotationNASService.ts` — add the same retry to the rename step on code-119.
   - Re-add `@p0` tag to `WF-0019 · Confirm & Assign (AI-pending quotation)` describe block in `tests/workflows/quotation/confirm-assign-ai.spec.ts` once green 10 consecutive runs across both projects.
   - Current P0 push-gate subset: WF-0001 + WF-0012 + WF-9000 (3 describes → 6 test runs). WF-0019 still runs in the full local suite, just not in the push gate.
2. **Gmail runner** — lands with WF-0060 Submit NCE (first flow that emits an email side-effect).
3. **ghost-os runner** — lands when a desktop-app workflow first needs evidence (no P0 today).

## Why this exists

Current pattern: push → firefight. Refactor without tests amplifies this. The seatbelt inverts it — tests lock current behaviour, refactor changes internal structure, tests catch regressions before users do.

## Scope

**In:**
- `playwright.config.ts` with Chromium (desktop) + Mobile Safari profiles
- `storageState.json` auth flow for seeded admin test user
- Folder convention: `tests/workflows/<domain>/<workflow>.spec.ts`
- Page-object helpers in `tests/pom/` for form shells, data tables, nav
- CI wiring: PR-triggered, blocks merge on failure
- ≥1 test per W03 P0 workflow (target: 20 specs by W04 exit)
- Seeded fixtures prefixed `[test]`, cleaned in `afterAll`
- **Cache-staleness test (W21 gate)** — for every P0 module: open list → click into detail → edit → save → navigate back → assert new value visible **without refresh**. This test catches the "edit → back → stale → press F5" bug class.

**Out:**
- Visual regression (Percy/Chromatic — separate pass)
- Load testing
- End-to-end API contract tests

## Dependencies on other cards

- Needs W01 substrate (staging or live-DB read-mostly)
- Needs W03 P0 workflow list
- Blocks every W09 migration PR

## Open workflow questions

- **Q-W04-a** ✅ **LIVE-DB (2026-04-19)**. Use live-DB with `[test]`-prefixed rows + `is_test_data=true` + hard-delete + zero-residue assertion. Re-evaluate when W01 Path A ships Week 5.
- **Q-W04-b** ✅ **accepted**. Idempotent fixtures per run, `[test]` prefix, cleaned `afterAll`.
- **Q-W04-c** ✅ **GITHUB ACTIONS (2026-04-19)**. GH Actions post-push (no PR workflow — user pushes direct to main). W22 wires `.github/workflows/seatbelt.yml` to run on every push to main. Mac Mini nightly deferred.
- **Q-W04-d** ✅ confirmed with user. Any module missing cache-staleness test = not P0.

## Done-when

- `playwright.config.ts` exists with auth + mobile profiles
- `tests/workflows/` has ≥20 specs covering W03 P0
- CI blocks `main` merge on test failure
- One green run end-to-end documented
