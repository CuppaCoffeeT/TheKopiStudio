/**
 * OverviewTab — client profile facts + financial snapshot + communication
 * style (no mutation affordances; purely presentational, so read-only mode
 * needs no gating).
 *
 * `totalBankBalance` / `lastReviewDate` are READ-ONLY derivations owned by
 * the bank-history recompute (corrected legacy bug 1) — displayed here with
 * a "derived" hint and editable only through the Bank history tab.
 *
 * The Communication style card renders the linked profiler results (RLS
 * pruned) straight from the query: skeleton while loading, ErrorState with
 * retry on failure (ListSection precedent), and only on a SETTLED empty
 * result the one NEUTRAL empty state covering both "never converted" and
 * "linked but RLS-hidden" — deliberately indistinguishable (REPORTS_LINK_PRD
 * neutral-empty-state rule). DISC colours are defined LOCALLY: importing
 * profiler's content palette would be a cross-feature drift error.
 */

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/primitives/shell/Card';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { formatCurrency } from '@/utils/currencyHelper';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import type { CrmClient, LinkedProfilerResult } from '../../types';

/** Legacy DISC palette, duplicated from the profiler hexes BY DESIGN (no import). */
const DISC_COLORS: Record<string, string> = {
  D: '#C0392B',
  I: '#D4680A',
  S: '#1A7A40',
  C: '#1A5F8A',
};
const DISC_NEUTRAL = '#52525b'; // zinc-600 — unexpected letters render toneless

function DiscPill({ letter, emphasis }: { letter: string; emphasis: 'primary' | 'secondary' }) {
  const col = DISC_COLORS[letter] ?? DISC_NEUTRAL;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium text-foreground ${
        emphasis === 'primary' ? 'px-2 py-0.5 text-[11px]' : 'px-1.5 py-0.5 text-[10px] opacity-75'
      }`}
      style={{ backgroundColor: `${col}1A`, borderColor: `${col}59`, fontFamily: 'var(--font-mono)' }}
    >
      {emphasis === 'primary' && (
        <span aria-hidden className="h-[5px] w-[5px] shrink-0 rounded-full" style={{ backgroundColor: col }} />
      )}
      {letter}
    </span>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt
        className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground"
        style={{ fontFamily: 'var(--font-pixel)' }}
      >
        {label}
      </dt>
      <dd className="m-0 mt-0.5 break-words text-[13.5px] text-foreground">
        {value}
      </dd>
    </div>
  );
}

/** Model numerics are form strings ('' = unset) — render an em-dash when unset. */
const fmtMoney = (value: string): string => (value === '' ? '—' : formatCurrency(Number(value)));
const fmtDate = (value: string): string => (value ? formatDisplayDateLong(value) : '—');
const fmtText = (value: string): string => value || '—';

interface OverviewTabProps {
  client: CrmClient;
  /** Linked profiler results query, newest first (RLS-pruned; settled empty = neutral state). */
  linkedResults: UseQueryResult<LinkedProfilerResult[]>;
}

export function OverviewTab({ client, linkedResults }: OverviewTabProps) {
  const linkedRows = linkedResults.data ?? [];
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
        <div className="mt-4 border-t border-border pt-4">
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
                <span className="block text-[11px] text-muted-foreground">
                  Derived from bank history
                </span>
              </>
            }
          />
          <Fact label="Last review date" value={fmtDate(client.lastReviewDate)} />
        </dl>
      </Card>

      <Card className="lg:col-span-2" data-testid="clients-detail-comm-style">
        <CardTitle as="h2">Communication style</CardTitle>
        {linkedResults.isLoading && (
          <div className="mt-3" data-testid="clients-detail-comm-style-loading">
            <LoadingSkeleton variant="table-rows" rowCount={2} />
          </div>
        )}
        {!linkedResults.isLoading && linkedResults.isError && (
          <ErrorState
            subhead="Failed to load profiling results"
            body="The linked profiling results could not be loaded. Check your connection and try again."
            path={`/clients/${client.id}`}
            onRetry={() => void linkedResults.refetch()}
            className="rounded-2xl"
          />
        )}
        {!linkedResults.isLoading && !linkedResults.isError && linkedRows.length === 0 && (
          <p
            className="m-0 mt-3 text-[12.5px] text-muted-foreground"
            data-testid="clients-detail-comm-style-empty"
          >
            No visible profiling results
          </p>
        )}
        {!linkedResults.isLoading && !linkedResults.isError && linkedRows.length > 0 && (
          <ul className="m-0 mt-4 grid list-none gap-3 p-0">
            {linkedRows.map((result) => (
              <li
                key={result.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-3 last:border-b-0 last:pb-0"
                data-testid={`clients-detail-comm-style-row-${result.id}`}
              >
                <span
                  className="inline-flex items-center gap-1"
                  aria-label={`DISC ${result.disc_primary} primary, ${result.disc_secondary} secondary`}
                >
                  <DiscPill letter={result.disc_primary} emphasis="primary" />
                  <DiscPill letter={result.disc_secondary} emphasis="secondary" />
                </span>
                <span
                  className="text-[13px] font-medium text-foreground"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  MBTI {result.mbti}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {formatDisplayDateLong(result.created_at)}
                </span>
                <Link
                  to={`/profiler-results/${result.id}`}
                  className="inline-flex min-h-11 items-center text-[12.5px] font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-400 sm:ml-auto"
                  data-testid={`clients-detail-view-playbook-${result.id}`}
                >
                  View full playbook
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
