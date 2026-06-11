# /self-heal-e2e — Autonomous fix orchestrator for a failed comprehensive E2E run

**Invoked head-less** by `scripts/ci/comprehensive-run.sh` (the Mac Mini nightly self-heal loop) via
`claude -p --permission-mode auto --output-format json`. The shell appends the current iteration
number, the fix branch name, and the list of failed specs below this file's content.

You are the **self-heal orchestrator**. The nightly comprehensive E2E suite (`@p0`, both browsers,
real NAS, all routes) went RED. Your job: **fix the root cause** so the failed specs pass, committing
on the fix branch the shell already created. The shell — NOT you — re-runs the suite and decides the
merge. Do exactly one iteration of fixing per invocation, then stop and return the JSON summary.

## 🔒 Hard rules (violating any of these is worse than failing to fix)

1. **Git is YOURS alone; sub-agents NEVER touch git.** You commit fixes with **explicit file lists**
   (`git add <path> <path> …`), **NEVER `git add -A` / `git add .`** (a stray add sweeps unrelated
   work). **One commit per iteration.** Do **NOT** create, switch, merge, rebase, or push branches —
   you are already on `auto-fix/<run-id>` and the shell owns branch lifecycle + the merge-on-green.
2. **Sub-agents are leaves with NO git.** Fan out **≤6–8 fix agents** (one per failed spec or tight
   cluster) via the Task/Workflow tooling. Each may use Read/Edit/Write/Grep/Glob/Bash(non-git) only.
   Tell every one: "🚫 NO git of any kind — edit + report only; the orchestrator commits." (A past
   24-agent run that let agents git **clobbered ~60% of fixes and jumped to main**.) Throttle 5–8 per
   wave — 16+ concurrent trips Anthropic 429.
3. **Scope = `tests/**` + `src/**` only.** **Never touch**: `supabase/**` (migrations / edge
   functions), `.env*` / any secret, `tests/**/fixtureLock*`, `tests/global-setup*` /
   `tests/global-teardown*` destructive logic, or `playwright*.config.ts` in a way that weakens the
   gate.
4. **Never "fix" a test by hiding it.** No deleting specs, no `.skip` / `.fixme` / `test.only`, no
   loosening an assertion to make red go green, no `SKIP_E2E`. If a spec is genuinely, provably
   obsolete, do NOT delete it — report it under `notes` as "needs human review" and leave it.
5. **No hardcoded values, placeholder/mock data, TODOs, or dead code** in any fix.
6. **Don't re-run the full suite or merge.** The shell re-runs `--last-failed` then a full `@p0`
   pass and merges only on a clean full run. Re-running here wastes the budget.

## ▶️ Procedure (one iteration)

1. **Read the failures.** For each failed spec listed below: open its Playwright **trace** under
   `test-results/` (and `test-results/parallel-results.json`), the spec file, and the implicated
   `src/**`. Identify the *root cause* — app regression vs. a legitimately stale expectation. NAS
   specs (WF-0012/0016/1001) touch the real Synology mount; a NAS failure is usually the edge
   function or folder lifecycle, not the test.
2. **Fan out fixers.** One Task/Workflow agent per spec/cluster, each with the guardrails above. Give
   each the spec path, the trace path, and the suspected root cause. Prefer fixing the **app** when
   the test correctly encodes intended behaviour.
3. **Collect + commit.** After agents return, review their edits, then **stage the explicit changed
   files** and make **one** commit: `fix(e2e): self-heal <run-id> iter <n> — <short summary>`.
   (Co-author trailer optional.) If no agent could fix anything, commit nothing and return
   `status: "unfixable"` — the shell detects the empty iteration and bails.
4. **Return JSON** (last thing you output — the health-checker contract):

```json
{
  "status": "fixed | partial | unfixable",
  "iteration": <n>,
  "fixedSpecs": ["tests/workflows/…"],
  "stillFailing": ["tests/workflows/…"],
  "filesChanged": ["src/…", "tests/…"],
  "commit": "<sha or ''>",
  "notes": "root causes + anything needing human review"
}
```

## 📚 Related
- `scripts/ci/comprehensive-run.sh` — the loop that drives this (branch · re-run · flake-bail · merge-on-green · escalate).
- `.claude/commands/write-workflow-test.md` — the diagnose→fix→re-run cadence this mirrors.
- `.claude/agents/health-checker.md` — the JSON `{status, …}` output contract.
- `docs/06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md` — how the nightly invokes this.
