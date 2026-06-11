# query-patterns/ — Workspace Router

**Last Updated**: 2026-04-27 SGT

Sub-guides extracted from [SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md) per the per-file token budget. Parent doc keeps the overview + Quick Reference; detail lives here.

## Navigation

| File | Purpose |
|------|---------|
| [PAGINATION.md](./PAGINATION.md) | Server-side pagination pattern — `.range()` + `count: 'exact'` + `useURLPagination` |
| [DROPDOWNS.md](./DROPDOWNS.md) | Dropdown / select query pattern — minimal columns + `.limit(5000)`, no joins |
| [COUNTS_AND_SINGLES.md](./COUNTS_AND_SINGLES.md) | Count-only badges, `.single()` / `.maybeSingle()`, bulk export |
| [LEGACY_MIGRATION.md](./LEGACY_MIGRATION.md) | Legacy `.limit(10000)` fallback + migration priority |

## Before working here

- Parent doc owns the overview and Quick Reference table — sub-guides are the detail.
- New patterns: add to the right sub-guide, not the parent. Update parent's Quick Reference if a new top-line rule emerges.
- React-Query cache concerns (query keys, invalidation) live in the sibling [react-query-cache/](../react-query-cache/) workspace, not here.

## 📚 Related

- [SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md) — parent
- [react-query-cache/CONTEXT.md](../react-query-cache/CONTEXT.md) — cache management standard
- [URL_STANDARDS.md](../URL_STANDARDS.md) — `useURLPagination` hook
