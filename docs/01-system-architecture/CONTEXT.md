# System Architecture

**Last Updated**: 2026-05-31 SGT

Core system-design docs (Layer 3 — how foundational systems work today). Routing only; detail in the linked guides.

**Belongs**: DB/RLS/FK · auth & RBAC · query standards · timezone · URL · design system · workflow engine.
**Not here**: features → `docs/03-features/` · plans → `docs/05-implementation/` · integrations → `docs/04-integrations/`.

## Navigation

| File | Purpose | Implementation in |
|------|---------|-------------------|
| `authentication/` | Auth workspace — flows · schema · patterns | `src/features/auth/`, `src/contexts/AuthContext.tsx`, `src/components/shared/app-shell/` |
| `DATABASE_POLICY.md` | RLS policies, FK standards, migration rules | `supabase/migrations/` |
| `DESIGN_SYSTEM.md` | Design router — tokens · fonts · primitives · archetypes | `src/components/primitives/`, `src/index.css`, `src/lib/design/tokens.ts` |
| `design-system/` | Sub-guides (PHILOSOPHY · TYPOGRAPHY · COLORS · TOKENS · PRIMITIVES · ARCHETYPES · …) | `src/components/primitives/**` |
| `DRAWING_LISTING_ORDER.md` | Drawing sort order + display rules | `src/features/projects/components/detail/drawings/` |
| `MOBILE_WEB_STANDARDS.md` | Touch-first — dvh · 16px zoom · 44px targets · safe-area | `src/components/primitives/**`, `index.html` |
| `MODULE_SYSTEM.md` | Module-based access control, RBAC | `src/contexts/AuthContext.tsx`, `src/features/people/components/access/` |
| `PEOPLE_SYSTEM.md` | People/contacts data model + normalization | `src/features/people/`, `src/lib/people/` |
| `react-query-cache/` | Cache keys, invalidation, cross-module bubble, ESLint | `src/utils/queryKeys/` |
| `SEARCHABLE_SELECT_COMPONENT.md` | Reusable searchable dropdown spec | `src/components/ui/` |
| `SUPABASE_QUERY_STANDARDS.md` | Query patterns — `.range()`/`.limit()`/`.single()` | `src/lib/` |
| `TIMEZONE_POLICY.md` | SGT-only handling, `timezoneUtils` | `src/utils/timezoneUtils.ts` |
| `URL_STANDARDS.md` | Route naming + URL param patterns | `src/App.tsx` |
| `WORKFLOW_SYSTEM.md` | State machines, workflow engine, transitions | `src/lib/`, `src/hooks/` |

## Before working here

- Docs describe how systems work NOW, not how to build them.
- Naming/header standards: `.claude/rules/documentation.md`.
