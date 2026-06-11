# Supabase Query Standards

**Created**: 2026-02-26 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

Supabase PostgREST has a **default row limit of 1,000 rows** per query. Queries without explicit pagination silently truncate results. As this system is fundamentally a list-based application (an advanced Excel sheet), **server-side pagination** is the mandatory standard for all new list views.

Detail patterns moved to [query-patterns/](./query-patterns/) sub-guides. This file is the entry point + the Quick Reference.

## 📚 Related Documentation

- [query-patterns/PAGINATION.md](./query-patterns/PAGINATION.md) — server-side `.range()` + hook + page component
- [query-patterns/DROPDOWNS.md](./query-patterns/DROPDOWNS.md) — `.limit(5000)` + minimal columns + anti-patterns
- [query-patterns/COUNTS_AND_SINGLES.md](./query-patterns/COUNTS_AND_SINGLES.md) — count-only, `.single()`, bulk export
- [query-patterns/LEGACY_MIGRATION.md](./query-patterns/LEGACY_MIGRATION.md) — `.limit(10000)` fallback + migration priority
- [URL_STANDARDS.md](./URL_STANDARDS.md) — URL query parameter standards
- [react-query-cache/CONTEXT.md](./react-query-cache/CONTEXT.md) — query key management
- [DATABASE_POLICY.md](./DATABASE_POLICY.md) — RLS and database security

---

## 🚨 The Hard Rule

**Every `.select()` call MUST have one of:**

| Use case | Pattern | Detail |
|----------|---------|--------|
| List page (new) | `.select('*', { count: 'exact' }).range(from, to)` | [PAGINATION.md](./query-patterns/PAGINATION.md) |
| Dropdown options | `.select('id, name').limit(5000)` | [DROPDOWNS.md](./query-patterns/DROPDOWNS.md) |
| Single record | `.single()` or `.maybeSingle()` | [COUNTS_AND_SINGLES.md](./query-patterns/COUNTS_AND_SINGLES.md) |
| Count only | `{ count: 'exact', head: true }` | [COUNTS_AND_SINGLES.md](./query-patterns/COUNTS_AND_SINGLES.md) |
| Export / bulk | `.limit(50000)` | [COUNTS_AND_SINGLES.md](./query-patterns/COUNTS_AND_SINGLES.md) |
| Legacy (pending migration) | `.limit(10000)` | [LEGACY_MIGRATION.md](./query-patterns/LEGACY_MIGRATION.md) |

No exceptions. Unbounded `.select()` silently caps at 1,000 rows.

## 🚨 The Original Bug

The `people` table hit 1,040 rows. A `super_admin` user at alphabetical position 1,013 became invisible across the entire People Management page — no error shown, no indication of missing data. This will happen to every growing table as the system scales. Full incident detail in [LEGACY_MIGRATION.md](./query-patterns/LEGACY_MIGRATION.md).

## ✅ Enforcement Checklist (List Views)

- [ ] Uses `useURLPagination` for URL-synced filter/sort/page state
- [ ] Uses `.range(from, to)` with `{ count: 'exact' }`
- [ ] Search/filter/sort run in the database, not JavaScript
- [ ] `TablePaginationControls` receives `totalCount` from server `count`
- [ ] Query key includes all filter/sort/page params (see [react-query-cache/FACTORY.md](./react-query-cache/FACTORY.md))
- [ ] `placeholderData: keepPreviousData` + `isFetching` opacity fade
- [ ] Search input debounced 350ms

For dropdowns: `.limit(5000)` + minimal columns + no relational embeds. Full anti-pattern catalogue in [DROPDOWNS.md](./query-patterns/DROPDOWNS.md).

For legacy code being touched: add `.limit(10000)` until migrated. Migration priority in [LEGACY_MIGRATION.md](./query-patterns/LEGACY_MIGRATION.md).
