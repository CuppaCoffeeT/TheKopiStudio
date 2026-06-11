# CRM Data Spine

**Created**: 2026-06-11 17:21:00 SGT
**Last Updated**: 2026-06-11 17:21:00 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The database spine for the merged Prospect Profiler app on Supabase project `mymzcbalyqqgdmzsfmam`: the 5 Insurance-CRM tables (upgraded to AppBase conventions), the **Pattern D** RLS shape that encodes "advisors own their book, managers see everything", the capability seeds, the `users`-table privilege-escalation fix, the `role-sync` edge function, and the one-time import runbook for the old CRM book (project `uivdgousiyfeyrebloaz`). No UI ships here — the profiler/crm module PRDs consume these tables.

This DB also serves the still-deployed legacy app: everything here is **additive**; legacy `profiles` / `results` tables and policies are untouched.

## 📚 Related Documentation

- [DATA_SPINE_PRD.md](../05-implementation/active/DATA_SPINE_PRD.md) — the PRD this doc closes (research findings, phases, execution log)
- [supabase/migrations/decisions.md](../../supabase/migrations/decisions.md) — dated ledger entries for Pattern D and the users hardening
- [DATABASE_POLICY.md](./DATABASE_POLICY.md) — RLS background; final authority is `.claude/rules/rls-policy.md`
- [MODULE_SYSTEM.md](./MODULE_SYSTEM.md) — app-layer RBAC that complements this DB layer

## 🗃️ The 5 CRM Tables

Migration: `supabase/migrations/20260611_164841_create_crm_tables.sql` (applied 2026-06-11). Source columns reproduced from the old CRM schema, plus AppBase standard columns on **every** table: `id uuid PK gen_random_uuid()`, `user_id uuid NOT NULL → public.users(id) ON DELETE CASCADE` (never `auth.users`), `created_at`/`updated_at timestamptz` (+ `update_updated_at_column()` trigger), `created_by`/`updated_by uuid NULL → public.users(id)`, `is_deleted boolean DEFAULT false`, covering index on every FK.

| Table | Purpose | Key business columns |
|---|---|---|
| `clients` | The advisor's book of clients | `name`, `email`, `phone`, `date_of_birth`, `annual_income`, `risk_profile`, `created_date` (drives UI ordering), `last_review_date`/`next_review_date`/`review_frequency`, `total_bank_balance` (derived — see below), `cpf_oa`/`cpf_sa`/`cpf_ma` |
| `policies` | Insurance policies per client (`client_id` FK) | `type`, `provider`, `policy_number`, `premium`/`frequency`, coverage set (`coverage_amount`, `tpd_*`, `critical_illness_*`, `early_critical_illness_*`), cash-value set (`has_cash_value`, `current_cash_value`, ILP fields, `illustrated_value_age_55/65`), hospitalization set (`hospital_type`, `integrated_shield_*`, `rider_cash`), `start_date`/`end_date`/`status` |
| `projected_cash_values` | Per-age cash-value projections per policy (`policy_id` FK) | `age`, `value`; **UNIQUE (policy_id, age)** — the app replaces whole projection sets, so duplicate ages are always corrupt data (the UNIQUE index also covers the `policy_id` FK) |
| `interactions` | Client touchpoints (`client_id` FK) | `date`, `type` (Meeting/…), `notes`, `follow_up` |
| `bank_balance_history` | Dated balance snapshots per client (`client_id` FK) | `date`, `balance`, `notes` |

**Derived-field rule**: `clients.total_bank_balance` and `clients.last_review_date` must equal the latest-by-date `bank_balance_history` row. The source app set them from the *touched* (not latest) record — the import recomputes them (see runbook).

## 🔐 RLS — Pattern D (owner + capability read)

The three sanctioned patterns in `.claude/rules/rls-policy.md` don't fit a multi-advisor book: A (`USING (true)`) leaks every advisor's PII/financials, B (capability-only) can't express row ownership, C (owner-only) is scoped to `notifications` and gives managers nothing. The requirement is the intersection — *per-advisor isolation* AND *managers see everything* — so all 5 tables use a deliberate, ledger-documented extension (decisions.md, 2026-06-11):

```sql
{table}_select:  USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')))
{table}_insert:  WITH CHECK ((SELECT auth.uid()) = user_id)
{table}_update:  USING ((SELECT auth.uid()) = user_id)
{table}_delete:  USING ((SELECT auth.uid()) = user_id)
```

Writes stay **owner-only** (manager read-only — PRD Open Question #1; reversible later by changing one policy per table). No hardcoded role lists — read-all rides on `has_capability()`. Every function call is `(SELECT …)`-wrapped (initplan caching). Policy names: `{table}_{cmd}`. Pattern D is also the intended template for the later profiler `results` cutover (via `view_all_results`).

## 🎫 Capabilities (seeded in the CRM migration)

| Capability | Roles | Consumed by |
|---|---|---|
| `view_all_clients` | `manager`, `super_admin` | Pattern D SELECT policies on all 5 CRM tables |
| `view_all_results` | `manager`, `super_admin` | Profiler module PRD (results cutover) — seeded now, unused yet |
| `manage_accounts` | `manager`, `super_admin` | `role-sync` edge function authorization |

Template roles `management`/`supervisor` get nothing (donor-codebase artifacts).

## 🛡️ users-Table Hardening

Migration: `supabase/migrations/20260611_165020_harden_users_rls.sql`. The foundation migration left `public.users` with one permissive policy (`"Authenticated can CRUD users"` USING(true)/WITH CHECK(true)) — any signed-in user could UPDATE any row's `role`/`is_approved`/`is_active` and self-elevate (module access + approval gating read those columns). Two layers fix it:

1. **Per-command policies**: `users_select` USING(true) (names needed app-wide) · `users_update` self-only (`(SELECT auth.uid()) = id`, USING + WITH CHECK) · `users_insert`/`users_delete` require `(SELECT public.is_super_admin())`.
2. **Guard trigger** `public.protect_user_privileges()` (BEFORE UPDATE, SECURITY DEFINER, `search_path = ''`): raises `42501` when `role`/`is_approved`/`is_active`/`is_deleted` change, unless the caller is (a) a direct postgres/migration session (`request.jwt.claims` unset), (b) `service_role` claims — the role-sync path, or (c) a super_admin JWT. Needed because RLS is row-level only: `users_update` legitimately allows self-row updates, so without the trigger a user could still flip their OWN role.

**Cross-user role/approval changes flow exclusively through the `role-sync` edge function** (service role): `users_update` is self-only, so even a super_admin's direct cross-row UPDATE matches 0 rows (disclosed semantic, Execution Log P2). Signup stays intact — `handle_new_user()` is SECURITY DEFINER owned by the table owner (bypasses RLS) and the guard is UPDATE-only; no `FORCE ROW LEVEL SECURITY`.

## 🔄 role-sync Edge Function Contract

`supabase/functions/role-sync/index.ts` — v2 (profiles mirror, 2026-06-11), `verify_jwt` ON. The only sanctioned promote/demote/approve mechanism.

**Request**: `POST` with caller `Authorization: Bearer <user JWT>` and JSON body
`{ "user_id": "<uuid>", "role"?: "<role name>", "is_approved"?: boolean }` — at least one of `role`/`is_approved` required.

**Flow**: (1) caller identity via anon-key client + `auth.getUser()`; (2) **authoritative** authorization via service-role read of `public.users` (caller must be approved/active/not-deleted) joined to `rls_capabilities` requiring `manage_accounts` — the JWT `app_metadata.role` claim is never trusted alone; (3) target + role validation against `public.roles` (must exist and be active); (4) UPDATE `public.users`, then on role change sync `auth.users` `app_metadata.role` via `auth.admin.updateUserById` (existing app_metadata keys preserved; on sync failure the `users` row is rolled back); (5) **v2 — legacy `public.profiles.role` mirror** on any request that includes `role`: `'advisor'`/`'manager'` mirror as-is, `'super_admin'` mirrors as `'manager'` (the profiles CHECK constraint only allows `advisor|manager`). The legacy results policy reads `profiles.role` via `get_my_role()`, so promotions must land there for manager read-all visibility until cutover. The mirror is **non-fatal**: on failure (DB error or missing profiles row) the function logs, returns `"profiles_mirror": "failed"`, and does NOT roll back `public.users` — `users` stays canonical; `profiles` is the legacy table.

**Responses**:

| Status | Body | When |
|---|---|---|
| 200 | `{ success: true, user_id, role, is_approved, profiles_mirror? }` | Mutation (and any auth sync) succeeded. `profiles_mirror` (`"ok"` \| `"failed"`) present only when the request included `role` |
| 400 | `{ error }` | Invalid JSON; missing/non-string `user_id`; neither `role` nor `is_approved`; unknown/inactive role; **last-super-admin guard** |
| 401 | `{ error: "Unauthorized" }` | Missing `Authorization` header or invalid/anon token |
| 403 | `{ error }` | Caller not approved/active, or caller's role lacks `manage_accounts` |
| 404 | `{ error: "Target user not found" }` | `user_id` has no `public.users` row |
| 500 | `{ error }` | DB read/write failure; app_metadata sync failure (states whether rollback succeeded) |

**Last-super-admin guard**: demoting a `super_admin` to any other role is refused (400) when they are the last approved + active + non-deleted super_admin — the system must always retain an RBAC administrator.

**Accepted limitations** (PRD Resolved decisions, 2026-06-11; carried into v2): `is_approved: false` on the last super_admin is still possible (recoverable via service-role/SQL); a non-UUID `user_id` returns 500 (Postgres cast error) rather than 400; no role-assignment ceiling — a manager may promote to `super_admin` (Permissions-Matrix-sanctioned); `protect_user_privileges` appears in RPC-exposure lint but is a trigger function and cannot be invoked via RPC.

## 📦 Import Runbook (one-time, old CRM → canonical project)

Idempotent end-to-end: generated INSERTs are `ON CONFLICT (id) DO NOTHING` with source UUIDs preserved; safe to re-run. `backups/` is gitignored.

**Step 1 — source key** (user): old CRM dashboard (`uivdgousiyfeyrebloaz`) → Project Settings → API → `service_role`, then put it in the env file (never committed; auto-loaded by both scripts):

```bash
echo 'SOURCE_SUPABASE_SERVICE_ROLE_KEY=<key>' >> "/Users/tenshi/Documents/Projects/Insurance CRM/.env.migration"
```

**Step 2 — export** (writes `backups/crm-export-<YYYY-MM-DD>.json`: all 5 tables paginated + source auth emails for remapping; prints row counts):

```bash
node scripts/export-crm.mjs
```

**Step 3 — generate import SQL** (remaps `user_id` by source email → canonical `public.users.id`; unmatched emails **abort with the list** — PRD Open Question #2):

```bash
node scripts/import-crm.mjs --export backups/crm-export-<YYYY-MM-DD>.json \
  --users-map '{"<source email>":"<public.users uuid>"}'   # and/or --default-user <uuid>
```

Emits `backups/crm-import-<date>.sql` (one transaction, FK order clients → policies → projected_cash_values → interactions → bank_balance_history; `created_at`/`created_date` carried over; pcv de-duped on (policy_id, age) keeping the last occurrence and sorted by age; `total_bank_balance`/`last_review_date` recomputed from the latest history row) plus `backups/crm-verify-<date>.sql`. The script never touches a database.

**Step 4 — execute + verify** (orchestrator): run `crm-import-<date>.sql` via MCP `execute_sql` against `mymzcbalyqqgdmzsfmam`, then run `crm-verify-<date>.sql` — row-count parity per table and a zero-rows derived-fields consistency check — plus per-role RLS spot checks (owner sees rows, other advisor sees none, manager sees all).
