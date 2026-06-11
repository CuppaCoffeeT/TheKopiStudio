---
description: Heavy git-sync + full parallel E2E loop. Commit everything, push to main origin, run the FULL Playwright suite (N parallel workers), root-cause every failure, fix, push again, and repeat until the whole suite is 100% green. Never stops mid-loop.
argument-hint: "[N]  — number of parallel Playwright workers (E2E_WORKERS). Asks if omitted; default 5."
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, AskUserQuestion, Workflow, Agent, mcp__supabase__list_migrations, mcp__supabase__apply_migration, mcp__supabase__execute_sql
---

# Git Full — commit · push main · full E2E · fix · repeat until 100% green

Heaviest git command. `/git-sync` pre-commit checks **plus** a self-healing loop: push to main origin, run the **full** parallel Playwright suite, root-cause every red, fix, re-push, re-run — until a clean run reports **0 failed**. Built on [docs/06-operations/PARALLEL_E2E_TESTING.md](../../docs/06-operations/PARALLEL_E2E_TESTING.md).

`N` = number of parallel Playwright **workers** (`E2E_WORKERS=N`), NOT Claude sub-agents. More workers = faster wall-clock (`≈ total ÷ N`), but **past the machine's performance-core count tests oversubscribe the CPU, time out, and produce false failures** — so cap N at perf-cores.

## Phase 0 — Worker count

- If `$ARGUMENTS` is a number, use it as `N`.
- Else ask (AskUserQuestion): **"How many parallel Playwright workers?"** — default **5**.
- Warn if `N` > performance-core count (`sysctl -n hw.perflevel0.physicalcpu`): false failures likely. Suggest 5–10.

## Phase 1 — Pre-commit checks (inherited from `/git-sync`)

1. **Migration check** — `mcp__supabase__list_migrations` vs local `supabase/migrations/`. Any local file not in the list = unexecuted → apply via MCP. Suspected duplicate → confirm with user before deleting.
2. **`/check-docs`** — doc-index health (broken links, unlisted files, wrong counts). Fix before committing.
3. **Edited `.md` review** — for staged `.md` files only, apply the `/check-docs` 4 criteria (inconsistencies · redundancy · clarity · up-to-dateness); append non-obvious lessons to the workspace `lessons.md`. Skip if no `.md` changed.
4. **Root temp cleanup** — delete any `tmpclaude-*` files in repo root before staging.
5. **CONTEXT.md freshness** — warn (don't block) if a modified folder's `CONTEXT.md` "Last Updated" is >30 days old.

## Phase 2 — Commit + push to main origin

6. `git pull --rebase` latest.
7. Stage changes, commit with a descriptive message (no approval wait — auto-memory `feedback_git_sync_no_approval`). Heed `feedback_concurrent_git_add_collision`: if parallel sessions may share this checkout, stage an explicit file list instead of `git add -A`.
8. **Push to `main` on origin.** Use `SKIP_E2E=1 git push origin <branch>:main` (or `git push` if already on `main`) — `SKIP_E2E=1` skips only the **redundant serial `@p0` pre-push gate**; **tsc + ESLint still run**. The full parallel suite in Phase 3 is the comprehensive arbiter, so the serial gate is wasted time inside this loop.
   - tsc/ESLint fail on push → fix root cause → recommit → repush. Don't bypass with `--no-verify`.

## Phase 3 — Full parallel E2E (the source of truth)

9. Run the **entire** suite (all specs, desktop + mobile, headless):
   ```bash
   E2E_WORKERS=N npx playwright test --config=playwright.parallel.config.ts
   ```
   The `setup` project signs in once per role → reuses `tests/.auth/<role>.json`, so in-spec logins are no-ops and parallelism is race-free.
10. Capture the run summary (passed / failed / flaky) and the failing spec list.

## Phase 4 — Triage + fix (only if any red)

11. For **each** failing spec, determine root cause before touching anything — classify, don't blanket-retry:
    | Symptom | Likely cause | Action |
    |---|---|---|
    | Many auth/redirect/401 at once | stale `tests/.auth/*.json` | `rm -rf tests/.auth` → re-run; only then treat survivors as real |
    | Random timeouts, pass on re-run | too many workers / CPU oversubscribed | lower `N`, re-run; not a code bug |
    | Deterministic assertion/element failure | **real prod bug or selector drift** | fix the product or the test at root cause |
    | `setup` "AIGENT_PASSWORD not set" / role password missing | secrets not loaded | source `/Volumes/YourVolume/.env.secrets` + repo `.env.secrets` (per-role keys) |
12. Fix **root causes**, not symptoms. **Never** `.skip` / `.fixme` / quarantine / loosen an assertion to force green without the user's explicit, named approval. A real prod bug surfaced by a test → fix the product code + log a lesson in the feature's `lessons.md` (rule: `lessons-logging.md`).
13. Many *distinct* failures across unrelated specs → fan out a `Workflow` (one agent per failure cluster: read spec + product code, return root cause + patch). **Workflow agents never run git** (`feedback_workflow_agents_no_git`) — orchestrator commits. Throttle 5–10/wave.
14. Re-run just the fixed specs to confirm local green, then continue.

## Phase 5 — Loop (do not stop)

15. Return to **Phase 2**: commit fixes → push → full suite. Repeat.
16. **Never stop, never ask "keep going?"** — multi-hour loops are accepted (`feedback_iterate_e2e_no_skip`). To survive across turns, keep the iteration as a standing goal (`/goals`, or `/loop` to re-fire) so it doesn't silently halt; if blocked on something only the user can unblock (missing secret, prod-data decision), say so explicitly and wait — otherwise keep working.

## Phase 6 — Done (gate)

17. Declare complete **only** when a **fresh full parallel run is 100% green** — `0 failed`, `0 flaky` that stays red on re-run. A run green only because tests were skipped/quarantined is NOT done.
18. Final summary: total specs, passed, duration, list of commits pushed, and any real prod bugs fixed (with the lessons logged).

## Guardrails

- **No green-by-skip.** Skipping/quarantining/weakening a test to pass needs explicit user approval (`code-hygiene` + W09 discipline).
- **Never commit `tests/.auth/`** — gitignored; holds live session tokens incl. a `super_admin` one. Never push secrets.
- **Data safety** — specs self-clean (timestamped names + teardown). Don't disable teardown; don't touch the shared seed fixture.
- **Push target** — main origin (no-PR direct-to-main, `feedback_no_pr_workflow`). On a feature branch, push `<branch>:main`.
- **Serial known-good fallback** — if the parallel run looks suspect, confirm with the serial gate config: `npm run test:e2e` (workers:1).

## 📚 Related

- [docs/06-operations/PARALLEL_E2E_TESTING.md](../../docs/06-operations/PARALLEL_E2E_TESTING.md) — parallel config, worker sizing, auth sessions, troubleshooting
- [git-sync.md](./git-sync.md) — pre-commit checks this command inherits · [git-quick.md](./git-quick.md) — bare commit+push
- `playwright.parallel.config.ts` · `tests/auth.setup.ts` · `tests/fixtures/roleAuth.ts`
