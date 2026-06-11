---
paths:
  - supabase/migrations/**
---

# Rule: RLS Policy (MANDATORY)

## Summary

Two sanctioned patterns: (1) **minimal RLS** — `USING (true)` for non-sensitive tables, security at app/module layer; (2) **capability-based RLS** — `USING ((SELECT public.<capability>()))` for operational tables where defense-in-depth is wanted. W14/W15 (2026-04-18) locked capability-based as the canonical strategy for hot operational tables; minimal RLS remains the default for everything else. **Every function call in a policy must be wrapped in `(SELECT …)`** — bare `USING (fn())` evaluates the function per-row and is a known RAM/CPU hotspot (see [supabase/migrations/lessons.md](../../supabase/migrations/lessons.md) 2026-05-25).

## Detailed Patterns

### Pattern A — Minimal RLS (default)

```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can CRUD <table_name>"
  ON public.<table_name> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

Use for: new tables that don't need DB-level row gating. Security stays at the app/module layer (see [module-access.md](./module-access.md)).

### Pattern B — Capability-based RLS (sanctioned for operational tables)

```sql
-- SELECT — broader read access
CREATE POLICY "Approved users can read <table>"
  ON public.<table> FOR SELECT TO authenticated
  USING ((SELECT public.is_approved_user()));

-- INSERT/UPDATE/DELETE — tighter write access
CREATE POLICY "Field roles can manage <table>"
  ON public.<table> FOR ALL TO authenticated
  USING ((SELECT public.is_field_or_above()))
  WITH CHECK ((SELECT public.is_field_or_above()));
```

Use for: tables that hold field-operational data (trial trenches, general works, worker OT) where a tighter DB-level boundary is desired in addition to the module-access app layer. **The `(SELECT …)` wrapper is mandatory** — it triggers Postgres' InitPlan optimization (one function eval per query, not per row).

Sanctioned capability functions (W14 framework): `has_capability()`, `is_admin()`, `is_finance_role()`, `can_manage_projects()`, `can_manage_quotations()`, `is_field_or_above()`, `is_approved_user()`, `is_super_admin()`.

### Tables on Pattern B (current state)

- `trial_trenches` · `general_works_entries` · `worker_ot` — capability-based since W14; initplan-wrapped 2026-05-25.

### Pattern C — Per-row owner (exception)

```sql
CREATE POLICY "Users see own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

Only `notifications`. Still uses the `(SELECT …)` wrapper for the same initplan reason.

### Anti-patterns

```sql
-- ❌ Bare function call — evaluates per row, kills performance
USING (is_approved_user())

-- ❌ Hardcoded role list — bypasses the capability framework
USING (current_setting('request.jwt.claim.user_metadata.role') = ANY (ARRAY['coordinator', 'management']))

-- ❌ User-specific predicate outside the notifications exception
USING (auth.uid() = created_by)
```

### Troubleshooting

If RLS is blocking legitimate access:

```sql
-- Reset to minimal (use only if pattern B is not required)
DROP POLICY IF EXISTS "<old-policy>" ON public.<table>;
CREATE POLICY "Authenticated can CRUD <table>"
  ON public.<table> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

If a capability policy is slow:

```sql
-- Wrap in (SELECT …) for initplan caching
DROP POLICY IF EXISTS "<slow-policy>" ON public.<table>;
CREATE POLICY "<slow-policy>"
  ON public.<table> FOR SELECT TO authenticated
  USING ((SELECT public.<capability>()));
```

## References

- [docs/01-system-architecture/DATABASE_POLICY.md](../../docs/01-system-architecture/DATABASE_POLICY.md)
- [supabase/migrations/decisions.md](../../supabase/migrations/decisions.md) — 2026-04-18 capability-RLS lock-in
- [supabase/migrations/lessons.md](../../supabase/migrations/lessons.md) — 2026-05-25 initplan wrap lesson
- Related: [module-access.md](./module-access.md) — Application-level access control that complements RLS
