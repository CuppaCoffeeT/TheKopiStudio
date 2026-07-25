/**
 * BankHistoryTab — date-ASC bank-balance history (service orders date ASC):
 * date, balance, notes per row; the header shows the client's CURRENT derived
 * total (`clients.total_bank_balance`, recomputed by the service after every
 * mutation — corrected legacy bugs 2+3). Add / Edit go through
 * BankBalanceModal; Delete is a tier-1 confirm → soft delete (also followed
 * by a recompute). All mutation affordances are hidden in read-only mode.
 */

import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import { Button } from '@/components/primitives/shell/Button';
import { formatCurrency } from '@/utils/currencyHelper';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { useSoftDeleteBankRecord } from '../../hooks/useBankMutations';
import type { CrmBankRecord, CrmClient } from '../../types';
import { BankBalanceModal } from '../modals/BankBalanceModal';
import { ListSection } from './ListSection';
import { RowActions } from './RowActions';

interface BankHistoryTabProps {
  clientId: string;
  readOnly: boolean;
  /** For the derived current total in the header. */
  client: CrmClient;
  bankHistory: UseQueryResult<CrmBankRecord[]>;
}

export function BankHistoryTab({ clientId, readOnly, client, bankHistory }: BankHistoryTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmBankRecord | null>(null);
  const [deleting, setDeleting] = useState<CrmBankRecord | null>(null);
  const removeRecord = useSoftDeleteBankRecord(clientId);
  const rows = bankHistory.data ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <>
      <ListSection
        title="Bank history"
        meta={
          <span data-testid="clients-bank-current-total">
            Current total{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(Number(client.totalBankBalance) || 0)}
            </span>{' '}
            · derived from the latest record
          </span>
        }
        action={
          !readOnly ? (
            <Button
              variant="primary"
              size="md"
              leadingIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              data-testid="clients-bank-add-btn"
            >
              Add record
            </Button>
          ) : undefined
        }
        isLoading={bankHistory.isLoading}
        isError={bankHistory.isError}
        onRetry={() => void bankHistory.refetch()}
        errorSubhead="Bank history didn't load."
        errorBody="The client's bank-balance history could not be read. Check your connection and try again."
        isEmpty={rows.length === 0}
        emptyTitle="No bank records yet"
        emptySubtext={
          readOnly
            ? 'No balance snapshots have been recorded for this client.'
            : 'Record a balance snapshot to start the history — the client total derives from the latest record.'
        }
        testId="clients-bank"
      >
        {rows.map((record) => (
          <li
            key={record.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5"
            data-testid={`clients-bank-row-${record.id}`}
          >
            <span
              className="w-28 flex-shrink-0 text-[11.5px] text-muted-foreground"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {formatDisplayDateLong(record.date)}
            </span>
            <span className="text-[13.5px] font-semibold tabular-nums text-foreground">
              {formatCurrency(Number(record.balance) || 0)}
            </span>
            <span className="min-w-0 flex-1 break-words text-[12.5px] text-muted-foreground">
              {record.notes}
            </span>
            {!readOnly && (
              <RowActions
                onEdit={() => {
                  setEditing(record);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleting(record)}
                editLabel={`Edit bank record dated ${record.date}`}
                deleteLabel={`Delete bank record dated ${record.date}`}
                editTestId={`clients-bank-edit-btn-${record.id}`}
                deleteTestId={`clients-bank-delete-btn-${record.id}`}
              />
            )}
          </li>
        ))}
      </ListSection>

      {!readOnly && (
        <BankBalanceModal
          open={formOpen}
          onOpenChange={(next: boolean) => (next ? setFormOpen(true) : closeForm())}
          clientId={clientId}
          record={editing ?? undefined}
        />
      )}

      {!readOnly && (
        <DestructiveConfirmDialog
          open={deleting !== null}
          onOpenChange={(next) => {
            if (!next) setDeleting(null);
          }}
          tier={1}
          resource={deleting ? `record dated ${formatDisplayDateLong(deleting.date)}` : 'record'}
          resourceKind="bank record"
          title="delete bank record?"
          description={`This removes the ${deleting ? formatDisplayDateLong(deleting.date) : ''} balance snapshot. The client's total recomputes from the remaining records.`}
          confirmLabel="Delete record"
          loading={removeRecord.isPending}
          onConfirm={() => {
            if (deleting) removeRecord.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }}
          testId="clients-bank-delete-dialog"
        />
      )}
    </>
  );
}
