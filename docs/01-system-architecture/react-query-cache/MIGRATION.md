# Migration Guide

**Created**: 2025-01-19 SGT · **Last Updated**: 2026-04-20 SGT
**Status**: 🟢 Production · **Priority**: 🟡 High

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Per-entity migration checklist + troubleshooting. The Dec-2025 hook-file pass is complete (see [_archive/MIGRATION_LOG_2025.md](./_archive/MIGRATION_LOG_2025.md)); the W21 pass (Apr 2026) closed the component/page gap — see [ENFORCEMENT.md](./ENFORCEMENT.md). This guide is for **new entities** being added.

## 🚀 Adding a new entity

### Phase 1: Setup

**1.1** — Add factory entry to [`src/utils/queryKeys.ts`](../../../src/utils/queryKeys.ts):

```typescript
entityName: {
  all: ['entity-name'] as const,
  lists: () => [...queryKeys.entityName.all, 'list'] as const,
  list: (filters: EntityNameFilters) => [...queryKeys.entityName.lists(), filters] as const,
  details: () => [...queryKeys.entityName.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.entityName.details(), id] as const,
}
```

**1.2** — Register in the `invalidateEntity` helper so mutations get the one-liner:

```typescript
export const invalidateEntity = {
  // ...
  entityName: (qc: QueryClient) =>
    qc.invalidateQueries({ queryKey: queryKeys.entityName.all }),
};
```

### Phase 2: Hooks

- [ ] Create `src/hooks/useEntityName.ts` with `useEntityName`, `useEntityNameDetail`, `useCreateEntityName`, `useUpdateEntityName`, `useDeleteEntityName`. See [USAGE.md](./USAGE.md) for patterns.
- [ ] Every mutation `onSuccess`: call `invalidateEntity.entityName(qc)` + `invalidateDashboards(qc)` + any parent-scoped keys the entity is nested under.
- [ ] Do **not** place `useMutation` in a component file — ESLint `error`.

### Phase 3: Components

- [ ] Components call the hooks — never inline `useQuery` / `useMutation`.
- [ ] Display toast feedback from the hook's `onSuccess` / `onError`.

## ✅ Verification

Test this workflow (covers the cross-module bubble gap):

1. List Page → Create → Back to List → ✅ New item appears without refresh
2. Detail Page → Update → Back to List → ✅ Updated data shows
3. List → Detail → Delete → Back to List → ✅ Item removed
4. Dropdown Selection After Create (cross-module) → ✅ Newly created item appears in the source entity's own list page without refresh
5. Network tab: CRUD operation triggers a refetch request; response has fresh data.
6. Console: no React Query errors or key-mismatch warnings.

## 🐛 Troubleshooting

Diagnostic recipes for stale data, excessive requests, and TypeScript errors: [MIGRATION_TROUBLESHOOTING.md](./MIGRATION_TROUBLESHOOTING.md).

---

## 📋 Implementation Checklist

### Pre-migration
- [ ] Read [FACTORY.md](./FACTORY.md), [INVALIDATION.md](./INVALIDATION.md), [USAGE.md](./USAGE.md), [ENFORCEMENT.md](./ENFORCEMENT.md)
- [ ] Install React Query DevTools if not already present
- [ ] Confirm `staleTime` global default is 1 minute in [main.tsx](../../../src/main.tsx)

### Migration (per entity)
- [ ] Add entity to `queryKeys.ts` + `invalidateEntity` helper
- [ ] Create hook file `src/hooks/use<Entity>.ts`
- [ ] Update all callers to use the hook
- [ ] Test CRUD operations per the Verification checklist above
- [ ] Verify ESLint passes (`npm run lint`)

### Post-migration
- [ ] No hardcoded query keys remaining for this entity (grep `'<entity-name>'`)
- [ ] No `useMutation` in `src/components/**` for this entity
- [ ] All tests passing
- [ ] Append a decision to [decisions.md](./decisions.md) if migration surfaced a pattern worth preserving
- [ ] Append a lesson to [lessons.md](./lessons.md) if something failed in a non-obvious way

## 📚 Related
- [CONTEXT.md](./CONTEXT.md) — workspace router (start here)
- [FACTORY.md](./FACTORY.md) — factory shape referenced by Phase 1
- [INVALIDATION.md](./INVALIDATION.md) — fan-out rules for the mutations you'll be adding
- [USAGE.md](./USAGE.md) — copy-paste patterns for hooks + components
- [ENFORCEMENT.md](./ENFORCEMENT.md) — W21 correction closing the component/page gap
- [decisions.md](./decisions.md) · [lessons.md](./lessons.md) — settled decisions and past failures
- [_archive/MIGRATION_LOG_2025.md](./_archive/MIGRATION_LOG_2025.md) — original Dec-2025 hook-file pass
- [docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md](../../../docs/99-refactor/_system/workflows/W21_REACT_QUERY_CACHE_FIX.md) — W21 card
