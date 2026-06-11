# AppBase Health Checker Agent

> **This is a task definition**, not a personality file. Personality files (SOUL.md, IDENTITY.md) live on Mac Mini at `~/.openclaw/agents/health-checker/agent/`.

Automated health checker for the AppBase codebase. Runs nightly at 2am SGT (delegated by Agent J). Can also be triggered manually via `/health-check`.

## Tools Required

- Bash (for `npx tsc --noEmit`, shell commands)
- Grep (for pattern scanning)
- Glob (for file discovery)
- Read (for file content)
- mcp__supabase__list_migrations (for migration gap check)

## Output Format

Return a JSON object with this structure:

```json
{
  "timestamp": "ISO-8601",
  "typescript": { "status": "pass|fail", "errorCount": 0, "errors": [] },
  "queryCompliance": { "status": "pass|warn", "violationCount": 0, "violations": [] },
  "missingMigrations": { "status": "pass|warn", "count": 0, "files": [] },
  "authUsersViolations": { "status": "pass|fail", "count": 0, "locations": [] }
}
```

## Severity Tiers (for Telegram alerting)

- 🔴 CRITICAL: `typescript` fail OR `authUsersViolations` fail → alert immediately
- 🟡 WARNING: `missingMigrations` warn → include in nightly summary
- ⚪ INFO: `queryCompliance` warn → log only, do not alert

---

## Checks

### 1. TypeScript Compilation (CLAUDE.md General)

**Command**: `npx tsc --noEmit 2>&1`

- Parse output for error count and `file:line` locations
- Status: `"pass"` if 0 errors, `"fail"` otherwise
- Note: tsconfig has `strict: false` — only true compilation errors are flagged
- Capture the first 20 errors max in the `errors` array (avoid huge output)

### 2. Supabase Query Compliance (CLAUDE.md Rule #8)

**Why**: Supabase PostgREST silently caps queries at 1,000 rows. All list queries must be bounded.

**How to check**:

1. Grep all `.ts` and `.tsx` files in `src/` for `.from(` calls
2. For each file with matches, read the file and examine each Supabase query chain
3. A query chain starts at `.from('table_name')` and ends at the next statement boundary

**Compliant if the chain includes ANY of**:
- `.range(` — server-side pagination
- `.limit(` — explicit limit
- `.single()` — single record fetch
- `.maybeSingle()` — optional single record
- `head: true` — count-only query

**EXCLUDE from violation checks**:
- Insert/update/delete/upsert operations (`.insert(`, `.update(`, `.delete(`, `.upsert(`)
- RPC calls (`.rpc(`)
- Lines inside comments (`//` or `/* */`)
- Queries that chain `.eq(` + `.single()` (single-record lookups)

**Status**: `"pass"` if 0 violations, `"warn"` otherwise (NOT `"fail"` — many legacy files still exist)

**Reference implementations** (known compliant):
- `src/services/peopleService.ts` — server-side pagination with `.range()` + `{ count: 'exact' }`
- `src/services/projectListService.ts` — pagination with relational queries
- `src/services/adminOverviewService.ts` — two-tier pagination + batch aggregation

### 3. Migration Gap Check (CLAUDE.md Rule #3)

**How to check**:

1. List all local migration files: `ls supabase/migrations/*.sql` → extract filenames
2. Call `mcp__supabase__list_migrations` → get list of applied migrations
3. Compare: any local file NOT in the applied list = unapplied migration
4. Status: `"pass"` if 0 gaps, `"warn"` otherwise

**Important**: Migration filenames follow `YYYYMMDD_HHMMSS_description.sql` pattern (underscores, no dashes). Some legacy files use dashes or UUIDs — include all formats in comparison.

### 4. auth.users Violations (CLAUDE.md Rule #3)

**Why**: Business tables must reference `public.users(id)`, never `auth.users(id)` directly.

**How to check**:

1. Grep for `auth.users` (case-insensitive) in:
   - All `.ts` and `.tsx` files in `src/`
   - All `.sql` files in `supabase/migrations/`
2. Status: `"pass"` if 0 violations, `"fail"` otherwise

**EXCLUDE from violations**:
- `supabase/migrations/20251109_113000_fix_auth_user_references.sql` — this is the enforcement migration that deliberately references `auth.users` to fix other tables
- Lines inside comments
- Documentation strings or markdown content embedded in code

---

## How This Fits With Other Checks

| Agent/Command | What it checks | When |
|---------------|---------------|------|
| **health-checker** (this) | TypeScript + query compliance + migrations + auth.users | Heartbeat (30min) + nightly |
| **docs-monitor** | Doc index accuracy, orphan files, counts | Nightly only |
| `/health-check` | Orchestrates both agents | Manual trigger |
| `/code-hygiene` | Root clutter + system-wide quality drift | Monthly / pre-release |
| `/check-docs` | Doc index accuracy only | Every git-sync |
