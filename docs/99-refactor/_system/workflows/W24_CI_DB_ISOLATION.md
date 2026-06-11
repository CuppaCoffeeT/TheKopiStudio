# W24 — CI database isolation (branch off prod)

**Created**: 2026-04-28 SGT
**Last Updated**: 2026-04-28 SGT
**Status**: 🔵 Planning — kicked off 2026-04-28; runway laid as Step 6 of the search-perf sweep
**Priority**: 🟡 High
**Tier**: Next (S3) · **Automation**: 🤖 scripted
**Blocked by**: nothing — search-perf indexes (W22 follow-up) already shipped; this is the durable fix
**Blocks**: zero-bypass CI runs · concurrent-job test isolation · realistic load testing

## 📋 Overview

CI tests, the AI-agent cron (every 60s), and live users all hit ONE Postgres database with an 8s `statement_timeout` ceiling on the `authenticated` role. Under load, ILIKE searches and large list joins time out (PG code 57014); PostgREST surfaces 500s; React Query renders empty lists; tests assert on data that exists but can't be retrieved. CLAUDE.md flagged this risk: *"Prod is the only DB; branching deferred to W5"*.

The 2026-04-28 trigram-index sweep removes the immediate trigger (seq scans on hot ILIKE columns), but the structural fix is to **branch CI off prod** — give tests their own Supabase project so they don't compete with prod cron + users for the 8s statement budget.

## What "branch CI off prod" means

Supabase provides **database branching** — `mcp__supabase__create_branch` forks the schema (no data) into a fresh project with its own `project_ref`. Cost: **$0.01344/hour ≈ $9.67/month** per persistent branch (org `ypruipavvddpywctvrkv`). The branch:
- Inherits all migrations from main
- Starts empty (`with_data: false` is the only mode for now — Supabase doesn't copy production rows)
- Has its own auth schema, its own service-role key, its own connection string
- Can be reset (`reset_branch`), rebased onto new main migrations (`rebase_branch`), or destroyed (`delete_branch`)

## Strategy options

| Option | Cost | Pros | Cons |
|---|---|---|---|
| **A. Single persistent test branch** | ~$10/mo | Always warm, no per-run setup, predictable | Stale data accumulates; needs `reset_branch` weekly |
| **B. Ephemeral per-PR branch** | ~$0.05 per PR | Clean slate per PR; matches PR review model | 2-3 min boot + migrate + seed delay; flaky on PR-open hooks |
| **C. Single shared "test" branch + CI-managed seeding** | ~$10/mo | Cheap; tests already isolate via `[test] WF-NNNN` prefix | Concurrent CI jobs still race on the same DB (smaller concern than prod) |

**Recommendation: Option C.** The trigram indexes already removed the immediate timeout cascade. Branching's primary remaining value is **isolation from the AI-agent cron + live users**, which a single shared test branch achieves at minimum cost. Per-PR ephemeral branches are nice-to-have — file as a separate W## later.

## Migration plan (sequential)

### Phase 1 — Seed inventory (no cost)
1. Walk every spec under `tests/workflows/` and extract every hardcoded UUID, email, and constant. Output: `tests/fixtures/SEED_REQUIREMENTS.md` listing what the branch must contain on day 1.
2. Build [`supabase/seed-test-fixtures.sql`](../../../supabase/seed-test-fixtures.sql) — idempotent INSERT … ON CONFLICT DO NOTHING. Stub committed 2026-04-28; flesh out as part of this card.

### Phase 2 — Branch creation (cost begins)
3. `mcp__supabase__get_cost(type='branch')` → confirm with user.
4. `mcp__supabase__create_branch(name='ci-test')`.
5. `mcp__supabase__list_migrations(<branch_project_ref>)` — verify all migrations from main applied cleanly.
6. Run `supabase/seed-test-fixtures.sql` against the branch via `apply_migration` (so it's tracked).
7. Re-create the Aigent test user via `auth.admin.createUser()` (auth schema is per-branch).

### Phase 3 — CI wiring (no rollout yet)
8. Add GitHub repo secrets: `BRANCH_SUPABASE_URL`, `BRANCH_SUPABASE_KEY`, `BRANCH_SUPABASE_PUBLISHABLE_KEY` (mirror of the prod three).
9. Update `.github/workflows/seatbelt.yml` matrix to include a `db: [prod, branch]` axis (defaults to `prod` so existing flow is unchanged).
10. Add `npm run test:e2e:p0:branch` script that exports the BRANCH_* vars over the SUPABASE_* names before running playwright.
11. Verify branch path passes the same @p0 suite locally before any GitHub Actions change.

### Phase 4 — Cutover
12. Flip the matrix default from `prod` → `branch`. Keep `prod` runnable on `workflow_dispatch` for one-off "does it really work in prod" sanity checks.
13. Document weekly `reset_branch` schedule (Sunday 03:00 SGT) so test residue from `[test] WF-NNNN%` cleanups doesn't accumulate.

### Phase 5 — Decommission cross-CI-job race workarounds
14. Roll back the project-name-prefix isolation hacks added in `b75ae416-followup` (`tests/workflows/clientprofiles/add-contact.spec.ts`, `tests/workflows/quotation/cache-staleness-edit-back.spec.ts`) once each project owns its own branch. They're defensive against shared-DB races; with isolation they're noise.

## Done-when

- [ ] `seed-test-fixtures.sql` runs idempotently on a fresh branch
- [ ] CI runs all @p0 specs against the branch in <8 min (matches current ceiling)
- [ ] AI-agent cron continues to run against prod only (no test data ever pollutes prod)
- [ ] Weekly reset job in place (cron in another project or GitHub Actions schedule)
- [ ] CLAUDE.md `# MCP` section updated to mention the branch project_ref

## Out of scope (file as follow-ups)

- Per-PR ephemeral branches (Strategy B above)
- Realistic-data branches (when Supabase ships `with_data: true`)
- Edge-function isolation — these still share prod deploys; `process-nas-operations` cron is fine to keep on prod since it doesn't touch test rows

## 📚 Related Documentation

- [W01_SUPABASE_BASELINE.md](./W01_SUPABASE_BASELINE.md) — original deferral note
- [W22_CI_GATES.md](./W22_CI_GATES.md) — pre-push hook + GitHub Actions gates that consume this
- [W04_PLAYWRIGHT_SEATBELT.md](./W04_PLAYWRIGHT_SEATBELT.md) — the test harness this isolates
- [supabase/seed-test-fixtures.sql](../../../supabase/seed-test-fixtures.sql) — the seed script (stub committed; complete in Phase 1)
- Trigger commit: `2026-04-28 fix(seatbelt) — search-perf trigram sweep` — recorded the timeout cascade that motivated this card
