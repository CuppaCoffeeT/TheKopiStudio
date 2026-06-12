/**
 * interactionsService unit tests (mocked supabase chain) — newest-first
 * bounded reads with the soft-delete filter, identity stamps on writes, and
 * the followUp '' → null coercion (the `date` column rejects '').
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CrmInteractionInput } from '../../types';
import {
  createInteraction,
  listInteractionsByClient,
  softDeleteInteraction,
  updateInteraction,
} from '../interactionsService';
import {
  calledWith,
  callsOf,
  createBuilder,
  expectSoftDeleteFilter,
  wireFromQueue,
  type FromQueue,
} from './supabaseMock';

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }));

const input: CrmInteractionInput = {
  date: '2026-06-10',
  type: 'Meeting',
  notes: 'Annual review discussion',
  followUp: '',
};

let from: FromQueue;
beforeEach(() => {
  fromMock.mockReset();
  from = wireFromQueue(fromMock);
});

describe('listInteractionsByClient', () => {
  it('reads non-deleted rows for the client, newest first, bounded', async () => {
    const builder = createBuilder({
      data: [{ id: 'i1', date: '2026-06-10', type: 'Meeting', notes: 'x', follow_up: null }],
    });
    from.enqueue(builder);

    const models = await listInteractionsByClient('client-1');

    expect(calledWith(builder, 'eq', 'client_id', 'client-1')).toBe(true);
    expectSoftDeleteFilter(builder);
    expect(callsOf(builder, 'order')).toEqual([
      ['date', { ascending: false }],
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(calledWith(builder, 'limit', 1000)).toBe(true);
    expect(models[0]).toEqual({
      id: 'i1',
      date: '2026-06-10',
      type: 'Meeting',
      notes: 'x',
      followUp: '',
    });
  });
});

describe('createInteraction', () => {
  it('stamps identity and writes follow_up as null for an empty followUp', async () => {
    const builder = createBuilder({ data: { id: 'i1' } });
    from.enqueue(builder);

    await createInteraction('client-1', input, 'user-1');

    expect(callsOf(builder, 'insert')[0][0]).toEqual({
      date: '2026-06-10',
      type: 'Meeting',
      notes: 'Annual review discussion',
      follow_up: null,
      client_id: 'client-1',
      user_id: 'user-1',
      created_by: 'user-1',
    });
  });

  it('keeps a real follow-up date', async () => {
    const builder = createBuilder({ data: { id: 'i1' } });
    from.enqueue(builder);

    await createInteraction('client-1', { ...input, followUp: '2026-07-01' }, 'user-1');

    const payload = callsOf(builder, 'insert')[0][0] as Record<string, unknown>;
    expect(payload.follow_up).toBe('2026-07-01');
  });
});

describe('updateInteraction', () => {
  it('updates BY ID with the updated_by stamp', async () => {
    const builder = createBuilder({ data: { id: 'i1' } });
    from.enqueue(builder);

    await updateInteraction('i1', input, 'user-1');

    expect(calledWith(builder, 'eq', 'id', 'i1')).toBe(true);
    const payload = callsOf(builder, 'update')[0][0] as Record<string, unknown>;
    expect(payload.updated_by).toBe('user-1');
    expect(payload.follow_up).toBeNull();
  });

  it('throws when RLS matches no row', async () => {
    from.enqueue(createBuilder({ data: null }));
    await expect(updateInteraction('i1', input, 'user-1')).rejects.toThrow(
      'You can only edit your own interactions',
    );
  });
});

describe('softDeleteInteraction', () => {
  it('sets is_deleted + updated_by and verifies via select(id)', async () => {
    const builder = createBuilder({ data: [{ id: 'i1' }] });
    from.enqueue(builder);

    await softDeleteInteraction('i1', 'user-1');

    expect(calledWith(builder, 'update', { is_deleted: true, updated_by: 'user-1' })).toBe(true);
    expect(calledWith(builder, 'select', 'id')).toBe(true);
  });

  it('throws on a phantom (0-row) delete', async () => {
    from.enqueue(createBuilder({ data: [] }));
    await expect(softDeleteInteraction('i1', 'user-1')).rejects.toThrow(
      'You can only delete your own interactions',
    );
  });
});
