---
paths:
  - src/**/*.ts
  - src/**/*.tsx
---

# Rule: URL Standards

## Summary

URL paths follow a specific convention: single-concept routes use no hyphens (e.g., `/clientprofiles`), while multi-word descriptive routes use hyphens (e.g., `/ot-calculator`). All new list views must use the `useURLPagination` hook to sync search, filter, sort, and page state to the URL.

## Detailed Patterns

### Path Naming

```sql
-- ✅ Single concepts: NO hyphens
'/clientprofiles', '/generalworks', '/supervisordashboard'

-- ✅ Multi-word descriptions: Use hyphens
'/ot-calculator', '/drafter-dashboard'
```

### URL State Management

**New list views MUST use `useURLPagination` hook** (`src/hooks/useURLPagination.ts`):
- Syncs `?search=`, `?status=`, `?sort=`, `?order=`, `?page=`, `?tab=` to URL
- Auto-resets page on filter change
- Omits defaults for clean URLs

**Reference implementation**: `PeopleManagement.tsx`

### Hook Features

- Clean URLs (default values auto-omitted)
- Auto page reset on filter change
- Multi-value filter support
- `hasActiveFilters` helper
- Replaces raw `useSearchParams` + `updateParams` boilerplate (~40 lines → 1 call)

## References

- [docs/01-system-architecture/URL_STANDARDS.md](../../docs/01-system-architecture/URL_STANDARDS.md)
- Source: `src/hooks/useURLPagination.ts`
- Related: [query-compliance.md](./query-compliance.md) — Server-side pagination works with URL state
