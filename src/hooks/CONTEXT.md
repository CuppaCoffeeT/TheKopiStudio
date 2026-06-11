# Hooks — Shared Primitive Root

~115 custom React hooks. One of four shared primitive roots (X5). Most wrap React Query against Supabase; a few are UI-state utilities.

## Scope

**Belongs**: `use<Entity>` data hooks · UI-state hooks (`useDebounce`, `useURLPagination`, `useLocalStorage`, `use-mobile`) · role-derived count hooks.
**Doesn't**: components (`src/components/`); pure helpers (`src/utils/`); raw Supabase service calls (`src/services/`). `useAuth` lives in `src/contexts/AuthContext.tsx`.

## Navigation

| Pattern | Examples |
|---------|----------|
| Entity data | `useProjects`, `useQuotation*`, `useInvoices`, `useClientCompanies`, `useWorkers`, `useDrafters` |
| Counts / dashboards | `useDashboardCounts`, `useCoordinatorCounts`, `useDrafterCounts`, `useNCEDashboardCounts` |
| Lifecycle / status | `useGeneralWorksStatusLog`, `useTrialTrenchStatusLog`, `useWorkerOTSummary` |
| Pagination + UI | `useURLPagination`, `useDebounce`, `useLocalStorage`, `use-mobile` |
| Email / comms | `useEmailThreads`, `useGmailAccounts`, `useEmailTemplates` (email-only hooks relocated to `src/features/email/hooks/`) |
| Files / NAS | `useNASHealth`, `useTrialTrenchFiles` + `useThumbnailUrl` + `useTrialTrenchSummary` (under `trialTrenchAttachments/`; old `useTrialTrenchAttachments` is a re-export shim), `useInvoiceAttachments` |
| Compliance / approvals | `useUserApprovals`, `usePendingChase*`, `usePendingNDA*` |

## Before working here

- **Naming**: `useCamelCase.ts`, one hook per file.
- **Query keys**: `@/utils/queryKeys` factory only — `.all` / `.list(filters)` / `.detail(id)` (rule: react-query).
- **Mutation invalidation**: invalidate both `.all` AND `.detail(id)` on success.
- **Dashboard refresh**: source-entity mutations call `invalidateDashboards()` (W21-2 wired this into 17 hooks).
- **Pagination**: list hooks use `.range(from,to)` + `{ count: 'exact' }` + accept `from`/`to` from `useURLPagination` (rule: query-compliance).
- **Single fetch**: `.single()` for detail; `.limit(5000)` for dropdowns; `.limit(10000)` legacy fix only.
- **Dates**: `@/utils/timezoneUtils` (rule: timezone).
- **`useAuth.tsx.deprecated`**: kept on purpose — don't delete without checking refs.

## 📚 Related

- [src/CONTEXT.md](../CONTEXT.md) · [.claude/rules/react-query.md](../../.claude/rules/react-query.md) · [.claude/rules/query-compliance.md](../../.claude/rules/query-compliance.md)
- [docs/01-system-architecture/react-query-cache/CONTEXT.md](../../docs/01-system-architecture/react-query-cache/CONTEXT.md) · [W21_REACT_QUERY_CACHE_FIX.md](../../docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md)
