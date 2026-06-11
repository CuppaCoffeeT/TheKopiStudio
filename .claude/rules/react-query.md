---
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Rule: React Query Cache Management (MANDATORY)

**Last Updated**: 2026-05-31 SGT

## Summary

All React Query usage must follow the centralized query key factory pattern defined in `@/utils/queryKeys`. Never use hardcoded string arrays as query keys. The factory provides a hierarchical key structure (`all` → `lists()` → `list(filters)` → `details()` → `detail(id)`) that enables precise cache invalidation. Mutations must invalidate both `.all` and `.detail(id)`.

## Detailed Patterns

### Forbidden — Hardcoded Keys

```typescript
// ❌ FORBIDDEN - hardcoded keys
useQuery({ queryKey: ['projects'] })
queryClient.invalidateQueries({ queryKey: ['projects'] })
```

### Correct — Centralized Factory

```typescript
// ✅ CORRECT - centralized factory
import { queryKeys } from '@/utils/queryKeys';
useQuery({ queryKey: queryKeys.projects.list({}) })
queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
// Mutations: invalidate both .all AND .detail(id)
```

### Key Structure

```
queryKeys.{entity}.all          → ['entity']
queryKeys.{entity}.lists()      → ['entity', 'list']
queryKeys.{entity}.list(filters)→ ['entity', 'list', { ...filters }]
queryKeys.{entity}.details()    → ['entity', 'detail']
queryKeys.{entity}.detail(id)   → ['entity', 'detail', id]
```

### Global Config

| Setting | Value |
|---------|-------|
| `staleTime` | 1 minute |
| `gcTime` | 5 minutes |
| `refetchOnMount` | `true` |
| `refetchOnWindowFocus` | `true` |

### Mutation Invalidation Pattern

When a mutation succeeds, invalidate:
1. `queryKeys.{entity}.all` — refreshes all list views
2. `queryKeys.{entity}.detail(id)` — refreshes the specific detail view

## References

- [docs/01-system-architecture/react-query-cache/CONTEXT.md](../../docs/01-system-architecture/react-query-cache/CONTEXT.md)
- Source: `src/utils/queryKeys/` (folder barrel `index.ts` + sub-modules: core/people/fieldops/financial/comms/misc/types). The `@/utils/queryKeys` import resolves to this barrel.
- Related: [query-compliance.md](./query-compliance.md) — Supabase query patterns that feed into React Query
