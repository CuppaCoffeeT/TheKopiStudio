/**
 * Users API — single supabase access layer for the Manage Accounts list.
 *
 * Reads `public.users` DIRECTLY (the `users_select` policy allows it) —
 * NEVER via the `get_all_users()` RPC, which is super_admin-gated and
 * silently returns 0 rows for managers (PRD-verified).
 *
 * All role/approval MUTATIONS go through the role-sync edge function
 * (see ../hooks/useRoleSync.ts) — direct UPDATEs match 0 rows / raise
 * 42501 by design (`protect_user_privileges` trigger).
 */

import { supabase } from '@/integrations/supabase/client';
import type { ManagedUser } from '../types';

export type UsersListTab = 'all' | 'pending';

export interface UsersListParams {
  search: string;
  page: number;
  rowsPerPage: number;
  tab: UsersListTab;
}

export interface UsersListResult {
  users: ManagedUser[];
  /** Total rows matching the current tab + search (drives pagination). */
  totalCount: number;
  /** Total unapproved, non-deleted users app-wide (drives the tab badge). */
  pendingCount: number;
}

/**
 * Build a PostgREST `.or()` filter matching name OR email, case-insensitive.
 *
 * Three layers, applied in order:
 *  0. `*`-strip — PostgREST rewrites `*` to `%` in (i)like patterns with no
 *     escape mechanism, so it is stripped up-front (gaps collapse to a space,
 *     matching resultsService.sanitizeSearchTerm).
 *  1. LIKE-level — backslash-escape `\`, `%`, `_` so user input can't inject
 *     wildcards into the pattern.
 *  2. PostgREST-level — double-quote the value so commas/parentheses in the
 *     term can't break the `.or()` condition parser; inside quotes PostgREST
 *     unescapes `\\` and `\"`, so backslashes from layer 1 are doubled.
 */
function buildSearchOrFilter(search: string): string {
  const starStripped = search.replace(/\*/g, ' ').replace(/\s+/g, ' ').trim();
  const likeEscaped = starStripped.replace(/[\\%_]/g, '\\$&');
  const quotedPattern = `"%${likeEscaped
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')}%"`;
  return `name.ilike.${quotedPattern},email.ilike.${quotedPattern}`;
}

/**
 * Paginated users list, newest sign-ups first. `tab='pending'` narrows to
 * unapproved accounts. The pending badge count is fetched alongside in the
 * same round-trip batch and ignores search/pagination on purpose.
 */
export async function getUsersPaginated({
  search,
  page,
  rowsPerPage,
  tab,
}: UsersListParams): Promise<UsersListResult> {
  const from = (page - 1) * rowsPerPage;
  const to = from + rowsPerPage - 1;

  let listQuery = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false);

  if (tab === 'pending') {
    listQuery = listQuery.eq('is_approved', false);
  }

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    listQuery = listQuery.or(buildSearchOrFilter(trimmedSearch));
  }

  const pendingCountQuery = supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('is_deleted', false)
    .eq('is_approved', false)
    .limit(1);

  const [listResult, pendingResult] = await Promise.all([
    listQuery.order('created_at', { ascending: false }).range(from, to),
    pendingCountQuery,
  ]);

  if (listResult.error) throw listResult.error;
  if (pendingResult.error) throw pendingResult.error;

  return {
    users: listResult.data ?? [],
    totalCount: listResult.count ?? 0,
    pendingCount: pendingResult.count ?? 0,
  };
}
