# Hooks — Shared Primitive Root

10 cross-feature React hooks (filesystem count 2026-10-28 — the AppBase-era entity hooks left with their features or were deleted as unused). One of four shared primitive roots (X5).

## Scope

**Belongs**: `use<Entity>` data hooks · UI-state hooks (`useDebounce`, `useURLPagination`, `useScrolled`, `useTabsOverflow`) · shell/session hooks.
**Doesn't**: components (`src/components/`); pure helpers (`src/utils/`); raw Supabase service calls (`src/services/`). `useAuth` lives in `src/contexts/AuthContext.tsx`.

## Navigation

| Pattern | Examples |
|---------|----------|
| Pagination + UI | `useURLPagination`, `useDebounce`, `useScrolled`, `useTabsOverflow` |
| Shell / chrome | `useDashboardChrome`, `useNotificationsBell`, `useViewAs` |
| Auth / session | `useLoginRedirect`, `useRecoverySession` |

Deleted 2026-10-28 as unused: `use-mobile`, `useEditableCard`, `useMediaQuery`, `usePendingUserCount` ([DEPRECATIONS.md](../../docs/99-refactor/_system/DEPRECATIONS.md)).

## Before working here

- **Naming**: `useCamelCase.ts`, one hook per file.
- **Query keys**: `@/utils/queryKeys` factory only — `.all` / `.list(filters)` / `.detail(id)` (rule: react-query).
- **Mutation invalidation**: invalidate both `.all` AND `.detail(id)` on success.
- **Pagination**: list hooks use `.range(from,to)` + `{ count: 'exact' }` + accept `from`/`to` from `useURLPagination` (rule: query-compliance).
- **Single fetch**: `.single()` for detail; `.limit(5000)` for dropdowns; `.limit(10000)` legacy fix only.
- **Dates**: `@/utils/timezoneUtils` (rule: timezone).

## 📚 Related

- [src/CONTEXT.md](../CONTEXT.md) · [.claude/rules/react-query.md](../../.claude/rules/react-query.md) · [.claude/rules/query-compliance.md](../../.claude/rules/query-compliance.md)
- [docs/01-system-architecture/react-query-cache/CONTEXT.md](../../docs/01-system-architecture/react-query-cache/CONTEXT.md) · [W21_REACT_QUERY_CACHE_FIX.md](../../docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md)
