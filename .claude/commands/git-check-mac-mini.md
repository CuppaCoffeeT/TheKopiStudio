# /git-check-mac-mini — Check the Mac Mini nightly E2E run + finish any escalated self-heal

**Run this (or just say "finish the escalated run" / "check the mac mini" / "did the nightly pass")** to pick up where the autonomous Mac-Mini E2E self-heal pipeline left off. A fresh Claude session needs no prior context — everything required is below.

## 📋 What this is

The Mac Mini runs a **nightly comprehensive E2E suite** (`appbase-nightly-e2e`, 02:00 SGT) with an autonomous `claude -p` **self-heal** loop:
- **All green** → it stamps the ledger, commits, and pushes; nothing to do.
- **Red but fixable** → it auto-fixes on a branch, re-runs, and **fast-forward-merges to `main`** once the full suite is green.
- **Red and NOT fully fixable within budget** (≤5 iterations / ≤240 min) → it **ESCALATES**: it commits the *partial* fixes to a branch **`auto-fix/<run-id>` and pushes that branch to GitHub**, **leaves `main` untouched (never a red commit)**, and sends a 🔴 Telegram.

**Escalation = "the AI did what it safely could and stopped; please finish it."** That is THIS skill. You finish the remaining failures and land everything on `main`.

## 🔑 Verified facts (use these exact values)

- **Mini SSH**: `ssh youruser@your-mac-mini` (key auth). For node/npx, prepend `export PATH=/opt/homebrew/bin:$HOME/.local/bin:$PATH`.
- **Mini clone** (a *clean CI checkout* — **push from HERE**, never a shared laptop checkout): `/Users/jlmac/repo/AppBase/trench-trace-portal-app`.
- **cron-manager** (on the Mini): job `appbase-nightly-e2e` · runs `/Users/jlmac/cron-manager/runs/appbase-nightly-e2e/<run-id>.json` · logs `/Users/jlmac/cron-manager/logs/appbase-nightly-e2e/<run-id>.log` · API `http://localhost:8500/api/jobs` · on-demand trigger `POST …/api/jobs/appbase-nightly-e2e/run`.
- Pipeline code: `scripts/ci/comprehensive-run.sh` · orchestrator skill `.claude/commands/self-heal-e2e.md` · runbook `docs/06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md`.
- Self-heal is bounded (≤5 iters / ≤240 min) and runs `SELF_HEAL=1 E2E_WORKERS=4`.

## ▶️ Steps

### 1. Find the latest run + its outcome (SSH the Mini)
```bash
ssh youruser@your-mac-mini 'RID=$(ls -t /Users/jlmac/cron-manager/runs/appbase-nightly-e2e/*.json | head -1); echo "run=$(basename $RID .json)"; cat "$RID"'
```
- `status: "completed"` / green → **report green, stop** (nothing escalated).
- `status: "running"` → **report in-progress**; optionally watch the log; don't start fixing yet.
- `status: "failed"` (escalated) → continue below.

### 2. Identify the remaining failures + the partial-fix branch
```bash
ssh youruser@your-mac-mini 'RID=<run-id>; LOG=/Users/jlmac/cron-manager/logs/appbase-nightly-e2e/$RID.log
  grep -E "entering self-heal|orchestrator exit|targeted GREEN|EXHAUSTED|ESCALATION|no progress|[0-9]+ failed|[0-9]+ passed \(" "$LOG" | tail -25
  grep -E "^\s+[0-9]+\) \[" "$LOG" | tail -10                 # the final failing spec lines
  tail -1200 "$LOG" | grep -E "✘|Error:|Expected:|Received:|Timed out|locator\(" | tail -30'   # the errors
git -C /Users/jlmac/repo/AppBase/trench-trace-portal-app ls-remote origin "auto-fix/*"   # the escalated branch(es)
```
Note the still-RED spec FILES + the latest `auto-fix/<run-id>` branch.

### 3. Review the partial fixes the self-heal already made
```bash
cd <your local repo>; git fetch origin -q
git diff origin/main...origin/auto-fix/<run-id> --stat
git diff origin/main...origin/auto-fix/<run-id> -- <each file>   # confirm SOUND (no weakened/skipped tests, no hacks)
```
Keep the sound ones; discard anything that weakened coverage.

### 4. Finish the remaining failures (the actual work)
For each still-red spec: read its Playwright **trace** (under the Mini's `test-results/`), the spec, and the implicated `src/**`. Fix the **ROOT CAUSE**:
- A spec that throws `"no … candidate found"` / depends on pre-existing prod data → make it **self-seed** its own data in a setup hook, run, then **hard-delete + assert zero residue** (mirror `tests/workflows/projectdetail/plan-purchase-checkbox-submit.spec.ts` WF-0434).
- A race/flake → add explicit waits (visible+enabled before click, DB poll), never a blind sleep.
- A real app bug → fix the component.
**Never** `.skip`/`.only`/loosen an assertion to make red go green. **Never** touch `supabase/**` migrations or `.env*`.

### 5. Verify against the real DB
```bash
npx playwright test <spec...>     # must pass on chromium-desktop AND mobile-safari
npx tsc --noEmit
```

### 6. Land on `main` — the CLEAN way ⚠️
**Check whether your local checkout is shared/dirty first:** `git status --short`. If it has unrelated uncommitted changes or unpushed commits from another session, **do NOT push from it** (you'll drag their work). Instead **push from the Mini's clean clone**:
```bash
git diff <base> <your-fix-commit> > /tmp/fix.patch        # just your changed files
scp /tmp/fix.patch youruser@your-mac-mini:/tmp/fix.patch
ssh youruser@your-mac-mini 'cd /Users/jlmac/repo/AppBase/trench-trace-portal-app; export PATH=/opt/homebrew/bin:$HOME/.local/bin:$PATH
  git fetch origin main -q && git reset --hard origin/main && git apply --check /tmp/fix.patch && git apply /tmp/fix.patch \
  && git add <files...> && git commit -m "fix(e2e): finish escalated run <run-id> — <summary>" && git push origin main'
```
(The Mini's pre-push gate validates on a clean tree.) If the local checkout IS clean, a normal local `git push origin main` is fine.

### 7. Clean up + report
```bash
git push --no-verify origin --delete auto-fix/<run-id>     # delete the merged escalation branch
```
Report: what the self-heal already fixed, what you finished, that it's on `main`, and that the next nightly will use it.

## 🔒 Hard rules
- `main` **never** receives a red/broken commit — push only after the affected specs pass.
- **Never** weaken/skip/`.only` a spec to fake green — fix the real cause (self-seed data · fix the app · kill a race).
- On a **shared laptop checkout**, never `reset`/rebase its history — push your fix from the Mini's **clean** clone (patch → apply → push).
- Mini `claude` auth = keychain/subscription; **never** pass `--no-session-persistence` or `--bare`.
- Re-enable / inspect the nightly via the cron-manager API or `http://cron.yourcompany.local`; the job command sets `SELF_HEAL=1 E2E_WORKERS=4`.

## 📚 Related
- `docs/06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md` — provisioning + dry-run + troubleshooting
- `scripts/ci/comprehensive-run.sh` — the runner + self-heal loop
- `.claude/commands/self-heal-e2e.md` — the autonomous fix-orchestrator the nightly invokes
- `docs/05-implementation/active/SELF_HEALING_E2E_PIPELINE_PRD.md` — full design
