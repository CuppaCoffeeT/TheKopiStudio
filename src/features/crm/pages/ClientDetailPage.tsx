/**
 * ClientDetailPage — one client's record (DETAIL archetype, route
 * /clients/:id — shares modulePath '/clients' with the list).
 *
 * P1 scaffold: real DetailPageFrame with breadcrumb + record chip. With no
 * data layer yet (and empty live tables) every id resolves to not-found, so
 * the body renders the not-found surface the shipped page keeps for missing
 * rows. P3 wires the crmClients detail hook; P4 adds the Overview/Policies/
 * Interactions/Bank-history tabs and the follow-up badge in the header meta.
 */

import { useNavigate, useParams } from 'react-router-dom';
import { DetailPageFrame } from '@/components/primitives/detail/DetailPageFrame';
import { Button } from '@/components/primitives/shell/Button';
import { Card } from '@/components/primitives/shell/Card';
import { NoResultsState } from '@/components/primitives/shell/NoResultsState';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <DetailPageFrame
      breadcrumb={[
        { label: 'Workspace', href: '/dashboard' },
        { label: 'Clients', href: '/clients' },
        { label: 'Client' },
      ]}
      title="Client record"
      recordId={id ? id.slice(0, 8) : undefined}
      variant="fullWidth"
      testId="client-detail"
    >
      <Card data-testid="client-detail-not-found">
        <NoResultsState query={id} />
        <div className="flex justify-center pb-2">
          <Button
            variant="outline"
            onClick={() => navigate('/clients')}
            data-testid="client-detail-back-link"
          >
            ← Back to clients
          </Button>
        </div>
      </Card>
    </DetailPageFrame>
  );
}
