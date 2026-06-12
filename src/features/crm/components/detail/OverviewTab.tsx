/**
 * OverviewTab — client profile facts + financial snapshot (no mutation
 * affordances; purely presentational, so read-only mode needs no gating).
 *
 * `totalBankBalance` / `lastReviewDate` are READ-ONLY derivations owned by
 * the bank-history recompute (corrected legacy bug 1) — displayed here with
 * a "derived" hint and editable only through the Bank history tab.
 */

import type { ReactNode } from 'react';
import { Card, CardTitle } from '@/components/primitives/shell/Card';
import { formatCurrency } from '@/utils/currencyHelper';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import type { CrmClient } from '../../types';

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt
        className="text-[10.5px] uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {label}
      </dt>
      <dd className="m-0 mt-0.5 break-words text-[13.5px] text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </div>
  );
}

/** Model numerics are form strings ('' = unset) — render an em-dash when unset. */
const fmtMoney = (value: string): string => (value === '' ? '—' : formatCurrency(Number(value)));
const fmtDate = (value: string): string => (value ? formatDisplayDateLong(value) : '—');
const fmtText = (value: string): string => value || '—';

export function OverviewTab({ client }: { client: CrmClient }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-testid="clients-detail-overview">
      <Card>
        <CardTitle as="h2">Profile</CardTitle>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Fact label="Email" value={fmtText(client.email)} />
          <Fact label="Phone" value={fmtText(client.phone)} />
          <Fact label="Date of birth" value={fmtDate(client.dateOfBirth)} />
          <Fact label="Occupation" value={fmtText(client.occupation)} />
          <Fact label="Annual income" value={fmtMoney(client.annualIncome)} />
          <Fact label="Client since" value={fmtDate(client.createdDate)} />
          <Fact label="Next review" value={fmtDate(client.nextReviewDate)} />
          <Fact label="Risk profile" value={fmtText(client.riskProfile)} />
        </dl>
        <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
          <dl>
            <Fact
              label="Notes"
              value={<span className="whitespace-pre-wrap">{fmtText(client.notes)}</span>}
            />
          </dl>
        </div>
      </Card>

      <Card>
        <CardTitle as="h2">Financials</CardTitle>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Fact label="CPF Ordinary Account" value={fmtMoney(client.cpfOA)} />
          <Fact label="CPF Special Account" value={fmtMoney(client.cpfSA)} />
          <Fact label="CPF MediSave Account" value={fmtMoney(client.cpfMA)} />
          <Fact
            label="Total bank balance"
            value={
              <>
                <span data-testid="clients-detail-total-balance">
                  {formatCurrency(Number(client.totalBankBalance) || 0)}
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  Derived from bank history
                </span>
              </>
            }
          />
          <Fact label="Last review date" value={fmtDate(client.lastReviewDate)} />
        </dl>
      </Card>
    </div>
  );
}
