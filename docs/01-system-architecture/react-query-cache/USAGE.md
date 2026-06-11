# Usage Patterns

**Created**: 2025-01-19 SGT · **Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production · **Priority**: 🟡 High

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Copy-paste patterns for queries, mutations, and component usage. Follow these — the ESLint rules and `invalidateEntity` / `invalidateDashboards` helpers assume this shape.

## 📝 Query Implementation

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/utils/queryKeys';

// ✅ CORRECT - List query with filters
export function useCompanies(filters: { isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.companies.list(filters),
    queryFn: () => fetchCompanies(filters),
    staleTime: 1000 * 60, // 1 minute
  });
}

// ✅ CORRECT - Detail query
export function useCompany(id: string) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => fetchCompany(id),
    enabled: !!id,
  });
}

// ✅ CORRECT - Related data query (nested under parent)
export function useProjectClientContacts(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.clientContacts(projectId),
    queryFn: () => fetchProjectClientContacts(projectId),
    enabled: !!projectId,
  });
}
```

## 📝 Mutation Implementation

**All mutations MUST live in `src/hooks/use<Entity>.ts` (or a feature-scoped hooks folder) — lint `error` if placed in `src/components/**`.**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateEntity, invalidateDashboards } from '@/utils/queryKeys';
import { showSuccess, showError } from '@/utils/toastHelper';

// ✅ CORRECT - Create mutation with comprehensive invalidation
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyData) => createCompany(data),
    onSuccess: (newCompany) => {
      invalidateEntity.companies(queryClient);
      invalidateDashboards(queryClient);
      showSuccess(`Company "${newCompany.company_name}" created successfully`);
    },
    onError: (error) => {
      showError('Failed to create company');
      console.error('Create company error:', error);
    },
  });
}

// ✅ CORRECT - Update mutation with specific + broad invalidation
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCompanyData }) =>
      updateCompany(id, data),
    onSuccess: (updatedCompany) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.detail(updatedCompany.id)
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.lists()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.companies.statistics()
      });
      invalidateDashboards(queryClient);
      showSuccess(`Company "${updatedCompany.company_name}" updated successfully`);
    },
  });
}

// ✅ CORRECT - Delete mutation
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      invalidateEntity.companies(queryClient);
      invalidateDashboards(queryClient);
      showSuccess('Company deleted successfully');
    },
  });
}
```

## 📝 Component Usage

```typescript
// Feature-scoped hooks live under `src/features/<domain>/hooks/`.
import { useCompanyList } from '@/features/companies/hooks/useCompanyList';
import { useCreateCompany } from '@/features/companies/hooks/useCreateCompany';

function CompanyList() {
  const { data: companies, isLoading } = useCompanyList({ search: '', showInactive: false, page: 1, sort: 'company_name', order: 'asc' });
  const createMutation = useCreateCompany({ userId });

  const handleCreate = (data: CompanyFormData) => {
    createMutation.mutate(data);
    // After success, ALL company queries automatically refetch
    // No manual refresh needed.
  };

  return (/* component JSX */);
}
```

---

## ✅ Best Practices

### DO's

1. **Always use query key factories**
   ```typescript
   queryKey: queryKeys.companies.list({ isActive: true })
   ```

2. **Use shared helpers for invalidation fan-out**
   ```typescript
   invalidateEntity.companies(queryClient);
   invalidateDashboards(queryClient);
   ```

3. **Use TypeScript types for filters** — defined alongside the factory entry.

4. **Group related queries under parent**
   ```typescript
   queryKeys.projects.clientContacts(projectId)
   // Results in: ['projects', 'detail', id, 'client-contacts']
   ```

5. **Show user feedback on mutations** via `showSuccess` / `showError`.

### DON'Ts

1. **Never hardcode query keys** — ESLint `error`.
2. **Never use inconsistent key names** for the same entity (`['companies']` vs `['clientCompanies']`).
3. **Never skip invalidations** on mutations.
4. **Never invalidate only detail without list** — the list stays stale.
5. **Never place `useMutation` in `src/components/**`** — ESLint `error`. Extract to a hook.

## 🧪 Testing & Examples

Manual verification checklist + reference patterns from the codebase: [USAGE_TESTING.md](./USAGE_TESTING.md).

## 📚 Related
- [CONTEXT.md](./CONTEXT.md) — workspace router (start here)
- [FACTORY.md](./FACTORY.md) — factory shape
- [INVALIDATION.md](./INVALIDATION.md) — `invalidateEntity` / `invalidateDashboards` helpers
- [INVALIDATION_CONFIG.md](./INVALIDATION_CONFIG.md) — staleTime tuning + global config
- [MIGRATION.md](./MIGRATION.md) — per-entity migration checklist
- [USAGE_TESTING.md](./USAGE_TESTING.md) — verification checklist + codebase examples
- [ENFORCEMENT.md](./ENFORCEMENT.md) — ESLint rules
- [decisions.md](./decisions.md) · [lessons.md](./lessons.md) — settled decisions and past failures
