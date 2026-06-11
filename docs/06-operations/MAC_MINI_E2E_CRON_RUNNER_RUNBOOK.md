# Mac Mini E2E Cron Runner Runbook

**Created**: 2026-06-01 14:30:00 SGT
**Last Updated**: 2026-06-01 14:30:00 SGT
**Status**: 🟡 Transitional
**Priority**: 🟡 High

## 📋 Overview

Tier-3 comprehensive + self-heal E2E runner. Runs LOCALLY on the Mac Mini via the **cron-manager** (NOT GitHub Actions). Executes `scripts/ci/comprehensive-run.sh` nightly at 02:00 SGT + on-demand: both browsers, real NAS, all routes, traces on. Green → stamp ledger + Telegram. Red → `SELF_HEAL=1` runs the `/self-heal-e2e` fix loop; hand-runs default to report-only.

> Tier-3 = local cron-manager. `.github/workflows/seatbelt.yml` stays the **push-smoke** gate — this runner does NOT replace it.

Status 🟡: code shipped; provisioning + job registration are user-executed (steps below).

### Verified Mini facts (recon 2026-06-01)

| Fact | Value |
|---|---|
| SSH | `ssh youruser@your-mac-mini` (key auth) · host `JLs-Mac-mini.local` · macOS 15.2 · bash 3.2.57 |
| Local clone | `/Users/jlmac/repo/AppBase/trench-trace-portal-app` (local → execute-OK; NAS `/Volumes/*` blocks execute) |
| node | 25.8.2 at `/opt/homebrew/bin` (npm/npx symlinked) — **NOT** on login/launchd PATH |
| claude | `/Users/jlmac/.local/bin/claude` v2.1.126 · headless `claude -p` works under keychain/subscription auth · **no `ANTHROPIC_API_KEY`** |
| Mounts | `/Volumes/JLQI` + `/Volumes/YourVolume` mounted · reading needs **gui/501** TCC domain |
| Keep-awake | already ON (`pmset -g`: sleep 0 / displaysleep 0 / disksleep 0) |
| cron-manager | `http://localhost:8500/api/jobs` (LAN `http://cron.yourcompany.local`) |

⚠️ NEVER pass `claude --no-session-persistence` or `--bare` — both disable keychain reads → "Not logged in".

---

## 1. One-Time Provisioning (user-executed)

Run over `ssh youruser@your-mac-mini`. Clone is behind + bare; these close the gaps. Prepend `/opt/homebrew/bin` so node/npm/npx resolve.

```bash
export PATH=/opt/homebrew/bin:$PATH
cd /Users/jlmac/repo/AppBase/trench-trace-portal-app

# 1. update clone (behind origin/main)
git pull --ff-only origin main

# 2. node_modules MISSING → install
npm ci

# 3. WebKit MISSING (chromium present) — mobile-safari needs webkit
npx playwright install webkit chromium

# 4. secrets — a COMPLETE LOCAL .env.secrets in the clone is REQUIRED (gitignored).
#    ⚠️ The cron-manager process context CANNOT read /Volumes file *contents* (TCC /
#    Full-Disk-Access) even though `[ -d /Volumes/JLQI ]` stat passes — so the script's
#    `dd` from /Volumes/YourVolume/.env.secrets FAILS under cron (exit 2). The NAS file is
#    ALSO split: it holds AIGENT_USER_ID + TELEGRAM_BOT_TOKEN but NOT the per-role
#    TEST_* creds (those live only in the laptop's repo-local .env.secrets). Assemble a
#    complete local copy = laptop creds + the 2 NAS-only keys:
#      (from the laptop)  scp .env.secrets jlmac@<mini>:/tmp/laptop.env
#      (on the mini)      cp /tmp/laptop.env ~/repo/AppBase/trench-trace-portal-app/.env.secrets
#                         grep -E '^(AIGENT_USER_ID|TELEGRAM_BOT_TOKEN)=' /Volumes/YourVolume/.env.secrets \
#                           >> ~/repo/AppBase/trench-trace-portal-app/.env.secrets
#                         chmod 600 ~/repo/AppBase/trench-trace-portal-app/.env.secrets ; rm /tmp/laptop.env
#    Required keys (12): AIGENT_USER_ID/EMAIL/PASSWORD · SUPABASE_URL/KEY ·
#    TEST_{COORDINATOR,SUPERVISOR,STOREMAN}_{EMAIL,PASSWORD} · TELEGRAM_BOT_TOKEN.
grep -oE '^[A-Za-z_]+=' .env.secrets | sed 's/=//' | sort -u   # verify the 12 keys present

# 5. confirm clone .env carries VITE_* for the vite dev server
grep -E '^VITE_' .env

# 6. confirm mounts + keep-awake (already on)
ls /Volumes/JLQI /Volumes/YourVolume >/dev/null && echo "mounts OK"
pmset -g | grep -E 'sleep|SleepDisabled'
```

Required secret keys: `VITE_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_*KEY`, `AIGENT_*`, `TELEGRAM_BOT_TOKEN`.

---

## 2. Hand-Run First (no self-heal — report-only)

Validate end-to-end before scheduling. `SELF_HEAL` defaults **0** → no git, report-only.

```bash
ssh youruser@your-mac-mini
export PATH=/opt/homebrew/bin:$PATH
cd /Users/jlmac/repo/AppBase/trench-trace-portal-app
bash scripts/ci/comprehensive-run.sh
```

Confirm:

| Check | Expected |
|---|---|
| WF-0012 / WF-0016 | run — Synology folder create → assert → delete |
| Telegram | green/red message arrives (chat_id 226567913) |
| WF-1001 | self-skips unless `WF_1001_SUBJECT` seeded — **expected**, not a failure |
| Exit code | 0 green · 1 red |

---

## 3. Register the Cron-Manager Job (REST)

Run the curl over SSH. The `command` cd's to the clone, fast-forwards, exports `SELF_HEAL=1` + PATH, then runs the script. Wrapped in `/bin/bash -lc`. `telegram_notify:false` — the script sends its own richer Telegram.

```bash
ssh youruser@your-mac-mini
curl -s -X POST http://localhost:8500/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "appbase-nightly-e2e",
    "description": "Tier-3 comprehensive + self-heal E2E (both browsers, real NAS, all routes). Nightly 02:00 SGT.",
    "schedule": "0 2 * * *",
    "schedule_type": "calendar",
    "working_directory": "/Users/jlmac/repo/AppBase/trench-trace-portal-app",
    "task_type": "shell",
    "enabled": true,
    "telegram_notify": false,
    "command": "/bin/bash -lc '"'"'cd /Users/jlmac/repo/AppBase/trench-trace-portal-app && git pull --ff-only origin main && export SELF_HEAL=1 PATH=/opt/homebrew/bin:$PATH && bash scripts/ci/comprehensive-run.sh'"'"'"
  }'
```

Verify:

```bash
curl -s http://localhost:8500/api/jobs | grep appbase-nightly-e2e
```

Then confirm the row in the web UI (`http://cron.yourcompany.local`).

⚠️ **Schedule notes**
- `"0 2 * * *"` calendar cron works (proven by `wp-status-check`). For sub-hour intervals use `schedule_type:"interval"` with **seconds** — `*/N` cron is BROKEN under launchd.
- **Agent J 02:00 overlap**: if CPU contention appears, change schedule to `"30 2 * * *"`.

---

## 4. On-Demand `/run`

Trigger off-schedule without waiting for 02:00:

```bash
# via cron-manager run endpoint
curl -s -X POST http://localhost:8500/api/jobs/appbase-nightly-e2e/run
```

Or click **Run now** on the job row in the web UI.

**Logs**: `log()` writes to **stderr** → cron-manager captures it as the job log. Watch the job log pane in the UI, not stdout — `$(...)` command substitution in the script swallows stdout, so stdout is empty by design.

---

## 5. Self-Heal Dry-Run / Acceptance Tests (Phase-3 gates)

Run with `SELF_HEAL=1` against a scratch state, **revert after**. On red the script: branch `auto-fix/<run-id>` → `claude -p` `/self-heal-e2e` orchestrator → re-run → ff-merge-on-full-green → escalate. Bail bounds: **≤5 iterations / ≤240 min**.

> ⚠️ **Isolate first**: run every dry-run from a scratch branch (`git checkout -b dryrun-selfheal`), NOT `main`. A successful auto-fix ff-merges into the *base* branch (whatever HEAD was) — from a scratch branch that's the scratch branch, never real `main`. Delete it after: `git checkout main && git branch -D dryrun-selfheal`.

| # | Plant | Expected outcome |
|---|---|---|
| a | **Fixable** break — flip one spec assertion to a wrong value | auto-fix → full re-run green → ff-merge to `main` + ✅ Telegram |
| b | **Unfixable** break — assert against a route/element that cannot exist | ≤5-iter / ≤240-min bail · branch `auto-fix/<run-id>` pushed · 🔴 escalation Telegram · **`main` NOT merged** |
| c | **Flaky** spec — non-deterministic (e.g. uncontrolled timing) | no-progress bail · not thrashed across all 5 iterations |

Safe planting + revert:

```bash
export PATH=/opt/homebrew/bin:$PATH
cd /Users/jlmac/repo/AppBase/trench-trace-portal-app

# snapshot clean state first
git stash list; git status

# (a) plant a fixable assertion break in ONE spec, then:
SELF_HEAL=1 bash scripts/ci/comprehensive-run.sh

# revert any scratch edit + scratch branches after EACH test
git checkout -- .
git branch -D "$(git branch --list 'auto-fix/*')" 2>/dev/null || true
```

After (a) the self-heal may have ff-merged to `main` — confirm `git log` and reset the scratch commit if it was only a planted break.

---

## 6. Post-Reboot

`/Volumes` reads need the **gui/501** TCC domain. After a reboot, launchd jobs that read `/Volumes` fail silently until the plists are reloaded from an interactive SSH session.

```bash
ssh youruser@your-mac-mini   # interactive session = gui/501 context
launchctl load ~/Library/LaunchAgents/com.yourcompany.cron.appbase-nightly-e2e.plist
ls /Volumes/JLQI /Volumes/YourVolume >/dev/null && echo "mounts OK"
```

Re-verify mounts before the next scheduled run.

---

## 7. Register in External Service Docs (user, when live)

These live on the NAS — outside this repo. When the job goes live, add a row to:

- `/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/CONTEXT.md`
- the Mac Mini `SERVICE_REGISTRY.md`

(Do not edit those files from this repo — document the step only.)

---

## 8. Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `node: command not found` / npx fails | login/launchd PATH lacks node → prepend `PATH=/opt/homebrew/bin:$PATH` |
| Exit 2 "JLQI not mounted" | mount preflight failed → remount `/Volumes/JLQI` + gui/501 plist reload (§6) |
| Exit 2 "no local .env.secrets and dd from /Volumes/YourVolume/.env.secrets failed" | cron process can't read /Volumes file *contents* (TCC) → place a COMPLETE local `.env.secrets` per §1 step 4 (this is the required path, not the fallback) |
| Sign-in fails for non-admin roles | local `.env.secrets` missing the per-role `TEST_*` creds (NAS copy doesn't have them) → assemble per §1 step 4 |
| "Not logged in" (claude) | keychain locked, or `--no-session-persistence`/`--bare` was passed → unlock keychain; NEVER pass those flags |
| Telegram silent | `TELEGRAM_BOT_TOKEN` unset in env → add to `.env.secrets` (chat_id defaults 226567913) |
| webkit / mobile-safari errors | WebKit browser missing → `npx playwright install webkit` |
| cron-manager UI log empty | logs are on **stderr** (stdout swallowed by `$(...)`) → read the job's stderr pane |

---

## 📚 Related Documentation

- [scripts/ci/comprehensive-run.sh](../../scripts/ci/comprehensive-run.sh) - The Tier-3 runner script scheduled here
- [playwright.comprehensive.config.ts](../../playwright.comprehensive.config.ts) - Comprehensive config (both browsers, real NAS, all routes, traces)
- [.claude/commands/self-heal-e2e.md](../../.claude/commands/self-heal-e2e.md) - `/self-heal-e2e` autonomous fix orchestrator
- [PARALLEL_E2E_TESTING.md](./PARALLEL_E2E_TESTING.md) - Parallel E2E worker model + results JSON
- [SELF_HEALING_E2E_PIPELINE_PRD.md](../05-implementation/active/SELF_HEALING_E2E_PIPELINE_PRD.md) - PRD: pipeline design + acceptance gates
- [.github/workflows/seatbelt.yml](../../.github/workflows/seatbelt.yml) - Push-smoke gate (Tier-1, stays separate from this runner)
