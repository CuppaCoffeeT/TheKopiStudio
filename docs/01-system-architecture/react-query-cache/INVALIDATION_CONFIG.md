# React Query Configuration & staleTime Tuning

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production · **Priority**: 🟡 High

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Global QueryClient defaults + per-query `staleTime` tuning by data freshness. Extracted from [INVALIDATION.md](./INVALIDATION.md) per per-file token budget.

## ⚙️ Global Defaults — [main.tsx](../../../src/main.tsx)

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,       // 1 minute — data considered "fresh"
      gcTime: 1000 * 60 * 5,      // 5 minutes — inactive cache retention
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

## Per-Query Overrides

```typescript
// Frequently changing data — lower staleTime
useQuery({
  queryKey: queryKeys.quotations.list({}),
  queryFn: fetchQuotations,
  staleTime: 1000 * 30, // 30 seconds
});

// Rarely changing data — higher staleTime
useQuery({
  queryKey: queryKeys.modules.userModules(userId),
  queryFn: () => getUserModules(userId),
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Static data — infinite staleTime
useQuery({
  queryKey: ['app-config'],
  queryFn: fetchAppConfig,
  staleTime: Infinity,
});
```

## Optimal staleTime by data type

| Data Type | staleTime | Reasoning |
|-----------|-----------|-----------|
| **Frequently Updated** (quotations, work entries) | 30-60 seconds | Balance freshness vs requests |
| **Moderately Updated** (projects, companies) | 1-2 minutes | Most common use case |
| **Rarely Updated** (modules, user permissions) | 5 minutes | Reduce unnecessary requests |
| **Static** (app config, dropdown options) | Infinity | Never refetch |
| **Real-time** (notifications, live counts) | 0 seconds | Always fresh |

## 📚 Related

- [INVALIDATION.md](./INVALIDATION.md) — parent (when to invalidate what + cross-module bubble rule)
- [CONTEXT.md](./CONTEXT.md) — workspace router
