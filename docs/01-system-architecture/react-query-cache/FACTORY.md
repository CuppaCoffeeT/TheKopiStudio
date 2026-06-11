# Query Key Factory Pattern

**Created**: 2025-01-19 SGT · **Last Updated**: 2026-04-20 SGT
**Status**: 🟢 Production · **Priority**: 🔴 Critical

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Centralized query key factory at [`src/utils/queryKeys.ts`](../../../src/utils/queryKeys.ts). Every React Query key in the codebase MUST come from here — hardcoded literals are a lint `error`.

## 🎯 Architecture Principles

### 1. Single Source of Truth
**All query keys MUST be defined in centralized query key factories.** Never hardcode query keys directly in components or hooks.

```typescript
// ❌ FORBIDDEN - Hardcoded keys
useQuery({ queryKey: ['companies'] })
useQuery({ queryKey: ['clientCompanies', { isActive: true }] })

// ✅ REQUIRED - Factory-based keys
import { queryKeys } from '@/utils/queryKeys';
useQuery({ queryKey: queryKeys.companies.list({ isActive: true }) })
```

### 2. Hierarchical Key Structure
Query keys MUST follow a hierarchical structure enabling broad or granular invalidation:

```
[entity] → [entity, type] → [entity, type, filters/id]
```

**Example**:
```typescript
['companies']                                // Root - invalidates ALL
['companies', 'list']                        // Type - invalidates all lists
['companies', 'list', { isActive: true }]   // Specific - invalidates this list only
['companies', 'detail']                      // Type - invalidates all details
['companies', 'detail', 'abc-123']          // Specific - invalidates one detail
```

### 3. Comprehensive Invalidation
**All mutations MUST invalidate both list AND detail queries** to prevent stale data:

```typescript
// ✅ CORRECT - Invalidate parent list + specific detail
onSuccess: (updatedEntity) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.companies.all }); // All company queries
  queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(id) }); // Specific detail
}

// ❌ WRONG - Only detail, list stays stale
onSuccess: (updatedEntity) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(id) });
}
```

### 4. Type Safety
Query key factories MUST use TypeScript's `as const` assertion for type inference and autocomplete:

```typescript
export const queryKeys = {
  companies: {
    all: ['companies'] as const, // Type: readonly ['companies']
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: CompanyFilters) => [...queryKeys.companies.lists(), filters] as const,
  }
}
```

---

## 🏗️ Factory Structure

**File**: [`src/utils/queryKeys.ts`](../../../src/utils/queryKeys.ts)

```typescript
/**
 * Centralized Query Key Factories
 *
 * MANDATORY: All React Query keys MUST be defined here.
 * Never hardcode query keys in components/hooks.
 *
 * Structure: [entity, type, filters/id]
 */

export const queryKeys = {
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: { isActive?: boolean; searchTerm?: string }) =>
      [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
    statistics: () => [...queryKeys.companies.all, 'statistics'] as const,
  },

  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: { status?: string; searchTerm?: string }) =>
      [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    clientContacts: (projectId: string) =>
      [...queryKeys.projects.detail(projectId), 'client-contacts'] as const,
    spatialFeatures: (projectId: string) =>
      [...queryKeys.projects.detail(projectId), 'spatial-features'] as const,
  },

  quotations: {
    all: ['quotations'] as const,
    lists: () => [...queryKeys.quotations.all, 'list'] as const,
    list: (filters: any) => [...queryKeys.quotations.lists(), filters] as const,
    details: () => [...queryKeys.quotations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quotations.details(), id] as const,
    nextNumber: () => [...queryKeys.quotations.all, 'next-number'] as const,
    emailRecipients: (quotationId: string) =>
      [...queryKeys.quotations.detail(quotationId), 'email-recipients'] as const,
    logs: (quotationId: string) =>
      [...queryKeys.quotations.detail(quotationId), 'logs'] as const,
  },

  // ... further entities (workers, staff, generalWorks, people, clientContacts, etc.)
  // See src/utils/queryKeys.ts for the full factory (2300+ lines)
};

// Type exports for filter objects
export type CompanyFilters = {
  isActive?: boolean;
  searchTerm?: string;
};

export type ProjectFilters = {
  status?: string;
  searchTerm?: string;
};
```

## When to add a new entity

Follow the same shape — `all` / `lists()` / `list(filters)` / `details()` / `detail(id)` plus any entity-specific aggregates (`statistics`, `byCompany`, etc.). Also register the entity in the `invalidateEntity` helper (see [INVALIDATION.md](./INVALIDATION.md)) so mutations have a one-liner for "invalidate all roots."

## 📚 Related
- [CONTEXT.md](./CONTEXT.md) — workspace router (start here)
- [INVALIDATION.md](./INVALIDATION.md) — when and how to invalidate
- [USAGE.md](./USAGE.md) — query + mutation implementation patterns
- [MIGRATION.md](./MIGRATION.md) — per-entity migration checklist
- [ENFORCEMENT.md](./ENFORCEMENT.md) — ESLint rules that require factory use
- [decisions.md](./decisions.md) · [lessons.md](./lessons.md) — settled decisions and past failures
