/**
 * ClientDetailPage — one customer's record (DETAIL archetype, route
 * /clients/:id — shares modulePath '/clients' with the list).
 *
 * This is the home of the customer-centred IA (Kopi Studio Directions turn 3a):
 * the three tools are launched from here, off `CustomerToolLauncher`, because
 * a tool always acts on a specific customer. Before that launcher existed the
 * chain was invisible from the record, and `/clients/:id/report` had no entry
 * point anywhere in the app.
 *
 * DetailPageFrame + TabNav over four tabs (Overview · Policies ·
 * Interactions · Bank history); `useClientDetail` fetches the client row and
 * the three child collections in parallel on detail(id) sub-keys. Header meta
 * carries risk profile, review frequency and the follow-up badge (earliest
 * future interaction follow-up, else next review — lib/followUps). Edit
 * opens ClientFormModal in edit mode; Delete is a confirm → soft delete →
 * navigate back (inside the mutation hook). A client owned by another
 * advisor (manager/super_admin read-everything) renders fully read-only —
 * every mutation affordance hidden, profiler's ReadOnlyHint pattern.
 */

import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import { DetailPageFrame } from '@/components/primitives/detail/DetailPageFrame';
import type { TabNavItem } from '@/components/primitives/detail/TabNav';
import { ErrorState } from '@/components/primitives/shell/ErrorState';
import { LoadingSkeleton } from '@/components/primitives/shell/LoadingSkeleton';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { deriveJourney } from '../lib/customerJourney';
import { resolveClientFollowUp } from '../lib/followUps';
import { clientFromRow } from '../lib/mapping';
import { useClientDetail } from '../hooks/useClientDetail';
import { useSoftDeleteClient } from '../hooks/useClientMutations';
import { BankHistoryTab } from '../components/detail/BankHistoryTab';
import { ClientDetailActions } from '../components/detail/ClientDetailActions';
import { CustomerToolLauncher } from '../components/detail/CustomerToolLauncher';
import { InteractionsTab } from '../components/detail/InteractionsTab';
import { OverviewTab } from '../components/detail/OverviewTab';
import { PoliciesTab } from '../components/detail/PoliciesTab';
import { FollowUpBadge } from '../components/FollowUpBadge';
import { ClientFormModal } from '../components/modals/ClientFormModal';

type DetailTab = 'overview' | 'policies' | 'interactions' | 'bank';

const PROFILER_PATH = '/profiler';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, modules } = useAuth();
  const { client, policies, interactions, bankHistory, linkedResults } = useClientDetail(id);
  const removeClient = useSoftDeleteClient(id ?? '');
  const [tab, setTab] = useState<DetailTab>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const row = client.data ?? null;
  // Identity-stable per row (React Query structural sharing): a child-query or
  // background refetch re-render must NOT recreate the model, or the open
  // ClientFormModal's [open, client] re-seed effect fires again and silently
  // clobbers in-flight edits (caught by the clients-advisor E2E rename step).
  const model = useMemo(() => (row ? clientFromRow(row) : null), [row]);
  const isOwn = Boolean(row && user && row.user_id === user.id);
  const refDate = getCurrentSingaporeTime();
  const followUp = model
    ? resolveClientFollowUp(interactions.data ?? [], model.nextReviewDate, refDate)
    : null;

  // The launcher's three states come from the SAME ruleset the Overview queue
  // and the Customers list checklist read, so this page can never disagree with
  // the row that opened it. `linkedResults` is RLS-pruned: a profile owned by
  // another advisor reads as un-profiled, deliberately indistinguishable from
  // never-profiled (REPORTS_LINK_PRD neutral-empty-state rule).
  const newestLinkedResult = linkedResults.data?.[0] ?? null;
  const journey = model
    ? deriveJourney({
        hasProfile: Boolean(newestLinkedResult),
        email: model.email,
        phone: model.phone,
        dateOfBirth: model.dateOfBirth,
        occupation: model.occupation,
        annualIncome: model.annualIncome === '' ? null : Number(model.annualIncome),
        nextReviewDate: model.nextReviewDate,
      })
    : null;
  const canProfile = modules.some((mod) => mod.path === PROFILER_PATH);

  const tabs: TabNavItem[] = [
    { value: 'overview', label: 'Overview', testId: 'clients-detail-tab-overview' },
    { value: 'policies', label: 'Policies', count: policies.data?.length ?? null, testId: 'clients-detail-tab-policies' },
    { value: 'interactions', label: 'Interactions', count: interactions.data?.length ?? null, testId: 'clients-detail-tab-interactions' },
    { value: 'bank', label: 'Bank history', count: bankHistory.data?.length ?? null, testId: 'clients-detail-tab-bank' },
  ];

  const actionProps = model
    ? {
        isOwn,
        deleting: removeClient.isPending,
        onEdit: () => setEditOpen(true),
        onDelete: () => setDeleteOpen(true),
      }
    : null;

  return (
    <DetailPageFrame
      breadcrumb={[
        { label: 'Overview', href: '/dashboard' },
        { label: 'Customers', href: '/clients' },
        { label: model?.name ?? 'Customer' },
      ]}
      title={model?.name ?? 'Customer record'}
      recordId={id ? id.slice(0, 8) : undefined}
      meta={
        model
          ? [
              `Risk: ${model.riskProfile}`,
              `Review: ${model.reviewFrequency}`,
              ...(followUp?.badge
                ? [
                    <FollowUpBadge
                      key="follow-up"
                      date={followUp.date}
                      refDate={refDate}
                      testId="clients-detail-follow-up-badge"
                    />,
                  ]
                : []),
            ]
          : undefined
      }
      actions={actionProps ? <ClientDetailActions {...actionProps} /> : undefined}
      mobileActionBar={actionProps ? <ClientDetailActions {...actionProps} mobile /> : undefined}
      tabs={model ? tabs : undefined}
      activeTab={tab}
      onTabChange={(next) => setTab(next as DetailTab)}
      variant="fullWidth"
      testId="clients-detail"
    >
      {client.isLoading && (
        <div data-testid="clients-detail-loading">
          <LoadingSkeleton variant="table-rows" rowCount={6} />
        </div>
      )}

      {client.isError && (
        <ErrorState
          variant="compact"
          subhead="This client didn't load."
          body="The client record could not be read. Check your connection and try again."
          onRetry={() => void client.refetch()}
        />
      )}

      {!client.isLoading && !client.isError && !model && (
        <div data-testid="clients-detail-not-found">
          <NoResultsState query={id} />
        </div>
      )}

      {model && id && journey && tab === 'overview' && (
        <>
          <CustomerToolLauncher
            journey={journey}
            linkedResultId={newestLinkedResult?.id ?? null}
            clientId={id}
            isOwn={isOwn}
            canProfile={canProfile}
            onStartProfiler={() => navigate(PROFILER_PATH)}
            onOpenProfile={(resultId) => navigate(`/profiler-results/${resultId}`)}
            onEditInformation={() => setEditOpen(true)}
            onOpenReport={() => navigate(`/clients/${id}/report`)}
          />
          <OverviewTab client={model} linkedResults={linkedResults} />
        </>
      )}
      {model && id && tab === 'policies' && (
        <PoliciesTab clientId={id} readOnly={!isOwn} policies={policies} />
      )}
      {model && id && tab === 'interactions' && (
        <InteractionsTab clientId={id} readOnly={!isOwn} interactions={interactions} refDate={refDate} />
      )}
      {model && id && tab === 'bank' && (
        <BankHistoryTab clientId={id} readOnly={!isOwn} client={model} bankHistory={bankHistory} />
      )}

      {model && isOwn && (
        <ClientFormModal open={editOpen} onOpenChange={setEditOpen} client={model} />
      )}

      {model && isOwn && (
        <DestructiveConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          tier={1}
          resource={model.name}
          resourceKind="client"
          title="delete client?"
          description={`This removes ${model.name} from your book along with their policies, interactions and bank history.`}
          confirmLabel="Delete client"
          loading={removeClient.isPending}
          onConfirm={() => removeClient.mutate()}
          testId="clients-detail-delete-dialog"
        />
      )}
    </DetailPageFrame>
  );
}
