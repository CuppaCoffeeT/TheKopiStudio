/**
 * Legacy Map persistence — `public.legacy_plans`, one row per customer.
 *
 * The plan is read and written WHOLE: the Legacy Map loads one customer's
 * document, mutates it in the browser, and saves it back. That is why it is a
 * JSONB column rather than four child tables (see the migration's header).
 *
 * RLS is Pattern D, mirroring `public.clients`: owner OR the
 * `view_all_clients` capability for reads, owner-only for writes. A manager can
 * therefore READ an advisor's plan — they can already read the customer it
 * belongs to — and can never write one.
 *
 * OWNERSHIP FOOTGUN, guarded in the UI: `legacy_plans_insert` only checks
 * `auth.uid() = user_id`, so a manager saving against another advisor's
 * customer would succeed and create a row owned by the MANAGER — which the
 * owning advisor could then never read. The page gates saving on the customer's
 * own ownership for that reason; this service stamps whoever is signed in.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { LegacyPlan } from '../lib/legacy';
import { parseLegacyPlan, SCHEMA_VERSION } from '../lib/legacyPlanSchema';

export interface StoredLegacyPlan {
  plan: LegacyPlan;
  updatedAt: string;
  /** Who owns the row — the page compares this to decide if saving is allowed. */
  userId: string;
}

/**
 * One customer's saved plan, or `null` when they have none yet.
 *
 * `maybeSingle()` because "no plan yet" is the normal state for most
 * customers, not an error.
 */
export async function getLegacyPlan(clientId: string): Promise<StoredLegacyPlan | null> {
  const { data, error } = await supabase
    .from('legacy_plans')
    .select('plan, updated_at, user_id')
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    plan: parseLegacyPlan(data.plan),
    updatedAt: data.updated_at,
    userId: data.user_id,
  };
}

/**
 * Create or replace a customer's plan.
 *
 * Upsert on `client_id` (the column carries a UNIQUE constraint), so saving
 * twice updates rather than erroring. `created_by` is only meaningful on the
 * insert branch; Postgres keeps the original on conflict because the update
 * clause below does not list it.
 */
export async function saveLegacyPlan(
  clientId: string,
  plan: LegacyPlan,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('legacy_plans').upsert(
    {
      client_id: clientId,
      user_id: userId,
      created_by: userId,
      updated_by: userId,
      // `LegacyPlan` is all primitives, arrays and plain objects, so it is
      // structurally Json — TypeScript just cannot prove it through the
      // interface. The parser on the way back out is what actually guards the
      // shape (`parseLegacyPlan`), not this cast.
      plan: plan as unknown as Json,
      schema_version: SCHEMA_VERSION,
    },
    { onConflict: 'client_id' },
  );
  if (error) throw error;
}
