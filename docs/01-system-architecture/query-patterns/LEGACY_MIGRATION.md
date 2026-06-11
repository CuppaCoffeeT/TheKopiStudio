# Legacy Query Migration Strategy

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production
**Priority**: 🟡 High

## 📋 Overview

Existing pages use client-side pagination (fetch all → filter/sort in JS → slice for page). These should progressively migrate to server-side pagination per [PAGINATION.md](./PAGINATION.md). Until then, every legacy `.select()` MUST have an explicit `.limit()` to prevent silent 1,000-row truncation.

## 📚 Related

- Parent: [SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md)
- Sibling: [PAGINATION.md](./PAGINATION.md) · [DROPDOWNS.md](./DROPDOWNS.md) · [COUNTS_AND_SINGLES.md](./COUNTS_AND_SINGLES.md)
- Tracker: [05-implementation/active/SERVER_SIDE_PAGINATION_MIGRATION.md](../../05-implementation/active/SERVER_SIDE_PAGINATION_MIGRATION.md)

---

## Immediate Fix — `.limit(10000)`

```typescript
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('is_deleted', false)
  .order('last_name')
  .limit(10000);  // ← prevents silent 1000-row cap
```

10,000 is the project default for "legacy, pending migration." If a table will exceed it, prioritize that table for migration to `.range()`.

## Migration Priority

| Priority | Table | Approx Rows | Files Affected |
|----------|-------|-------------|----------------|
| 🔴 Done | `people` | 1,040+ | 5 files (fixed) |
| 🔴 High | `trial_trenches` | Growing fast | 17 files |
| 🔴 High | `worker_ot` | Growing fast | 15 files |
| 🟡 Medium | `client_contacts` | Growing | 7 files |
| 🟡 Medium | `general_works_entries` | Growing | 11 files |
| 🟡 Medium | `workers` | Growing | 6 files |

## The Original Problem (why these rules exist)

```typescript
// This query silently returns AT MOST 1,000 rows — no error, no warning
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('is_deleted', false)
  .order('last_name');
// If there are 1,040 people, the last 40 are SILENTLY DROPPED
```

**Real-world impact**: The `people` table hit 1,040 rows. A `super_admin` user (Sky Tan) was at alphabetical position 1,013 and became invisible across the entire People Management page — no error shown, no indication of missing data.

This will happen to **every growing table** as the system scales. Hence the hard rule: every `.select()` must have one of `.range()`, `.limit()`, `.single()`, or `{ head: true, count: 'exact' }`.
