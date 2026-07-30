/**
 * Customer row model — the Advisor column's structural invariant.
 *
 * The Advisor (owner) column is optional: it shows only for viewers with
 * `view_all_clients`. The one thing that must never break is that the COLUMN
 * and the CELL are driven by the same flag — if they fall out of step, every
 * row's data shifts one column sideways under the header. These tests pin that:
 * `buildCustomerRow`'s cell keys must equal `customerColumns`' keys in BOTH
 * modes. They read cell/column *keys* only, so no DOM render is needed.
 */
import { describe, expect, it } from 'vitest';

import type { CustomerJourney } from '../../lib/customerJourney';
import type { CrmClient } from '../../types';
import { buildCustomerRow, customerColumns, type RowState } from '../customerRowModel';

const CLIENT = {
  id: 'c1',
  name: 'NKB',
  email: 'nkb@gmail.com',
  phone: '',
  createdDate: '2013-07-23',
  riskProfile: 'Aggressive',
} as CrmClient;

const STATE: RowState = {
  journey: { steps: { profiler: 'done', info: 'done', report: 'todo' } } as unknown as CustomerJourney,
  quietDays: null,
  isQuiet: false,
  hasContact: false,
};

const keysOf = <T extends { key: string }>(items: T[]) => items.map((i) => i.key);

describe('customerColumns', () => {
  it('omits the Advisor column when the viewer cannot see other books', () => {
    expect(keysOf(customerColumns(false))).toEqual(['name', 'risk', 'added', 'progress', 'contact']);
  });

  it('inserts Advisor immediately after the customer name when shown', () => {
    expect(keysOf(customerColumns(true))).toEqual([
      'name',
      'advisor',
      'risk',
      'added',
      'progress',
      'contact',
    ]);
  });
});

describe('buildCustomerRow — cells stay in lockstep with the columns', () => {
  it('emits no advisor cell when no advisor is passed', () => {
    const row = buildCustomerRow(CLIENT, STATE, () => {});
    expect(keysOf(row.cells)).toEqual(keysOf(customerColumns(false)));
  });

  it('inserts the advisor cell in the exact slot the column occupies', () => {
    const row = buildCustomerRow(CLIENT, STATE, () => {}, { name: 'Keane' });
    expect(keysOf(row.cells)).toEqual(keysOf(customerColumns(true)));
  });

  it('holds even when the owner name could not be resolved (null)', () => {
    const row = buildCustomerRow(CLIENT, STATE, () => {}, { name: null });
    expect(keysOf(row.cells)).toEqual(keysOf(customerColumns(true)));
  });
});
