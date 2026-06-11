# Dropdown / Select Query Pattern

**Created**: 2026-04-27 SGT
**Last Updated**: 2026-04-27 SGT
**Status**: 🟢 Production
**Priority**: 🔴 Critical

## 📋 Overview

Dropdowns load all options at once for in-memory search. Use `.limit(5000)` as a safety net + select **only the columns the dropdown reads**. Do NOT embed relational joins in dropdown queries — they trigger statement timeouts (Postgres error 57014) at scale.

## 📚 Related

- Parent: [SUPABASE_QUERY_STANDARDS.md](../SUPABASE_QUERY_STANDARDS.md)
- Sibling: [PAGINATION.md](./PAGINATION.md) · [COUNTS_AND_SINGLES.md](./COUNTS_AND_SINGLES.md) · [LEGACY_MIGRATION.md](./LEGACY_MIGRATION.md)

---

## Pattern

```typescript
const { data } = await supabase
  .from('client_companies')
  .select('id, company_name, uen')        // minimal columns only
  .eq('is_active', true)
  .order('company_name')
  .limit(5000);                            // safety net
```

## Rules

1. **Minimal columns**: select exactly what the dropdown renders (typically `id`, `name`, optionally one secondary field like `uen` or `code`).
2. **Hard cap `.limit(5000)`**: prevents silent 1,000-row PostgREST cap from biting; 5,000 is a generous ceiling for any dropdown that should still feel snappy in-memory.
3. **No embedded joins** (`!left`, `!inner`): joins multiply rows × related-table rows. A dropdown of 1,000 companies with a `client_contacts!left` embed pulls thousands of contact rows per request. Compute counts via separate `head: true` queries when needed.
4. **No multi-line `.or()`**: PostgREST's `or` parser breaks on whitespace. Single line, comma-delimited. Reference only columns that exist on the queried table.

## When to consider remote-fetch combobox instead

If the table is heading toward 5,000+ rows (e.g. `people`, `quotations`), a static dropdown stops scaling. Switch to a server-side combobox: debounced text input → `.ilike()` query → return 100 rows. That's a UX redesign, not a query tweak.

## Anti-patterns (observed bugs)

```typescript
// ❌ BUG: .limit(10000) is INSIDE the select template — parsed as a column
.select(`
  *,
  client_contacts!left (id, is_active, mailing_list)
.limit(10000)
`)

// ❌ BUG: multi-line or() — PostgREST returns 400 OR silently fails
query.or(`
  company_name.ilike.%${s}%,
  uen.ilike.%${s}%
`)

// ❌ BUG: references column that doesn't exist on queried table
query.or(`company_name.ilike.%${s}%,contact_person.ilike.%${s}%`)
//                                  ^^^^^^^^^^^^^^ on a different table

// ❌ Slow: relational embed pulled per-row, then counts computed client-side
.select(`*, client_contacts!left (id, is_active, mailing_list)`)
.limit(5000);
```
