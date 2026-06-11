# src/lib — Shared Non-UI Primitives

**Related:** [W07_SHARED_PRIMITIVES.md](../../docs/99-refactor/_system/workflows/W07_SHARED_PRIMITIVES.md)

Cross-feature TypeScript helpers with no React component output. Bulletproof React layout. **Deep imports only** (Q-W07-b) — no barrel `index.ts`.

## Structure

```
src/lib/
├── design/        # Design tokens + ThemeProvider (W08 Phase 1)
│   ├── tokens.ts      # Type-safe token accessors — ctaTokens, cardTokens, etc.
│   └── ThemeProvider.tsx
├── queries/       # TanStack Query helpers (tkdodo pattern)
│   ├── queryOptions.ts       # Typed queryOptions() wrapper
│   ├── mutationTemplate.ts   # onSuccess → invalidate + toast template
│   └── invalidateHelpers.ts  # re-exports invalidateDashboards (W21)
├── supabase/      # Typed client wrappers — enforce .range/.limit/.single
│   └── typed-client.ts       # fetchPage · fetchOne · fetchDropdown · fetchCount + re-exported `db`
└── utils.ts       # cn() classname merger (shadcn baseline)
```

## Consume from a feature — examples

### queryOptions (tkdodo pattern)

Declare a query once, reuse across `useQuery`, `prefetchQuery`, `invalidateQueries`:

```tsx
// src/features/staff-management/api/staffOptions.ts
import { sharedQueryOptions } from '@/lib/queries/queryOptions';
import { queryKeys } from '@/utils/queryKeys';
import { staffEmploymentService } from '@/lib/people/staffEmploymentService';

export const staffListOptions = (filters: StaffFilters) =>
  sharedQueryOptions({
    queryKey: queryKeys.staff.list(filters),
    queryFn: () => staffEmploymentService.getAll(filters),
    staleTime: 60_000,
  });

// In the component:
const { data } = useQuery(staffListOptions({ isActive: true }));

// In a prefetcher:
queryClient.prefetchQuery(staffListOptions({ isActive: true }));
```

### Mutation template (W21 invalidation contract)

Every mutation must invalidate both the entity root AND the dashboards that aggregate it — W21 baked this into a template:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buildMutationCallbacks } from '@/lib/queries/mutationTemplate';
import { queryKeys } from '@/utils/queryKeys';

const queryClient = useQueryClient();

const updateStaff = useMutation({
  mutationFn: (input: UpdateStaffInput) =>
    staffEmploymentService.update(input.personId, input.data),
  ...buildMutationCallbacks({
    queryClient,
    entityKey: queryKeys.staff.all,
    detailKey: (input) => queryKeys.staff.detail(input.personId),
    successMessage: 'Staff member updated',
  }),
});
```

The template auto-runs:
1. `queryClient.invalidateQueries({ queryKey: entityKey })`
2. `queryClient.invalidateQueries({ queryKey: detailKey(vars, data) })` if provided
3. `invalidateDashboards(queryClient)` (can be disabled via `invalidateDashboardCaches: false`)
4. `showSuccess(successMessage)` / `showError(err.message)`

### Typed Supabase client (query-compliance enforced)

The project's `.claude/rules/query-compliance.md` forbids `.select()` without a terminator (`.range`, `.limit`, `.single`, or `{ head: true }`). `typed-client.ts` bakes the four shapes into named helpers so feature code can't forget:

```tsx
import { fetchPage, fetchOne, fetchDropdown, fetchCount } from '@/lib/supabase/typed-client';

// Paginated list — maps directly to `<DataTable fetchPage={...}>`:
const page = await fetchPage('people', {
  from, to,
  build: (q) => q.eq('is_active', true).ilike('last_name', `%${search}%`).order('last_name'),
});
// → { rows, count } ; forces `.range(from, to)` + `{ count: 'exact' }`

// Single record by id:
const person = await fetchOne('people', { id, build: (q) => q.is('deleted_at', null) });
// → forces `.single()` + `.eq('id', id)`

// Dropdown / combobox feed with hard cap (default 5000):
const companies = await fetchDropdown('companies', {
  columns: 'id, company_name, uen',
  build: (q) => q.eq('is_active', true).order('company_name'),
});

// Count-only badge (HEAD request, no row payload):
const pendingCount = await fetchCount('quotations', {
  build: (q) => q.eq('status', 'pending'),
});
```

`table` is typed from `Database['public']['Tables']` so typos are a compile error. The `build` callback receives the normal PostgREST filter builder — all the `.eq`/`.ilike`/`.in`/`.order`/`.gte` methods are available. The wrappers append the enforced terminator.

Need `.auth` / `.storage` / RPC? Import the raw client via the same module: `import { db } from '@/lib/supabase/typed-client'`.

### Design tokens

```tsx
import { ctaTokens, cardTokens } from '@/lib/design/tokens';

<button style={{ backgroundColor: ctaTokens.primaryBg, color: ctaTokens.primaryFg }}>
  Save
</button>

// OR prefer CSS var in className:
<div className="rounded-[var(--card-radius)] p-[var(--card-padding)]" />
```

Tokens are the single source of truth from [LOCKED_PICKS.md](../../docs/99-refactor/_system/LOCKED_PICKS.md). If you change a value, change both [tokens.ts](design/tokens.ts) and [index.css](../index.css) in the same commit.

## Rules that apply here

- **Deep imports** (Q-W07-b) — `@/lib/queries/queryOptions`, never `@/lib/queries`.
- **No barrels** — don't create `index.ts` in any of these folders.
- **Tokens only for visual values** — never hex literals.
