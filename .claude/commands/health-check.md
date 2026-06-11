(RUN THIS COMMAND TO CHECK CODEBASE HEALTH)
# Health Check Command

Run a comprehensive health check of the AppBase codebase. Combines all automated checks into a single report.

## Step 1: Run Health Checker

Read `.claude/agents/health-checker.md` and execute all 4 checks:

1. **TypeScript compilation** — run `npx tsc --noEmit 2>&1`, parse errors
2. **Supabase query compliance** (Rule #8) — scan `src/` for `.from(` calls missing `.range()`, `.limit()`, `.single()`, `.maybeSingle()`, or `head: true`. Exclude insert/update/delete/upsert/rpc operations.
3. **Migration gap check** (Rule #3) — list local `supabase/migrations/*.sql` files, compare against `mcp__supabase__list_migrations` output. Report any unapplied migrations.
4. **auth.users violations** (Rule #3) — grep `src/` and `supabase/migrations/` for `auth.users`. Exclude the enforcement migration `20251109_113000_fix_auth_user_references.sql` and comments.

## Step 2: Run Docs Monitor

Read `.claude/agents/docs-monitor.md` and execute all 5 doc health checks:

1. File existence — every link in `docs/DOCUMENTATION_INDEX.md` exists
2. Unlisted files — no orphan `.md` files in `docs/`
3. Duplicate entries — no path listed twice in index
4. File count — actual count matches stated total
5. Stale CONTEXT.md links — all links in `docs/CONTEXT.md` valid

## Step 3: Present Combined Report

Format results as a summary table:

```
| Check              | Status    | Details              |
|--------------------|-----------|----------------------|
| TypeScript         | PASS/FAIL | N errors             |
| Query Compliance   | PASS/WARN | N violations         |
| Migration Gaps     | PASS/WARN | N unapplied          |
| auth.users         | PASS/FAIL | N violations         |
| Docs Health        | PASS/WARN | N issues             |
```

## Step 4: Offer Fixes

For any issues found, ask: **"Want me to fix any of these? Which should I start with?"**

Fixable items:
- **TypeScript errors** → show error locations, offer to fix
- **Query compliance** → show violation files, offer to add `.limit()`
- **Migration gaps** → offer to execute via Supabase MCP
- **auth.users** → show locations, offer to fix references
- **Docs issues** → delegate to `/check-docs` fix flow
