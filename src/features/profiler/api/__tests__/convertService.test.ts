/**
 * convertService unit tests (mocked supabase chain) — the two READS added to
 * stop the bridge duplicating people, plus the link statement they feed.
 *
 * Both reads scope to the caller's own non-deleted book: `clients_select`
 * also passes a `view_all_clients` holder, so an unscoped lookup would let a
 * manager link their result onto another advisor's customer — a profile that
 * customer's owner can then never read.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findClientByName, relinkResultToClient, resolveLinkableClientId } from '../convertService';
import {
  calledWith,
  callsOf,
  createBuilder,
  wireFromQueue,
  type FromQueue,
} from '../../../crm/api/__tests__/supabaseMock';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }));

const ADVISOR = 'advisor-uuid-1';

let queue: FromQueue;

beforeEach(() => {
  vi.clearAllMocks();
  queue = wireFromQueue(fromMock);
});

describe('findClientByName', () => {
  it('matches case-insensitively inside the advisor’s own live book', async () => {
    const builder = createBuilder({ data: [{ id: 'client-1', name: 'Sky Tan' }] });
    queue.enqueue(builder);

    const found = await findClientByName('  sky tan  ', ADVISOR);

    expect(found).toEqual({ id: 'client-1', name: 'Sky Tan' });
    expect(calledWith(builder, 'eq', 'user_id', ADVISOR)).toBe(true);
    expect(calledWith(builder, 'eq', 'is_deleted', false)).toBe(true);
    // Trimmed, and matched whole — no wildcards, so "Sky Tan" never eats "Sky Tanaka".
    expect(callsOf(builder, 'ilike')).toEqual([['name', 'sky tan']]);
  });

  it('neutralises LIKE wildcards so a typed % cannot match everyone', async () => {
    const builder = createBuilder({ data: [] });
    queue.enqueue(builder);

    await findClientByName('%', ADVISOR);

    expect(callsOf(builder, 'ilike')).toEqual([['name', ' ']]);
  });

  it('never queries on a blank name', async () => {
    expect(await findClientByName('   ', ADVISOR)).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe('resolveLinkableClientId', () => {
  it('resolves the id when the customer is the advisor’s own', async () => {
    const builder = createBuilder({ data: { id: 'client-1' } });
    queue.enqueue(builder);

    expect(await resolveLinkableClientId('client-1', ADVISOR)).toBe('client-1');
    expect(calledWith(builder, 'eq', 'id', 'client-1')).toBe(true);
    expect(calledWith(builder, 'eq', 'user_id', ADVISOR)).toBe(true);
    expect(calledWith(builder, 'eq', 'is_deleted', false)).toBe(true);
  });

  it('resolves null for a foreign or deleted id rather than throwing', async () => {
    queue.enqueue(createBuilder({ data: null }));

    expect(await resolveLinkableClientId('someone-elses-client', ADVISOR)).toBeNull();
  });
});

describe('relinkResultToClient', () => {
  it('promotes a 0-row update to the orphan-explaining error', async () => {
    queue.enqueue(createBuilder({ data: null }));

    await expect(relinkResultToClient('result-1', 'client-1')).rejects.toThrow(
      /client record was created/,
    );
  });
});
