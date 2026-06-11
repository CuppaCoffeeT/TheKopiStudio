/**
 * useURLPagination — Reusable hook for URL-synced filter, sort, and pagination state.
 *
 * Reads/writes filter, sort, page, and tab state from URL search params so that
 * every list view is shareable (copy URL → paste → same view).
 *
 * Follows:
 * - docs/01-system-architecture/URL_STANDARDS.md (clean URLs, param conventions)
 * - docs/01-system-architecture/SUPABASE_QUERY_STANDARDS.md (server-side pagination)
 *
 * Usage:
 *   const { params, setters, updateParams, resetAll } = useURLPagination({ defaults });
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface URLPaginationDefaults {
  /** Default sort column — omitted from URL when active. @default 'created_at' */
  sort?: string;
  /** Default sort direction — omitted from URL when active. @default 'asc' */
  order?: 'asc' | 'desc';
  /** Default tab — omitted from URL when active. @default undefined (no tab) */
  tab?: string;
  /** Default status value — omitted from URL when active. @default 'all' */
  status?: string;
}

export interface URLPaginationParams {
  search: string;
  status: string;
  /** Comma-separated multi-value filters parsed into string[] */
  role: string[];
  sort: string;
  order: 'asc' | 'desc';
  page: number;
  tab: string;
}

export interface URLPaginationSetters {
  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  setRole: (values: string[]) => void;
  setSort: (value: string) => void;
  toggleOrder: () => void;
  setPage: (page: number) => void;
  setTab: (tab: string) => void;
}

export interface UseURLPaginationReturn {
  params: URLPaginationParams;
  setters: URLPaginationSetters;
  /** Low-level updater — batch multiple param changes in one URL update.
   *  Pass `null` to remove a param. Resets page to 1 by default. */
  updateParams: (updates: Record<string, string | null>, resetPage?: boolean) => void;
  /** Reset all params back to defaults (clears URL). */
  resetAll: () => void;
  /** True when any filter is active (search, status ≠ default, role set). */
  hasActiveFilters: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useURLPagination(options?: URLPaginationDefaults): UseURLPaginationReturn {
  const defaultSort = options?.sort ?? 'created_at';
  const defaultOrder = options?.order ?? 'asc';
  const defaultTab = options?.tab;
  const defaultStatus = options?.status ?? 'all';

  const [searchParams, setSearchParams] = useSearchParams();

  // --- Read state from URL ---
  const params = useMemo<URLPaginationParams>(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || defaultStatus,
    role: searchParams.get('role')?.split(',').filter(Boolean) || [],
    sort: searchParams.get('sort') || defaultSort,
    order: (searchParams.get('order') || defaultOrder) as 'asc' | 'desc',
    page: Math.max(1, parseInt(searchParams.get('page') || '1', 10)),
    tab: searchParams.get('tab') || defaultTab || '',
  }), [searchParams, defaultSort, defaultOrder, defaultTab, defaultStatus]);

  // --- Core updater: batch param changes, auto-reset page ---
  //
  // No-op guard: if none of the requested updates actually differ from the
  // current URL values, return `prev` unchanged. This matters because callers
  // (e.g. a debounced search effect) may re-issue setSearch with the SAME value
  // on every render. Without this guard, every re-issue strips `?page=` via the
  // resetPage branch and the user gets bounced to page 1 when clicking pages 2+.
  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        let changed = false;
        for (const [key, value] of Object.entries(updates)) {
          const currentValue = prev.get(key) || null;
          const newValue = value === null || value === '' ? null : value;
          if (currentValue === newValue) continue;
          changed = true;
          if (newValue === null) next.delete(key);
          else next.set(key, newValue);
        }
        if (!changed) return prev;
        if (resetPage && !('page' in updates)) next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  // --- Individual setters (omit param when value matches default → clean URL) ---
  const setSearch = useCallback(
    (value: string) => updateParams({ search: value || null }),
    [updateParams],
  );

  const setStatus = useCallback(
    (value: string) => updateParams({ status: value === defaultStatus ? null : value }),
    [updateParams, defaultStatus],
  );

  const setRole = useCallback(
    (values: string[]) => updateParams({ role: values.length > 0 ? values.join(',') : null }),
    [updateParams],
  );

  const setSort = useCallback(
    (value: string) => updateParams({ sort: value === defaultSort ? null : value }),
    [updateParams, defaultSort],
  );

  const toggleOrder = useCallback(() => {
    const nextOrder = params.order === 'asc' ? 'desc' : 'asc';
    // Preserve clean-URL contract: if the next direction matches the default, omit from URL.
    updateParams({ order: nextOrder === defaultOrder ? null : nextOrder });
  }, [updateParams, params.order, defaultOrder]);

  const setPage = useCallback(
    (page: number) => updateParams({ page: page > 1 ? String(page) : null }, false),
    [updateParams],
  );

  const setTab = useCallback(
    (tab: string) => updateParams({ tab: tab === (defaultTab || '') ? null : tab }),
    [updateParams, defaultTab],
  );

  const resetAll = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const hasActiveFilters = !!(
    params.search ||
    (params.status !== defaultStatus) ||
    params.role.length > 0
  );

  // Stable `setters` reference — without memoization the object literal was
  // recreated every render, which caused debounced-search effects that list it
  // as a dependency to re-fire on every unrelated re-render (e.g. page click)
  // and eventually call setSearch('') which strips the ?page= param and jumps
  // the user back to page 1. Individual setters are already useCallback-stable.
  const setters = useMemo(
    () => ({ setSearch, setStatus, setRole, setSort, toggleOrder, setPage, setTab }),
    [setSearch, setStatus, setRole, setSort, toggleOrder, setPage, setTab],
  );

  return {
    params,
    setters,
    updateParams,
    resetAll,
    hasActiveFilters,
  };
}
