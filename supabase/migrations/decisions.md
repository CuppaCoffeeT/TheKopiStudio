# Migration Decisions Ledger

Dated, append-only record of deliberate schema/RLS decisions — especially anywhere
we extend or deviate from the sanctioned patterns in
[.claude/rules/rls-policy.md](../../.claude/rules/rls-policy.md). Newest entries last.

---

## 2026-06-11 — Pattern D: owner + capability read (CRM tables)

**Migration**: `20260611_164841_create_crm_tables.sql` ·
**PRD**: [docs/05-implementation/active/DATA_SPINE_PRD.md](../../docs/05-implementation/active/DATA_SPINE_PRD.md)

**Decision**: all 5 CRM tables (`clients`, `policies`, `projected_cash_values`,
`interactions`, `bank_balance_history`) use a fourth RLS shape — **Pattern D —
owner + capability read** — as a deliberate extension of the three sanctioned
patterns in `rls-policy.md`:

```sql
{table}_select:  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')))
{table}_insert:  WITH CHECK ((SELECT auth.uid()) = user_id)
{table}_update:  USING ((SELECT auth.uid()) = user_id)
{table}_delete:  USING ((SELECT auth.uid()) = user_id)
```

**Why none of the sanctioned patterns fits**:

- **Pattern A (minimal `USING (true)`)** — wrong for a multi-advisor book of
  business: any authenticated advisor could read/write every other advisor's
  clients. The data is sensitive PII + financials; app-layer-only gating is not
  acceptable here.
- **Pattern B (capability-only)** — gates by role tier but has no concept of row
  ownership, so it cannot express "an advisor sees only their own clients".
- **Pattern C (per-row owner)** — the rule file scopes owner predicates to
  `notifications` only, and it grants nothing beyond the owner, so a manager
  would see only their own rows.

**The requirement is the intersection**: the user explicitly mandated
*per-advisor book isolation* (advisors own their rows: `user_id = self` for all
CRUD) **and** *managers see everything* (manager + super_admin read all rows).
Pattern D composes C's owner predicate with B's capability check in the SELECT
policy only — writes remain owner-only (PRD Open Question #1: manager write
access was not requested; read-only is the default and is reversible later by
changing a single policy per table).

**Mechanics kept from the existing framework**:

- Read-all rides on the existing `public.has_capability()` framework via a new
  `view_all_clients` capability seeded for `manager` + `super_admin` (no
  hardcoded role lists in policies — the rule file's anti-pattern).
- Every function call is `(SELECT …)`-wrapped for the initplan optimization,
  exactly as Patterns B/C require.
- Policy names follow the `{table}_{cmd}` SOP convention.

**Scope**: Pattern D applies to the 5 CRM tables only. It does not change the
default guidance (Pattern A for non-sensitive tables, Pattern B for operational
tables, Pattern C for `notifications`), and it does not touch the legacy
`profiles`/`results` policies. The same shape is the intended template for the
profiler `results` cutover later (capability `view_all_results`, seeded now).

## 2026-06-11 — Users-table hardening (P2): per-command policies + privilege-guard trigger

**Migration**: `20260611_165020_harden_users_rls.sql`

**Problem**: the foundation migration's Pattern-A default left `public.users` with one
permissive policy (`"Authenticated can CRUD users"` USING(true) WITH CHECK(true)).
Any authenticated user could UPDATE any row — including `role`, `is_approved`,
`is_active` — and `get_user_modules()` / approval gating read those columns, so this
was a live self-privilege-escalation hole.

**Decision — two layers, because RLS alone cannot close it**:
1. Per-command policies (`{table}_{cmd}` naming): `users_select` stays USING(true)
   (user names are needed app-wide); `users_update` is self-only
   (`(SELECT auth.uid()) = id` in USING and WITH CHECK); `users_insert` /
   `users_delete` require `(SELECT public.is_super_admin())`.
2. RLS is row-level only — a self-row UPDATE is legitimate, so a user could still
   flip their OWN `role`. A `BEFORE UPDATE` trigger
   (`public.protect_user_privileges()`, SECURITY DEFINER, `search_path = ''`)
   raises `42501` when any of `role` / `is_approved` / `is_active` / `is_deleted`
   changes, unless the caller is one of three sanctioned classes:
   - `request.jwt.claims` unset/empty (`NULLIF(current_setting(…, true), '') IS NULL`)
     → direct postgres / migration sessions;
   - claims `role = 'service_role'` → the role-sync edge function's service-role
     client (Open Question #6: Supabase DOES set claims for service-role REST calls,
     so an absent-claims check alone would have blocked role-sync);
   - `public.is_super_admin()` → super_admin end-user JWT.
   Plain column updates (name, phone, …) are unaffected for every caller.

**Deliberately preserved**: `handle_new_user()` signup inserts still work — the
function is SECURITY DEFINER owned by postgres (table owner bypasses RLS, and the
guard is UPDATE-only); no `FORCE ROW LEVEL SECURITY` was added for exactly this
reason. Promote/demote/approve for OTHER users flows through the role-sync edge
function (service role), not direct client UPDATEs — `users_update` being self-only
encodes that.

---

## 2026-08-13 — Squash to a baseline migration; archive the 10 drifted files

**Decision**: `supabase/migrations/` now holds exactly one applied file,
`00000000000000_baseline_prod_schema.sql` — the faithful `pg_dump` of prod's public
schema (15 tables, 15 functions, 48 RLS policies, 12 triggers) plus the
`on_auth_user_created` trigger on `auth.users`. The 10 previous files moved verbatim to
`_archive/`, which the CLI never globs.

**Why**: they could not rebuild the database. They never `CREATE`d the tables, their
timestamps did not match prod's 12 applied versions (most changes went in via MCP), and
— found while moving them — the CLI parses a migration's version as the digits before the
FIRST underscore, so `20260611_162101_…` and seven siblings were all version `20260611`:
a duplicate-version history, which `supabase start` rejects outright. The repo could not
reproduce its own schema, which blocks the ephemeral CI test DB
([docs/06-operations/CI_TEST_DB_ISOLATION.md](../../docs/06-operations/CI_TEST_DB_ISOLATION.md)).

**Impact**: `supabase start` / `db reset` rebuilds prod's schema exactly, then applies
`seed.sql`. New changes are ordinary timestamped migrations stacked on the baseline —
and the naming convention needs the full 14-digit `YYYYMMDDHHMMSS` prefix with NO
internal underscore, or versions collide again. Prod is unaffected: it already has this
schema and is not managed by this file.

**Two edits to the raw dump**, both required and both commented in place: `CREATE SCHEMA
public` → `IF NOT EXISTS` (a local DB already has `public`, so a bare CREATE aborts on
statement 1), and a trailing `GRANT` / `ALTER DEFAULT PRIVILEGES` block — a native
`pg_dump` over the pooler carries no grants, and PostgREST reaches every table as
`anon` / `authenticated` / `service_role`, which without privileges get 42501 before RLS
is ever consulted.
