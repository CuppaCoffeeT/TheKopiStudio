# Invalidation Strategy

**Created**: 2025-01-19 SGT · **Last Updated**: 2026-04-20 SGT
**Status**: 🟢 Production · **Priority**: 🔴 Critical

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Mutations must fan out invalidation to **every root the entity appears in**: parent-scoped keys, global entity root, and dashboard counts. Forgetting any one causes a stale-data bug that's invisible in development (component unmounts re-fetch on re-mount) but obvious in production (user clicks Back → list is wrong).

## 🔄 When to Invalidate What

| Operation | Invalidate | Reason |
|-----------|------------|--------|
| **CREATE** | `entity.all` + dashboards | New item affects lists, statistics, counts |
| **UPDATE** | `entity.detail(id)` + `entity.lists()` | Update specific item + refresh all lists showing it |
| **DELETE** | `entity.all` + dashboards | Removed item affects lists, statistics, counts |
| **Bulk Update** | `entity.all` + dashboards | Multiple items changed, safest to invalidate everything |
| **Status Change** | `entity.detail(id)` + `entity.lists()` + parent lists + dashboards | Status affects filtering, counts, parent queries |

## 🚨 Cross-module bubble rule (W09, Apr 2026)

**Problem**: User adds a Client Contact from Project Detail → presses Back → opens Client Contacts module → searches for the new contact → not found until hard refresh.

**Root cause**: The mutation invalidated only the parent-scoped key (`queryKeys.projects.clientContacts(projectId)`) and forgot the global entity root (`queryKeys.clientContacts.all`) plus dashboard counts.

**Rule**: Every mutation's `onSuccess` must invalidate **all roots the entity appears in** — not just the parent-scoped key it was mutated through.

```typescript
// ❌ BAD — only parent-scoped; global list stays stale
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.clientContacts(projectId)
  });
}

// ✅ GOOD — scoped + global root + dashboards
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.clientContacts(projectId)
  });
  invalidateEntity.clientContacts(queryClient); // global root
  invalidateDashboards(queryClient);            // any dashboard the entity feeds
}
```

## Shared helpers

Both live in [`src/utils/queryKeys.ts`](../../../src/utils/queryKeys.ts):

- **`invalidateEntity.<name>(queryClient)`** — one-line "invalidate all root queries for this entity." Every entity registered in the factory has one. Use this instead of `queryClient.invalidateQueries({ queryKey: queryKeys.<name>.all })` so adding new roots later doesn't require touching every call site.
- **`invalidateDashboards(queryClient)`** — one-line call that invalidates every role dashboard / count root (dashboard, coordinatorDashboard, supervisorDashboard, managementCounts, reportDashboard, nceDashboard, supervisorCounts, drafterCounts + legacy standalone count keys). Call this in every source-entity mutation so badges refresh without a manual refresh.

## Invalidation Examples

```typescript
// CREATE - Invalidate everything
onSuccess: () => {
  invalidateEntity.companies(queryClient);
  invalidateDashboards(queryClient);
}

// UPDATE - Invalidate detail + lists + dashboards
onSuccess: (updated) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(updated.id) });
  queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
  invalidateDashboards(queryClient);
}

// DELETE - Invalidate everything
onSuccess: () => {
  invalidateEntity.companies(queryClient);
  invalidateDashboards(queryClient);
}

// CROSS-MODULE (nested/scoped view) — scoped + global + dashboards
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.clientContacts(projectId)
  });
  invalidateEntity.clientContacts(queryClient);
  invalidateDashboards(queryClient);
}
```

## ⚙️ Configuration

Global QueryClient defaults + per-query `staleTime` tuning by data freshness: [INVALIDATION_CONFIG.md](./INVALIDATION_CONFIG.md).

## 📚 Related
- [CONTEXT.md](./CONTEXT.md) — workspace router (start here)
- [FACTORY.md](./FACTORY.md) — the factory these invalidations key off of
- [INVALIDATION_CONFIG.md](./INVALIDATION_CONFIG.md) — staleTime tuning + global config
- [USAGE.md](./USAGE.md) — full mutation patterns with `onSuccess` examples
- [USAGE_TESTING.md](./USAGE_TESTING.md) — verification checklist
- [MIGRATION.md](./MIGRATION.md) — checklist for adding a new entity
- [ENFORCEMENT.md](./ENFORCEMENT.md) — ESLint rule requiring mutations in hooks, not components
- [decisions.md](./decisions.md) — canonical helpers decision (2026-04-19)
- [lessons.md](./lessons.md) — cross-module bubble lesson (origin of this rule)
