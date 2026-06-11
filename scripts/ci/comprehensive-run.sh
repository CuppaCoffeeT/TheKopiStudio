#!/usr/bin/env bash
#
# comprehensive-run.sh — local orchestrator for the Mac Mini nightly + on-demand
# COMPREHENSIVE E2E run: @p0 across BOTH browsers (chromium-desktop + mobile-safari),
# the REAL NAS (mounted /Volumes/JLQI), and ALL routes (no SMOKE_MAX_ROUTES cap).
#
# Runs on the Mac Mini, FROM THE LOCAL CLONE — never from /Volumes (execute is
# blocked there by the TCC/exec policy). Playwright auto-starts the dev server via
# the inherited webServer block, so this script must NOT start/stop a server itself.
#
# BINDING gotchas (learned the hard way — do NOT "simplify" these away):
#   - log() ALWAYS writes to stderr: cron-manager tees stdout only, and $(...)
#     command-substitution swallows stdout, so any log on stdout would vanish.
#   - MOUNT PREFLIGHT runs BEFORE any sign-in / suite work: if /Volumes/JLQI is not
#     mounted the 3 NAS specs (WF-0012, WF-0016, WF-1001) would SILENTLY skip and a
#     red NAS regression would masquerade as green. Fail loud, abort.
#   - ENV: load secrets from a LOCAL .env.secrets, else `dd` the file off the NAS
#     (NOT cp/source on /Volumes — sourcing/copying straight off the mount is flaky
#     under the gui/501 TCC domain; dd to a local temp file is reliable).
#   - Reading /Volumes needs the gui/501 TCC domain (cron-manager launches the job
#     in that domain); a bare root/launchd context cannot see the mounts.
#
# Pipeline parses test-results/parallel-results.json via scripts/ci/parse-pw-results.mjs.
# Runbook: docs/06-operations/MAC_MINI_E2E_CRON_RUNNER_RUNBOOK.md
#
# Phase-1 v1: green path complete; red path = report + Telegram + exit 1 via
# handle_red(). Phase 3 replaces handle_red()'s body with the self-heal loop, so it
# is kept a clean standalone function.

set -uo pipefail

log() { echo "[comprehensive-run $(date '+%H:%M:%S')] $*" >&2; }

REPO_DIR="${REPO_DIR:-$PWD}"
cd "$REPO_DIR"
if [ ! -f package.json ]; then
  log "FATAL: $REPO_DIR has no package.json"
  exit 1
fi

# node/npx are NOT on the Mini's launchd/login PATH; Homebrew node lives in
# /opt/homebrew/bin (recon 2026-06-01). Prepend known bin dirs so npx/node resolve
# under launchd. bash 3.2-safe (no associative arrays).
for p in /opt/homebrew/bin /usr/local/bin; do
  case ":$PATH:" in
    *":$p:"*) ;;
    *) [ -d "$p" ] && PATH="$p:$PATH" ;;
  esac
done
export PATH

# Single-run guard — one comprehensive run at a time on this host.
LOCK="${TMPDIR:-/tmp}/appbase-comprehensive.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  log "another comprehensive run holds the lock — exiting"
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

notify_telegram() {
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
    log "TELEGRAM_BOT_TOKEN unset — skipping notify"
    return 0
  fi
  if curl -sS --max-time 20 \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode chat_id="${TELEGRAM_CHAT_ID:-226567913}" \
    --data-urlencode text="$1" >/dev/null 2>&1; then
    log "telegram sent → chat ${TELEGRAM_CHAT_ID:-226567913}"
  else
    log "telegram send failed"
  fi
}

# MOUNT PREFLIGHT — fail loud BEFORE anything touches the suite.
if [ ! -d /Volumes/JLQI ]; then
  log "FATAL: /Volumes/JLQI not mounted — the 3 NAS specs would silently skip"
  notify_telegram "🔴 AppBase comprehensive E2E ABORTED: /Volumes/JLQI not mounted on the Mini."
  exit 2
fi

# ENV — prefer a LOCAL .env.secrets; else dd the file off the NAS to a local temp.
if [ -f "$REPO_DIR/.env.secrets" ]; then
  SECRETS="$REPO_DIR/.env.secrets"
else
  SECRETS="${TMPDIR:-/tmp}/appbase-e2e.env"
  dd if=/Volumes/YourVolume/.env.secrets of="$SECRETS" bs=64k 2>/dev/null || {
    log "FATAL: no local .env.secrets and dd from /Volumes/YourVolume/.env.secrets failed"
    notify_telegram "🔴 AppBase comprehensive E2E ABORTED: secrets unavailable."
    exit 2
  }
fi
set -a
# shellcheck disable=SC1090
. "$SECRETS"
set +a

# Force LOCAL behaviour: trace off-CI defaults + all 50 routes (no smoke cap).
unset CI
unset SMOKE_MAX_ROUTES
export E2E_WORKERS="${E2E_WORKERS:-6}"

# --- self-heal config (Phase 3) ---------------------------------------------
# SELF_HEAL is OFF by default — a hand-run (laptop/Mini) must NOT auto-branch /
# commit / merge / push. The nightly cron job opts IN with SELF_HEAL=1.
SELF_HEAL="${SELF_HEAL:-0}"
RUN_ID="${RUN_ID:-$(date '+%Y%m%d-%H%M%S')-comprehensive}"
SELF_HEAL_MAX_ITERS="${SELF_HEAL_MAX_ITERS:-5}"              # hard cap: iterations
SELF_HEAL_MAX_WALL_SECONDS="${SELF_HEAL_MAX_WALL_SECONDS:-14400}"  # hard cap: 240 min (2am→6am)
SELF_HEAL_CLAUDE_TIMEOUT="${SELF_HEAL_CLAUDE_TIMEOUT:-3000}" # per-iter claude -p timeout: 50 min
SELF_HEAL_MODEL="${SELF_HEAL_MODEL:-opus}"
SKILL_FILE=".claude/commands/self-heal-e2e.md"

RESULTS="test-results/parallel-results.json"
rm -f "$RESULTS"

log "running comprehensive @p0 (both browsers, real NAS, all routes, workers=$E2E_WORKERS)…"
npx playwright test --config=playwright.comprehensive.config.ts --grep @p0
PW_EXIT=$?
log "playwright exit=$PW_EXIT"

VERDICT="$(node scripts/ci/parse-pw-results.mjs "$RESULTS" verdict)"
FAILED="$(node scripts/ci/parse-pw-results.mjs "$RESULTS" failed)"

# Defensive cross-check: Playwright exited non-zero but the parsed verdict says
# green (e.g. a global-teardown/infra error AFTER tests passed, or a stale JSON).
# Never claim green in that case — downgrade to red so the run is investigated.
if [ "$PW_EXIT" -ne 0 ] && [ "$VERDICT" = "green" ]; then
  log "playwright exit=$PW_EXIT despite green verdict — downgrading to red"
  VERDICT="red"
  FAILED="$(printf '%s\n%s' "${FAILED:-}" "(playwright exited $PW_EXIT — see test-results/)")"
fi

# Stamp the comprehensive-green line in WORKFLOW_LEDGER.md AND commit+push it.
# Gated on SELF_HEAL=1: a hand-run (SELF_HEAL=0) writes NOTHING — an uncommitted
# ledger edit would dirty the tree and break the next nightly's `git pull --ff-only`
# (self-poisoning). The nightly owns git, so it commits the stamp (explicit file,
# [skip ci]) and pushes. All failures are non-fatal — the suite was already green.
stamp_green() {
  if [ "$SELF_HEAL" != "1" ]; then
    log "ledger stamp skipped (SELF_HEAL=0 hand-run — no git, no dirty tree)"
    return 0
  fi
  local ledger="docs/99-refactor/_system/ledgers/WORKFLOW_LEDGER.md"
  node scripts/ci/update-ledger-green.mjs "$ledger" "$(date '+%Y-%m-%d')" "$1" \
    || { log "ledger update failed (non-fatal)"; return 0; }
  git add -- "$ledger" 2>/dev/null || { log "ledger git add failed (non-fatal)"; return 0; }
  if git diff --cached --quiet -- "$ledger" 2>/dev/null; then
    log "ledger unchanged — nothing to commit"; return 0
  fi
  git commit -q -m "chore(e2e): comprehensive green $(date '+%Y-%m-%d') [skip ci]" -- "$ledger" \
    2>/dev/null || { log "ledger commit failed (non-fatal)"; return 0; }
  git push origin "$(git rev-parse --abbrev-ref HEAD)" 2>/dev/null || log "ledger push failed (non-fatal)"
}

# Report-only red handler (SELF_HEAL=0 — hand-runs). No git, no auto-fix.
handle_red_report() {
  local failed="$1"
  log "RED — failed specs:"
  log "$failed"
  notify_telegram "🔴 AppBase comprehensive E2E RED $(date '+%Y-%m-%d %H:%M'). Failed: $(echo "$failed" | tr '\n' ' '). Traces under test-results/. (SELF_HEAL off — no auto-fix.)"
  exit 1
}

# Portable timeout: prefer gtimeout/timeout, else background + TERM/KILL.
run_with_timeout() {
  local secs="$1"; shift
  local tbin; tbin="$(command -v gtimeout 2>/dev/null || command -v timeout 2>/dev/null || true)"
  if [ -n "$tbin" ]; then "$tbin" "$secs" "$@"; return $?; fi
  "$@" <&0 &   # preserve caller stdin (bash sends background-job stdin to /dev/null otherwise)
  local pid=$!
  # On timeout, TERM the child + its direct children (claude spawns node), then KILL.
  # macOS bash 3.2 has no setsid, so reap one level via pkill -P rather than a pgid kill.
  ( sleep "$secs"; pkill -TERM -P "$pid" 2>/dev/null; kill -TERM "$pid" 2>/dev/null; \
    sleep 5; pkill -KILL -P "$pid" 2>/dev/null; kill -KILL "$pid" 2>/dev/null ) &
  local killer=$!
  wait "$pid" 2>/dev/null; local rc=$?
  kill -TERM "$killer" 2>/dev/null; wait "$killer" 2>/dev/null
  return "$rc"
}

# One round of fixing: a single `claude -p` orchestrator that fans out fix agents
# (Task/Workflow) and COMMITS explicit file lists on the current branch. The
# orchestrator must NOT create/switch/merge/push branches — the shell owns that.
# NB: NEVER --no-session-persistence / --bare (both disable keychain → "Not
# logged in" on the Mini's subscription auth). No --max-turns (absent in v2.1.126);
# the loop is bounded by the shell (iters + wall-clock + per-iter timeout).
run_claude_orchestrator() {
  local iter="$1" failed="$2" budget="${3:-$SELF_HEAL_CLAUDE_TIMEOUT}"
  if [ ! -f "$SKILL_FILE" ]; then
    log "FATAL: orchestrator skill $SKILL_FILE missing"; return 1
  fi
  local promptfile; promptfile="${TMPDIR:-/tmp}/appbase-selfheal-prompt.$$"
  {
    cat "$SKILL_FILE"
    printf '\n\n---\nIteration: %s of %s\nBranch (ALREADY checked out — do NOT create/switch/merge/push): auto-fix/%s\nFailed specs to fix this iteration:\n%s\n' \
      "$iter" "$SELF_HEAL_MAX_ITERS" "$RUN_ID" "$failed"
  } > "$promptfile"
  log "invoking claude -p orchestrator (iter $iter · model $SELF_HEAL_MODEL · timeout ${budget}s)…"
  # Prompt via STDIN, NOT a trailing positional arg: --add-dir is variadic
  # (<directories...>) and would swallow a prompt arg placed after it ("Input must be
  # provided…", exit 1). run_with_timeout preserves stdin into its background job (<&0),
  # so `< "$promptfile"` reaches claude. Verified end-to-end on the Mini 2026-06-01.
  run_with_timeout "$budget" \
    claude -p \
      --permission-mode auto \
      --output-format json \
      --model "$SELF_HEAL_MODEL" \
      --add-dir "$REPO_DIR" \
      < "$promptfile" >> "${TMPDIR:-/tmp}/appbase-selfheal-claude.$RUN_ID.log" 2>&1
  local rc=$?
  rm -f "$promptfile"
  log "claude -p orchestrator exit=$rc (iter $iter); log: ${TMPDIR:-/tmp}/appbase-selfheal-claude.$RUN_ID.log"
  return "$rc"
}

escalate_unfixable() {
  local branch="$1" base="$2"
  log "self-heal EXHAUSTED — leaving $branch for review; $base untouched"
  git push -u origin "$branch" 2>/dev/null || log "could not push $branch (review locally)"
  git checkout "$base" 2>/dev/null || true
  notify_telegram "🔴 AppBase self-heal ESCALATION $RUN_ID — could NOT auto-fix within ${SELF_HEAL_MAX_ITERS} iters / $((SELF_HEAL_MAX_WALL_SECONDS/60))min. Branch auto-fix/$RUN_ID pushed for review. Traces under test-results/. main NOT merged — it stays green."
  exit 1
}

# Fix branch is GREEN but the FF-merge/push lost a race (base advanced mid-run).
# Distinct from "unfixable" — the fix IS good; it just needs a manual merge.
escalate_merge_race() {
  local branch="$1" base="$2"
  log "fix branch GREEN but FF-merge/push to $base failed (base advanced) — leaving branch for manual merge"
  git push -u origin "$branch" 2>/dev/null || log "could not push $branch"
  git checkout "$base" 2>/dev/null || true
  notify_telegram "🟠 AppBase self-heal $RUN_ID: fix branch auto-fix/$RUN_ID is GREEN but FF-merge to $base failed ($base advanced during the run). Branch pushed — merge it manually. $base untouched."
  exit 1
}

# Infra abort (e.g. results JSON unreadable) — not an auto-fixable test failure.
escalate_infra() {
  local branch="$1" base="$2" reason="$3"
  log "self-heal infra abort: $reason"
  git push -u origin "$branch" 2>/dev/null || log "could not push $branch"
  git checkout "$base" 2>/dev/null || true
  notify_telegram "🔴 AppBase self-heal INFRA ABORT $RUN_ID: $reason. Branch auto-fix/$RUN_ID pushed. $base untouched."
  exit 1
}

# FF-merge the green fix branch → base + push. Only ever called after a FULL
# comprehensive re-run came back green (the hard invariant: main never red).
merge_and_push() {
  local branch="$1" base="$2"
  log "full suite GREEN — merging $branch → $base"
  git checkout "$base" || return 1
  git pull --ff-only origin "$base" 2>/dev/null || log "pull --ff-only noop/failed (continuing)"
  git merge --ff-only "$branch" || { log "FF-merge failed ($base advanced?)"; git checkout "$branch" 2>/dev/null; return 1; }
  if git push origin "$base"; then
    stamp_green "comprehensive @p0 green after self-heal ($RUN_ID)"
    notify_telegram "✅ AppBase self-heal SUCCEEDED $RUN_ID — auto-fixed + merged green to $base."
    git branch -d "$branch" 2>/dev/null || true
    return 0
  fi
  log "push rejected"; return 1
}

# Bounded fix loop. Branches off the current state, iterates fix→re-run, and only
# merges after a CLEAN FULL re-run. Bails on no-progress / cap exhaustion.
self_heal_loop() {
  log "RED — entering self-heal ($SELF_HEAL_MAX_ITERS iters max / $((SELF_HEAL_MAX_WALL_SECONDS/60)) min max)"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { log "not a git work tree — abort"; handle_red_report "$FAILED"; }
  local base branch deadline iter prev_failed rem failed verdict cb rv re fe fv
  base="$(git rev-parse --abbrev-ref HEAD)"
  branch="auto-fix/$RUN_ID"
  git checkout -b "$branch" 2>/dev/null || { log "could not create $branch"; handle_red_report "$FAILED"; }

  deadline=$(( $(date +%s) + SELF_HEAL_MAX_WALL_SECONDS ))
  iter=0; prev_failed=""
  # HARD wall-clock cap: every blocking op (claude + both playwright re-runs) is
  # wrapped in a timeout derived from the REMAINING budget, so the loop can never
  # run past `deadline` — not just check it between iterations.
  while [ "$iter" -lt "$SELF_HEAL_MAX_ITERS" ]; do
    rem=$(( deadline - $(date +%s) ))
    if [ "$rem" -le 60 ]; then log "wall-clock budget exhausted (${rem}s) — stop"; break; fi
    iter=$((iter + 1))

    failed="$(node scripts/ci/parse-pw-results.mjs "$RESULTS" failed)"
    verdict="$(node scripts/ci/parse-pw-results.mjs "$RESULTS" verdict)"
    if [ "$verdict" = "error" ]; then
      escalate_infra "$branch" "$base" "results JSON unreadable ($RESULTS)"
    fi
    if [ -z "$failed" ]; then log "no failed specs recorded — bail"; break; fi
    # No-progress / regression guard: identical failed set to last iter ⇒ stuck.
    if [ "$iter" -gt 1 ] && [ "$failed" = "$prev_failed" ]; then
      log "no progress vs previous iter — bail (not auto-fixable / flaky)"; break
    fi
    prev_failed="$failed"

    # claude budget = min(per-iter cap, remaining wall-clock).
    cb="$SELF_HEAL_CLAUDE_TIMEOUT"
    rem=$(( deadline - $(date +%s) )); [ "$rem" -lt "$cb" ] && cb="$rem"
    run_claude_orchestrator "$iter" "$failed" "$cb" || log "orchestrator nonzero (re-running anyway)"
    if [ -z "$(git rev-list "$base..$branch" 2>/dev/null)" ]; then
      log "orchestrator produced NO commits this iter — bail (cannot fix)"; break
    fi

    rem=$(( deadline - $(date +%s) ))
    if [ "$rem" -le 60 ]; then log "no budget for re-run — stop"; break; fi
    log "re-running --last-failed (iter $iter · ${rem}s budget)…"
    rm -f "$RESULTS"   # wipe so a timed-out re-run can't be read as a stale verdict
    run_with_timeout "$rem" npx playwright test --config=playwright.comprehensive.config.ts --last-failed
    re=$?
    rv="$(node scripts/ci/parse-pw-results.mjs "$RESULTS" verdict)"
    if [ "$re" -ne 0 ] && [ "$rv" = "green" ]; then rv="red"; fi   # killed/exit≠0 ⇒ not green
    if [ "$rv" != "green" ]; then log "targeted re-run still red / timed-out (iter $iter)"; continue; fi

    rem=$(( deadline - $(date +%s) ))
    if [ "$rem" -le 60 ]; then log "no budget for full re-run — escalate"; break; fi
    log "targeted GREEN — confirming with a full @p0 re-run (${rem}s budget · regression guard)…"
    rm -f "$RESULTS"   # wipe so a timed-out full re-run can't be read as a stale verdict
    run_with_timeout "$rem" npx playwright test --config=playwright.comprehensive.config.ts --grep @p0
    fe=$?
    fv="$(node scripts/ci/parse-pw-results.mjs "$RESULTS" verdict)"
    if [ "$fe" -ne 0 ] && [ "$fv" = "green" ]; then fv="red"; fi
    if [ "$fv" = "green" ]; then
      if merge_and_push "$branch" "$base"; then exit 0; else escalate_merge_race "$branch" "$base"; fi
    fi
    log "full re-run surfaced new failures — looping"
  done
  escalate_unfixable "$branch" "$base"
}

if [ "$VERDICT" = "green" ]; then
  log "GREEN"
  stamp_green "comprehensive @p0 green · both browsers · real NAS · all routes (workers=$E2E_WORKERS)"
  notify_telegram "✅ AppBase comprehensive E2E GREEN $(date '+%Y-%m-%d %H:%M') · both browsers · real NAS · all routes."
  exit 0
elif [ "$SELF_HEAL" = "1" ]; then
  self_heal_loop
else
  handle_red_report "$FAILED"
fi
