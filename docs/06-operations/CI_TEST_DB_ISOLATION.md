# CI Test-DB Isolation — stop the E2E suite writing to production

**Status**: PLAN (approved direction: ephemeral local Supabase in CI). Blocked on one
user action — a prod schema dump. **Last Updated**: 2026-08-07

## The problem

`.github/workflows/seatbelt.yml` runs the Playwright `@p0` suite against a **live**
Supabase project. Its `env:` block feeds the runner GitHub secrets
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`
service-role, `TEST_{ADVISOR,MANAGER,SUPER_ADMIN}_PASSWORD`) that currently point at
**production** `mymzcbalyqqgdmzsfmam`. The suite signs in as three real accounts and
creates / mutates / deletes real rows every run. Two costs:

1. **Residue in prod.** Each run leaves `E2E-…`-named clients + child rows behind
   (dating back to 2026-06-12). It regrows after every cleanup — as of 2026-08-07,
   ~138 soft-deleted E2E clients had accumulated again.
2. **Flaky red CI.** Both matrix legs (chromium-desktop, mobile-safari) share ONE book
   and THREE accounts, so specs race each other — the `manage-accounts` role round-trip
   flips the shared `e2e-advisor` role while `results-advisor` asserts against it. This
   is why the suite has been red for weeks with failures unrelated to any code change.

## The fix: ephemeral local Supabase per CI run

Run `supabase start` on the runner (Docker is available on `ubuntu-latest`), apply the
schema + a committed `seed.sql`, and point the dev server + tests at the **local** stack
(`http://127.0.0.1:54321`). Each run gets a pristine, isolated database.

Why this over a second persistent test project:
- Kills the residue problem (throwaway DB) **and** the shared-account race (each run
  isolated) in one move.
- **Zero GitHub secrets.** Local Supabase's anon + service-role keys are fixed, public
  demo JWTs (identical for everyone), and the test-account passwords become committed
  non-secret constants. The whole `env:` block becomes literals.
- Costs nothing per run; nothing to maintain between runs.

## Blocker (needs the DB password — your one action)

The committed migrations have **drifted** from prod and cannot rebuild the schema:
prod's `supabase_migrations.schema_migrations` records **12** applied versions
(`20260320062304`, `20260611082914`, …) whose timestamps do **not** match the **10**
files in `supabase/migrations/` (earliest local `20260611_162101`). Most schema changes
were applied directly via MCP, so `supabase/migrations/` is not the applied history.
**The repo currently cannot reproduce its own 15-table schema** — a problem in its own
right, independent of CI.

So the schema must come from a faithful dump of prod, which needs the DB password (the
MCP has no dump primitive). Run this locally and hand back the file:

```bash
# from the repo root, links to prod then dumps the public schema only
supabase link --project-ref mymzcbalyqqgdmzsfmam      # prompts for the DB password
supabase db dump --schema-only -f supabase/schema.sql # roles/RLS/functions/triggers/tables
supabase db dump --schema-only --schema auth -f supabase/schema_auth.sql  # auth triggers (handle_new_user etc.)
```

That `schema.sql` becomes the canonical schema — either squashed into a single
replacement migration or applied by `db reset` before `seed.sql`.

## What the schema surfaced (why hand-reconstruction was rejected)

Details found during investigation that a hand-built schema would miss, and that the
dump captures for free:
- **15 public tables**: `bank_balance_history, clients, interactions, legacy_plans,
  modules, notifications, policies, profiles, projected_cash_values, results,
  rls_capabilities, role_modules, roles, user_modules, users`.
- There is BOTH a `users` and a `profiles` table; `results.user_id` FKs to **`profiles`**,
  and the auth `handle_new_user` trigger populates them on signup.
- `has_capability(text)` is `SECURITY DEFINER`, reading `auth.jwt()->'app_metadata'->>'role'`
  against `rls_capabilities`. RLS across the 5 customer tables is Pattern D
  (`auth.uid() = user_id OR has_capability('view_all_clients')`).

## Seed data (captured — schema-stable, ready for `seed.sql`)

RBAC backbone, with exact IDs so FKs line up:

- **roles** (5): advisor `f9903da3…`, management `e25228a3…`, manager `ee57f6eb…`,
  super_admin `a51f60a2…`, supervisor `8184ba29…`.
- **modules** (8): Dashboard `a82c0495…` `/dashboard`, Profiler `41be04d9…` `/profiler`,
  Results `036a27bc…` `/profiler-results`, CRM Dashboard `be6d5737…` `/crm`,
  Clients `b92df10c…` `/clients`, Portfolio Report `8339583f…` `/crm-reports`,
  Manage Accounts `694525f5…` `/manage-accounts`, Account Settings `d00ebd47…`
  `/account-settings`.
- **role_modules** (26 mappings), **rls_capabilities** (11) — captured verbatim; matrix:
  `view_all_clients` / `view_all_results` / `manage_accounts` → manager + super_admin;
  `admin` → management + super_admin; `field_or_above` → management + super_admin +
  supervisor.
- **user_modules**: 0 rows — no per-user overrides to reproduce.

Three test accounts (auth.users + profiles/users rows, `is_approved = is_active = true`,
email-confirm disabled locally so they can sign in):

| role | id | email | name |
|---|---|---|---|
| advisor | `ddd53c7d-d034-4ee9-826c-37550cc28306` | skytwech+e2e-advisor@gmail.com | e2e-advisor |
| manager | `c1ae358a-a34f-4db5-bea2-40729faa2dca` | skytwech+e2e-manager@gmail.com | e2e-manager |
| super_admin | `ea135b9e-ccd6-46cd-8aca-f77aec581168` | skytwech+e2e-superadmin@gmail.com | e2e-superadmin |

Eight legacy `results` fixtures — canonical copy already in-repo at
`src/features/profiler/lib/__fixtures__/legacy-results.ts` (`LEGACY_RESULTS`, byte-identical
to the pre-foundation snapshot). E2E asserts total ≥ 8, a "Bee zhen" search, and James
opening read-only. **Adaptation**: prod's "Bee zhen" is owned by Keane (`507f36ef…`, a real
user we will NOT seed); reassign it to the seeded super_admin so it stays foreign-to-manager
(still exercises `view_all_results`) without importing a real person. James stays
`user_id = NULL` (the unclaimed read-only case).

## File changes (once the schema lands)

1. `supabase/schema.sql` (+ `schema_auth.sql`) — from the dump. Squash `supabase/migrations/`
   into one canonical migration derived from it, OR keep and let `db reset` apply schema then
   seed. Squashing also fixes the standalone drift problem.
2. `supabase/config.toml` — set `[auth] enable_confirmations = false`, seed path, local ports.
3. `supabase/seed.sql` — RBAC (above) → auth users (3, `crypt()` passwords) → profiles/users
   rows → 8 results. **Validate on first `supabase start`**: the `auth.users`/`auth.identities`
   insert shape is CLI-version-sensitive and cannot be checked here (no Docker in the authoring
   env).
4. `.github/workflows/seatbelt.yml` — add a Supabase-CLI setup + `supabase start` step; replace
   the secret-backed `env:` with local literals:
   ```yaml
   VITE_SUPABASE_URL: http://127.0.0.1:54321
   VITE_SUPABASE_PUBLISHABLE_KEY: <fixed local anon JWT>
   SUPABASE_URL: http://127.0.0.1:54321
   SUPABASE_KEY: <fixed local service_role JWT>
   TEST_ADVISOR_PASSWORD: <committed test constant>   # + manager, super_admin
   ```
   Keep `max-parallel: 1`? With an isolated DB per leg the shared-book race is gone, so the two
   legs can run in parallel again — but confirm with one green serial run first, then relax.

## Validation path (no local Docker in the authoring env)

The local stack cannot be exercised here, so validation is: open a PR from
`worktree-ci-test-db-isolation`; the `pull_request` trigger runs the new workflow; iterate on
`seed.sql` / `config.toml` against the runner logs until green. Do NOT merge to main until a
run is green — a broken workflow on main blocks every push.

## Sequencing

1. **[you]** run the dump commands above → commit `supabase/schema.sql` (+ auth).
2. **[me]** write `seed.sql` + `config.toml` + the `seatbelt.yml` rewrite; squash migrations.
3. **[CI]** open PR → iterate to green.
4. **[you]** merge; then rotate/retire the now-unused prod E2E GitHub secrets and, once green,
   do a final prod residue clean — CI stops adding to it from then on.

## Related

- `docs/06-operations/PARALLEL_E2E_TESTING.md` · `tests/lessons.md` (shared-account races)
- `supabase/lessons.md` 2026-07-29 (free-tier no-backup; CI-writes-to-prod root cause)
