# Data Spine — CRM Schema, RLS, Role-Sync & Cross-Project Import — PRD

**Created:** 2026-06-11 · **Last Updated:** 2026-06-11 · **Status:** 🔵 Planning · **Priority:** P0 (blocks profiler + crm modules)
**Work type**: module (data-spine — DB schema + privileged edge function + data migration; NO UI)

🤖 Build via: `/prd-execute docs/05-implementation/active/DATA_SPINE_PRD.md`
✅ Completion gate: the scoped gate subset in **Definition of Done** below green → PRD moves to completed/

## 📊 Progress / State

| Phase | Status | Notes |
|---|---|---|
| P1 — CRM tables migration + capabilities + decisions ledger | ⬜ | |
| P2 — users-table hardening migration | ⬜ | |
| P3 — role-sync edge function | ⬜ | |
| P4 — CRM data export + import + verification | ⬜ | BLOCKED on `SOURCE_SUPABASE_SERVICE_ROLE_KEY` from the user (old CRM project dashboard) |
| P5 — docs + index registration | ⬜ | |

Current phase: — · Blockers: P4 needs the source project's service-role key (see Open Questions)

## 📋 Definition

**What**: Lay the database spine for the merged Prospect Profiler app on the live Supabase project `mymzcbalyqqgdmzsfmam`: the 5 Insurance-CRM tables upgraded to AppBase conventions, the RLS pattern that encodes "advisors own their book, managers see everything", the capability seeds, the missing role-sync edge function the foundation migration's wiring note requires, a users-table privilege-escalation fix, and the one-time import of the CRM book from the old project `uivdgousiyfeyrebloaz`.

**Why**: Phases 2–4 (profiler module, crm module, reports) all build on these tables and capabilities. The data import is independent of UI and de-risks the merge earliest. The users-table fix closes a live security hole found in research.

**Target user/role**: advisor (owns rows), manager (reads all, manages accounts), super_admin (everything). No UI in this PRD.

**Success criteria**: all 5 tables live with Gate-9.8-clean RLS; capabilities seeded; role-sync function deployed and rejecting unauthorized callers; CRM rows imported with row-count parity + recomputed totals; types regenerated; tsc/build/lint/drift green; decisions ledger started.

**Scope cut (NOT in v1)**: no UI, no profiler `results` table changes (still FK→profiles; cutover work), no changes to legacy `profiles`/`results` policies, no manager WRITE access to other advisors' rows (read-only default), no decommissioning of the old CRM project.

## 🔎 Research findings (verified 2026-06-11 — prd-execute inherits, does NOT re-research)

**Live DB state (MCP-verified)**: 9 tables in public, all RLS-enabled: foundation 7 (`roles`,`users`,`modules`,`role_modules`,`user_modules`,`rls_capabilities`,`notifications`) + legacy `profiles`,`results`. No name collision with the 5 CRM tables. Roles: advisor, management, manager, super_admin, supervisor. `rls_capabilities` currently: admin→{management,super_admin}, field_or_above→{management,super_admin,supervisor} — **no rows for `manager`**. Users: skytwech@gmail.com=super_admin, keane.nsb@gmail.com=manager (both approved). Migration history: 20260320062304 (legacy initial), 20260611082914 + 20260611082940 (foundation + backfill). Legacy `results.user_id` still FK→`profiles(id)` — intentionally untouched until cutover. The old deployed app serves production from this same DB: **all migrations must be additive; nothing may touch `profiles`/`results`.**

**Security finding (must fix, P2)**: `public.users` has a single policy `"Authenticated can CRUD users"` USING(true) WITH CHECK(true) — any authenticated user can UPDATE any row (role/is_approved/is_active), i.e. app-layer privilege escalation. Module access (`get_user_modules`) and approval gating read `users.role`/`is_approved`, so this is exploitable today. Fix in P2 (template's Pattern-A default is wrong for this table).

**Source schema (file-verified: `"/Users/tenshi/Documents/Projects/Insurance CRM/supabase/schema.sql"`)**: 5 tables, uuid PKs `gen_random_uuid()`, `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` (must become → `public.users(id)`), single owner policy per table (`user_id = auth.uid()` FOR ALL). Exact columns in the schema file; notable: `policies` has NO `updated_at`; `projected_cash_values` has NO `created_at` and no UNIQUE(policy_id,age); only 6 indexes (user_id missing on pcv/interactions/bbh). App layer (`useClients.js`): snake↔camel mapping, dates as 'YYYY-MM-DD', ''→null, numerics via Number(). **Known data-layer bugs to fix at import**: `total_bank_balance`/`last_review_date` set from the *touched* (not latest) history record, never recalculated on delete, and writable directly from the client form → recompute from max-date history row on import. `created_at` drives UI ordering → must be carried over, not defaulted. Preserve source row UUIDs (no collisions across projects; makes import idempotent via ON CONFLICT (id) DO NOTHING).

**House conventions (file-verified)**: migrations `YYYYMMDD_HHMMSS_desc.sql` (timestamp from `date +"%Y%m%d_%H%M%S"`), applied EXCLUSIVELY via `mcp__supabase__apply_migration` with the committed .sql byte-identical; subagents AUTHOR .sql, the orchestrator APPLIES via MCP and confirms with `list_migrations`. Standard columns id/created_at/updated_at/created_by/updated_by/is_deleted; covering index on EVERY FK; FKs → `public.users(id)` never auth.users; every policy fn call `(SELECT …)`-wrapped; policy names `{table}_{cmd}` (SOP style — the newer authority); `updated_at` via `public.update_updated_at_column()` trigger. Types regen via `mcp__supabase__generate_typescript_types` into `src/integrations/supabase/types.ts`, then build. Edge functions: deploy via `mcp__supabase__deploy_edge_function` (NEVER CLI — `deploy-edge-functions.sh` is stale template boilerplate); caller-JWT functions keep `verify_jwt` ON; auth precedent = `pdf-generation` (anon-key client + caller Authorization header + `auth.getUser()`); privileged mutations = service-role client (`SUPABASE_SERVICE_ROLE_KEY` secret, autoRefreshToken:false, persistSession:false). Scripts: ESM `.mjs` in scripts/, JSDoc header, ✓/✗ output, `process.exit(0|1)`; mirror `loc-ratchet.mjs` style. Pin project ref `mymzcbalyqqgdmzsfmam` (SOP text still says `your-project-ref` — do not copy verbatim).

**RLS pattern decision (records as Pattern D in the decisions ledger)**: rls-policy.md's three patterns don't cover "owner-scoped + capability read-all" (owner predicates are notifications-only per the rule file; SOP's Pattern C conflicts with the rule file's). The user explicitly chose: advisors own their book; managers see everything. Therefore all 5 CRM tables get **Pattern D — owner + capability read**:
- `{table}_select`: `USING ((SELECT auth.uid()) = user_id OR (SELECT public.has_capability('view_all_clients')))`
- `{table}_insert`: `WITH CHECK ((SELECT auth.uid()) = user_id)`
- `{table}_update` / `{table}_delete`: `USING ((SELECT auth.uid()) = user_id)` (owner-only writes; manager read-only — Open Question #1)
This is a deliberate, documented extension — record in `supabase/migrations/decisions.md` (ledger does not exist yet; P1 creates it).

**Capability seeds (P1)**: `view_all_clients` → manager, super_admin · `view_all_results` → manager, super_admin (consumed by the profiler module PRD later) · `manage_accounts` → manager, super_admin. (`management`/`supervisor` template roles get nothing — donor-codebase artifacts, unused here.)

**Role-sync function (P3) — composite of verified precedents**: foundation wiring note + backfill migration explicitly reserve "an admin edge function (auth.admin.updateUserById)" for this PRD. No role-check precedent exists in the two template functions; the sanctioned composite: (1) validate caller via anon-key client + Authorization header + `auth.getUser()` (pdf-generation pattern), (2) authoritative authorization via service-role read of `public.users.role` for the caller (JWT claim may lag) joined to `rls_capabilities` requiring `manage_accounts`, (3) mutate: UPDATE `public.users` (role and/or is_approved) + `auth.admin.updateUserById(target, { app_metadata: { role } })`, (4) do NOT touch `profiles.role` (CHECK constraint allows only advisor/manager; legacy app semantics stay frozen). JSON `{success}`/`{error}`, corsHeaders, OPTIONS preflight, verify_jwt ON.

**Import (P4)**: source project `uivdgousiyfeyrebloaz` unreachable by MCP — export needs its service_role key, supplied at run time via env `SOURCE_SUPABASE_SERVICE_ROLE_KEY` (never committed). Target writes go through MCP `execute_sql` (no target service key needed). user_id remap by email: source `auth.users` (admin API) → email → canonical `public.users.id`; unmatched emails ABORT with a clear list (Open Question #2). FK order: clients → policies → projected_cash_values → interactions → bank_balance_history. Carry over `created_at`/`created_date`; preserve ids; recompute `total_bank_balance` + `last_review_date` from latest-by-date history row; insert pcv sorted by age; verify row-count parity + per-client spot checks both sides.

**RLS verification technique (test plan)**: simulate roles in SQL via `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"sub":"<uuid>","role":"authenticated","app_metadata":{"role":"advisor"}}';` inside a transaction in `execute_sql` — gives per-role positive/negative assertions without a browser.

## 🧩 Module Spec

- **Folders touched**: `supabase/migrations/` (2 new .sql + decisions.md ledger), `supabase/functions/role-sync/`, `scripts/` (2 .mjs), `docs/01-system-architecture/` (schema doc), `docs/05-implementation/` (this PRD), `backups/` (gitignored export artifacts). **No `src/features/` folder** — types.ts regen is the only src change.
- **Data model**: 5 tables as source schema + AppBase upgrades: `updated_at` everywhere (+ trigger), `created_at` on pcv, `created_by`/`updated_by uuid NULL REFERENCES public.users(id)`, `is_deleted boolean NOT NULL DEFAULT false`, `user_id` → `public.users(id)` ON DELETE CASCADE, covering index on EVERY FK (user_id ×5, client_id ×3, policy_id ×1, created_by/updated_by ×10), UNIQUE(policy_id, age) on projected_cash_values (app delete-reinserts whole sets; uniqueness is safe and blocks dup-age rows).
- **RLS**: Pattern D (above) on all 5; policy names `{table}_{cmd}`.
- **No routes, no modules-table rows** (UI module registration happens in the crm-module PRD).

## 🔐 Permissions Matrix (drives SQL-level negative checks — no UI yet)

| Action | advisor (owner) | advisor (other's row) | manager | super_admin |
|---|---|---|---|---|
| SELECT any CRM table | ✅ own | ❌ | ✅ all (view_all_clients) | ✅ all |
| INSERT (user_id = self) | ✅ | ❌ (user_id≠self) | ✅ own only | ✅ own only |
| UPDATE / DELETE | ✅ own | ❌ | ❌ others' (read-only) | ❌ others' (read-only) |
| role-sync function call | ❌ 403 | ❌ 403 | ✅ (manage_accounts) | ✅ |
| users.role / is_approved change via direct UPDATE | ❌ blocked (P2 trigger) | ❌ | ❌ | ✅ (is_super_admin) |

## 🚦 Phases

### P1 — CRM tables migration + capability seeds + decisions ledger
**Goal**: 5 tables live, Pattern D RLS, capabilities seeded, ledger started.
**Scope**: one migration `YYYYMMDD_HHMMSS_create_crm_tables.sql` (timestamp from date cmd at authoring): 5 CREATE TABLE IF NOT EXISTS per Module Spec; updated_at triggers; all covering indexes; RLS enable + Pattern D policies; `INSERT INTO public.rls_capabilities … ON CONFLICT DO NOTHING` for view_all_clients/view_all_results/manage_accounts → manager+super_admin. Create `supabase/migrations/decisions.md` with a dated Pattern-D entry (the rule-file deviation and why). Subagent authors .sql; **orchestrator applies via `mcp__supabase__apply_migration`** then regenerates types.ts.
**Verify**: `list_migrations` shows it; `list_tables` shows 5 new tables RLS-enabled; `pg_policies` ≥4 policies per table, all `(SELECT …)`-wrapped; `get_advisors(security)` no rls_disabled / no always-true on the 5; SQL role-simulation positive/negative per Permissions Matrix; tsc 0 + build green with new types.
**Parallel-safe**: no (schema phase, serialize). **Dependencies**: none.

### P2 — users-table hardening migration
**Goal**: close the self-privilege-escalation hole without breaking AuthContext or the compat signup trigger.
**Scope**: migration `…_harden_users_rls.sql`: drop `"Authenticated can CRUD users"`; add `users_select` (authenticated USING(true) — names needed app-wide), `users_update` (self: `USING ((SELECT auth.uid()) = id)`), `users_insert`/`users_delete` (`(SELECT public.is_super_admin())`); plus BEFORE UPDATE trigger fn `public.protect_user_privileges()` (SECURITY DEFINER, pinned search_path) raising exception when role/is_approved/is_active/is_deleted change AND NOT `public.is_super_admin()` AND `current_setting('request.jwt.claims', true)` is present (service-role/postgres sessions bypass — the role-sync function and migrations must keep working). handle_new_user inserts run as SECURITY DEFINER owner — verify they still pass.
**Verify**: SQL simulation — advisor JWT cannot update another user nor own role; self name update works; service-role-style session (no jwt claims) can update role; signup trigger still creates users+profiles rows (insert a throwaway auth.users row in a rolled-back transaction or verify function definitions).
**Parallel-safe**: no (schema). **Dependencies**: P1 applied first (serialize DB phases).

### P3 — role-sync edge function
**Goal**: the missing promote/demote/approve mechanism.
**Scope**: `supabase/functions/role-sync/index.ts` per the Research-findings composite: POST `{ user_id, role?, is_approved? }`; caller validation (getUser) → authorization (service-role read: caller users.role joined to rls_capabilities requires manage_accounts) → validate target role ∈ public.roles → UPDATE public.users + `auth.admin.updateUserById` app_metadata.role → `{success:true}`; errors 400/401/403/404/500 JSON; corsHeaders + OPTIONS; verify_jwt ON; uses `_shared/cors.ts`. Orchestrator deploys via `mcp__supabase__deploy_edge_function`.
**Verify**: deployed (list_edge_functions); OPTIONS 200; POST without Authorization → 401; POST with anon key as bearer → 401/403; code review confirms service-role key only from `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` (auto-provisioned secret), authoritative check NOT trusting JWT claim alone. (Happy-path with a real manager JWT is exercised in the Phase-2 module PRD's E2E; here a code-level adversarial review stands in.)
**Parallel-safe**: yes vs P4 (disjoint files). **Dependencies**: P1 (capabilities exist), P2 (trigger must not block it — service-role path).

### P4 — CRM data export + import + verification
**Goal**: the old CRM book lives in the canonical project.
**Scope**: `scripts/export-crm.mjs` — env `SOURCE_SUPABASE_URL` (default `https://uivdgousiyfeyrebloaz.supabase.co`) + `SOURCE_SUPABASE_SERVICE_ROLE_KEY` (required; abort with instructions if unset); exports all 5 tables + source auth user emails (admin API) to `backups/crm-export-<date>.json` (gitignored); prints row counts. `scripts/import-crm.mjs --dry-run|--execute` — reads the export, remaps user_id by email against canonical `public.users` (MCP-free: takes a `--users-map` JSON or queries via supplied target anon key + service path is NOT available → simplest: emits FK-ordered idempotent INSERT … ON CONFLICT (id) DO NOTHING SQL to `backups/crm-import-<date>.sql` with `created_at` carried over, pcv sorted by age, `total_bank_balance`/`last_review_date` recomputed from latest history) — **orchestrator executes the generated SQL via `mcp__supabase__execute_sql`** in FK order, then runs verification queries. Unmatched source emails → abort and surface (Open Question #2).
**Verify**: row-count parity per table (source export vs target SELECT count), zero FK violations, every client's total_bank_balance equals its max-date history balance, spot-check 3 clients' policies/interactions field-by-field, RLS check: owner sees rows / other-advisor JWT sees none / manager JWT sees all.
**Parallel-safe**: script authoring yes; the EXECUTE step blocked on the user-supplied key. **Dependencies**: P1 (tables), user key.

### P5 — docs + registration
**Goal**: spine documented, index updated, log closed.
**Scope**: `docs/01-system-architecture/CRM_DATA_SPINE.md` (≤12,000c): tables, Pattern D rationale, capability list, role-sync contract, import runbook; row in `docs/DOCUMENTATION_INDEX.md`; dated entries in `supabase/migrations/decisions.md`; Execution Log rows; PRD → completed/.
**Verify**: links resolve; /check-docs-style pass; index row present.
**Parallel-safe**: yes. **Dependencies**: P1–P4 content final.

## 🎯 Definition of Done — scoped gate subset (no-UI PRD; feature-folder gates N/A)

1. tsc --noEmit = 0 · 2. `npm run lint` ≤15 warnings · 3. `npm run build` green · 4. `npm run drift:check` 0 net-new · 5. Migration conventions: committed .sql byte-identical to MCP-applied (list_migrations confirms), timestamps real, FKs → public.users, covering index per FK, `(SELECT …)`-wrapped policy fns · 6. Gate 9.8 per new table: get_advisors(security) clean, ≥1 policy in pg_policies · 7. Permissions-Matrix SQL simulations all pass (positive AND negative) · 8. types.ts regenerated + committed · 9. Import row-count parity + recomputed-totals check (P4) · 10. decisions.md ledger has ≥2 dated entries (Pattern D, users hardening) · 11. DOCUMENTATION_INDEX row present.
N/A by scope: primitive greps, @p0 Playwright, feature CONTEXT.md, folder-structure asserts, archetype/URL gates (no UI; consumed by later PRDs).

## ❓ Open Questions / Risks

1. **Manager writes to CRM rows** — default: read-only (owner-only writes). Reversible: single-policy change later. (User said "managers see everything"; write access not requested.)
2. **Unmatched source emails at import** — default: ABORT and list them; user decides map-to-owner vs invite. If the CRM advisor email matches skytwech@gmail.com or keane.nsb@gmail.com, no question arises.
3. **`SOURCE_SUPABASE_SERVICE_ROLE_KEY`** — user action: old CRM project dashboard → Settings → API → service_role; place as `SOURCE_SUPABASE_SERVICE_ROLE_KEY=…` in `"/Users/tenshi/Documents/Projects/Insurance CRM/.env.migration"` (never committed). P4 EXECUTE blocked until present; everything else proceeds.
4. **Risk — shared prod DB**: old app serves production from this DB throughout; P1/P2 are additive + users-policy-tightening only (old app reads `profiles`, not `users` — verified it never queries `users`). Compat signup trigger untouched.
5. **Risk — pcv UNIQUE(policy_id,age)**: source data could theoretically hold duplicate ages per policy; import de-dupes keeping the last occurrence and logs.
6. **Risk — service-role bypass semantics in P2 trigger**: bypass keyed on absent `request.jwt.claims`; verify Supabase sets claims for service-role REST calls (it does set role=service_role) — trigger must allow `current_setting('request.jwt.claims',true)::json->>'role' = 'service_role'` too. Author the trigger with BOTH checks.

## 🗒️ Execution Log

| Date | Phase | Result |
|---|---|---|
| | | |
