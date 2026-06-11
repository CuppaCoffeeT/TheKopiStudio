---
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Rule: Supabase Query & Server-Side Pagination (MANDATORY)

**Last Updated**: 2026-05-31 SGT

## Summary

Supabase PostgREST silently caps queries at 1,000 rows. All new list views must use server-side pagination with `.range()` and `{ count: 'exact' }`. Legacy modules that haven't been migrated must add an explicit `.limit()` to avoid silent truncation. Dropdowns use `.limit(5000)`, single record lookups use `.single()`, and count-only queries use `{ count: 'exact', head: true }`.

## Detailed Patterns

### Forbidden — Silent Truncation

```typescript
// ❌ FORBIDDEN - silently truncated at 1,000 rows
const { data } = await supabase.from('people').select('*').order('last_name');
```

### New Modules — Server-Side Pagination

```typescript
// ✅ NEW modules - server-side pagination
const { data, count } = await supabase
  .from('people')
  .select('*', { count: 'exact' })
  .order('last_name')
  .range((page - 1) * 100, page * 100 - 1);
```

### Legacy Fix — Explicit Limit

```typescript
// ✅ LEGACY fix - add limit until migrated
const { data } = await supabase.from('people').select('*').limit(10000);
```

### Quick Reference

| Use Case | Pattern |
|----------|---------|
| **Dropdowns** | `.limit(5000)` |
| **Single record** | `.single()` |
| **Count only** | `{ count: 'exact', head: true }` |
| **List views** | `.range(from, to)` + `{ count: 'exact' }` |

### Pagination UX

- `placeholderData: keepPreviousData` — prevents layout shift during page transitions
- `isFetching` opacity fade — visual indicator during background refetch
- Debounced search (350ms) — prevents excessive API calls

### Reference Implementation

- `PeopleManagement.tsx` + `peopleService.ts`
- `useURLPagination` hook for URL state sync

## Known Patterns


### Unbounded queries on list views and dropdowns (4 occurrences, 2026-03-22 → 2026-03-24)

Recurring pattern: `.select('*')` used without `.range()` or `.limit()` on tables that can exceed 1,000 rows. Observed in:
- `workEntryService.ts` — unbounded work_entries fetch, silently truncated
- `projectService.ts` (now `src/lib/projects/`) — dropdown query missing `.limit(5000)`
- `InvoiceListPage.tsx` — client-side pagination fetching all records first
- `NotificationBell.tsx` — notification dropdown without limit

**Fix**: Every `.select()` call must have one of: `.range()` (paginated views), `.limit(5000)` (dropdowns), `.limit(10000)` (legacy), or `.single()` (detail). No exceptions.

_(Note 2026-05-31: several of the example files above were relocated during the 2026-05 services-drain remediation — e.g. `projectService.ts` → `src/lib/projects/`. The PATTERN remains the canonical lesson; paths are historical.)_

## References

- [docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md](../../docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md)
- Related: [url-standards.md](./url-standards.md) — URL state management for paginated views
- Related: [react-query.md](./react-query.md) — Cache management for paginated queries
