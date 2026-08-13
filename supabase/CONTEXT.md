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
| `migrations/` | **One** applied file: `00000000000000_baseline_prod_schema.sql`, the faithful prod public schema (squashed 2026-08-13). New changes stack on top of it. |
| `migrations/_archive/` | The 10 pre-squash files — drifted, duplicate-versioned, never rebuilt the DB. Reference only; the CLI does not glob subdirectories. |
| `seed.sql` | Fixtures for the **ephemeral local test DB only** (RBAC backbone + 8 legacy `results`). Never applied to prod. |
| `config.toml` | Local-stack config for `supabase start` (CI). `project_id` there is only a container-name prefix. |
| `functions/` | Supabase Edge Functions (Deno) — `role-sync` is load-bearing for @p0 |
| `MIGRATION_TEMPLATE.md` | Required template for all new migrations |

## Before working here

- **Two databases, two tools — do not mix them up.**
  - **Prod** (`mymzcbalyqqgdmzsfmam`), the only real DB: schema changes go through the Supabase **MCP**, NEVER the CLI.
  - **The ephemeral local stack** that CI's E2E job builds with `supabase start`: CLI-only, throwaway, and the MCP has no business touching it. Design: [CI_TEST_DB_ISOLATION.md](../docs/06-operations/CI_TEST_DB_ISOLATION.md).
- **Naming**: `YYYYMMDDHHMMSS_description.sql`. **No underscore inside the timestamp** — the CLI reads the version as the digits before the FIRST `_`, which is how the archived files ended up eight-to-a-version.
- **FK references**: `public.users(id)` always — NEVER `auth.users(id)`. (`profiles`/`users` predate the rule and still FK to `auth.users`; don't copy them.)
- **RLS**: Every new table must have minimal authenticated RLS policy
- **Template**: Follow `MIGRATION_TEMPLATE.md` for all new migrations
- **Unexecuted migrations**: Compare local `migrations/` files against `mcp__supabase__list_migrations` output
- **Branching**: NOT in use (decided 2026-04-18 in refactor W01). Only one DB exists — prod. No staging, no preview branches. See [W01 card](../docs/99-refactor/_system/workflows/W01_SUPABASE_BASELINE.md) for why (drift: 7 of 365 local files match prod's 371 rows). Revisit in Week 5 once W09 module migrations close the drift.
- **Detailed rules**: `.claude/rules/migrations.md`, `.claude/rules/rls-policy.md`
