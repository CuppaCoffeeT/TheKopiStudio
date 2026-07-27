# System Architecture

**Last Updated**: 2026-07-27 SGT

Core system-design docs (Layer 3 — how foundational systems work today). Routing only; detail in the linked guides.

**Belongs**: DB/RLS/FK · auth & RBAC · query standards · timezone · URL · design system · app structure.
**Not here**: features → `docs/03-features/` · plans → `docs/05-implementation/` · integrations → `docs/04-integrations/`.

## Navigation

Every row below was path-verified 2026-07-27. If you add a doc here, add its row **and** verify the implementation path resolves.

| File | Purpose | Implementation in |
|------|---------|-------------------|
| `APPLICATION_ARCHITECTURE.md` | App structure, providers, routing, layout shell | `src/App.tsx`, `src/main.tsx`, `src/components/shared/app-shell/` |
| `authentication/` | Auth workspace — flows · schema · patterns | `src/contexts/AuthContext.tsx`, `src/components/shared/app-shell/ProtectedRoute.tsx`, `src/pages/Login.tsx` |
| `canonical-page-patterns/` | The 6 archetype "build/migrate a page" specs | `src/components/primitives/ui/ListPageFrame.tsx`, `src/components/primitives/detail/DetailPageFrame.tsx` |
| `CRM_DATA_SPINE.md` | 5 CRM tables · RLS Pattern D · capabilities · role-sync · import runbook | `supabase/migrations/`, `src/features/crm/` |
| `DATABASE_POLICY.md` | RLS policies, FK standards, migration rules | `supabase/migrations/` |
| `DESIGN_SYSTEM.md` | Design router — tokens · fonts · primitives · archetypes | `src/components/primitives/`, `src/index.css`, `src/lib/design/tokens.ts` |
| `design-system/` | Sub-guides (PHILOSOPHY · TYPOGRAPHY · COLORS · TOKENS · PRIMITIVES · ARCHETYPES · …) | `src/components/primitives/**` |
| `MOBILE_WEB_STANDARDS.md` | Touch-first — dvh · 16px zoom · 44px targets · safe-area | `src/components/primitives/**`, `index.html` |
| `MODULE_SYSTEM.md` | Module-based access control, RBAC | `src/contexts/AuthContext.tsx`, `src/features/manage-accounts/` |
| `query-patterns/` | Pagination · dropdowns · counts/singles · legacy migration | `src/hooks/useURLPagination.ts`, `src/lib/pagination.ts` |
| `react-query-cache/` | Cache keys, invalidation, cross-module bubble, ESLint | `src/utils/queryKeys/` |
| `SEARCHABLE_SELECT_COMPONENT.md` | Reusable searchable dropdown spec | `src/components/primitives/overlays/SearchableMultiSelect.tsx` |
| `SUPABASE_QUERY_STANDARDS.md` | Query patterns — `.range()`/`.limit()`/`.single()` | `src/lib/` |
| `TIMEZONE_POLICY.md` | SGT-only handling, `timezoneUtils` | `src/utils/timezoneUtils.ts` |
| `URL_STANDARDS.md` | Route naming + URL param patterns | `src/App.tsx` |

**Retired rows** (kept so the names resolve to an explanation rather than to nothing):

| File | Retired | Note |
|---|---|---|
| `DRAWING_LISTING_ORDER.md` | pre-merge (AppBase template era) | Drawing sort order — the drawings feature never shipped in this app; doc removed with it |
| `PEOPLE_SYSTEM.md` | pre-merge (AppBase template era) | People/contacts model — superseded by `CRM_DATA_SPINE.md` (clients/contacts live in the CRM spine) |
| `WORKFLOW_SYSTEM.md` | pre-merge (AppBase template era) | State-machine engine — no workflow engine ships in this app |

## Before working here

- Docs describe how systems work NOW, not how to build them.
- **The app is light-pinned** (The Kopi Studio, cream/brown, 2026-07-25). Anything in these docs describing navy/gold, zinc, dark mode, a top masthead or a module-launcher grid is a retired era — see [design-system/CONTEXT.md](./design-system/CONTEXT.md) and [.claude/rules/light-theme.md](../../.claude/rules/light-theme.md).
- Naming/header standards: `.claude/rules/documentation.md`.
