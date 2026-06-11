# Supabase

Database migrations, edge functions, and generated TypeScript types for the AppBase portal (PostgreSQL via Supabase).

## What belongs here

Migration SQL files, edge functions, generated types, and the migration template.

## What does NOT belong here

- Application code → `src/`
- Documentation about migrations → `docs/06-operations/migrations/`

## Navigation

| Folder | Purpose |
|--------|---------|
| `migrations/` | Active migration files (334+) — the canonical schema history |
| `migrations_archive/` | Pre-2025-09-07 chaotic migrations — reference only, do not modify |
| `functions/` | Supabase Edge Functions (Deno) |
| `MIGRATION_TEMPLATE.md` | Required template for all new migrations |

## Before working here

- **Naming**: `YYYYMMDD_HHMMSS_description.sql` — underscores only, NO dashes
- **FK references**: `public.users(id)` always — NEVER `auth.users(id)`
- **RLS**: Every new table must have minimal authenticated RLS policy
- **Execution**: ONLY via Supabase MCP (project_id `your-project-ref`) — NEVER use CLI
- **Template**: Follow `MIGRATION_TEMPLATE.md` for all new migrations
- **Unexecuted migrations**: Compare local `migrations/` files against `mcp__supabase__list_migrations` output
- **Branching**: NOT in use (decided 2026-04-18 in refactor W01). Only one DB exists — prod. No staging, no preview branches. See [W01 card](../docs/99-refactor/_system/workflows/W01_SUPABASE_BASELINE.md) for why (drift: 7 of 365 local files match prod's 371 rows). Revisit in Week 5 once W09 module migrations close the drift.
- **Detailed rules**: `.claude/rules/migrations.md`, `.claude/rules/rls-policy.md`
