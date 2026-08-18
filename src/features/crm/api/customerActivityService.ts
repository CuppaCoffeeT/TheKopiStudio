/**
 * Customer activity API — the READ side of `public.customer_activity`.
 *
 * Reads merge two tables on purpose. `customer_activity` holds what the app
 * observed; `interactions` holds what a human logged (a meeting, a call). The
 * timeline the advisor wants is both, in one date order — showing them in two
 * separate lists would make "when did we last actually speak?" a question you
 * answer by comparing two scroll positions.
 *
 * The WRITE side is `@/lib/activityLog`, app-level, because the profiler
 * feature writes to the same log and `.dependency-cruiser` forbids
 * cross-feature imports.
 *
 * Every select is bounded (.claude/rules/query-compliance.md). A customer's
 * whole history is a child list, not a paginated view.
 */

import { supabase } from '@/integrations/supabase/client';
import type { ActivityChange } from '@/lib/activityLog';
import type { CustomerActivityEntry } from '../lib/customerActivity';

/** Per-customer child lists are bounded; one customer never nears this. */
const CHILD_LIMIT = 1000;

interface ActivityRow {
  id: string;
  activity_type: string;
  tool: string | null;
  summary: string;
  changes: unknown;
  occurred_at: string;
  actor_id: string | null;
}

interface ManualRow {
  id: string;
  date: string;
  type: string | null;
  notes: string | null;
  created_at: string;
  user_id: string;
}

/** `changes` comes back as `Json`; narrow it without trusting the shape. */
function toChanges(raw: unknown): ActivityChange[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.label !== 'string') return [];
    return [
      {
        field: typeof record.field === 'string' ? record.field : record.label,
        label: record.label,
        from: typeof record.from === 'string' ? record.from : '',
        to: typeof record.to === 'string' ? record.to : '',
      },
    ];
  });
}

/**
 * The merged timeline for one customer, newest first.
 *
 * Actor names are resolved in ONE follow-up select over the ids actually
 * present, not per row: a customer with 80 entries touched by two people should
 * cost two lookups, not eighty. An unresolvable id (a deleted user) yields a
 * null name and the UI prints nothing rather than a raw uuid.
 */
export async function listCustomerActivity(clientId: string): Promise<CustomerActivityEntry[]> {
  const [autoResult, manualResult] = await Promise.all([
    supabase
      .from('customer_activity')
      .select('id, activity_type, tool, summary, changes, occurred_at, actor_id')
      .eq('client_id', clientId)
      .eq('is_deleted', false)
      .order('occurred_at', { ascending: false })
      .limit(CHILD_LIMIT),
    supabase
      .from('interactions')
      .select('id, date, type, notes, created_at, user_id')
      .eq('client_id', clientId)
      .eq('is_deleted', false)
      .order('date', { ascending: false })
      .limit(CHILD_LIMIT),
  ]);
  if (autoResult.error) throw autoResult.error;
  if (manualResult.error) throw manualResult.error;

  const autoRows = (autoResult.data ?? []) as ActivityRow[];
  const manualRows = (manualResult.data ?? []) as ManualRow[];

  const actorIds = Array.from(
    new Set([
      ...autoRows.map((row) => row.actor_id).filter((id): id is string => Boolean(id)),
      ...manualRows.map((row) => row.user_id),
    ]),
  );

  const names = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, name')
      .in('id', actorIds)
      .limit(CHILD_LIMIT);
    for (const row of data ?? []) {
      if (row.name) names.set(row.id, row.name);
    }
  }

  const entries: CustomerActivityEntry[] = [
    ...autoRows.map((row) => ({
      id: row.id,
      type: row.activity_type,
      tool: row.tool,
      summary: row.summary,
      changes: toChanges(row.changes),
      occurredAt: row.occurred_at,
      actorId: row.actor_id,
      actorName: row.actor_id ? (names.get(row.actor_id) ?? null) : null,
      manual: false,
    })),
    ...manualRows.map((row) => ({
      id: row.id,
      type: 'contact_logged',
      tool: null,
      // The interaction TYPE is the headline ("Meeting", "Phone Call"); the
      // note is the body, and the tab renders it under the summary.
      summary: row.type ?? 'Contact',
      changes: [],
      // `date` is a DATE column with no time. Sorting a bare date against a
      // timestamptz would put every logged contact at SG 08:00 (UTC midnight)
      // and shuffle it below same-day automatic entries; `created_at` is when
      // the row was actually written, so same-day ordering stays truthful.
      occurredAt: row.created_at,
      actorId: row.user_id,
      actorName: names.get(row.user_id) ?? null,
      manual: true,
      notes: row.notes ?? '',
      loggedDate: row.date,
    })),
  ];

  return entries.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
