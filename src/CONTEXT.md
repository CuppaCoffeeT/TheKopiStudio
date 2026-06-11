# Source Code

React 18 + TypeScript app code for the AppBase Trench Trace Portal. Router only — detail lives in the linked guides.

## What belongs / doesn't

Components, pages, hooks, services, utilities, types, contexts. NOT: migrations → `supabase/` · docs → `docs/` · rules/commands → `.claude/`.

## Navigation

New code goes in `features/<name>/` (Bulletproof React), not `pages/` or `services/`.

| Folder | Purpose | Status |
|--------|---------|--------|
| `features/` | 51 feature modules, each `components/hooks/api/lib/pages/` | ✅ primary |
| `components/primitives/` | Design-system primitives, 8 groups (shell/overlays/form/detail/dashboard/charts/ui/atoms) | ✅ primary |
| `components/ui/` | shadcn base + sanctioned domain wrappers (staff-select, contact-form…) | ✅ primary |
| `components/shared/` | Cross-feature surfaces used by ≥2 features (cdw-spatial, nas, email…) | ✅ primary |
| `pages/` | Thin route shells re-exporting `features/<name>/pages/` | 🟠 thinned |
| `services/` | Draining into `features/<x>/api/` — add nothing here | 🟠 drain target |
| `hooks/` | Cross-feature hooks (useAuth, useURLPagination, useViewAs…) | ✅ stable |
| `utils/` | Pure fns (timezoneUtils, queryKeys, toastHelper) | ✅ stable |
| `lib/` | Infra (supabase client, queryClient, ThemeProvider) | ✅ stable |
| `types/` `contexts/` `integrations/` | Global types · React Context providers · Supabase setup | ✅ stable |

**Component placement:** primitive exists → `primitives/<group>/` · ≥2 features → `shared/<domain>/` · 1 feature → `features/<x>/components/` · shadcn base → `ui/`.

## Before working here

- State: React Query (`utils/queryKeys.ts` factory) for server, Context for UI only
- Forms: RHF + Zod · Dates: `utils/timezoneUtils.ts` only · no raw date-fns
- Toast: `showSuccess`/`showError` from `utils/toastHelper.ts` — no useToast
- Lists: `hooks/useURLPagination.ts` + server-side `.range()` pagination
- Access: `useAuth()` module check, never role strings · Portals in dialogs
- Rule detail in `.claude/rules/` (timezone, toast-system, query-compliance, react-query, module-access)

## Related

- Feature logic → `docs/03-features/CONTEXT.md` · Primitives → `src/components/primitives/CONTEXT.md`
- Architecture → `docs/01-system-architecture/` (DESIGN_SYSTEM, MODULE_SYSTEM, DATABASE_POLICY, WORKFLOW_SYSTEM)
