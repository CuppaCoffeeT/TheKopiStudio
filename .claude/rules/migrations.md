---
paths:
  - supabase/migrations/**
---

# Rule: Migration Standards

## Summary

All database migrations must follow strict naming conventions (`YYYYMMDD_HHMMSS_description.sql`, underscores only), reference `public.users(id)` for foreign keys (never `auth.users(id)`), and be executed exclusively through Supabase MCP — never via CLI. Supabase's `list_migrations` is the source of truth for what has been applied; compare against local files to find gaps.

## Detailed Patterns

### Naming Convention

```bash
# ALWAYS get timestamp first
date +"%Y%m%d_%H%M%S"

# Filename: YYYYMMDD_HHMMSS_description.sql (underscores only, NO dashes)
# Template: Follow supabase/MIGRATION_TEMPLATE.md
```

### Foreign Key References

- ✅ Reference `public.users(id)` for foreign keys
- ❌ NEVER reference `auth.users(id)` directly

### Migration Execution Tracking

- ⚠️ ONLY execute migrations through Supabase MCP (NEVER use CLI)
- ✅ **Supabase IS the source of truth** — `mcp__supabase__list_migrations` shows exactly what has been applied
- ✅ To find unexecuted migrations: compare local `supabase/migrations/` files against `mcp__supabase__list_migrations` output — the gap = not yet applied
- ✅ When creating new migrations: Execute immediately after creation via Supabase MCP
- ✅ During `/git-sync`: Run `mcp__supabase__list_migrations`, compare with local files, execute any gaps

### RLS in Migrations

Every new table migration MUST include the minimal RLS pattern:

```sql
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can CRUD <table_name>"
  ON public.<table_name> FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
```

## References

- [supabase/MIGRATION_TEMPLATE.md](../../supabase/MIGRATION_TEMPLATE.md)
- Related: [rls-policy.md](./rls-policy.md) — RLS pattern required in every table migration
