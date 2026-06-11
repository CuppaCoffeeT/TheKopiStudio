# Migration Troubleshooting

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production · **Priority**: 🟡 High

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Diagnostic recipes for common post-migration symptoms. Extracted from [MIGRATION.md](./MIGRATION.md) per per-file token budget.

## 🐛 Issue: Data still stale after migration

**Possible causes**:
1. Query key mismatch — old key still in use somewhere
2. Invalidation using wrong key
3. Multiple components using different query keys for the same data
4. **Cross-module bubble gap** — mutation invalidated only the scoped key, not the global entity root (see [INVALIDATION.md](./INVALIDATION.md))

**Debug**:

```typescript
// Log what gets invalidated
queryClient.invalidateQueries({
  queryKey: queryKeys.companies.all,
  predicate: (query) => {
    console.log('Invalidating:', query.queryKey);
    return true;
  }
});

// React Query DevTools (install: @tanstack/react-query-devtools)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// In App.tsx: <ReactQueryDevtools initialIsOpen={false} />
```

**Fix**:
- Use DevTools → React Query tab
- Find the query that's not refetching
- Check its query key
- Grep the codebase for that exact key → update to use the factory
- If the mutation was done through a scoped/parent view, ensure `invalidateEntity.<name>(qc)` is called **in addition to** the parent-scoped invalidation

## 🐛 Issue: Too many network requests

**Cause**: `staleTime` too low, or over-invalidating.

**Fix**:

```typescript
// Increase staleTime for rarely-changing data
useQuery({
  queryKey: queryKeys.companies.list({}),
  queryFn: fetchCompanies,
  staleTime: 1000 * 60 * 2, // 2 minutes
});

// Invalidate more specifically
queryClient.invalidateQueries({
  queryKey: queryKeys.companies.detail(id) // Only this detail
});
```

## 🐛 Issue: TypeScript errors after migration

**Cause**: Filter types not matching factory definition.

**Fix**: define explicit filter types alongside the factory entry (see [MIGRATION.md](./MIGRATION.md) Phase 1.1).

## 📚 Related

- [MIGRATION.md](./MIGRATION.md) — parent (per-entity checklist)
- [INVALIDATION.md](./INVALIDATION.md) — cross-module bubble rule
- [INVALIDATION_CONFIG.md](./INVALIDATION_CONFIG.md) — staleTime tuning
- [CONTEXT.md](./CONTEXT.md) — workspace router
