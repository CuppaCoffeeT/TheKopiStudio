/**
 * Linked profiler results API — crm-owned read of `public.results` for the
 * prospect→client bridge (REPORTS_LINK_PRD P4; merge plan sanctions an
 * own-feature api hitting shared tables — importing profiler's services
 * would be a cross-feature drift error).
 *
 * Legacy results RLS prunes server-side: advisors see their own rows,
 * managers see all, super_admin sees own-only until cutover. A linked but
 * RLS-hidden result therefore resolves to an EMPTY list — indistinguishable
 * from "never converted" by design (the card renders one neutral empty
 * state for both). `results` has no `is_deleted` column, so no soft-delete
 * filter applies here.
 */

import { supabase } from '@/integrations/supabase/client';
import type { LinkedProfilerResult } from '../types';

/**
 * Visible profiling results linked to one client, newest first — bounded to
 * the 10 most recent (a client realistically has one or two).
 */
export async function listLinkedResultsByClient(
  clientId: string,
): Promise<LinkedProfilerResult[]> {
  const { data, error } = await supabase
    .from('results')
    .select('id, prospect_name, disc_primary, disc_secondary, mbti, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}
