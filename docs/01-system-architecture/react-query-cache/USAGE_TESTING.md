# Usage — Testing & Examples

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production · **Priority**: 🟡 High

👉 Workspace router: [CONTEXT.md](./CONTEXT.md)

## 📋 Overview

Manual verification checklist after migrating an entity, plus reference patterns from the codebase. Extracted from [USAGE.md](./USAGE.md) per per-file token budget.

## 🧪 Testing Checklist

After migrating an entity, manually verify:

1. **List → Create → Back to list**
   - Go to list page (e.g., `/companylist`)
   - Create new item
   - Navigate back to list
   - ✅ New item appears WITHOUT manual refresh

2. **Detail → Update → Back to list**
   - Open a detail page
   - Update (e.g., change status)
   - Navigate back
   - ✅ List reflects the update WITHOUT manual refresh

3. **Detail → Update → Stay on detail**
   - Update item on detail page
   - ✅ Detail reflects the change immediately

4. **List → Detail → Delete → Back to list**
   - Delete from detail
   - Navigate back
   - ✅ Item removed from list WITHOUT manual refresh

5. **Dropdown selection after create** (cross-module bubble check)
   - Open a form with an entity dropdown
   - "Create New" → create → back to form
   - ✅ New item appears in dropdown WITHOUT manual refresh
   - **Also**: open the entity's own list page, search for it → ✅ appears (confirms the global root was invalidated, not just the scoped key)

### Network + Console checks

- DevTools → Network: CRUD triggers a refetch request; response has updated data.
- DevTools → Console: no React Query errors or key-mismatch warnings.

## 🎓 Examples from Codebase

### Good pattern — [`src/hooks/useEnhancedQuotations.ts`](../../../src/hooks/useEnhancedQuotations.ts)

Comprehensive invalidation across related roots:

```typescript
export const useCreateEnhancedQuotation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => quotationService.createQuotation(data),
    onSuccess: (newQuotation) => {
      invalidateEntity.quotations(queryClient);
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.nextNumber()
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.emailRecipients(newQuotation.id)
      });
      invalidateDashboards(queryClient);
      showSuccess(`Quotation "${newQuotation.quotation_number}" created successfully`);
    },
  });
};
```

### Prefetch for UX

```typescript
const queryClient = useQueryClient();

const handleMouseEnter = (companyId: string) => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.companies.detail(companyId),
    queryFn: () => fetchCompany(companyId),
    staleTime: 1000 * 60,
  });
};
```

## 📚 Related

- [USAGE.md](./USAGE.md) — parent (queries · mutations · component usage · best practices)
- [INVALIDATION.md](./INVALIDATION.md) · [INVALIDATION_CONFIG.md](./INVALIDATION_CONFIG.md)
- [MIGRATION.md](./MIGRATION.md) · [MIGRATION_TROUBLESHOOTING.md](./MIGRATION_TROUBLESHOOTING.md)
