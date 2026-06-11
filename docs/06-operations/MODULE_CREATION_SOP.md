# Module Creation SOP

**Created**: 2026-05-30 SGT
**Last Updated**: 2026-05-31 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical
**Supersedes**: 2026-03-23 MODULE_CREATION_SOP (pre-refactor, 33KB stale)

## Overview

Authoritative router for building a NEW module end-to-end (archetype → scaffold → DB → RBAC → queries → primitives → cross-cutting → docs). To migrate an existing page to primitive shape, follow this SOP + the [MODULE_COMPLIANCE_CHECKLIST.md](./MODULE_COMPLIANCE_CHECKLIST.md) audit; to **audit/verify** any module (new or existing) run the same checklist; this SOP is the build guide for net-new domains. Comprehensive reference — read top-to-bottom once, then use the checklist per build.

## Pre-flight (read before writing code)

[src/CONTEXT.md](../../src/CONTEXT.md) · [ARCHETYPES.md](../01-system-architecture/design-system/ARCHETYPES.md) · [universal-components.md](../../.claude/rules/universal-components.md) · [CANONICAL_LIST_TABLE_PATTERN.md](../01-system-architecture/canonical-page-patterns/CANONICAL_LIST_TABLE_PATTERN.md) · [TOKEN_BUDGET.md](../99-meta/TOKEN_BUDGET.md).

## Step 1: Pick your archetype

Every page is exactly ONE of six shapes. **Run in order, first match wins:** route `/:id` or `*Detail.tsx` → DETAIL · `/create|/new|/edit` or `Create|Form` → FORM · `*Dashboard*`/role home → DASHBOARD · `*Settings*` tabbed → SETTINGS · paginated collection → LIST · else → TOOL. Dispatch + per-archetype rules: [ARCHETYPES.md](../01-system-architecture/design-system/ARCHETYPES.md).

| Archetype | Root primitive | Folder |
|---|---|---|
| LIST | `ListPageFrame` | `features/<slug>/pages/<Slug>List.tsx` |
| DETAIL | `DetailPageFrame` | `features/<slug>/pages/<Slug>Detail.tsx` |
| DASHBOARD | `AppHeaderShell` + `KpiTile`/`ChartShell` | `features/<slug>-dashboard/` |
| FORM | `Field` rows in `Modal`/`Dialog` | `features/<slug>/pages/<Slug>Create.tsx` |
| SETTINGS | `AppHeaderShell` + `TabNav` | `features/<slug>-settings/` |
| TOOL | `AppHeaderShell` + bespoke | `features/<slug>/pages/<Slug>Page.tsx` |

## Step 2: Scaffold the feature folder

**One folder per domain, not per page** — list + detail of one entity live together. Never split `<x>list/`+`<x>detail/`. Caps: ≤200 LOC/file (pages ≤300); one concern/file; named exports except pages; JSDoc one-liner top of every file. Single-caller hooks/utils live in the feature; ≥2 callers stay global. Full shape: [CANONICAL_FEATURE_FOLDER.md](../01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md).

```
src/features/<domain>/
├── api/         supabase.from() reads + mutation fns. NO hooks/JSX
├── hooks/       one useX() per file (useXList, useXMutation)
├── lib/         pure: columns, row builders, formatters + NOTES/decisions/lessons.md
├── components/  feature-only UI (≥2 features → promote to src/components/shared/<domain>/)
├── pages/       thin composition roots, default export
└── types.ts · index.ts (public barrel — page exports + any cross-feature surface) · CONTEXT.md
```

> **`types.ts` flat file, never a `types/` dir.** `types.ts`/`index.ts` are present where the feature exports types / has a public surface — not every feature has both (see [CANONICAL_FEATURE_FOLDER.md](../01-system-architecture/canonical-page-patterns/CANONICAL_FEATURE_FOLDER.md)).
>
> 🚫 **Never create a new top-level `src/components/<domain>/` or a loose root file** — `no-stray-domain-components` (dependency-cruiser, severity `error`) fails CI. `src/components/` may hold only `primitives/`, `ui/`, `shared/`. New cross-feature surfaces go to `src/components/shared/<domain>/`.

**Worked example `/workorders`** — copy the canonical adopter [src/features/companies/](../../src/features/companies/) and rename. Create, in order: migration `.sql` (table + FK indexes + RLS Step 3 + `modules`/`role_modules` Step 4, then regen types — Step 3) · `api/<x>Service.ts` (`getPaginated`=`.select('*',{count:'exact'}).eq().or().order().range(from,to)`, PAGE_SIZE=100; `getById`=`.single()`) · `hooks/use<X>List.ts` (`useQuery` keyed `list(params)` + `keepPreviousData`) · `hooks/use<X>Mutation.ts` (invalidate `.all`+`.detail(id)`) · `lib/<x>Columns.ts`+`<x>Row.tsx` (pure) · `pages/<X>List.tsx` (`ListPageFrame`+`useURLPagination`+350ms debounce) · `pages/<X>Detail.tsx` (`DetailPageFrame`) · `types.ts` · `index.ts` · `CONTEXT.md`.

`App.tsx` — direct barrel import (NOT lazy), gated for both routes:
```tsx
import { WorkOrderList, WorkOrderDetail } from "@/features/workorders";
{ path:"/workorders", element:<ProtectedRoute modulePath="/workorders"><WorkOrderList/></ProtectedRoute> },
{ path:"/workorders/:id", element:<ProtectedRoute modulePath="/workorders"><WorkOrderDetail/></ProtectedRoute> },
```
Skip `src/pages/` for new modules (thin re-export shell only for legacy paths).

## Step 3: Database & RLS

DB is **production-only** (project `your-project-ref`): write `.sql` → apply via `mcp__supabase__apply_migration` (CLI banned for changes) → regen types. [rls-policy.md](../../.claude/rules/rls-policy.md) · [migrations.md](../../.claude/rules/migrations.md) · [MIGRATION_TEMPLATE.md](../../supabase/MIGRATION_TEMPLATE.md).

- **Naming** `YYYYMMDD_HHMMSS_desc.sql`, underscores only. Get real timestamp: `date +"%Y%m%d_%H%M%S"` — never guess.
- **Apply**: local `.sql` + MCP `apply_migration` MUST be identical SQL. MCP `name`=snake_case, no timestamp/`.sql`. Truth = `mcp__supabase__list_migrations`.
- **Columns**: `id uuid pk default gen_random_uuid()`, `created_at`/`updated_at timestamptz`, `created_by`/`updated_by`, `is_deleted boolean`. Add a covering index for EVERY FK (154 unindexed FKs caused seq-scans, 2026-05-25).
- **FK rule**: user columns → `public.users(id)`, NEVER `auth.users(id)` ([AUTH_USER_ID_NORMALIZATION.md](../02-security/AUTH_USER_ID_NORMALIZATION.md)).
- **Types**: regen `src/integrations/supabase/types.ts` via `mcp__supabase__generate_typescript_types` (app's source of truth; `npm run db:types` writes a separate CLI snapshot). Verify `npm run build`.

**Three RLS patterns** — `enable row level security` first, pick ONE, name policies `{table}_{cmd}`. **Wrap EVERY function call in `(SELECT …)`** (InitPlan — bare calls re-eval per row; fixed trial_trenches 1099ms→0.133ms):
- **A (DEFAULT, app-layer gating)** `for all to authenticated using (true) with check (true)`.
- **B (capability, operational; broad read/tight write)** `_select … using ((select public.is_approved_user()))` + `_write for all … using ((select public.has_capability('manage_<t>')))` (same `check`).
- **C (admin-only)** like B, `_write` uses `(select public.is_admin())`.

Sanctioned fns: `has_capability()`·`is_admin()`·`is_finance_role()`·`can_manage_projects()`·`is_field_or_above()`·`is_approved_user()`·`is_super_admin()`. Never hardcode JWT role lists; never recursive RLS as primary gate.

## Step 4: Module registration (RBAC)

Access is **module-path based via `useAuth().modules`, never role strings** ([module-access.md](../../.claude/rules/module-access.md) · [MODULE_SYSTEM.md](../01-system-architecture/MODULE_SYSTEM.md)). `path` is the join key across DB/route/guard — one char off = "tile shows, page redirects to /dashboard".

1. **`modules` INSERT** (`name`,`description`,`icon_name` Lucide PascalCase,`path` UNIQUE,`category`,`sort_order`,`is_active`) `ON CONFLICT (path)`.
2. **`role_modules` grants** — join live `public.roles` (`SELECT name FROM public.roles`: `super_admin`/`management`/`coordinator`/`supervisor`/`drafter`/`Office_admin`…). `user_modules` overrides win over role default.
3. **`App.tsx`** — `<ProtectedRoute modulePath="/x">`; `modulePath` MUST equal DB `path`; sub-routes `/x/:id` share parent path.
4. **Check** `modules.some(m => m.path === MODULE_PATH)` — reflects overrides + impersonation. NEVER `user.role === 'admin'` (no DB role equals `'admin'`; bypasses overrides + impersonation).
5. **URL naming** ([url-standards.md](../../.claude/rules/url-standards.md)): single concept no hyphens (`/clientprofiles`); multi-word hyphens (`/ot-calculator`).

## Step 5: Queries & React Query

Build order keys → service → hooks → page. [react-query.md](../../.claude/rules/react-query.md) · [query-compliance.md](../../.claude/rules/query-compliance.md) · [SUPABASE_QUERY_STANDARDS.md](../01-system-architecture/SUPABASE_QUERY_STANDARDS.md).

- **`queryKeys.ts` factory** (single source of truth, no hardcoded arrays). Shape, every line `as const`: `all` → `lists()` → `list(filters)` → `details()` → `detail(id)` → `statistics()`. Filter type includes every param that changes the result set.
- **Bound EVERY `.select()`** (PostgREST silently caps at 1,000 rows — a super_admin at row 1,013 once vanished): list `.range(from,to)`+`{count:'exact'}` (100/page); dropdown `.limit(5000)`; single `.single()`/`.maybeSingle()`; count `{count:'exact',head:true}`.
- **Pagination** `from=(page-1)*100`, `to=from+99` (zero-based inclusive). Filter/search/sort in DB (`.eq`/`.or`/`.ilike`/`.order`), never JS.
- **List hook** key `list(params)` + `placeholderData: keepPreviousData` + `isFetching` opacity fade. **Detail hook** `detail(id)` + `enabled: !!id`.
- **Mutations** update invalidates BOTH `.all` AND `.detail(id)`; create/delete invalidate `.all`. Toast `showSuccess`/`showError`.
- **`useURLPagination`** ([hook](../../src/hooks/useURLPagination.ts)) owns search/filter/sort/page/tab in URL — never raw `useState`. Debounce search 350ms.

## Step 6: Components — 4-tier system

**Decision (top-down, stop at first match)**: 1) primitive covers it → `@/components/primitives/<group>`; 2) new reusable + design-spec → build a primitive (`/design-prompt` first); 3) 2+ features → `src/components/shared/<domain>/`; 4) one feature → `features/<x>/components/`; 5) shadcn base / sanctioned wrapper → `@/components/ui/`. **Cardinal rule: new code imports `primitives/**`, never `ui/**`** except the sanctioned list. Full Need→Import matrix: [universal-components.md](../../.claude/rules/universal-components.md) · inventory [primitives/CONTEXT.md](../../src/components/primitives/CONTEXT.md).

Key imports: `Button`/`Badge`/`Card`/`PageTitle`/`PageDescription` (shell) · `Input`/`Select`/`Textarea`/`Field`/`DatePicker`/`FileUpload` (form) · `Modal`/`DestructiveConfirmDialog`/`DrawerRoot`/`Alert`/`SearchableMultiSelect`/`Tabs` (overlays) · `DataTable` (ui) · `KpiTile` (dashboard) · `showSuccess`/`showError`. **Page frames**: LIST→`ListPageFrame` (ui); DETAIL→`DetailPageFrame` (detail); TOOL/SETTINGS/custom→`AppHeaderShell` (shell). Never `DashboardHeader` in new code; all frames internalize chrome via `useViewAs()`/`useNotificationsBell()`.

**The 5 forbidden greps must ALL return zero before close** — the canonical grep block + false-positive notes live in [MODULE_COMPLIANCE_CHECKLIST.md](./MODULE_COMPLIANCE_CHECKLIST.md) gate 3. "Couldn't translate the primitive" is NOT a valid deferral; defer a file ONLY with the user's named in-conversation approval + `lib/NOTES.md` entry. Sanctioned exceptions + 5-step edit protocol: [universal-components-protocols.md](../../.claude/rules/universal-components-protocols.md).

## Step 7: Cross-cutting rules

Wire in from the first commit.

| Rule | Contract | Authority |
|---|---|---|
| Timezone | Display/parse via `@/utils/timezoneUtils` only (`toUTCForDatabase`/`parseFromDateTimeLocal`/`formatDisplayDateShort`/`getLocalDateString`). Raw `date-fns` ONLY for arithmetic/comparison. FORBIDDEN: `format`/`parseISO`/`toLocaleString`. | [timezone.md](../../.claude/rules/timezone.md) |
| Toast | `showSuccess`/`showError` from `@/utils/toastHelper`. `useToast` deleted; never call `sonner` directly. | [toast-system.md](../../.claude/rules/toast-system.md) |
| Dark mode | **Cardinal: page sits ONE SHADE LIGHTER than cards** — page `dark:bg-zinc-900`, card `dark:bg-zinc-950`. Equal bg = invisible cards. Pair every light util with `dark:`. CTA + focus ring flip. | [dark-mode.md](../../.claude/rules/dark-mode.md) |
| Mobile | Long/multi-input form → fullscreen Dialog, NEVER bottom drawer. `dvh` not `vh`. Inputs `pointer-coarse:text-[16px]`. 44px targets. `env(safe-area-inset-*)`. | [mobile-web.md](../../.claude/rules/mobile-web.md) |
| URL state | `useURLPagination` for list state, never raw `useState`. Route path = DB `modules.path`. | [url-standards.md](../../.claude/rules/url-standards.md) |
| Memory | Append `decisions.md`/`lessons.md` in `features/<slug>/lib/` for non-obvious choices/failures. Read before, append after. | [lessons-logging.md](../../.claude/rules/lessons-logging.md) |

## Step 8: Documentation

Three mandatory artefacts ([documentation.md](../../.claude/rules/documentation.md) · [TOKEN_BUDGET.md](../99-meta/TOKEN_BUDGET.md)): (1) `features/<slug>/CONTEXT.md` routing-only, ≤1,600c, 5 sections (Routes/Archetypes · Purpose · Navigation table · Belongs/Doesn't · Related); (2) `docs/03-features/<slug>/<NAME>.md` SCREAMING_SNAKE_CASE, ≤12,000c, required header + `## 📚 Related Documentation` bidirectional back-links (authored during the build; template in [documentation.md](../../.claude/rules/documentation.md)); (3) a row in `docs/DOCUMENTATION_INDEX.md` (unregistered docs are invisible).

Ceilings (`wc -c`): Feature CONTEXT 1,600 · Category CONTEXT 2,400 · Guide/SOP 8,000 · Feature doc 12,000 · Reference 15,000. `decisions.md`/`lessons.md`: append-only, newest at bottom, update header date, archive >50 entries. Decision fields `**Decision**`/`**Why**`/`**Impact**` (reversal adds `**Supersedes**`); lesson fields `**What happened**`/`**Root cause**`/`**Fix**`.

## Step 9: Verify (Definition of Done)

Run the **9-gate audit** in [MODULE_COMPLIANCE_CHECKLIST.md](./MODULE_COMPLIANCE_CHECKLIST.md): tsc · lint · the 5 primitive greps · build · @p0 · docs · decisions · drift · **Gate 9 architecture-rule greps** (toast · roles · date-fns · query-bounds · URL-state · dark-mode · mobile-vh + the RLS-presence Supabase-MCP check — these enforce Steps 3/4/5/7). **ALL must pass.** Any fail → write `## Unfinished` (gate · why · tried · unblock) in `lib/NOTES.md` and STOP. See [MODULE_COMPLIANCE_CHECKLIST.md](./MODULE_COMPLIANCE_CHECKLIST.md) — the audit tool for any existing module, not just new ones.

## Step 10: Deleting a module

The reverse checklist (code → routes → queryKeys → DB rows+table+RLS+indexes → tests → docs → verify-clean) lives in [MODULE_COMPLIANCE_CHECKLIST.md](./MODULE_COMPLIANCE_CHECKLIST.md) → "Deleting a module".
