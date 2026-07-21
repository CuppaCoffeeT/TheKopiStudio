---
description: Scaffold a new AppBase feature module — canonical folder skeleton, lazy route, module-registration migration stub, and CONTEXT.md — per MODULE_CREATION_SOP. Deterministic foundation step; fill it in with /prd-execute.
argument-hint: "<module-name>  (e.g. material-requests)  [--path /material-requests]"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, mcp__supabase__apply_migration, mcp__supabase__execute_sql, mcp__supabase__list_tables
---

# Create Module

Lay down the **canonical empty skeleton** for a new feature module so a build (manual or `/prd-execute`) has a correct, compliant foundation. This is the mechanical "foundation" step — it does NOT implement features. Authority: `docs/06-operations/MODULE_CREATION_SOP.md`.

Module: `$ARGUMENTS`.

## Pre-flight

1. **Don't scaffold blind.** Read `docs/06-operations/MODULE_CREATION_SOP.md` and the closest existing `src/features/<sibling>/` for the current shape (it drifts — mirror reality, not this doc's snapshot).
2. Decide the URL path: single concept → no hyphen (`/materialrequests`); multi-word → hyphen (`/material-requests`). Confirm it's unique (`grep -rn "<path>" src/App.tsx`).
3. Confirm the module name isn't taken (`ls src/features/`).
4. Work on a branch, not main. Subagents (if any) never run git.

## Scaffold steps

### 1. Folder skeleton — `src/features/<module>/` (deterministic, not interpretive)
Run the exact create sequence so the shape is mechanical — never hand-author a tree:
```bash
M=<module>
mkdir -p src/features/$M/{api,components,hooks,pages,lib}
# then create exactly these three files:
#   src/features/$M/index.ts     — empty-but-valid public barrel (the ONLY cross-feature import surface)
#   src/features/$M/types.ts     — flat file, placeholder export (re-export generated DB types where possible)
#   src/features/$M/CONTEXT.md   — feature memory + nav (house CONTEXT.md template, ≤1,600c)
```
`pages/` gets one stub page that renders a `ListPageFrame`/`DetailPageFrame`/`DashboardHeader` per the intended archetype (reuse existing shared components — `primitives/`, `ui/`, `shared/`; a new design system from Claude Design will replace the old primitive mandates). `api/` is present only where the feature owns data; the others appear as needed but never under different names.

**Structure rules (hard — `no-stray-domain-components` fails CI otherwise):**
- `types.ts` is a **flat file**, never a `types/` directory.
- Do **NOT** create `src/components/<module>/` — feature-local UI lives in `src/features/<module>/components/`; cross-feature surfaces go to `src/components/shared/<domain>/`.
- Do **NOT** create a `src/pages/<module>.tsx` shell — route entries live in `src/features/<module>/pages/`.
- Do **NOT** create module-owned `hooks/`, `lib/`, or shared dirs at the `src/` root — they belong inside the feature folder.
- Large / multi-surface module (5+ related surfaces): nest canonical-shaped sub-folders instead of crowding one `components/` — see CANONICAL_FEATURE_FOLDER.md § Sub-folder features.

### 2. DB migration stub — `supabase/migrations/YYYYMMDD_HHMMSS_create_<module>.sql`
Write (do NOT apply yet unless the user/PRD says so) a migration that:
- `create table public.<table>` snake_case, FKs → `public.users(id)` (never `auth.users`), timestamps;
- `alter table ... enable row level security;`
- minimal authenticated read policy + capability-gated write policies via `has_capability(...)` (see `.claude/rules/rls-policy.md`);
- any SECURITY DEFINER fn pins `search_path`.
Apply via **Supabase MCP `apply_migration`** only (never CLI) when ready; keep the committed `.sql` in sync. Then `npm run db:types`.

### 3. Module registration migration
```sql
insert into public.modules (name, path, icon, description, category)
values ('<Display Name>', '<path>', '<LucideIconName>', '<desc>', '<category>');

insert into public.role_modules (role, module_id)
select r.role, m.id
from (values ('super_admin'),('management')/*,...roles per PRD*/) as r(role)
cross join public.modules m where m.path = '<path>';
```
**Path in DB must exactly match the App.tsx route.** Icons: Lucide names only. Access is module-based via `useAuth().modules` — never hardcoded role checks.

### 4. Route
Add a lazy route to `src/App.tsx`: `const <Module>Page = lazy(() => import('@/features/<module>/pages/<Module>Page'))` + a `<Route path="<path>" .../>` inside the auth-guarded Suspense tree. Path must match the DB module row.

### 5. CONTEXT.md
Populate `src/features/<module>/CONTEXT.md`: purpose, the api/hooks/pages map, which shared components the pages use, the RLS capabilities, and links to the PRD + canonical archetype doc.

## Verify (must pass before declaring scaffold done)

- **Canonical fileset exists** — assert the exact shape, no rogue paths:
  ```bash
  M=<module>
  test -f src/features/$M/index.ts && test -f src/features/$M/types.ts && test -f src/features/$M/CONTEXT.md
  test ! -d src/features/$M/types        # flat types.ts, never a types/ dir
  test ! -d src/components/$M             # no stray domain-components folder
  test ! -f src/pages/$M.tsx             # no thin route-shell at src/pages root
  ```
- `npx tsc --noEmit` → 0
- `npm run build` → passes (the stub route loads; **bare-dir imports need an `index.ts`** — verify the barrel resolves)
- `npm run drift:check` → run **FULL** check; `no-stray-domain-components` = **0** (not just "0 net-new" — literal zero), plus no circular / cross-feature / pages→features
- route renders (the stub page mounts behind auth)

## Output

Report: folder created, route + DB rows added (or migration stubbed), and the **next step**: run `/prd-execute <PRD>` to implement, or build manually per the SOP phases. Note any decision deferred to the PRD.

## 📚 Related

- `docs/06-operations/MODULE_CREATION_SOP.md` · `docs/06-operations/MODULE_COMPLIANCE_CHECKLIST.md`
- `docs/01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md` — the canonical folder shape + flat-`types.ts` rule + § Sub-folder features
- `.dependency-cruiser.cjs` — `no-stray-domain-components` rule (severity `error`) that fails CI on any stray `src/components/<domain>/`
- `.claude/commands/prd-write.md` (spec) · `.claude/commands/prd-execute.md` (build) · `.claude/commands/delete-module.md` (teardown)
- `docs/01-system-architecture/canonical-page-patterns/CANONICAL_LIST_TABLE_PATTERN.md` + sibling CANONICAL_*_PATTERN docs
