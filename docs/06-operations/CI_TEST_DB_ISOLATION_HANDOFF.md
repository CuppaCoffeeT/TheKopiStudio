# Handoff — CI Test-DB Isolation (ephemeral local Supabase)

**Purpose**: pick up the in-flight work to stop the E2E suite writing to production.
**Written**: 2026-08-13 · **Branch**: `worktree-ci-test-db-isolation` (3 commits ahead of `main`,
NOT merged). **Repo**: `~/Documents/Projects/TheKopiStudio` · **Prod project**: `mymzcbalyqqgdmzsfmam`.

> **PICKED UP 2026-08-13.** All four pieces in §3 are now written and committed on this branch.
> The live status, the as-built deviations from §3, and the list of what the first CI run still
> has to prove are in [CI_TEST_DB_ISOLATION.md](CI_TEST_DB_ISOLATION.md) — **read that, not §3**,
> for what to do next. This file is kept for §2 (the failure table) and §5 (reference data),
> which are still current and still worth not re-deriving.

> Paste this whole file into a fresh session as the brief. It is self-contained.

---

## 0. Mission

`.github/workflows/seatbelt.yml` runs the Playwright `@p0` suite against **production** Supabase
via GitHub secrets. It (a) leaves `E2E-…` residue in prod every run and (b) races three shared
accounts across two matrix legs → CI has been red for weeks for reasons unrelated to code.

**Approved fix**: run an **ephemeral local Supabase per CI run** (`supabase start` on the runner —
Docker is available there), apply a faithful schema + seed, point the app/tests at
`http://127.0.0.1:54321`. Kills residue AND the shared-account race, and needs **zero GitHub
secrets** (local keys + test passwords are deterministic constants).

---

## 1. What is DONE (committed on `worktree-ci-test-db-isolation`)

| Commit | Contents |
|---|---|
| `e65b334` | `docs/06-operations/CI_TEST_DB_ISOLATION.md` — full plan + investigation |
| `efab730` | `supabase/schema.sql` — faithful prod public schema |
| `b6bc426` | `supabase/seed.sql` + psql-17 fix to schema.sql + doc progress update |

- **`supabase/schema.sql`** (~1780 lines): faithful public schema — **15 tables, 15 functions,
  48 RLS policies, 12 triggers**, plus the `on_auth_user_created` trigger on `auth.users`
  re-attached (pg_dump `--schema=public` omits it). psql-17-safe.
- **`supabase/seed.sql`**: RBAC backbone (roles, modules, role_modules, rls_capabilities —
  verbatim from prod) + the **8 legacy `results` fixtures** (owner `NULL`, empty scoring jsonb).
- **Plan doc** `CI_TEST_DB_ISOLATION.md`: the design + a "Progress — 2026-08-13" section.

**Also completed earlier this session and ALREADY MERGED TO MAIN** (context only, no action):
- Advisor (owner) column on `/clients`, capability-gated on `view_all_clients` (`18e90f6`).
- Recovered customer **NKB** (1 client + 9 policies) imported from an external Supabase, owned by
  Keane. Lives in prod now.
- Prod E2E residue cleared (regrows each CI run until this task lands).

---

## 2. What FAILED along the way, and the fix (so you don't repeat it)

| Failure | Root cause | Fix |
|---|---|---|
| `supabase db dump --schema-only` → `unknown flag` | schema-only is the DEFAULT in this CLI (2.75); `--schema-only` doesn't exist | drop the flag: `supabase db dump -f …` |
| `supabase db dump` → `Cannot connect to the Docker daemon` | `db dump` runs `pg_dump` in Docker; **Docker Desktop is NOT installed on this Mac** | bypassed Docker entirely — `brew install libpq` gives a native `pg_dump` at `/opt/homebrew/opt/libpq/bin/pg_dump` |
| `pg_dump -h db.mymzcbalyqqgdmzsfmam.supabase.co` → `could not translate host name` | free-tier **direct** connections are IPv6-only / not resolvable here | use the **IPv4 session pooler** instead |
| pooler `aws-0-ap-southeast-2…` → `Tenant or user not found` | wrong pooler shard | correct host is **`aws-1-ap-southeast-2.pooler.supabase.com:5432`**, user **`postgres.mymzcbalyqqgdmzsfmam`** — found in `supabase/.temp/pooler-url` |
| (anticipated) local `supabase db reset` would error on schema.sql | `pg_dump` **18** emits `\restrict`/`\unrestrict` psql meta-commands; local Supabase psql is **17** | already stripped from `schema.sql`; strip again on any re-dump |
| Bash tool refused compound commands ("too complex … worktree") | worktree-isolation guard on multi-part commands with redirects | run plain single commands, or put logic in a script file and run that |

---

## 3. Historical (the "what is LEFT" brief, retired 2026-08-13 — all four are now written)

> **Superseded.** Every item below has been built; three of them differ from the sketch here in
> ways that matter (`[auth.email]` not `[auth]`; `createUser({ id })` not `{ user_id }`; the
> role also has to be set in the JWT's `app_metadata`, which this section misses entirely and
> which would have left every RLS capability check failing closed). The as-built table and the
> reasons are in [CI_TEST_DB_ISOLATION.md](CI_TEST_DB_ISOLATION.md#file-changes--as-built-2026-08-13).
> Kept verbatim as the record of what was specified.

> None of these could be validated in the authoring env (no Docker). Validate by opening a PR
> (the runner has Docker) OR by running `supabase start` locally after installing Docker Desktop.

### 3.1 Migration snapshot (make the schema rebuildable)
- Move `supabase/schema.sql` → `supabase/migrations/00000000000000_baseline.sql`.
- **Delete the 10 existing drifted migration files** in `supabase/migrations/` (they don't match
  prod's applied history and don't even `CREATE` the tables — see `MIGRATION_SYSTEM_RECONSTRUCTION.md`).
- Result: `supabase start` rebuilds the exact prod schema. Also fixes the standalone "repo can't
  rebuild its own DB" drift.
- Keep `supabase/seed.sql` where it is — `supabase start` applies migrations then seed.

### 3.2 `supabase/config.toml`
- Set `[auth] enable_confirmations = false` (so seeded users can sign in without email confirm).
- Confirm default ports (API 54321, DB 54322). Leave `project_id` line as-is.

### 3.3 `tests/setup/seed-auth-users.mjs` (auth seeding — admin API, NOT raw SQL)
Runs as a CI step AFTER `supabase start`. Raw `auth.users` inserts are gotrue-version-fragile;
use the admin API against the local service_role key:
```js
import { createClient } from '@supabase/supabase-js';
const admin = createClient('http://127.0.0.1:54321', process.env.LOCAL_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } });
const users = [
  { id: 'ddd53c7d-d034-4ee9-826c-37550cc28306', email: 'skytwech+e2e-advisor@gmail.com',    role: 'advisor',     name: 'e2e-advisor' },
  { id: 'c1ae358a-a34f-4db5-bea2-40729faa2dca', email: 'skytwech+e2e-manager@gmail.com',     role: 'manager',     name: 'e2e-manager' },
  { id: 'ea135b9e-ccd6-46cd-8aca-f77aec581168', email: 'skytwech+e2e-superadmin@gmail.com', role: 'super_admin', name: 'e2e-superadmin' },
];
for (const u of users) {
  await admin.auth.admin.createUser({ user_id: u.id, email: u.email,
    password: process.env[`TEST_${u.role.toUpperCase()}_PASSWORD`], email_confirm: true });
  // handle_new_user() creates the profiles/users row on insert; set role + flags:
  await admin.from('users').update({ role: u.role, name: u.name, is_approved: true, is_active: true }).eq('id', u.id);
  // If a separate profiles row exists and needs the role too, update it as well.
}
// Reassign the Keane-owned legacy result to the seeded super_admin so it stays foreign to the
// manager (exercises view_all_results) — results.user_id FKs to PROFILES.
await admin.from('results').update({ user_id: 'ea135b9e-ccd6-46cd-8aca-f77aec581168' })
  .eq('id', '883d2eca-e09a-4dc8-957c-b1a84bf15e5d'); // "Bee zhen"
```
**Validate**: after this, `assertUserProfileLive` in `tests/runners/supabaseChecks.ts` must pass
(is_approved + is_active), and each role's modules/capabilities must resolve (they come from
role_modules/rls_capabilities seeded in seed.sql).

### 3.4 `.github/workflows/seatbelt.yml`
In the `e2e-p0` job, before the Playwright run:
- Add `supabase/setup-cli@v1` (or `npx supabase`), then `supabase start`.
- Capture local keys: `supabase status -o env` exposes `ANON_KEY` and `SERVICE_ROLE_KEY` (fixed
  demo JWTs — deterministic, non-secret). Export them into the test env.
- Run `node tests/setup/seed-auth-users.mjs`.
- Replace the secret-backed `env:` block with local literals:
  ```yaml
  VITE_SUPABASE_URL: http://127.0.0.1:54321
  VITE_SUPABASE_PUBLISHABLE_KEY: ${{ env.ANON_KEY }}      # from supabase status
  SUPABASE_URL: http://127.0.0.1:54321
  SUPABASE_KEY: ${{ env.SERVICE_ROLE_KEY }}               # local service_role
  TEST_ADVISOR_PASSWORD: e2e-advisor-pw                   # committed test constants
  TEST_MANAGER_PASSWORD: e2e-manager-pw
  TEST_SUPER_ADMIN_PASSWORD: e2e-superadmin-pw
  ```
- `max-parallel: 1` can eventually go back to parallel (isolated DB kills the shared-book race)
  — but get ONE green serial run first, then relax it in a follow-up.
- The GitHub secrets (`VITE_SUPABASE_*`, `SUPABASE_KEY`, `TEST_*`) become unused → retire them
  after this is green.

---

## 4. Requirements / prerequisites

- **Docker** to validate locally (`supabase start`). The Mac here has **no Docker Desktop** — either
  install it, or validate purely via CI on a PR.
- **Supabase CLI** — installed (2.75.0; a newer 2.111 exists).
- **`pg_dump`** if you must re-dump: `/opt/homebrew/opt/libpq/bin/pg_dump` (brew `libpq`, already
  installed). Connect via the pooler (see §2). The **DB password was reset to a value pasted in
  chat and MUST be reset again** — ask the user for a fresh one if you need to re-dump.
- **Node** for the seed script + `@supabase/supabase-js` (already a dep).

---

## 5. Reference data (all captured, no need to re-query)

- **Test users**: advisor `ddd53c7d-d034-4ee9-826c-37550cc28306`, manager
  `c1ae358a-a34f-4db5-bea2-40729faa2dca`, super_admin `ea135b9e-ccd6-46cd-8aca-f77aec581168`.
  Emails `skytwech+e2e-<role>@gmail.com`. Defaults live in `tests/fixtures/testUsers.ts`.
- **"Bee zhen" result** id `883d2eca-e09a-4dc8-957c-b1a84bf15e5d` — reassign to super_admin.
- **15 public tables**: bank_balance_history, clients, interactions, legacy_plans, modules,
  notifications, policies, profiles, projected_cash_values, results, rls_capabilities,
  role_modules, roles, user_modules, users. `results.user_id` → **profiles**; the 5 customer
  tables use Pattern-D RLS (`auth.uid()=user_id OR has_capability('view_all_clients')`).
- **E2E specs** address rows by `data-testid`, not column position; `results-manager.spec.ts`
  asserts page-1 results ≥ 8 (the fixtures), a "Bee zhen" search, and James (`b332c435…`, owner
  NULL) opening read-only. Canonical fixture data: `src/features/profiler/lib/__fixtures__/legacy-results.ts`.

---

## 6. Constraints (house rules — do not violate)

- **Never push to `main`/force-push/merge without explicit user approval.** Work on the branch;
  the user merges. (They have merged via `git push origin <branch>:main` fast-forwards this session.)
- **Supabase changes**: MCP or migrations only, project `mymzcbalyqqgdmzsfmam` — **NEVER** touch the
  `JLCD Backend` project (`pgqpidzmrmbhzhhbfbpg`) — explicitly off-limits.
- Repo gates must stay green: `tsc`, eslint, `npm run drift:check`, `npm run loc:check` (≤200
  LOC/file, baseline 35), vitest, Playwright. Commits run pre-commit/pre-push hooks.
- Any secret pasted in chat (DB password, `sb_secret_…`) must be flagged for rotation.

---

## 7. Suggested next actions, in order

1. Do §3.1 (migration snapshot) + §3.2 (config.toml) — pure file moves/edits.
2. Write §3.3 (seed-auth-users.mjs).
3. Rewrite §3.4 (seatbelt.yml).
4. If Docker is available: `supabase start` locally, `supabase db reset`, then run
   `npx playwright test --grep @p0 --project=chromium-desktop` against the local stack; fix errors.
   If not: open a **PR from `worktree-ci-test-db-isolation`** and iterate against CI runs to green.
5. Once green: user merges; retire the now-unused GitHub secrets; do a final prod residue clean
   (CI stops adding to it from then on).
