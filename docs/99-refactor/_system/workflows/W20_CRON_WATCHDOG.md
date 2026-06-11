# W20 — Claude-powered cron watchdog

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-16 SGT
**Status**: 🔵 Planning
**Priority**: 🟡 High

**Goal**: Register a Claude agent cron on Mac Mini (via [ADD_JOB.md](/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/ADD_JOB.md) REST API) that runs every 2h — audits docs, runs Playwright, auto-fixes low-risk drift, escalates high-risk via Telegram, keeps CONTEXT.md + decisions/lessons in sync.
**Tier**: Later · **Status**: 🔴 PLANNED · **Automation**: 🤖 auto (with HITL escalation)
**Blocked by**: W04 (tests), W10 (skills the agent calls), W18 + W19 (clean baseline) · **Blocks**: nothing — this is steady-state

## Why this exists

W18/W19 establish the clean context. Without W20 it rots in 2 weeks. This watchdog enforces continuously: docs stay clean, tests stay green, drift caught in hours not months. Delivers user's MWP vision: *"anyone can prompt, no drift"*.

## Scope

**In:**
- Shell pre-check wrapper per [ADD_JOB.md § Shell Pre-check Pattern](/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/ADD_JOB.md) — launch Claude only when work exists (saves Anthropic credits on idle runs)
- Claude agent per run checks:
  1. **Docs drift** — broken links, status-line mismatch, over-budget files per [TOKEN_BUDGET.md](../../99-meta/TOKEN_BUDGET.md) (from W19)
  2. **CONTEXT.md freshness** — CONTEXT.md timestamp vs newest sibling; flag if >7 days behind sibling changes
  3. **Playwright** — run W04 suite against staging (or live-DB read-only); report failures
  4. **Code drift** — dependency-cruiser violations, new `USING(true)` RLS, new raw `date-fns`, new hardcoded role checks, `ProjectDetailPage.tsx` line-count regression (post-W13)
  5. **Memory archive check** — flag `decisions.md` / `lessons.md` >50 entries for archive
- **Auto-fix LOW-risk** (whitelisted categories only):
  - Backlink repair (`Related Documentation` section sync)
  - DOCUMENTATION_INDEX sync (add/remove rows to match files)
  - `Last Updated` date on files whose content changed this week
  - Append `archive_pending` tag to `decisions.md` / `lessons.md` entries >6 months old
- **Escalate HIGH-risk via Telegram**:
  - Playwright failure
  - RLS violation (new `USING(true)` or new hardcoded role check)
  - `ProjectDetailPage.tsx` gaining lines again (post-W13)
  - Over-budget file that can't be trivially split
  - Any `.select()` without `.range/.limit/.single` (CLAUDE.md rule 4)

## W14 watchdog SQL (runs every 2h + on every W15.## merge)

Inherited from W14 Q-W14-d — the "don't forget any permissive policy" tracker.

```sql
-- Query 1: permissive policies still functionally no-RLS
-- Excludes 2 intentional keeps (rls_capabilities public lookup + service_role CRUD on worker_applications)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR qual IS NULL)
  AND (with_check = 'true' OR with_check IS NULL)
  AND policyname NOT IN (
    'Authenticated users can read rls_capabilities',
    'Service role can CRUD worker_applications'
  )
ORDER BY tablename, policyname;

-- Query 2: tables in public with RLS disabled entirely
SELECT n.nspname, c.relname
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
```

**Alert conditions**:
- Query 1 returns rows that are NEW since the last run → drift detected, alert (someone added a new permissive policy)
- Query 2 returns rows → serious, alert high-priority (table lost RLS entirely)
- Query 1 count stays flat over 7 days during an active W15 sub-card → W15 stalled, ping Telegram

**Baseline (2026-04-18 after W14 COMMENT ON POLICY migration)**: Query 1 = **20 rows**, Query 2 = **0 rows**. G4 clearance requires Query 1 → 0.

Watchdog writes the count to `SYSTEM_STATE.md` "Latest update" line or appends to a ledger file so the Refactor Dashboard can render the trend.
- **Weekly digest** appended to [`SYSTEM_STATE.md` recent-changes](../SYSTEM_STATE.md): what auto-fixed, what escalated, trend vs prior week

**Out:**
- Building new features (watches, doesn't add)
- Writing security patches (escalates; user writes them)
- Merging PRs (can comment, can't merge)
- Refactoring code (calls W10 skills if needed, doesn't improvise)

## Cron registration (via ADD_JOB.md REST API)

```bash
ssh youruser@your-mac-mini "curl -s -X POST http://localhost:8500/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    \"name\": \"appbase-refactor-watchdog\",
    \"description\": \"Audit AppBase docs + tests + code hygiene every 2h. Auto-fix low-risk, escalate high-risk to Telegram.\",
    \"schedule\": \"7200\",
    \"working_directory\": \"/Users/tanweijie/repo/AppBase/trench-trace-portal-app\",
    \"task_type\": \"shell\",
    \"command\": \"/bin/bash /Users/jlmac/scripts/appbase-refactor-watchdog.sh\",
    \"telegram_notify\": true,
    \"chat_id\": \"226567913\",
    \"enabled\": true
  }'"
```

Schedule `"7200"` = 2 hours. Shell wrapper pre-checks work; launches Claude agent only when drift/failures found.

## Dependencies on other cards

- W04 seatbelt — the Playwright suite this runs
- W10 scaffolding skills — `/check-docs`, `/code-hygiene` the agent invokes
- W18 + W19 — clean starting baseline (without these, watchdog drowns in noise)

## Open workflow questions

- **Q-W20-a** ✅ **2h during refactor, daily after stabilises (2026-04-19, default accepted)**.
- **Q-W20-b** ✅ **conservative initially, expand after 2 weeks clean (2026-04-19, default accepted)**.
- **Q-W20-c** ✅ **Telegram immediate + weekly digest in SYSTEM_STATE.md (2026-04-19, default accepted)**.
- **Q-W20-d** ✅ **NO cost ceiling (2026-04-19, OVERRIDE)**. User: "no need care about cost for now, we are using the claude max plan." Cron runs on Claude Max subscription (flat fee, no per-token billing). Re-evaluate if we switch to metered API.
- **Q-W20-e** ✅ **live-DB read-only + non-destructive `[test]`-prefixed writes (2026-04-19)**. Matches Q-W04-a answer (live-DB only, staging deferred to Week 5 Path A).

**Reference**: register the job via [CRON_MANAGER ADD_JOB.md](/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/ADD_JOB.md) REST API pattern on Mac Mini (per user 2026-04-19).

## Done-when

- Job registered + running
- First successful auto-fix (backlink repair or similar)
- First HIGH-risk escalation reaches Telegram
- Weekly digest appears in SYSTEM_STATE.md recent changes
- Cost trend within budget after 2 weeks
- Sets DAG flag: **`watchdog_live`** (gate G5)

## Related

- [ADD_JOB.md](/Volumes/YourVolume/JLCD_COMPANY/DEVELOPER/CRON_MANAGER/ADD_JOB.md) — REST API for cron registration
- [W04_PLAYWRIGHT_SEATBELT.md](W04_PLAYWRIGHT_SEATBELT.md) — test suite
- [W10_SCAFFOLDING_SKILLS.md](W10_SCAFFOLDING_SKILLS.md) — skills agent invokes
- [W18_DOCS_AUDIT.md](W18_DOCS_AUDIT.md) — baseline
- [W19_MWP_CONTEXT.md](W19_MWP_CONTEXT.md) — pattern enforced
