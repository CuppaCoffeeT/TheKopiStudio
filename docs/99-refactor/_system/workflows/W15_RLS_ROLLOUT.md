# W15 — RLS per-domain rollout (umbrella)

**Created**: 2026-04-16 SGT
**Last Updated**: 2026-04-19 SGT (eod+15)
**Status**: 🟡 IN PROGRESS — sub-cards W15.01/.03/.04/.05 🟢, W15.02 🟡 Part A shipped. Permissive-policy count 20 → 13. G4 `rls_restored` flips when W15.02 Part B lands.
**Priority**: 🔴 Critical

**Goal**: Replace permissive `USING(true)` policies across every domain table with real policies following the strategy decided in W14. Umbrella card — spawns one sub-card per domain.
**Tier**: Next · **Status**: 🔴 PLANNED · **Automation**: hybrid (SQL + manual review)
**Blocked by**: W14 (matrix + strategy) · **Blocks**: nothing individually, but gates G4 flag `rls_restored`

## Why this exists

This is the actual RLS work. One-shot attempts die — too big, too risky, too many test failures. The umbrella + sub-card pattern lets each domain land independently with its own test suite.

## Scope

**In (umbrella — spawns children after W14 lands):**
- One child card per HIGH→LOW risk domain: `W15.01_USERS_AND_PEOPLE_RLS.md`, `W15.02_PAYROLL_RLS.md`, `W15.03_SALARY_RLS.md`, …
- Per child card:
  1. Read matrix row for each table in the domain (from W14)
  2. Write real policies per strategy (capability-based by default) — SELECT / INSERT / UPDATE / DELETE × role
  3. Write a Playwright integration test — log in as each role, verify allowed/denied actions
  4. Deploy via Supabase MCP (or CLI per X10 exception if the migration needs it)
  5. Soak 24h; watch `agent_corrections` + Sentry-like logs for RLS-denied errors
  6. Remove the `TEMPORARY USING(true)` policy in the same migration
- Rollout order (from W14 HIGH-risk ranking): payroll → salary → users/people → projects → quotations → workers → logs/configs

**Out:**
- Changing the capability framework itself (W14 locks strategy)
- Auth provider changes
- MFA (W16)

## Child-card template stub

Each `W15.##_<DOMAIN>_RLS.md` contains:
- Target tables in the domain (from matrix)
- **Permissive policies replaced by this PR** — explicit list copied from `RLS_STATE_MATRIX.md` ledger (per Q-W14-d tracking system). Every line is a `(table, policyname)` tuple. PR must decrement the ledger in the same commit.
- Policy matrix (table × action × who can)
- Migration SQL draft — includes `DROP POLICY` for each permissive placeholder + `CREATE POLICY` real replacement
- Test plan (Playwright roles × actions) — forbidden combos expected to FAIL
- Rollback plan

### Permissive-policy ledger (the "don't forget any" guard)

Source of truth: `research/RLS_STATE_MATRIX.md` + live `pg_policies` table.

After every W15.## merge, two SQL queries MUST return zero (or justified exceptions documented inline):

```sql
-- 1. Any policy effectively open
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR qual IS NULL)
  AND (with_check = 'true' OR with_check IS NULL);

-- 2. Any table in public with RLS disabled
SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
```

G4 merge gate = both queries return `[]`. W20 Claude cron watchdog runs them every 2h once W15 starts rolling out.

## Dependencies on other cards

- W14 strategy + matrix — hard block
- W07 shared primitives — client code must not assume open DB (no hard-coded "role === admin" bypasses)
- W04 seatbelt — each domain's P0 workflows must stay green after policy swap

## Open workflow questions

- **Q-W15-a** ✅ Defaults accepted (user 2026-04-18) — **one PR per domain** (tables in same domain share policy logic; cleaner revert scope).
- **Q-W15-b** ✅ Defaults accepted — **yes, feature-flag each rollout** via `VITE_FF_RLS_<DOMAIN>_V2` so prod can fall back to permissive if a policy over-restricts.
- **Q-W15-c** ✅ Defaults accepted — **MCP by default, CLI only via X10 one-time exception** when migration needs it (e.g. role creation). Stays aligned with CLAUDE.md hard rule 4.
- **Q-W15-d** ✅ Defaults accepted — **1–2 domains per week** — test burden (Playwright RLS matrix per domain) is the limiter, not SQL authoring.

## Done-when

- Zero `USING(true) WITH CHECK(true)` policies remain in `public` schema
- Every table has a documented, tested real policy
- RLS integration tests cover every role × every domain in CI
- `RLS_STATE_MATRIX.md` updated to "ALL REAL"
- Sets DAG flag: **`rls_restored`** (gate G4)

## Related

- [W14_AUTH_RLS_AUDIT.md](W14_AUTH_RLS_AUDIT.md) — produces the input matrix
- [W07_SHARED_PRIMITIVES.md](W07_SHARED_PRIMITIVES.md) — client code respects RLS
- [`.claude/rules/rls-policy.md`](../../../../.claude/rules/rls-policy.md) — the rule this card enforces
