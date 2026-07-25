/**
 * OverviewTab — the client dossier body (2a detail archetype).
 *
 * Layout follows the 2a Detail comp: a 1.4fr/1fr grid of cream panels — wide
 * column carries FINANCIAL POSITION (stat columns + the single brown ramp) and
 * NOTES, narrow column carries RELATIONSHIP (label/value rows) and the
 * transient COMMUNICATION STYLE panel. Panels come from
 * `primitives/detail/dossier`; nothing here re-implements card chrome.
 *
 * `totalBankBalance` / `lastReviewDate` are READ-ONLY derivations owned by
 * the bank-history recompute (corrected legacy bug 1) — displayed here with
 * a "derived" hint and editable only through the Bank history tab.
 *
 * The Communication style panel renders the linked profiler results (RLS
 * pruned) straight from the query: 2a loading panel while loading, ErrorState
 * with retry on failure (ListSection precedent), and only on a SETTLED empty
 * result the one NEUTRAL empty state covering both "never converted" and
 * "linked but RLS-hidden" — deliberately indistinguishable (REPORTS_LINK_PRD
 * neutral-empty-state rule). DISC colours are defined LOCALLY: importing
 * profiler's content palette would be a cross-feature drift error.
 */

import type { UseQueryResult } from '@tanstack/react-query';
import {
  DossierKeyValueList,
  DossierLoadingPanel,
  DossierPanel,
  DossierRampBar,
  DossierStatGrid,
} from '@/components/primitives/detail/dossier';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { formatCurrency } from '@/utils/currencyHelper';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import type { CrmClient, LinkedProfilerResult } from '../../types';
import { CommunicationStyleRows } from './CommunicationStyleRows';

/** Model numerics are form strings ('' = unset) — render an em-dash when unset. */
const fmtMoney = (value: string): string => (value === '' ? '—' : formatCurrency(Number(value)));
const fmtDate = (value: string): string => (value ? formatDisplayDateLong(value) : '—');
const fmtText = (value: string): string => value || '—';
const num = (value: string): number => Number(value) || 0;

interface OverviewTabProps {
  client: CrmClient;
  /** Linked profiler results query, newest first (RLS-pruned; settled empty = neutral state). */
  linkedResults: UseQueryResult<LinkedProfilerResult[]>;
}

export function OverviewTab({ client, linkedResults }: OverviewTabProps) {
  const linkedRows = linkedResults.data ?? [];
  const balance = num(client.totalBankBalance);

  return (
    <div
      className="grid grid-cols-1 items-start gap-[22px] lg:grid-cols-[1.4fr_1fr]"
      data-testid="clients-detail-overview"
    >
      <div className="flex min-w-0 flex-col gap-[22px]">
        <DossierPanel label="Financial position" density="stat">
          <DossierStatGrid
            stats={[
              {
                label: 'Bank balance',
                value: formatCurrency(balance),
                testId: 'clients-detail-total-balance',
              },
              { label: 'CPF OA', value: fmtMoney(client.cpfOA) },
              { label: 'CPF SA', value: fmtMoney(client.cpfSA) },
              { label: 'Medisave', value: fmtMoney(client.cpfMA) },
            ]}
          />
          <DossierRampBar
            segments={[
              { label: 'Bank', value: balance },
              { label: 'CPF OA', value: num(client.cpfOA) },
              { label: 'CPF SA', value: num(client.cpfSA) },
              { label: 'Medisave', value: num(client.cpfMA) },
            ]}
            testId="clients-detail-position-ramp"
          />
          <p className="m-0 mt-2.5 text-[11.5px] text-muted-foreground">
            Bank balance derived from bank history
          </p>
        </DossierPanel>

        <DossierPanel label="Notes" density="prose">
          <p className="m-0 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[color:var(--fg-dim)]">
            {fmtText(client.notes)}
          </p>
        </DossierPanel>
      </div>

      <div className="flex min-w-0 flex-col gap-[22px]">
        <DossierPanel label="Relationship">
          <DossierKeyValueList
            rows={[
              { label: 'Email', value: fmtText(client.email) },
              { label: 'Phone', value: fmtText(client.phone) },
              { label: 'Date of birth', value: fmtDate(client.dateOfBirth) },
              { label: 'Occupation', value: fmtText(client.occupation) },
              { label: 'Annual income', value: fmtMoney(client.annualIncome) },
              { label: 'Risk profile', value: fmtText(client.riskProfile) },
              { label: 'Review frequency', value: fmtText(client.reviewFrequency) },
              { label: 'Client since', value: fmtDate(client.createdDate) },
              { label: 'Last review', value: fmtDate(client.lastReviewDate) },
              { label: 'Next review', value: fmtDate(client.nextReviewDate) },
            ]}
          />
        </DossierPanel>

        {linkedResults.isLoading ? (
          <div data-testid="clients-detail-comm-style-loading">
            <DossierLoadingPanel
              verb="Reading the playbooks…"
              caption="Loading linked profiling results"
            />
          </div>
        ) : (
          <DossierPanel label="Communication style" testId="clients-detail-comm-style">
            {linkedResults.isError && (
              <ErrorState
                variant="compact"
                subhead="Profiling results didn't load."
                body="Check your connection and try again."
                onRetry={() => void linkedResults.refetch()}
                className="px-0 py-6"
              />
            )}
            {!linkedResults.isError && linkedRows.length === 0 && (
              <p
                className="m-0 text-[12.5px] text-muted-foreground"
                data-testid="clients-detail-comm-style-empty"
              >
                No visible profiling results
              </p>
            )}
            {!linkedResults.isError && linkedRows.length > 0 && (
              <CommunicationStyleRows rows={linkedRows} />
            )}
          </DossierPanel>
        )}
      </div>
    </div>
  );
}
