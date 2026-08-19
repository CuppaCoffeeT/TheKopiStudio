/**
 * ClientDetailPage — one customer's record (DETAIL archetype, route
 * /clients/:id — shares modulePath '/clients' with the list).
 *
 * `CustomerToolLauncher` launches the six tools from here — the customer-first
 * direction of the trip, kept when the tools also became places of their own at
 * `/tools/*` (2026-08-18). Before it existed the chain was invisible from the
 * record and the report had no entry point anywhere in the app.
 *
 * DetailPageFrame + TabNav over four tabs (Overview · Policies · Activity ·
 * Bank history); `useClientDetail` fetches the client row and its child
 * collections in parallel on detail(id) sub-keys, and `useCustomerActivity`
 * adds the merged automatic+manual timeline. Header meta carries risk profile,
 * review frequency and the follow-up badge (lib/followUps). Edit opens
 * ClientFormModal; Delete is a confirm → soft delete → navigate back. Another
 * advisor's customer renders fully read-only.
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
import { toolHref, toolRouteByKey } from '@/lib/toolRoutes';
import { getCurrentSingaporeTime } from '@/utils/timezoneUtils';
import { resolveClientFollowUp } from '../lib/followUps';
import { clientFromRow } from '../lib/clientMapping';
import { profilerHrefFor } from '../lib/profilerEntry';
import { useInfoToolParam } from '../hooks/useInfoToolParam';
import { useClientDetail } from '../hooks/useClientDetail';
import { useCustomerActivity } from '../hooks/useCustomerActivity';
import { useDetailJourney } from '../hooks/useDetailJourney';
import { useSoftDeleteClient } from '../hooks/useClientMutations';
import { BankHistoryTab } from '../components/detail/BankHistoryTab';
import { ClientDetailActions } from '../components/detail/ClientDetailActions';
import { CustomerToolLauncher } from '../components/detail/CustomerToolLauncher';
import { ActivityTab } from '../components/detail/ActivityTab';
import { OverviewTab } from '../components/detail/OverviewTab';
import { PoliciesTab } from '../components/detail/PoliciesTab';
import { FollowUpBadge } from '../components/FollowUpBadge';
import { ClientFormModal } from '../components/modals/ClientFormModal';

type DetailTab = 'overview' | 'policies' | 'activity' | 'bank';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { client, policies, interactions, bankHistory, linkedResults } = useClientDetail(id);
  // The merged automatic + manual timeline. `interactions` is still fetched
  // above because the follow-up badge and the report section read it directly.
  const activity = useCustomerActivity(id);
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

  const { journey, newestLinkedResult, canProfile } = useDetailJourney(model, linkedResults.data);

  // `?tool=info` — the Overview shortcut for step 02, the one tool with no
  // route of its own. Opens this page's edit form; see the hook for why.
  useInfoToolParam(Boolean(model), isOwn, () => setEditOpen(true));

  const tabs: TabNavItem[] = [
    { value: 'overview', label: 'Overview', testId: 'clients-detail-tab-overview' },
    { value: 'policies', label: 'Policies', count: policies.data?.length ?? null, testId: 'clients-detail-tab-policies' },
    { value: 'activity', label: 'Activity', count: activity.data?.length ?? null, testId: 'clients-detail-tab-activity' },
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
                ? [<FollowUpBadge key="follow-up" date={followUp.date} refDate={refDate} testId="clients-detail-follow-up-badge" />]
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
            isOwn={isOwn}
            canProfile={canProfile}
            onStartProfiler={() => navigate(profilerHrefFor({ id, name: model.name }))}
            onOpenProfile={(resultId) => navigate(`/profiler-results/${resultId}`)}
            onEditInformation={() => setEditOpen(true)}
            onOpenReport={() => navigate(`/clients/${id}/report`)}
            // Straight at the new routes, not through the redirect.
            onOpenTax={() => navigate(toolHref(toolRouteByKey('tax'), id))}
            onOpenSrs={() => navigate(toolHref(toolRouteByKey('srs'), id))}
            onOpenLegacy={() => navigate(toolHref(toolRouteByKey('legacy'), id))}
          />
          <OverviewTab client={model} linkedResults={linkedResults} />
        </>
      )}
      {model && id && tab === 'policies' && (
        <PoliciesTab clientId={id} readOnly={!isOwn} policies={policies} />
      )}
      {model && id && tab === 'activity' && (
        <ActivityTab clientId={id} readOnly={!isOwn} activity={activity} interactions={interactions} />
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
