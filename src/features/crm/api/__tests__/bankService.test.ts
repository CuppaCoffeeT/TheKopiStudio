/**
 * bankService unit tests (mocked supabase chain) — corrected legacy bugs 2+3:
 * every mutation recomputes the client's derived columns from the LATEST
 * non-deleted row (date DESC, created_at DESC, id DESC), zero rows reset to
 * 0/null, and reads carry the soft-delete filter.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBankRecord,
  listBankHistoryByClient,
  recomputeClientBalance,
  softDeleteBankRecord,
  updateBankRecord,
} from '../bankService';
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

const record = { date: '2026-06-01', balance: '8200.5', notes: 'Quarterly review' };

let from: FromQueue;
beforeEach(() => {
  fromMock.mockReset();
  from = wireFromQueue(fromMock);
});

describe('listBankHistoryByClient', () => {
  it('reads non-deleted rows for the client, oldest first, bounded', async () => {
    const builder = createBuilder({ data: [] });
    from.enqueue(builder);

    await listBankHistoryByClient('client-1');

    expect(calledWith(builder, 'eq', 'client_id', 'client-1')).toBe(true);
    expectSoftDeleteFilter(builder);
    expect(calledWith(builder, 'order', 'date', { ascending: true })).toBe(true);
    expect(calledWith(builder, 'limit', 1000)).toBe(true);
  });
});

describe('recomputeClientBalance', () => {
  it('picks the latest row by (date, created_at, id) DESC and writes both columns', async () => {
    const latestFetch = createBuilder({ data: { balance: 8200.5, date: '2026-05-30' } });
    const clientUpdate = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(latestFetch, clientUpdate);

    await recomputeClientBalance('client-1', 'user-1');

    expectSoftDeleteFilter(latestFetch);
    expect(callsOf(latestFetch, 'order')).toEqual([
      ['date', { ascending: false }],
      ['created_at', { ascending: false }],
      ['id', { ascending: false }],
    ]);
    expect(calledWith(latestFetch, 'limit', 1)).toBe(true);
    expect(calledWith(clientUpdate, 'update', {
      total_bank_balance: 8200.5,
      last_review_date: '2026-05-30',
      updated_by: 'user-1',
    })).toBe(true);
    expect(calledWith(clientUpdate, 'eq', 'id', 'client-1')).toBe(true);
  });

  it('resets to 0 / null when no non-deleted rows remain', async () => {
    const latestFetch = createBuilder({ data: null });
    const clientUpdate = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(latestFetch, clientUpdate);

    await recomputeClientBalance('client-1', 'user-1');

    expect(calledWith(clientUpdate, 'update', {
      total_bank_balance: 0,
      last_review_date: null,
      updated_by: 'user-1',
    })).toBe(true);
  });

  it('throws when the client update matches no row', async () => {
    from.enqueue(createBuilder({ data: null }), createBuilder({ data: [] }));
    await expect(recomputeClientBalance('client-1', 'user-1')).rejects.toThrow(
      'Balance recompute could not update this client',
    );
  });
});

describe('createBankRecord', () => {
  it('stamps identity on the insert, then recomputes', async () => {
    const insert = createBuilder({ data: { id: 'bank-1' } });
    const latestFetch = createBuilder({ data: { balance: 8200.5, date: '2026-06-01' } });
    const clientUpdate = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(insert, latestFetch, clientUpdate);

    await createBankRecord('client-1', record, 'user-1');

    expect(from.tables).toEqual(['bank_balance_history', 'bank_balance_history', 'clients']);
    expect(callsOf(insert, 'insert')[0][0]).toEqual({
      date: '2026-06-01',
      balance: 8200.5,
      notes: 'Quarterly review',
      client_id: 'client-1',
      user_id: 'user-1',
      created_by: 'user-1',
    });
  });
});

describe('updateBankRecord', () => {
  it('updates BY ID with the updated_by stamp, then recomputes', async () => {
    const update = createBuilder({ data: { id: 'bank-1' } });
    const latestFetch = createBuilder({ data: { balance: 1, date: '2026-06-01' } });
    const clientUpdate = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(update, latestFetch, clientUpdate);

    await updateBankRecord('bank-1', 'client-1', record, 'user-1');

    expect(calledWith(update, 'eq', 'id', 'bank-1')).toBe(true);
    const payload = callsOf(update, 'update')[0][0] as Record<string, unknown>;
    expect(payload.updated_by).toBe('user-1');
    expect(payload.balance).toBe(8200.5);
    expect(from.tables).toEqual(['bank_balance_history', 'bank_balance_history', 'clients']);
  });

  it('throws on an RLS-blocked update and skips the recompute', async () => {
    from.enqueue(createBuilder({ data: null }));
    await expect(updateBankRecord('bank-1', 'client-1', record, 'user-1')).rejects.toThrow(
      'You can only edit your own bank records',
    );
    expect(from.tables).toEqual(['bank_balance_history']);
  });
});

describe('softDeleteBankRecord', () => {
  it('soft-deletes BY ID, then recomputes', async () => {
    const softDelete = createBuilder({ data: [{ id: 'bank-1' }] });
    const latestFetch = createBuilder({ data: null });
    const clientUpdate = createBuilder({ data: [{ id: 'client-1' }] });
    from.enqueue(softDelete, latestFetch, clientUpdate);

    await softDeleteBankRecord('bank-1', 'client-1', 'user-1');

    expect(calledWith(softDelete, 'update', { is_deleted: true, updated_by: 'user-1' })).toBe(true);
    expect(calledWith(softDelete, 'eq', 'id', 'bank-1')).toBe(true);
    expect(calledWith(clientUpdate, 'update', {
      total_bank_balance: 0,
      last_review_date: null,
      updated_by: 'user-1',
    })).toBe(true);
  });

  it('throws on a phantom (0-row) delete and skips the recompute', async () => {
    from.enqueue(createBuilder({ data: [] }));
    await expect(softDeleteBankRecord('bank-1', 'client-1', 'user-1')).rejects.toThrow(
      'You can only delete your own bank records',
    );
    expect(from.tables).toEqual(['bank_balance_history']);
  });
});
