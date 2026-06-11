/**
 * Typed Supabase client — W07 Phase 2 primitive.
 *
 * Thin, type-safe wrappers around the raw `supabase` client that enforce the
 * project's query-compliance rule: every `.select()` MUST carry `.range()`,
 * `.limit()`, `.single()`, or `.head:true`. See `.claude/rules/query-compliance.md`.
 *
 * Four entry points — pick the one that matches your read shape:
 *
 *   | Use case            | Helper               | Guarantees                                |
 *   |---------------------|----------------------|-------------------------------------------|
 *   | Paginated list view | `fetchPage()`        | `.range(from, to)` + `{ count: 'exact' }` |
 *   | Single record       | `fetchOne()`         | `.single()` + `.eq(idColumn, id)`         |
 *   | Dropdown / picker   | `fetchDropdown()`    | `.limit(limit ?? 5000)` hard cap          |
 *   | Count-only          | `fetchCount()`       | `{ count: 'exact', head: true }`          |
 *
 * These wrap the standard PostgREST builder returned by `supabase.from(table)`
 * — callers keep full access to `.eq`, `.ilike`, `.order`, `.in`, etc. via
 * the `build` callback. The wrappers append the enforced terminator.
 *
 * Deep imports only (Q-W07-b): `import { fetchPage } from '@/lib/supabase/typed-client'`.
 *
 * Related:
 *   - `.claude/rules/query-compliance.md` — forbids `.select()` without a terminator
 *   - `src/components/tables/DataTable.tsx` — consumes `fetchPage` return shape
 *   - `docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md`
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type {
  PostgrestFilterBuilder,
  PostgrestSingleResponse,
} from '@supabase/postgrest-js';

/** All readable table names from the generated `Database` type. */
export type TableName = keyof Database['public']['Tables'];

/** A PostgREST filter builder for the given table (selecting all columns). */
type FilterBuilder<T extends TableName> = PostgrestFilterBuilder<
  Database['public'],
  Database['public']['Tables'][T]['Row'],
  Database['public']['Tables'][T]['Row'][],
  T
>;

/** Callback applied to the filter builder before the terminator is attached. */
export type BuildFn<T extends TableName> = (
  query: FilterBuilder<T>,
) => FilterBuilder<T>;

/** Re-export the raw client for callers that need `.auth`, `.storage`, RPC, etc. */
export { supabase as db };

// ---------------------------------------------------------------------------
// fetchPage — paginated list
// ---------------------------------------------------------------------------

export interface FetchPageOptions<T extends TableName> {
  /** `0`-indexed range start (inclusive). */
  from: number;
  /** `0`-indexed range end (inclusive). */
  to: number;
  /** Columns to select — defaults to `*`. */
  columns?: string;
  /**
   * Apply filters, ordering, joins, etc. Example:
   *   `(q) => q.eq('is_active', true).ilike('name', `%${search}%`).order('created_at', { ascending: false })`
   */
  build?: BuildFn<T>;
}

export interface FetchPageResult<Row> {
  rows: Row[];
  count: number;
}

/**
 * Paginated read with exact total count. Maps 1:1 to the
 * `DataTable.fetchPage(from, to)` shape.
 *
 * @throws the PostgREST error if `.range()` fails.
 */
export async function fetchPage<T extends TableName>(
  table: T,
  options: FetchPageOptions<T>,
): Promise<FetchPageResult<Database['public']['Tables'][T]['Row']>> {
  const { from, to, columns = '*', build } = options;

  const base = supabase
    .from(table)
    .select(columns, { count: 'exact' }) as unknown as FilterBuilder<T>;

  const filtered = build ? build(base) : base;
  const { data, count, error } = await filtered.range(from, to);

  if (error) throw error;

  return {
    rows: (data ?? []) as Database['public']['Tables'][T]['Row'][],
    count: count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// fetchOne — single record
// ---------------------------------------------------------------------------

export interface FetchOneOptions<T extends TableName> {
  /** Column to match on. Defaults to `'id'`. */
  idColumn?: keyof Database['public']['Tables'][T]['Row'] & string;
  /** Value to match. Usually the record UUID. */
  id: string;
  /** Columns to select — defaults to `*`. */
  columns?: string;
  /** Apply additional filters (e.g. soft-delete guards) before `.single()`. */
  build?: BuildFn<T>;
}

/**
 * Fetch one record by id (or another unique column). Uses `.single()` so a
 * missing row surfaces as a PostgREST error rather than `null`.
 */
export async function fetchOne<T extends TableName>(
  table: T,
  options: FetchOneOptions<T>,
): Promise<Database['public']['Tables'][T]['Row']> {
  const { id, idColumn = 'id', columns = '*', build } = options;

  const base = supabase
    .from(table)
    .select(columns) as unknown as FilterBuilder<T>;

  const filtered = build ? build(base) : base;
  const { data, error } = (await (filtered as unknown as FilterBuilder<T> & {
    eq: (column: string, value: unknown) => FilterBuilder<T>;
  })
    .eq(idColumn, id)
    .single()) as PostgrestSingleResponse<Database['public']['Tables'][T]['Row']>;

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// fetchDropdown — bounded picker/combobox feed
// ---------------------------------------------------------------------------

export interface FetchDropdownOptions<T extends TableName> {
  /** Row cap. Defaults to `5000` per query-compliance rule. */
  limit?: number;
  /** Columns to select — defaults to `*`. Pick only what the picker renders. */
  columns?: string;
  /** Apply filters + ordering; typical use: `.eq('is_active', true).order('name')`. */
  build?: BuildFn<T>;
}

/**
 * Fetch a bounded list for a dropdown / combobox / picker. Forces an explicit
 * `.limit()` so no reader ever hits the 1,000-row silent truncation.
 */
export async function fetchDropdown<T extends TableName>(
  table: T,
  options: FetchDropdownOptions<T> = {},
): Promise<Database['public']['Tables'][T]['Row'][]> {
  const { limit = 5000, columns = '*', build } = options;

  const base = supabase
    .from(table)
    .select(columns) as unknown as FilterBuilder<T>;

  const filtered = build ? build(base) : base;
  const { data, error } = await filtered.limit(limit);

  if (error) throw error;
  return (data ?? []) as Database['public']['Tables'][T]['Row'][];
}

// ---------------------------------------------------------------------------
// fetchCount — count-only (HEAD request, no row payload)
// ---------------------------------------------------------------------------

export interface FetchCountOptions<T extends TableName> {
  /** Apply filters that scope the count (e.g. `.eq('status', 'pending')`). */
  build?: BuildFn<T>;
}

/**
 * Count rows matching a filter without transferring row data.
 * Uses `{ count: 'exact', head: true }` — the canonical badge/counter pattern.
 */
export async function fetchCount<T extends TableName>(
  table: T,
  options: FetchCountOptions<T> = {},
): Promise<number> {
  const { build } = options;

  const base = supabase
    .from(table)
    .select('*', { count: 'exact', head: true }) as unknown as FilterBuilder<T>;

  const filtered = build ? build(base) : base;
  const { count, error } = await filtered;

  if (error) throw error;
  return count ?? 0;
}
