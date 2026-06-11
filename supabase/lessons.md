# Supabase — Lessons

Workspace: `supabase/` (migrations, RLS, triggers, edge functions)

Last Updated: 2026-05-04

---

## 2026-05-04 — Legacy `current_setting('request.jwt.claim.*')` JWT path silently denies all writes

**What happened**: Workers RLS had a policy `"Coordinators and above can manage workers"` whose qual was `current_setting('request.jwt.claim.user_metadata.role', true) = ANY (ARRAY['coordinator','management','super_admin'])`. Coordinator user shamim could not update worker JWP040 active→inactive on `/workers` — Save fired, no error, no success change. The companion admin-only policy still worked for super_admin/management, masking the issue.

**Root cause**: The `request.jwt.claim.user_metadata.role` setting is a Supabase pre-2022 GUC. The current Supabase auth model exposes the role via `auth.jwt()->'app_metadata'->>'role'` (used by `has_capability()` and the helper functions `is_admin()`, `can_manage_projects()`, etc.). The legacy GUC path is no longer populated, so the predicate returned NULL → policy denied. PostgreSQL UPDATE on a row failing the USING clause silently affects 0 rows with no error, so `if (error)` checks pass and success toasts fire while the DB stays unchanged.

**Fix**: Migration `20260504_141912_fix_workers_rls_legacy_jwt_path.sql` — drop both legacy policies (`"Coordinators and above can manage workers"` + `"Admin can manage workers"`), create `"Project roles can manage workers"` using `(SELECT can_manage_projects())` (subquery wrap for once-per-statement evaluation, mirroring the people-table policies). Defense-in-depth: `WorkerList.tsx` save/delete/restore mutations now `.select('id')` and throw on 0-row updates so future RLS misconfigs surface as errors instead of silent successes.

**How to apply**: Whenever auditing RLS, grep `pg_policies` for `current_setting('request.jwt.claim` — every hit is a latent silent-deny waiting to bite a non-admin role. The canonical role check in this project is `has_capability(<slug>)` driven by `public.rls_capabilities` (managed at `/admin?tab=rls`); helper wrappers are `is_admin()`, `is_finance_role()`, `can_manage_projects()`, `can_manage_quotations()`, `is_field_or_above()`, `is_approved_user()`. Any new RLS write policy should call those + wrap in `(SELECT ...)` for performance.

**Also**: Supabase UPDATE returning `error: null` does NOT prove a row changed — RLS-USING-fail is the exception. Code that relies on the write succeeding should `.select()` and assert `data.length > 0`, or use a SECURITY DEFINER RPC that raises explicitly.
