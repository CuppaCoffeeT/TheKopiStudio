/**
 * PoliciesTab — the client's policies as list cards: type + status, provider /
 * policy number, premium with frequency, coverage summary via lib/finance
 * `formatCoverage`, ILP / hospitalization badges. Add / per-policy Edit go
 * through PolicyFormModal (projections replace inside the service); Delete is
 * a tier-1 confirm → soft delete (cascades to projections). All mutation
 * affordances are hidden in read-only mode.
 */

import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { formatCurrency } from '@/utils/currencyHelper';
import { formatCoverage } from '../../lib/finance';
import { useSoftDeletePolicy } from '../../hooks/usePolicyMutations';
import type { CrmPolicy } from '../../types';
import { PolicyFormModal } from '../modals/PolicyFormModal';
import { ListSection } from './ListSection';
import { RowActions } from './RowActions';

const STATUS_TONES: Record<string, BadgeTone> = {
  active: 'success',
  lapsed: 'warning',
  expired: 'danger',
  cancelled: 'danger',
  surrendered: 'danger',
  matured: 'info',
};

const statusTone = (status: string): BadgeTone => STATUS_TONES[status.toLowerCase()] ?? 'neutral';

/** Hospitalization plans show their ward class; everything else the coverage tiers. */
function coverageSummary(policy: CrmPolicy): string {
  if (policy.isHospitalization) return policy.hospitalType || '—';
  const parts: string[] = [];
  if (Number(policy.coverageAmount) > 0) parts.push(`Death ${formatCoverage(Number(policy.coverageAmount))}`);
  if (Number(policy.tpdCoverage) > 0) parts.push(`TPD ${formatCoverage(Number(policy.tpdCoverage))}`);
  if (Number(policy.criticalIllnessCoverage) > 0) parts.push(`CI ${formatCoverage(Number(policy.criticalIllnessCoverage))}`);
  if (Number(policy.earlyCriticalIllnessCoverage) > 0) parts.push(`ECI ${formatCoverage(Number(policy.earlyCriticalIllnessCoverage))}`);
  return parts.length > 0 ? parts.join(' · ') : 'No coverage recorded';
}

interface PoliciesTabProps {
  clientId: string;
  readOnly: boolean;
  policies: UseQueryResult<CrmPolicy[]>;
}

export function PoliciesTab({ clientId, readOnly, policies }: PoliciesTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmPolicy | null>(null);
  const [deleting, setDeleting] = useState<CrmPolicy | null>(null);
  const removePolicy = useSoftDeletePolicy(clientId);
  const rows = policies.data ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <>
      <ListSection
        title="Policies"
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
              data-testid="clients-policies-add-btn"
            >
              Add policy
            </Button>
          ) : undefined
        }
        isLoading={policies.isLoading}
        isError={policies.isError}
        onRetry={() => void policies.refetch()}
        errorSubhead="Failed to load policies"
        errorBody="The client's policies could not be loaded. Check your connection and try again."
        retryPath={`/clients/${clientId}`}
        isEmpty={rows.length === 0}
        emptyTitle="No policies yet"
        emptySubtext={
          readOnly
            ? 'This client has no recorded policies.'
            : "Add this client's first policy to start tracking coverage and premiums."
        }
        testId="clients-policies"
      >
        {rows.map((policy) => (
          <li
            key={policy.id}
            className="flex flex-col gap-1.5 px-5 py-4"
            data-testid={`clients-policy-row-${policy.id}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {policy.type}
              </span>
              <Badge tone={statusTone(policy.status)}>{policy.status}</Badge>
              {policy.isInvestmentLinked && (
                <Badge tone="accent" dot={false}>
                  ILP
                </Badge>
              )}
              {policy.isHospitalization && (
                <Badge tone="warning" dot={false}>
                  Hospitalization
                </Badge>
              )}
              {!readOnly && (
                <RowActions
                  onEdit={() => {
                    setEditing(policy);
                    setFormOpen(true);
                  }}
                  onDelete={() => setDeleting(policy)}
                  editLabel={`Edit ${policy.type} policy`}
                  deleteLabel={`Delete ${policy.type} policy`}
                  editTestId={`clients-policy-edit-btn-${policy.id}`}
                  deleteTestId={`clients-policy-delete-btn-${policy.id}`}
                />
              )}
            </div>
            <div
              className="text-[11.5px] text-zinc-500 dark:text-zinc-400"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {policy.provider || '—'} · {policy.policyNumber || 'No policy number'}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-zinc-700 dark:text-zinc-300">
              <span>
                Premium {formatCurrency(Number(policy.premium) || 0)} / {policy.frequency}
              </span>
              <span>{coverageSummary(policy)}</span>
            </div>
          </li>
        ))}
      </ListSection>

      {!readOnly && (
        <PolicyFormModal
          open={formOpen}
          onOpenChange={(next: boolean) => (next ? setFormOpen(true) : closeForm())}
          clientId={clientId}
          policy={editing ?? undefined}
        />
      )}

      {!readOnly && (
        <DestructiveConfirmDialog
          open={deleting !== null}
          onOpenChange={(next) => {
            if (!next) setDeleting(null);
          }}
          tier={1}
          resource={deleting ? deleting.policyNumber || deleting.type : 'policy'}
          resourceKind="policy"
          title="delete policy?"
          description={`This removes the ${deleting?.type ?? ''} policy${deleting?.policyNumber ? ` ${deleting.policyNumber}` : ''} and its cash-value projections from the client's record.`}
          confirmLabel="Delete policy"
          loading={removePolicy.isPending}
          onConfirm={() => {
            if (deleting) removePolicy.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }}
          testId="clients-policy-delete-dialog"
        />
      )}
    </>
  );
}
