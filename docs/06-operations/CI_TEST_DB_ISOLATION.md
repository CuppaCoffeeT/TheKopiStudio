# CI Test-DB Isolation — stop the E2E suite writing to production

**Status**: CODE COMPLETE, AWAITING FIRST CI RUN. All four remaining pieces are written; none
has ever been executed, because `supabase start` needs Docker and the authoring Mac has none.
The first `pull_request` / `workflow_dispatch` run on `worktree-ci-test-db-isolation` is the
first execution of any of it. **Last Updated**: 2026-08-13

## Progress — 2026-08-13

### Landed earlier (schema + seed)

- **`supabase/schema.sql`** — faithful prod public schema (15 tables, 15 functions, 48 RLS
  policies, 12 triggers) + the `on_auth_user_created` trigger. Obtained via `pg_dump` (brew
  `libpq`) over the **IPv4 session pooler** — the direct host `db.<ref>.supabase.co` is
  IPv6-only and would not resolve. Exact pooler host came from `supabase/.temp/pooler-url`:
  `aws-1-ap-southeast-2.pooler.supabase.com:5432`, user `postgres.<ref>`.
  **Now at `supabase/migrations/00000000000000_baseline_prod_schema.sql`** (see below).
- **`supabase/seed.sql`** — RBAC backbone (roles/modules/role_modules/rls_capabilities,
  verbatim) + the 8 legacy `results` fixtures (owner NULL, empty scoring jsonb).

### Landed this pass (the four remaining pieces)

| # | Change | Notes |
|---|---|---|
| 1 | `schema.sql` → `supabase/migrations/00000000000000_baseline_prod_schema.sql` | Version `00000000000000` so it always sorts first. Two edits to the dump: `CREATE SCHEMA public` → `IF NOT EXISTS` (local `public` already exists → aborts on statement 1), and a trailing `GRANT`/`ALTER DEFAULT PRIVILEGES` block (a native `pg_dump` carries no grants, and PostgREST reaches every table as `anon`/`authenticated`/`service_role`). |
| 1b | The 10 drifted migrations → `supabase/migrations/_archive/` | **Archived, not deleted** — code-hygiene keeps history. The CLI globs `migrations/*.sql` non-recursively, so nothing there is applied. Third defect found while doing it: the CLI parses the version as the digits before the FIRST `_`, so eight of the ten were all version `20260611` — a duplicate-version history, not merely a drifted one. |
| 2 | `supabase/config.toml` | `[auth.email] enable_confirmations = false` (**not** `[auth]` — that key does not exist there), explicit `[api]`/`[db]` ports, `major_version = 17` to match prod's 17.6, explicit `[db.seed]`, and studio/storage/realtime/analytics off. |
| 3 | `tests/setup/seed-auth-users.mjs` | Admin-API auth seeding + verification. |
| 4 | `.github/workflows/seatbelt.yml` | `supabase/setup-cli@v1` (pinned 2.114.0) → `supabase start` → export `supabase status -o env` → seed script → Playwright. Every GitHub secret dropped from the job. Timeout 20 → 35 min for the cold image pull; a `failure()` step dumps the container logs. |

### Gotchas found (all of them already baked into the files above)

- **`pg_dump` 18 emits `\restrict`/`\unrestrict`** psql meta-commands that the local Supabase
  **psql 17** container errors on — already stripped; strip from any future re-dump too.
- **Auth users are seeded via the admin API, not raw SQL** — `auth.users`/`auth.identities`
  inserts are gotrue-version-sensitive.
- **`results.user_id` FKs to `profiles`** (not `users`) — the "Bee zhen" reassignment targets a
  profiles row.
- **The role that RLS reads is in the JWT, not in `public.users`.** `has_capability()` and
  `is_super_admin()` both read `auth.jwt()->'app_metadata'->>'role'`. Seeding `public.users.role`
  alone leaves every capability check failing closed — manager sees an empty book, and
  `view_all_clients` / `view_all_results` never engage. The seed script therefore sets
  **three** role surfaces: JWT `app_metadata.role`, `public.users.role`, and
  `public.profiles.role`.
- **`public.profiles.role` is its own contract.** `get_my_role()` reads it, and
  "Managers read all results/profiles" are written against `get_my_role() = 'manager'`. Its
  CHECK allows only `advisor|manager`, so **super_admin maps to `manager`** — the same mapping
  `supabase/functions/role-sync/index.ts` (v2) applies in prod. Get this wrong and
  results-superadmin.spec sees nothing.
- **The edge runtime must stay ON.** `manage-accounts.spec.ts` (@p0) drives the role round-trip
  through `/functions/v1/role-sync` from the UI *and* restores the advisor role in `afterAll`
  by POSTing that endpoint directly. Disabling `[edge_runtime]` 404s both.
- **`supabase status -o env` emits `KEY="value"`.** `$GITHUB_ENV` takes the line literally, so
  the quotes must be stripped or every value arrives wrapped in `"`.

### Still unvalidated — what the first CI run has to prove

Nothing below has ever run. In rough order of how likely it is to be what goes red first:

1. `supabase start` accepts this `config.toml` on CLI 2.114.0 (`major_version = 17`,
   `[db.seed]`, the four `enabled = false` service blocks).
2. The baseline migration applies clean under psql 17 — one bad statement aborts the whole file.
3. `seed.sql` applies after it (FK order, and that `public` grants really do reach PostgREST).
4. `seed-auth-users.mjs` — `createUser({ id })` is honoured, `handle_new_user()` fires, and the
   `protect_user_privileges` trigger admits the service-role UPDATE.
5. The suite itself. Only here are failures likely to be about the app rather than the harness.

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

## Historical (pre-dump blocker, resolved 2026-08-13)

> Kept verbatim: this is why the baseline exists at all, and the `--schema-only` /
> IPv6 / pooler-shard dead ends are recorded in the handoff's failure table.
> The dump has been taken; the baseline migration now carries the schema. The commands
> below are the re-dump recipe, and they still need a **fresh** DB password — the one
> used on 2026-08-13 was pasted in chat and must be treated as burned.

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

## File changes — as built (2026-08-13)

The plan called for four changes; all four are written. Deviations from the plan, and why:

| Planned | Built | Why it differs |
|---|---|---|
| `supabase/schema.sql` + `schema_auth.sql` | one `migrations/00000000000000_baseline_prod_schema.sql` | The auth-schema dump was never needed: the only auth-side object is the `on_auth_user_created` trigger, appended by hand to the public dump. |
| "squash OR keep and let `db reset` apply" | squash | Keeping both would have left the duplicate-version history in the apply path. |
| delete the 10 drifted migrations | move to `migrations/_archive/` | Same effect on the CLI (it globs non-recursively) without discarding history. |
| `[auth] enable_confirmations = false` | `[auth.email] enable_confirmations = false` | The key does not exist under `[auth]`. Doubled up with `email_confirm: true` per user in the seed script. |
| auth users seeded in `seed.sql` with `crypt()` | `tests/setup/seed-auth-users.mjs`, admin API | A hand-written `auth.users` INSERT is gotrue-version-fragile and silently yields accounts that cannot sign in. |
| the `env:` block gets hardcoded local JWTs | keys come from `supabase status -o env` | The demo JWTs are deterministic but version-dependent; reading them from the CLI cannot go stale. |
| `max-parallel` can go back up | still 1 | Deliberately deferred — one variable at a time. See the comment in the workflow. |

## Validation path (no local Docker in the authoring env)

The local stack cannot be exercised here, so validation is CI. `workflow_dispatch` on
`worktree-ci-test-db-isolation` is the cheapest loop (this repo ships direct to `main`, no
PRs). Iterate on `config.toml` / the baseline / `seed.sql` against the runner logs until
green. Do NOT merge to `main` until a run is green — a broken workflow on main blocks every
push.

**If you do install Docker**, the whole loop collapses to a local
`supabase db reset && node tests/setup/seed-auth-users.mjs`, which is worth doing before
burning many CI runs on it.

## Sequencing

1. ~~**[you]** run the dump commands → commit `supabase/schema.sql`.~~ **Done.**
2. ~~**[me]** `seed.sql` + `config.toml` + `seatbelt.yml` + squash migrations.~~ **Done.**
3. **[CI]** ← *you are here.* Dispatch the workflow on the branch; iterate to green.
4. **[you]** merge; then rotate/retire the now-unused prod E2E GitHub secrets
   (`VITE_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_KEY`, `TEST_*_PASSWORD` — the job reads none
   of them any more) and do a final prod residue clean, since CI stops adding to it from then
   on. The prod DB password used for the dump is burned (pasted in chat) — rotate it too.

## Related

- `docs/06-operations/PARALLEL_E2E_TESTING.md` · `tests/lessons.md` (shared-account races)
- `supabase/lessons.md` 2026-07-29 (free-tier no-backup; CI-writes-to-prod root cause)
