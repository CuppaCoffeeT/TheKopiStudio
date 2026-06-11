---
description: Execute a PRD end-to-end by delegating ALL execution to subagents — fanning out a workflow when work is parallel, a single agent when it isn't. The orchestrator plans, verifies, updates, commits, and resolves agents' questions; it never executes the work itself; it never stops until the PRD is fully delivered.
argument-hint: "<path-to-PRD.md>  (e.g. docs/05-implementation/active/MATERIAL_REQUESTS_PRD.md)"
allowed-tools: Workflow, Agent, Task, Bash, Read, Edit, Write, Grep, Glob, AskUserQuestion, mcp__supabase__apply_migration, mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__supabase__list_migrations, mcp__supabase__get_advisors, mcp__supabase__generate_typescript_types
---

# Execute PRD

Build the PRD at `$ARGUMENTS` to completion — production-ready, tested, documented — by **delegating all execution to subagents**: a workflow when work fans out, a single agent when it doesn't. The PRD is the contract; don't finish until it's met.

## Prime directive — you ORCHESTRATE, you don't execute

Tight PRD-driven loop:

> **read PRD → plan next slice → delegate it → verify reports vs gates → update PRD/docs line-by-line → commit the phase → re-read PRD for what's next → repeat.**

You hold only: PRD state, the plan, gate results, open questions. **Everything touching code/migrations/tests/research runs in a subagent — never your own hands.** This protects your context so you keep the whole module in your head across the build.

**Never stop until the PRD is 100% delivered.** Blocked or unsure → don't ask mid-flight, don't halt. Instead:
- *Best practice in THIS codebase?* → spawn a reader to digest `docs/` + the closest existing module, then proceed.
- *Example elsewhere?* → grep a sibling, copy its shape.
- *What breaks / edge case?* → spawn an adversarial agent before moving on.

Only genuinely user-owned, irreversible calls defer — batched up front (Stage 0) or written to the PRD's Open Questions and surfaced at the very end. Never a reason to stop.

## Two-level model — you plan, subagents execute

| Slice looks like… | Delegate as… |
|---|---|
| one small step (single migration, one fix, one reader) | **single agent** — no workflow |
| many independent units (one service/concern, one page/surface, one spec/story) | workflow, wide `pipeline`/`parallel` — one agent per unit |
| a stage needing ALL prior results (dedup, cross-file reconcile, "0 found → skip") | `parallel` **barrier**, then the next stage |
| output that can be subtly wrong (RLS, money, status transitions, migrations) | follow-on **adversarial verify** — N skeptics, majority-refute kills it |
| unknown-size discovery (edge cases, missing states, dead code) | **loop-until-dry** — fan finders until K dry rounds |

**Subagents are leaves — the `Agent` tool is withheld from them.** Every bit of parallelism, every verify pass, every retry loop lives in the script YOU write. Never tell an agent to "delegate further," "spin up helpers," or "coordinate a team." 12 files in parallel + a verify = 12 `agent()` calls + a verify stage in your script, not one agent managing 12.

**Cost lever:** route build/test/scaffold agents to a cheaper tier (per-`agent()` `model: 'sonnet'`, or `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6`); keep yourself + research-synthesis + gate-verification + completeness-critic on Opus. Gates catch deviations, so Sonnet leaves are safe — the cost is breadth, not depth.

## Non-negotiables

1. **Dedicated WORKTREE, never the shared checkout.** Stage 1 creates + enters a per-run worktree on `feat/<module>-prd-exec` off latest `origin/main`. **NEVER `git checkout`/`-b` in the current checkout** — it silently switches the branch out from under concurrent runs. A branch is not isolation; a separate working directory is. Orchestrator + every subagent + every commit happen inside this worktree. Never on `main`.
2. **Subagents NEVER run git** (commit/push/checkout/reset/stash/branch) — edit + `git mv` only. **You** are the sole committer — once per completed phase. (All subagents share the one worktree; a stray `git` clobbers it.)
3. **Worktrees isolate files/branches, NOT shared resources:**
   - **Prod DB** (`your-project-ref`): one DB for all runs. Migrations additive + non-overlapping (new tables/columns, namespaced); serialize the schema phase if two runs touch schema. **Top residual risk.**
   - **node_modules** (symlinked in): never `npm install`/`ci` mid-run — read-only scripts only (tsc/build/lint/test). A new dependency is a coordination point — flag it, don't silently install.
   - **Port 8080** (dev/Playwright): distinct `--port`/`PORT` per run, or serialize the build + e2e gate.
4. **Every phase ends green** on the 8-gate DoD (`docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md`): tsc 0 · lint ≤ cap · query-compliance · RLS · primitives-only · drift 0 net-new · LOC ratchet · `npm run build` passes.
5. **No hardcoded values, no test/placeholder/mock data, no TODO-left-behind, no commented-out dead code** in delivered work. Every agent prompt states this; the Stage-5 critic hunts violations.
6. **Update the PRD line-by-line, not just the header.** Per phase: flip `Status:` (⬜→🟡→✅), tick `- [ ]`→`- [x]`, append a dated Execution-Log entry, bump `Last Updated`. Sub-guides + sibling PRDs too — remove deprecated instructions, add newly-required ones.
7. **DB via Supabase MCP only** (`apply_migration`, project `your-project-ref`) + a matching committed `supabase/migrations/YYYYMMDD_HHMMSS_*.sql`. FKs → `public.users(id)`. RLS on every table (minimal authenticated + capability-gated writes via `has_capability()`). Pin `search_path` on SECURITY DEFINER fns. (Concurrency: see #3.)

---

## Stage 0 — Ingest (research already lives in the PRD)

The PRD's **🔎 Research findings** is your blast-radius map + precedent + verified facts — `/prd-write` ran the fan-out research; **do NOT re-run it.**

1. **Read the PRD fully** (`$ARGUMENTS`): users/roles, data model, status lifecycle, pages + archetypes, permissions matrix, phases, acceptance criteria, Research findings, Open Questions.
2. **Trust the findings; fill only genuine gaps.** A fact the build needs that's missing or looks stale (a table/route/capability the PRD didn't verify) → spawn a targeted reader to confirm it — not a full re-research. Refresh DB reality only where you'll write schema (`list_tables` on the exact tables you extend).
3. **Self-answer Open Questions** from the findings wherever a defensible best-practice answer exists; write the answer + rationale into the PRD (move Open Questions → a "Resolved Decisions" subsection).
4. **Batch the truly user-owned questions** (irreversible product/money/notification/retention calls research can't settle) and ask now via `AskUserQuestion`. Record answers in the PRD. User unavailable → safest reversible default, recorded as provisional, proceed.
5. Commit the PRD updates (decisions resolved). The only Stage-0 code-free commit.

## Stage 1 — Isolate (worktree), then scaffold

All work for this run lives in its own worktree — never the shared checkout. A branch alone isn't isolation. (Two runs sharing one checkout = the MATERIAL_INVENTORY incident: a branch silently switched, 55 files intermingled.)

1. **Create + enter the worktree off latest main, in one step** (you, not agents):
   - Prefer **`EnterWorktree({name: "<module>-prd-exec"})`** — creates the worktree, switches the session in, auto-cleans on exit.
   - Raw-git fallback: `git fetch origin` then `git worktree add ../wt-<module> -b feat/<module>-prd-exec origin/main`.
   - 🚫 NEVER `git checkout -b` in the current checkout.
2. **Wire the gitignored resources BEFORE `cd`-ing in** (so `git rev-parse --show-toplevel` still resolves to the main checkout). `node_modules` is gitignored → symlink, don't install (#3): `ln -s "$(git rev-parse --show-toplevel)/node_modules" <worktree>/node_modules`. Symlink `.env`/`.env.local`/`.env.secrets` if build/tests need them.
3. **Enter and stay.** Orchestrator + every subagent read/edit/gate ONLY here; you remain the sole committer.
4. **Brand-new module** → scaffold the canonical skeleton (reuse `/create-module`: `api/ components/ hooks/ pages/ lib/ types.ts index.ts CONTEXT.md` + lazy route stub + module-registration migration stub). Delegate to one agent; verify tsc 0.
5. Commit the scaffold.

## Stage 2 — Plan the build

Derive an explicit **sub-phased** plan from the PRD phases (hold it in head / a scratch `lib/NOTES.md`). Break each PRD phase into the smallest independently-verifiable, leaf-sized slices (one agent finishes without sub-delegating). Typical:

| PRD phase | Leaf slices |
|---|---|
| DB + RLS | migration (tables/enums/FKs) · RLS policies (per-role) · types regen |
| api/ + hooks | one service/concern (paginated `.range()`) · one hook/query+mutation (queryKeys + invalidation) |
| UI | each page (archetype + primitives) · each component · mobile · dark-mode · a11y |
| Route + registration | App.tsx lazy route · `modules`+`role_modules` rows · module-access wiring |
| E2E | one spec/story · re-run per role · load+a11y per page (Stage 4) |

## Stage 3 — Execute, phase by phase (the main loop)

Per PRD phase, **delegate — don't execute.** Pick the shape (§ Two-level model): a workflow when slices fan out (`pipeline` default; a `parallel` barrier only where a stage needs all prior; an adversarial-verify stage on anything subtly-wrong), a single agent when it's one thing. You author the script; agents are leaves. Runtime auto-throttles — pass all the work, it queues. Then:

1. **Collect** each report (what built, files touched, assumptions).
2. **Verify the gates yourself**: `npx tsc --noEmit` (0) · `npm run lint` · `npm run drift:check` · `npm run build` · `npm run loc:check` · the 5 primitive greps in the feature folder. Fail → spawn a fix agent (hand-patch only one-line obvious).
3. **Update the PRD**: phase `Status:` ✅, tick tasks, append an Execution-Log row (date · phase · what landed · agents), bump `Last Updated`.
4. **Commit** (you, once): `feat(<module>): <phase> — <summary>`.
5. **Re-read the PRD for what's next.** A new question → stuck protocol, keep going.

**Agent prompt template (every execution agent you spawn includes):**
> Working dir + branch. 🚫 NO git commit/push/checkout/reset/stash/branch — edit + `git mv` only; orchestrator commits. 🚫 You are a leaf — do NOT spawn or coordinate other agents; do only your slice. Import ONLY from `@/components/primitives/**` (+ sanctioned `ui/**`); no raw shadcn, no raw `<button>/<input>/<select>/<textarea>/<label>/<h1>`. Every `.select()` needs `.range()`/`.limit()`/`.single()`. Dates via `timezoneUtils`. Toasts via `showSuccess`/`showError`. queryKeys factory + invalidate `.all`+`.detail(id)`. RLS/FK rules. **No hardcoded values, no test/placeholder/mock data, no TODOs, no dead code.** Run `npx tsc --noEmit`, report the count. Return a concise plain-text report.

## Stage 4 — Comprehensive E2E (every button, every role)

Follow `docs/06-operations/PARALLEL_E2E_TESTING.md`. Derive the test matrix straight from the PRD:
- **one workflow spec per user story** under `tests/workflows/<module>/`, tagged `@p0` (+ `@mobile` on touch-first surfaces);
- **re-run each under every role** in the permissions matrix via `loginAs(<role>)` — allowed actions succeed AND forbidden actions are blocked (RLS + module-access negatives);
- **a Load + a11y spec per page** (mount + axe `wcag2aa`, zero critical/serious);
- **assert every button / field / status transition** — no happy-path-only.

Launch a test-authoring workflow (one agent per spec/role), then **you** run the suite (`npm run test:e2e:p0`, per-spec as needed). Each failure → triage (bug vs flake vs a11y) → fix agent next pass → re-run. **Iterate until green** — never declare done on red. Update the PRD test phase + acceptance checklist as specs pass.

## Stage 5 — Doc-sync & completeness critic

1. **Line-by-line doc pass** (run an agent, then review): re-read the PRD + every sub-guide it references end-to-end. Remove now-deprecated instructions, add newly-required ones, reconcile every marker with reality. The PRD must read as a true record, not a stale plan.
2. **Completeness critic** (adversarial): "What's missing? Any hardcoded value, placeholder/test data, unhandled error/loading/empty state, untested role, page without a11y, `.select()` without a bound, raw shadcn, dead code, TODO?" Findings → another Stage-3 loop. Don't skip the tail.
3. Update `features/<x>/CONTEXT.md` · `DOCUMENTATION_INDEX.md` · append decisions/lessons to the feature's `lib/decisions.md` / `lib/lessons.md`.

## Stage 6 — Land & report

1. **Final sweep yourself**: tsc 0 · lint · drift 0 · build pass · `@p0` green · `get_advisors` clean for new tables.
2. **Close out the PRD (MANDATORY when the DoD is green):**
   - Header `Status:` → `🟢 Complete`; every Progress-table phase ✅.
   - Final Execution-Log entry (gate scorecard + what shipped).
   - In `docs/05-implementation/active/` → `git mv` to `completed/`, then reconcile [DOCUMENTATION_INDEX.md](../../docs/DOCUMENTATION_INDEX.md) (relocate the row active/→completed/, fix path + status 🟢, bump active/completed counts) + the active count in [docs/05-implementation/CONTEXT.md](../../docs/05-implementation/CONTEXT.md). A non-`05-implementation/active` PRD → marked Complete in place.
   - A gate genuinely un-passable for an environmental reason (e.g. `@p0` infra-blocked, not a code regression) → do NOT silently mark complete; record the caveat in the Execution Log + final report, move the PRD only if the user accepts the deferral.
3. Commit + push the run's branch (from its worktree). **Do not merge to main** unless the user asked — open the branch for review / report it ready. Tear down: EnterWorktree auto-cleans on exit; a raw-git worktree needs `git worktree remove ../wt-<module>` after push.
4. **Final report**: what shipped, the gate scorecard, the E2E matrix result, that the PRD moved to `completed/`, and **any remaining Open Questions** (point to the PRD section). Flag any provisional default chosen for an unanswered question.

---

## Stuck protocol (use instead of stopping)

In order: (1) re-read the PRD slice; (2) reader agent digests the relevant `docs/` guide; (3) agent finds the closest module + mirrors it; (4) adversarial agent stress-tests the candidate; (5) still genuinely user-owned → write it to Open Questions, proceed with the safest reversible default. Blockers become PRD entries, not stop signs.

## 📚 Related

- `docs/06-operations/MODULE_CREATION_SOP.md` — the build sequence each phase follows
- `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md` — the 8-gate DoD + 5 greps every phase must pass
- `docs/06-operations/PARALLEL_E2E_TESTING.md` — the Stage 4 multi-role test model
- `.claude/commands/prd-write.md` — authors the PRD this command consumes; does ALL research up front
- `.claude/commands/create-module.md` — the Stage-1 scaffolder this command reuses
