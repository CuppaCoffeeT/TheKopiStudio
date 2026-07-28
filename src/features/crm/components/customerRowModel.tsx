/**
 * Customer row model — the Customers list's per-row derivation and cells.
 *
 * Extracted from `ClientsListPage` (2026-07-28, W23 LOC ceiling) at the seam
 * that was already there: the page owns fetching, URL state and the modals;
 * this owns what one row KNOWS and how it renders. Lowercase filename because
 * it is a model + cell builders, not a component (naming table in CLAUDE.md).
 *
 * Every derivation here goes through `lib/customerJourney` + `lib/customerAttention`
 * — the same rules the Overview queue and the customer detail launcher read — so
 * a row can never contradict the record it opens.
 */

import type { ReactNode } from 'react';
import { Badge } from '@/components/primitives/shell/Badge';
import { DateCell } from '@/components/primitives/shell/cells/DateCell';
import type { DataTableRow } from '@/components/primitives/ui/DataTable';
import type { CustomerSignals } from '../api/customerSignalsService';
import { deriveAttention } from '../lib/customerAttention';
import { deriveJourney, type CustomerJourney } from '../lib/customerJourney';
import type { CrmClient } from '../types';
import { JourneyChecklist } from './JourneyChecklist';

/** A customer row's derived state — journey + how long they have been quiet. */
export interface RowState {
  journey: CustomerJourney;
  quietDays: number | null;
  isQuiet: boolean;
  /** False when no interaction was ever logged — the column must not claim one. */
  hasContact: boolean;
}

/** Model numerics are form strings ('' = unset); the journey rules want numbers. */
export function toRowState(
  client: CrmClient,
  signals: CustomerSignals | undefined,
  refDate: Date,
): RowState {
  const journey = deriveJourney({
    hasProfile: signals?.hasProfile ?? false,
    email: client.email,
    phone: client.phone,
    dateOfBirth: client.dateOfBirth,
    occupation: client.occupation,
    annualIncome: client.annualIncome === '' ? null : Number(client.annualIncome),
    nextReviewDate: client.nextReviewDate,
  });
  const attention = deriveAttention(
    {
      lastContactDate: signals?.lastContactDate ?? null,
      addedDate: client.createdDate || null,
      nextReviewDate: client.nextReviewDate || null,
      journey,
    },
    refDate,
  );
  return {
    journey,
    quietDays: attention.quietDays,
    isQuiet: attention.isQuiet,
    hasContact: Boolean(signals?.lastContactDate),
  };
}

/**
 * "7 days ago" / "Today" / "Never contacted".
 *
 * The quiet CLOCK falls back to the added date (a customer added three weeks
 * ago with no reply has certainly gone quiet), but this LABEL must not — saying
 * "Today" under a "Last contact" heading for someone who has never been
 * contacted is simply false. The two readings are separated on purpose.
 */
export function contactLabel(state: RowState): string {
  if (!state.hasContact) return 'Never contacted';
  const days = state.quietDays;
  if (days === null) return 'Never contacted';
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

/** The risk chip's text — "Not profiled" until the profiler has actually run. */
export function riskLabel(client: CrmClient, state: RowState): string {
  return state.journey.steps.profiler === 'done' ? client.riskProfile : 'Not profiled';
}

/**
 * Last-contact cell, badged terracotta once the customer has gone quiet.
 *
 * A lowercase BUILDER, not a component: this file's job is the row model, and
 * exporting one component beside the helpers trips `react-refresh/only-export-
 * components` on every other export in the file.
 */
export function contactCell(client: CrmClient, state: RowState): ReactNode {
  if (state.isQuiet) {
    return (
      <Badge tone="danger" data-testid={`clients-quiet-${client.id}`}>
        {contactLabel(state)}
      </Badge>
    );
  }
  // --fg-dim, not --fg-muted: the 2a list row is `surface="bare"` and sits on
  // the PAGE cream, where #7D6B5B is 4.12:1 and fails AA.
  return <span className="text-[color:var(--fg-dim)]">{contactLabel(state)}</span>;
}

export function buildCustomerRow(
  client: CrmClient,
  state: RowState,
  onOpen: () => void,
): DataTableRow {
  return {
    id: client.id,
    testId: `clients-row-${client.id}`,
    onClick: onOpen,
    cells: [
      {
        key: 'name',
        grow: 2,
        content: (
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{client.name}</span>
            {/* --fg-dim for the same bare-row reason as ContactCell above:
                `DataRowCells` makes this step for its own `muted` cells, but
                content passed INTO a cell has to make it itself. */}
            <span className="truncate text-[11.5px] text-[color:var(--fg-dim)]">
              {client.email || client.phone || 'No contact on file'}
            </span>
          </span>
        ),
      },
      {
        key: 'risk',
        width: 124,
        content: (
          <Badge variant="outline" data-testid={`clients-risk-chip-${client.id}`}>
            {riskLabel(client, state)}
          </Badge>
        ),
      },
      { key: 'added', width: 104, content: <DateCell value={client.createdDate || null} /> },
      {
        key: 'progress',
        width: 168,
        content: (
          <JourneyChecklist journey={state.journey} testId={`clients-progress-${client.id}`} />
        ),
      },
      { key: 'contact', width: 140, content: contactCell(client, state) },
    ],
  };
}
