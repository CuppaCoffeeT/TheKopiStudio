/**
 * Activity log — the WRITE side of `public.customer_activity`, app-level.
 *
 * WHY THIS IS IN `src/lib` AND NOT IN `features/crm`: two features write to
 * this log. The CRM writes when a customer's information changes or a report
 * is generated; the PROFILER writes when a profile is saved against a customer.
 * `.dependency-cruiser.cjs` forbids cross-feature imports outright
 * (`no-cross-feature-imports`), and rightly — a profiler that reaches into
 * `features/crm` is how two features become one tangled one. The shared
 * primitive belongs at the level both can see.
 *
 * The READ side stays in `features/crm`: only the customer record renders this
 * timeline, and the merge with `interactions` is CRM domain knowledge.
 *
 * FIRE AND FORGET. `recordActivity` never throws and never surfaces a toast.
 * Logging is a side effect of work that has already succeeded — if the history
 * insert fails, the profile still saved, and a red toast about the audit trail
 * would tell the advisor their work was lost when it was not. The failure goes
 * to the console; the missing row shows as a gap rather than as a lie.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

/** The kinds of thing that land on a customer's timeline. */
export type ActivityType =
  | 'customer_created'
  | 'profile_created'
  | 'profile_updated'
  | 'info_updated'
  | 'tool_opened'
  | 'report_generated'
  | 'policy_changed'
  | 'balance_updated';

/** Which tool an entry came from. Null for edits made on the record itself. */
export type ActivityTool =
  | 'prospect-profiler'
  | 'tax-calculator'
  | 'srs-planner'
  | 'legacy-map'
  | 'client-report'
  | 'portfolio-report';

/** One field that changed, ready to print. */
export interface ActivityChange {
  /** The model key — machine-readable, so a future UI can group or filter. */
  field: string;
  /** What the advisor calls it. */
  label: string;
  /** Display strings. Empty string means "nothing was there". */
  from: string;
  to: string;
}

/** What a caller must supply to log something. */
export interface ActivityInput {
  clientId: string;
  /**
   * The OWNING advisor — `clients.user_id`, NOT the viewer. RLS checks the
   * owner, so passing the viewer would silently drop every row a manager
   * writes against another advisor's customer.
   */
  ownerId: string;
  /** Who actually performed it. */
  actorId: string;
  type: ActivityType;
  tool?: ActivityTool;
  summary: string;
  changes?: ActivityChange[];
}

/**
 * Log one thing that happened. Never throws.
 *
 * @returns whether the row landed — a test can assert on it; callers doing
 *   real work should ignore it.
 */
export async function recordActivity(input: ActivityInput): Promise<boolean> {
  const { error } = await supabase.from('customer_activity').insert({
    client_id: input.clientId,
    user_id: input.ownerId,
    actor_id: input.actorId,
    activity_type: input.type,
    tool: input.tool ?? null,
    summary: input.summary,
    // Mapped field by field rather than cast: `Json` demands an index
    // signature that `ActivityChange` deliberately does not have, and a blanket
    // `as unknown as Json` would also wave through a future field that has no
    // business in an audit row.
    changes:
      input.changes && input.changes.length > 0
        ? (input.changes.map((change) => ({
            field: change.field,
            label: change.label,
            from: change.from,
            to: change.to,
          })) as Json)
        : null,
  });

  if (error) {
    // Deliberately quiet — see the module docblock.
    console.warn('[customer-activity] entry not recorded:', error.message);
    return false;
  }
  return true;
}
