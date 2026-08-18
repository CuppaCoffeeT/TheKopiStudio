/**
 * useLogToolOpen — writes one "tool opened" entry per customer, per visit.
 *
 * "Opened" is the honest event to record. The planning tools save nothing (they
 * say so on the page), so there is no completion to hook — what the activity
 * log can truthfully report is that on 19 Aug the advisor pulled up this
 * customer's numbers in the Tax calculator. That is what an advisor wants back
 * from a timeline six months later.
 *
 * ONCE PER CUSTOMER, not once per render. The effect is keyed on the customer
 * and guarded by a ref, so a refetch, a re-render or a React 18 double-invoked
 * effect in development cannot produce three identical rows a second apart.
 * Switching customer inside an open tool logs the new one — which is correct;
 * that is a second thing the advisor did.
 *
 * Parked entirely without a customer: a blank calculator belongs to nobody, and
 * there is no record to hang the entry off.
 */

import { useEffect, useRef } from 'react';
import type { ActivityTool } from '@/lib/activityLog';
import { useLogActivity } from './useCustomerActivity';

export function useLogToolOpen(
  tool: ActivityTool,
  /** The whole timeline line, e.g. `Tax calculator opened`. */
  summary: string,
  clientId: string | null,
  /** The customer's `user_id` — RLS checks the OWNER, never the viewer. */
  ownerId: string | null,
  /** `report_generated` for the report; the planning tools are `tool_opened`. */
  type: 'tool_opened' | 'report_generated' = 'tool_opened',
): void {
  const logActivity = useLogActivity();
  const logged = useRef<string | null>(null);

  useEffect(() => {
    if (!clientId || !ownerId) return;
    if (logged.current === clientId) return;
    logged.current = clientId;
    void logActivity({ clientId, ownerId, type, tool, summary });
  }, [clientId, ownerId, tool, summary, type, logActivity]);
}
