# Counts, Singles & Bulk Query Patterns

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

Patterns for queries that aren't paginated lists or dropdowns: count-only badges, single-record lookups, and bulk export operations.

## 📚 Related

- Parent: [SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md)
- Sibling: [PAGINATION.md](./PAGINATION.md) · [DROPDOWNS.md](./DROPDOWNS.md) · [LEGACY_MIGRATION.md](./LEGACY_MIGRATION.md)

---

## Count-Only Queries

For dashboard badges and stats — no row data transferred, just the count.

```typescript
const { count } = await supabase
  .from('trial_trenches')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'pending_supervisor');
```

Key flag: `head: true` — sends `HEAD` request, no rows returned, only the `Content-Range` header carries the count.

## Single Record

`.single()` enforces exactly one row (errors if 0 or 2+). Use `.maybeSingle()` if the row may not exist (returns `null` instead of erroring).

```typescript
// Errors if not found
const { data } = await supabase
  .from('people')
  .select('*')
  .eq('id', personId)
  .single();

// Returns null if not found
const { data } = await supabase
  .from('client_companies')
  .select('*')
  .eq('uen', uen)
  .maybeSingle();
```

## Bulk / Export Operations

Exports that need every matching row use `.limit(50000)` as a generous ceiling. Anything larger should stream via Edge Function instead.

```typescript
const { data } = await supabase
  .from('trial_trenches')
  .select('*')
  .eq('is_deleted', false)
  .order('created_at', { ascending: false })
  .limit(50000);
```

## Quick Reference

| Use Case | Pattern |
|----------|---------|
| Count only | `{ count: 'exact', head: true }` |
| Single record (must exist) | `.single()` |
| Single record (may not exist) | `.maybeSingle()` |
| Export / bulk | `.limit(50000)` |
| Streaming export (>50K) | Edge Function with cursor |
