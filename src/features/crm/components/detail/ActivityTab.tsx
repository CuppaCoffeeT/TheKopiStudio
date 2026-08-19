/**
 * ActivityTab — the customer's history, recorded automatically.
 *
 * WHAT THIS REPLACED (2026-08-18): `InteractionsTab`, whose primary affordance
 * was "+ Add interaction" — a form the advisor had to remember to fill in after
 * doing something the app had just watched them do. Everything observable now
 * writes itself (`lib/customerActivity`), and this tab reads the merged result:
 * automatic entries and human-logged contacts in one date order.
 *
 * "Log contact" survives as a SECONDARY action, and that is not a compromise.
 * The app cannot know you had coffee with someone, and `interactions.date` is
 * what the "no contact in 14 days" queue rule counts from — inferring contact
 * from "opened a calculator" would reset that clock without anyone having
 * spoken. The button is quiet because it is now the exception, not the routine.
 *
 * This file owns the query, the header affordance and the two modals;
 * `ActivityRow` owns what one entry looks like and the manual-vs-automatic rule
 * that decides whether it offers any controls at all.
 */

import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import { Button } from '@/components/primitives/shell/Button';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { useSoftDeleteInteraction } from '../../hooks/useInteractionMutations';
import type { CustomerActivityEntry } from '../../lib/customerActivity';
import type { CrmInteraction } from '../../types';
import { InteractionFormModal } from '../modals/InteractionFormModal';
import { ActivityRow } from './ActivityRow';
import { ListSection } from './ListSection';

interface ActivityTabProps {
  clientId: string;
  readOnly: boolean;
  activity: UseQueryResult<CustomerActivityEntry[]>;
  /** Manual rows only — the Edit form needs the full interaction model. */
  interactions: UseQueryResult<CrmInteraction[]>;
}

export function ActivityTab({ clientId, readOnly, activity, interactions }: ActivityTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmInteraction | null>(null);
  const [deleting, setDeleting] = useState<CrmInteraction | null>(null);
  const removeInteraction = useSoftDeleteInteraction(clientId);

  const rows = activity.data ?? [];
  /** Manual rows carry an `interactions.id`; look the model up for the form. */
  const interactionById = new Map((interactions.data ?? []).map((row) => [row.id, row]));

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <>
      <ListSection
        title="Activity"
        meta="Recorded automatically. Log a contact only for something the app cannot see — a meeting, a call."
        action={
          !readOnly ? (
            <Button
              variant="outline"
              size="md"
              className="pointer-coarse:min-h-11"
              leadingIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              data-testid="clients-interactions-add-btn"
            >
              Log contact
            </Button>
          ) : undefined
        }
        isLoading={activity.isLoading}
        isError={activity.isError}
        onRetry={() => void activity.refetch()}
        errorSubhead="The activity log didn't load."
        errorBody="This customer's history could not be read. Check your connection and try again."
        isEmpty={rows.length === 0}
        emptyTitle="Nothing has happened yet"
        emptySubtext={
          readOnly
            ? 'Nothing has been recorded against this customer.'
            : 'Running the profiler, editing the information or generating a report will each appear here on their own.'
        }
        testId="clients-activity"
      >
        {rows.map((entry) => (
          <ActivityRow
            key={`${entry.manual ? 'manual' : 'auto'}-${entry.id}`}
            entry={entry}
            // Read-only viewers get no model, so `ActivityRow` renders no
            // controls — the same switch that hides them for automatic rows.
            interaction={readOnly || !entry.manual ? undefined : interactionById.get(entry.id)}
            onEdit={(interaction) => {
              setEditing(interaction);
              setFormOpen(true);
            }}
            onDelete={setDeleting}
          />
        ))}
      </ListSection>

      {!readOnly && (
        <InteractionFormModal
          open={formOpen}
          onOpenChange={(next: boolean) => (next ? setFormOpen(true) : closeForm())}
          clientId={clientId}
          interaction={editing ?? undefined}
        />
      )}

      {!readOnly && (
        <DestructiveConfirmDialog
          open={deleting !== null}
          onOpenChange={(next) => {
            if (!next) setDeleting(null);
          }}
          tier={1}
          resource={
            deleting ? `${deleting.type} — ${formatDisplayDateLong(deleting.date)}` : 'contact'
          }
          resourceKind="contact"
          title="delete contact?"
          description={`This removes the ${deleting?.type ?? ''} logged on ${deleting ? formatDisplayDateLong(deleting.date) : ''} from the customer's timeline. Automatic entries are not affected.`}
          confirmLabel="Delete contact"
          loading={removeInteraction.isPending}
          onConfirm={() => {
            if (deleting) {
              removeInteraction.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
            }
          }}
          testId="clients-interaction-delete-dialog"
        />
      )}
    </>
  );
}
