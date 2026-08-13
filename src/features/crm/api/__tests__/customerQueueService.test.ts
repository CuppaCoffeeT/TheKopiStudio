/**
 * customerQueueService unit tests (mocked supabase chain).
 *
 * Guards the two properties the Overview queue got wrong in production:
 *  1. OWN BOOK — every one of the three reads filters `user_id`. RLS alone
 *     let a `view_all_clients` holder (and a manager, via the results
 *     read-all policy) collect other advisors' customers into a queue titled
 *     "pick up where you left off".
 *  2. PROFILED means a linked `results.client_id` — matching on the prospect
 *     NAME is never a substitute, so a same-named result must not mark a
 *     customer profiled.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCustomerQueue } from '../customerQueueService';
import { calledWith, createBuilder, wireFromQueue, type FromQueue } from './supabaseMock';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }));

const ADVISOR = 'advisor-uuid-1';

/** A customer with the whole information step filled in — chain step 02 done. */
function completeCustomer(overrides: Record<string, unknown> = {}) {
  return {
    id: 'client-1',
    name: 'Sky Tan',
    email: 'sky@example.sg',
    phone: '97107233',
    date_of_birth: '1990-01-01',
    occupation: 'IT manager',
    annual_income: 120000,
    next_review_date: '2027-01-01',
    risk_profile: 'Moderate',
    created_date: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

let queue: FromQueue;

beforeEach(() => {
  vi.clearAllMocks();
  queue = wireFromQueue(fromMock);
});

describe('getCustomerQueue', () => {
  it('scopes all three reads to the advisor, never the whole firm', async () => {
    const clients = createBuilder({ data: [] });
    const interactions = createBuilder({ data: [] });
    const results = createBuilder({ data: [] });
    queue.enqueue(clients, interactions, results);

    await getCustomerQueue(ADVISOR);

    expect(queue.tables).toEqual(['clients', 'interactions', 'results']);
    for (const builder of [clients, interactions, results]) {
      expect(calledWith(builder, 'eq', 'user_id', ADVISOR)).toBe(true);
    }
  });

  it('marks a customer profiled only via a linked result row', async () => {
    queue.enqueue(
      createBuilder({ data: [completeCustomer()] }),
      createBuilder({ data: [] }),
      createBuilder({ data: [{ client_id: 'client-1' }] }),
    );

    const linked = await getCustomerQueue(ADVISOR);

    expect(linked.unfinished).toHaveLength(0);
    expect(linked.totalWaiting).toBe(0);
  });

  it('leaves a same-named but UNLINKED result unfinished — the Sky Tan bug', async () => {
    queue.enqueue(
      createBuilder({ data: [completeCustomer()] }),
      createBuilder({ data: [] }),
      // The advisor DID profile "Sky Tan", but the row carries no client_id.
      createBuilder({ data: [{ client_id: null }] }),
    );

    const unlinked = await getCustomerQueue(ADVISOR);

    expect(unlinked.unfinished).toHaveLength(1);
    expect(unlinked.unfinished[0].reasonText).toBe('Never profiled — no risk profile on file');
  });
});
