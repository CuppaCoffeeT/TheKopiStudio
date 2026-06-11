---
description: Safely tear down a AppBase feature module — code, route, tests, DB module rows, docs — with reference-sweep and gate verification. Never hard-deletes production data without explicit confirmation.
argument-hint: "<module-name or /path>  (e.g. material-requests)"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, mcp__supabase__apply_migration, mcp__supabase__execute_sql, mcp__supabase__list_tables
---

# Delete Module

Remove a feature module completely and cleanly. Target: `$ARGUMENTS`. Authority: the deletion checklist in `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md`.

## ⚠️ Safety first

- **Look before you delete.** Read the module's `CONTEXT.md` + PRD. If what you find contradicts "this is removable" (e.g. it's used in production, other modules depend on it), STOP and surface that instead of proceeding.
- **Never hard-delete production data** (drop a table with rows / delete `modules` rows users depend on) without **explicit user confirmation** in-conversation AND a backup/export first. Prefer soft-archive (rename table to `_archive_*`, or `is_deleted` flag) unless the user explicitly approves a hard drop.
- Work on a branch, not main.

## Steps

### 1. Reference sweep (know the blast radius before touching anything)
```
grep -rn "features/<module>" src
grep -rn "<route-path>" src
grep -rn "<module>" src/App.tsx
```
List every importer, the route, any shared component the module owns, and whether other features import from its `index.ts`. If anything outside the module imports it → resolve those first (promote to `shared/`/`lib/` or delete the consumers per their own scope). Do not orphan importers.

### 2. Remove the route + any page shell
- Delete the lazy import + `<Route>` from `src/App.tsx`.
- Delete any thin `src/pages/<X>.tsx` route shell the module created (route entries normally live in `src/features/<module>/pages/`).

### 3. Remove query-key entity
Remove the module's entity block **and its `Filters` type** from `src/utils/queryKeys.ts`.

### 4. Database (confirm with user before destructive SQL)
Write a migration `supabase/migrations/YYYYMMDD_HHMMSS_remove_<module>.sql`. Run in **FK-safe order**:
- `delete from public.user_modules` → then `public.role_modules` → then `public.modules where path = '<path>'` (children before parent);
- then `DROP TABLE` the feature table(s) + their RLS policies + indexes (or soft-archive per the safety rule above).
Apply via Supabase MCP only after confirmation. Regenerate types (`npm run db:types`).

### 5. Delete code + tests
- `rm -rf src/features/<module>/`
- **Tests** — sweep `tests/**` (not just `tests/workflows/<module>/`) for the module's routes / test-ids and delete what only that module used:
  ```
  grep -rln "<route-path>\|<module>\|data-testid.*<module>" tests/
  ```
- **Shared components** (`src/components/shared/<domain>/`) — re-grep ALL features for each shared surface the module owned. Delete **only if zero consumers remain**; if any other feature still imports it, STOP and surface it (do not orphan). When deleted, update `src/components/shared/CONTEXT.md`.

### 6. Docs
- Delete the feature doc folder `docs/03-features/<slug>/`.
- Remove the module's row from `docs/DOCUMENTATION_INDEX.md`, and sweep inbound back-links from related docs (fix or remove the dangling links).
- Archive the PRD: `mv docs/05-implementation/active/<X>_PRD.md docs/05-implementation/archive/`.
- Preserve any "Errors Encountered / What NOT To Try Again" history (per code-hygiene — never delete debugging history).

### 7. Verify (all must pass)
- `npx tsc --noEmit` → 0 (no dangling imports)
- `grep -rn "<slug>\|/<route>" src/ tests/ docs/` → zero (only intentional, named residue)
- `npm run build` → passes
- `npm run drift:check` → clean — in particular `no-stray-domain-components` = 0 (no orphaned stray-component dir left behind)
- `get_advisors` clean (no orphaned RLS/policies) if DB changed

### 8. Commit
One commit (you, the orchestrator): `chore(<module>): remove module — code, route, tests, DB rows, docs`. Do not push to main unless the user asked.

## Output

Report: what was removed, what was soft-archived vs hard-dropped (and the confirmation you got), the gate scorecard, and any residue intentionally left (with reason).

## 📚 Related

- `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md` (deletion reverse-checklist — authority) · `.claude/commands/create-module.md` · `.claude/commands/check-module.md`
- `docs/01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md` (folder shape + `shared/<domain>/` promotion lane) · `.dependency-cruiser.cjs` (`no-stray-domain-components`)
- `src/components/shared/CONTEXT.md` (update when a shared surface is deleted) · `src/utils/queryKeys.ts` (remove entity block)
- `.claude/rules/code-hygiene.md` (preserve debugging history) · `.claude/rules/rls-policy.md`
