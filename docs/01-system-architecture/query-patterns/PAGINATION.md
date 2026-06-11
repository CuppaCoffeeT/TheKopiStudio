# Server-Side Pagination Pattern

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-05-30 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

The mandatory pattern for all new list views: `.range(from, to)` + `{ count: 'exact' }`. Replaces client-side pagination (which silently truncates at 1,000 rows).

## 📚 Related

- Parent: [SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md)
- Sibling: [DROPDOWNS.md](./DROPDOWNS.md) · [COUNTS_AND_SINGLES.md](./COUNTS_AND_SINGLES.md) · [LEGACY_MIGRATION.md](./LEGACY_MIGRATION.md)
- [URL_STANDARDS.md](../URL_STANDARDS.md) — `useURLPagination` hook
- [react-query-cache/CONTEXT.md](../react-query-cache/CONTEXT.md) — query keys

---

## Core Pattern

```typescript
const PAGE_SIZE = 100;
const from = (page - 1) * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;

const { data, count, error } = await supabase
  .from('people')
  .select('*', { count: 'exact' })
  .eq('is_deleted', false)
  .order('last_name', { ascending: true })
  .range(from, to);

// data = 100 rows for current page
// count = total rows matching filters (e.g., 1,040)
```

## Standard Hook Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';

const PAGE_SIZE = 100;

interface UseEntityListParams {
  page: number;
  searchTerm?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useEntityList({
  page,
  searchTerm,
  status,
  sortBy = 'created_at',
  sortOrder = 'desc',
}: UseEntityListParams) {
  return useQuery({
    queryKey: queryKeys.entity.list({ page, searchTerm, status, sortBy, sortOrder }),
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('entity_table')
        .select('*', { count: 'exact' })
        .eq('is_deleted', false);

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, count, error } = await query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      return {
        items: data || [],
        totalCount: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
      };
    },
  });
}
```

## Standard Page Component (with `useURLPagination`)

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useURLPagination } from '@/hooks/useURLPagination';
import { Pagination } from '@/components/primitives/ui';
import { queryKeys } from '@/utils/queryKeys';

const PAGE_SIZE = 100;

const EntityListPage = () => {
  const { params, setters } = useURLPagination({
    sort: 'created_at',
    order: 'desc',
    status: 'all',
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: queryKeys.entity.list({
      search: params.search || undefined,
      status: params.status,
      sort: params.sort,
      order: params.order,
      page: params.page,
    }),
    queryFn: () => entityService.getPaginated({
      page: params.page,
      searchTerm: params.search || undefined,
      status: params.status !== 'all' ? params.status : undefined,
      sortBy: params.sort,
      sortOrder: params.order,
    }),
    placeholderData: keepPreviousData,
  });

  if (isLoading && !data) return <div>Loading...</div>;

  const totalItems = data?.totalCount || 0;
  const from = totalItems === 0 ? 0 : (params.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(params.page * PAGE_SIZE, totalItems);

  return (
    <>
      <SearchInput value={params.search} onChange={setters.setSearch} />
      <StatusFilter value={params.status} onChange={setters.setStatus} />

      <div className={`transition-opacity duration-150 ${isFetching ? 'opacity-60' : ''}`}>
        <Table>
          {data?.items.map(item => (
            <TableRow key={item.id}>...</TableRow>
          ))}
        </Table>

        <Pagination
          page={params.page}
          totalPages={data?.totalPages || 1}
          from={from}
          to={to}
          total={totalItems}
          onPageChange={setters.setPage}
        />
      </div>
    </>
  );
};
```

## Why Server-Side Pagination

| Aspect | Client-Side (old) | Server-Side (standard) |
|--------|-------------------|----------------------|
| Data fetched | ALL rows (1000+) | Only 100 rows per page |
| Row limit issue | Silently truncated at 1,000 | No limit — `.range()` bypasses cap |
| Search/filter | JavaScript in browser | Database query (faster) |
| Sort | JavaScript in browser | Database ORDER BY (faster) |
| Network payload | Large | Small (one page) |
| Scales to 10K+ rows | Slow, memory-heavy | Same speed regardless |

## Joined Queries with Pagination

```typescript
const { data, count } = await supabase
  .from('people')
  .select(`
    *,
    workers (jwp, wp_number, status),
    users!users_person_id_fkey (id, role, is_active)
  `, { count: 'exact' })
  .eq('is_deleted', false)
  .order('last_name')
  .range(from, to);
```

## Server-Side Search & Filter

```typescript
// Single field
query = query.ilike('name', `%${searchTerm}%`);

// Multiple fields (OR) — single line, no whitespace
query = query.or(
  `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
);

// Multiple statuses (IN)
query = query.in('status', ['pending_supervisor', 'pending_coordinator']);

// Date range
query = query.gte('created_at', startDate).lte('created_at', endDate);

// Dynamic sort
query = query.order(sortBy, { ascending: sortOrder === 'asc' });
```

## Enforcement Checklist

- [ ] Uses `useURLPagination` for URL-synced filter/sort/page state
- [ ] Uses `.range(from, to)` with `{ count: 'exact' }`
- [ ] Search/filter happens in the database, not in JavaScript
- [ ] Sorting happens via `.order()`, not in JavaScript
- [ ] `Pagination` receives `total` from server `count`
- [ ] Page resets to 1 when filters change (auto via `useURLPagination`)
- [ ] Query key includes all filter/sort/page params
- [ ] Uses `queryKeys` factory (see [react-query-cache/FACTORY.md](../react-query-cache/FACTORY.md))
- [ ] Uses `placeholderData: keepPreviousData`
- [ ] Uses `isFetching` opacity fade, not "Loading..." replacement
- [ ] Search input is debounced (350ms)
