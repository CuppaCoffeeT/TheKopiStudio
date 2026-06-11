
# Database Security Policy

**Created**: 2025-09-12 08:15:00 SGT  
**Last Updated**: 2026-05-30 SGT  
**Status**: 🟢 Production  
**Priority**: 🔴 Critical  

## 📋 Overview

This project uses **two sanctioned RLS patterns**: minimal `USING (true)` for non-sensitive tables (security at the app/module layer) and **capability-based RLS** (`has_capability()` / `is_admin()` / `is_approved_user()` etc.) for operational and sensitive tables. As of 2026-05-29 the live database is predominantly capability-based — **277 capability-based policies vs. only 5 remaining minimal `USING (true)` policies**. The earlier "minimal RLS MANDATORY for ALL tables, NEVER restrictive" stance is **superseded**.

> **Final authority**: [.claude/rules/rls-policy.md](../../.claude/rules/rls-policy.md) is the canonical, auto-loaded rule for RLS in migrations. This doc gives the architectural background; when the two differ, the rule file wins.

## 📚 Related Documentation
- [.claude/rules/rls-policy.md](../../.claude/rules/rls-policy.md) - **Canonical RLS rule** (Pattern A / B / C, InitPlan wrap requirement)
- [DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md](../02-security/DATABASE_SECURITY_VULNERABILITY_ANALYSIS_AND_REMEDIATION_PLAN.md) - Critical security vulnerability analysis and fixes
- [MODULE_SYSTEM.md](./MODULE_SYSTEM.md) - Application-level RBAC system that complements RLS
- [AUTH_USER_ID_NORMALIZATION.md](../02-security/AUTH_USER_ID_NORMALIZATION.md) - User ID foreign key standards

## Core Principle

**Database access is gated by two layers**: capability-based RLS at the database level (defense-in-depth on operational/sensitive tables) PLUS the application module-permission system. Non-sensitive tables may still use minimal `USING (true)` RLS and rely on the app layer alone. Restrictive policies are no longer prohibited — they are the canonical pattern for hot operational and sensitive tables.

## Sanctioned RLS Patterns

Two patterns are sanctioned (full spec in [.claude/rules/rls-policy.md](../../.claude/rules/rls-policy.md)). **Every function call in a policy must be wrapped in `(SELECT …)`** — bare `USING (fn())` re-evaluates per row and is a known CPU/RAM hotspot.

### Pattern A — Minimal RLS (default for non-sensitive tables)

```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can CRUD <table_name>"
  ON public.<table_name> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

Use for: new tables that don't need DB-level row gating. Security stays at the app/module layer.

### Pattern B — Capability-based RLS (canonical for operational/sensitive tables)

```sql
-- SELECT — broader read access (keeps dashboards/lists working)
CREATE POLICY "Approved users can read <table>"
  ON public.<table> FOR SELECT TO authenticated
  USING ((SELECT public.is_approved_user()));

-- INSERT/UPDATE/DELETE — tighter write access via capability
CREATE POLICY "Capable roles can manage <table>"
  ON public.<table> FOR ALL TO authenticated
  USING ((SELECT public.can_manage_projects()))
  WITH CHECK ((SELECT public.can_manage_projects()));
```

Sanctioned capability functions (W14 framework, dynamic via `rls_capabilities` table, manageable at `/peoplemanagement?tab=access`): `has_capability()`, `is_admin()`, `is_finance_role()`, `can_manage_projects()`, `can_manage_quotations()`, `is_field_or_above()`, `is_approved_user()`, `is_super_admin()`.

W14/W15 (2026-04-18) locked capability-based RLS as the canonical strategy for hot operational tables; the 2026-05-29 Phase 0 migration (`20260529_160100_replace_always_true_rls_phase0.sql`) replaced the last broad always-true policies on `project_form_imports`, `xero_webhook_events`, `workflows`, `workflow_runs`, `workflow_incidents`.

### When NOT to use restrictive policies

Avoid these specific *footguns* (they are still bad — but capability functions like `is_approved_user()` are NOT in this list):

```sql
-- ❌ Bare function call — evaluates per row, kills performance
USING (is_approved_user())               -- wrap as (SELECT public.is_approved_user())

-- ❌ Hardcoded role list — bypasses the capability framework
USING (current_setting('request.jwt.claim.user_metadata.role') = ANY (ARRAY['coordinator','management']))

-- ❌ Self-referential / recursive predicate — causes "infinite recursion detected in policy"
USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
```

## Application-Level Security

This project implements security through:

### 1. Module Permission System
- Role-based module access (super_admin, management, coordinator, supervisor)
- Individual user permission overrides
- Dynamic module loading based on permissions

### 2. Route Protection
- Front-end route guards based on user roles
- Module visibility controlled by permissions
- Automatic redirects for unauthorized access

### 3. API Security
- JWT token validation
- User role verification in API calls
- Resource access control in business logic

## Migration Guidelines

### When Creating New Tables:

Choose the pattern by table sensitivity (see [.claude/rules/rls-policy.md](../../.claude/rules/rls-policy.md)):

- **Non-sensitive** → Pattern A (minimal `USING (true)`), security at the app/module layer.
- **Operational/sensitive** → Pattern B (capability-based): broad `is_approved_user()` SELECT + capability-gated writes, all predicates wrapped in `(SELECT …)`.

```sql
-- Your table creation
CREATE TABLE public.your_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- your columns
);

ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Pattern A (minimal) — non-sensitive table
CREATE POLICY "Authenticated can CRUD your_table"
  ON public.your_table FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- OR Pattern B (capability-based) — operational/sensitive table
-- CREATE POLICY "Approved users can read your_table"
--   ON public.your_table FOR SELECT TO authenticated
--   USING ((SELECT public.is_approved_user()));
-- CREATE POLICY "Capable roles can manage your_table"
--   ON public.your_table FOR ALL TO authenticated
--   USING ((SELECT public.can_manage_projects()))
--   WITH CHECK ((SELECT public.can_manage_projects()));
```

### When Modifying Existing Tables:

1. **Preserve the table's existing pattern** (A or B) unless intentionally hardening.
2. **Always wrap capability functions in `(SELECT …)`** for InitPlan caching.
3. **Test thoroughly after changes** across affected roles.

## Common Issues and Solutions

### "Infinite recursion detected in policy"
Caused by a self-referential predicate (a policy that queries its own table or a table whose policy queries back). Use a `SECURITY DEFINER` capability function (`has_capability()`, `is_admin()`, etc.) instead of an inline subquery against the protected table:

```sql
DROP POLICY IF EXISTS "recursive_policy_name" ON public.table_name;
CREATE POLICY "Capable roles can manage table_name"
  ON public.table_name FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
```

### "Permission denied for table"
1. Confirm RLS is enabled and the role holds the required capability (`/peoplemanagement?tab=access` → `rls_capabilities`).
2. Verify the user is authenticated and approved.
3. Re-login to refresh the JWT, then retry.

### "User not found" or "Profile not found"
1. Confirm the account is approved by an administrator.
2. Handle user lookup in application code; don't rely on RLS for user validation.

## Testing RLS Changes

After any RLS changes:

1. **Re-login** to refresh the JWT so new policies/capabilities take effect.
2. **Test all relevant roles**: super_admin, management, coordinator, supervisor (+ Office_admin / engineer / drafter where applicable).
3. **Test all CRUD operations**: Create, Read, Update, Delete.
4. **Check browser console**: Look for RLS-related errors.
5. **Verify capability seeding**: confirm the role→capability mapping exists in `rls_capabilities`.

## Emergency RLS Reset

If a capability policy breaks legitimate access on a single table, fall back to minimal RLS for that table only (do not blanket-reset all tables — most now intentionally use Pattern B):

```sql
-- Reset ONE table to minimal (use only if Pattern B is not required for it)
DROP POLICY IF EXISTS "<broken-policy>" ON public.<table_name>;
CREATE POLICY "Authenticated can CRUD <table_name>"
  ON public.<table_name> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

If a capability policy is merely slow, wrap its predicate in `(SELECT …)` rather than removing it.

## Notification System RLS (Pattern C — per-row owner)

`notifications` uses a per-row owner predicate, wrapped in `(SELECT …)` for InitPlan caching:

```sql
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
```

This per-row exception is reserved for `notifications` (per-user privacy). Other tables use Pattern A or B.

## Remember

**Capability-based RLS (defense-in-depth at the DB layer) plus the application module system is the canonical strategy. Minimal `USING (true)` RLS remains the default only for non-sensitive tables. Final authority on RLS patterns is [.claude/rules/rls-policy.md](../../.claude/rules/rls-policy.md).**
