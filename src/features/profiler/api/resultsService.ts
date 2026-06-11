/**
 * Results API — single supabase access layer for saved profiling results.
 *
 * Legacy `public.results` RLS governs every call (untouched this PRD):
 * advisors reach their own rows, managers read all rows but can only mutate
 * their own, NULL-owner legacy rows have no update/delete path at all. A
 * blocked update therefore matches 0 rows and resolves to `null` rather than
 * raising — callers treat `null` as "not permitted / not found".
 */

import { supabase } from '@/integrations/supabase/client';
import type { ProfilerResult } from '../types';

export interface ResultsListParams {
  /** Raw search text — sanitized before being embedded in the PostgREST filter. */
  search: string;
  /** 1-based page number. */
  page: number;
  rowsPerPage: number;
}

export interface ResultsPage {
  rows: ProfilerResult[];
  /** Total matching rows (RLS-scoped), for pagination math. */
  count: number;
}

/**
 * Strip characters that are structural in a PostgREST `.or()` filter string
 * (`,` splits conditions, `()` group, `"` quotes values, `\` escapes) and the
 * LIKE wildcards `%`/`_`/`*` (PostgREST rewrites `*` to `%` in ilike) so user
 * input can never inject operators or patterns.
 * Collapses the gaps to single spaces — "100%, sure" still matches "100 sure".
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[%_,()\\"*]/g, ' ').replace(/\s+/g, ' ').trim();
}

const SEARCH_COLUMNS = ['prospect_name', 'advisor_name', 'mbti', 'disc_primary'] as const;

/**
 * Server-side paginated list of saved results, newest first. RLS scopes the
 * rows (advisor → own, manager → all incl. NULL-owner legacy rows) — no role
 * logic client-side. Search is server-side (`ilike` across prospect/advisor/
 * MBTI/DISC-primary) so pagination counts stay correct.
 */
export async function getResultsPaginated({
  search,
  page,
  rowsPerPage,
}: ResultsListParams): Promise<ResultsPage> {
  const from = (page - 1) * rowsPerPage;
  const to = from + rowsPerPage - 1;

  let query = supabase.from('results').select('*', { count: 'exact' });

  const term = sanitizeSearchTerm(search);
  if (term) {
    query = query.or(SEARCH_COLUMNS.map((col) => `${col}.ilike.%${term}%`).join(','));
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return { rows: data ?? [], count: count ?? 0 };
}

/** Fetch one saved result. Resolves `null` when missing or not visible under RLS. */
export async function getResultById(id: string): Promise<ProfilerResult | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Update the advisor notes on an own row. Resolves the updated row, or `null`
 * when RLS matched no row (foreign or NULL-owner result).
 */
export async function updateResultNotes(
  id: string,
  notes: string,
): Promise<ProfilerResult | null> {
  const { data, error } = await supabase
    .from('results')
    .update({ notes })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Delete an own result row. RLS silently matches 0 rows for foreign rows —
 * `.select('id')` exposes that as an empty array, promoted to an error here so
 * the mutation surfaces it instead of reporting a phantom success.
 */
export async function deleteResult(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('results')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('You can only delete your own results');
  }
}
