/**
 * InteractionsTab — date-DESC interaction timeline (service orders date /
 * created_at / id DESC): type badge, date, notes, follow-up date chip toned by
 * lib/followUps `followUpBadge` (overdue red / urgent amber / upcoming blue —
 * legacy ClientCard tones). Add / Edit go through InteractionFormModal
 * (followUp '' → null in mapping); Delete is a tier-1 confirm → soft delete.
 * All mutation affordances are hidden in read-only mode.
 */

import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { formatDisplayDateLong } from '@/utils/timezoneUtils';
import { followUpBadge } from '../../lib/followUps';
import { useSoftDeleteInteraction } from '../../hooks/useInteractionMutations';
import type { CrmInteraction } from '../../types';
import { FOLLOW_UP_BADGE_TONES } from '../followUpTone';
import { InteractionFormModal } from '../modals/InteractionFormModal';
import { ListSection } from './ListSection';
import { RowActions } from './RowActions';

/** Interaction types per the port map (PRD): Meeting · Phone Call · Email · Follow-up · Policy Review. */
const TYPE_TONES: Record<string, BadgeTone> = {
  Meeting: 'info',
  'Phone Call': 'neutral',
  Email: 'accent',
  'Follow-up': 'warning',
  'Policy Review': 'success',
};

interface InteractionsTabProps {
  clientId: string;
  readOnly: boolean;
  interactions: UseQueryResult<CrmInteraction[]>;
  /** Clock injection for the follow-up chip tone (page passes SG time). */
  refDate: Date;
}

export function InteractionsTab({ clientId, readOnly, interactions, refDate }: InteractionsTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CrmInteraction | null>(null);
  const [deleting, setDeleting] = useState<CrmInteraction | null>(null);
  const removeInteraction = useSoftDeleteInteraction(clientId);
  const rows = interactions.data ?? [];

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <>
      <ListSection
        title="Interactions"
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
              data-testid="clients-interactions-add-btn"
            >
              Add interaction
            </Button>
          ) : undefined
        }
        isLoading={interactions.isLoading}
        isError={interactions.isError}
        onRetry={() => void interactions.refetch()}
        errorSubhead="Failed to load interactions"
        errorBody="The client's interactions could not be loaded. Check your connection and try again."
        retryPath={`/clients/${clientId}`}
        isEmpty={rows.length === 0}
        emptyTitle="No interactions yet"
        emptySubtext={
          readOnly
            ? 'No meetings, calls or reviews have been logged for this client.'
            : 'Log the first meeting, call or review to build the client timeline.'
        }
        testId="clients-interactions"
      >
        {rows.map((interaction) => {
          const chip = followUpBadge(interaction.followUp || null, refDate);
          return (
            <li
              key={interaction.id}
              className="flex flex-col gap-1.5 px-5 py-4"
              data-testid={`clients-interaction-row-${interaction.id}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TYPE_TONES[interaction.type] ?? 'neutral'}>{interaction.type}</Badge>
                <span
                  className="text-[11.5px] text-zinc-500 dark:text-zinc-400"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {formatDisplayDateLong(interaction.date)}
                </span>
                {chip && (
                  <Badge tone={FOLLOW_UP_BADGE_TONES[chip.tone]}>
                    Follow-up {formatDisplayDateLong(interaction.followUp)}
                  </Badge>
                )}
                {!readOnly && (
                  <RowActions
                    onEdit={() => {
                      setEditing(interaction);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeleting(interaction)}
                    editLabel={`Edit ${interaction.type} interaction`}
                    deleteLabel={`Delete ${interaction.type} interaction`}
                    editTestId={`clients-interaction-edit-btn-${interaction.id}`}
                    deleteTestId={`clients-interaction-delete-btn-${interaction.id}`}
                  />
                )}
              </div>
              <p className="m-0 whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                {interaction.notes}
              </p>
            </li>
          );
        })}
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
          resource={deleting ? `${deleting.type} — ${formatDisplayDateLong(deleting.date)}` : 'interaction'}
          resourceKind="interaction"
          title="delete interaction?"
          description={`This removes the ${deleting?.type ?? ''} logged on ${deleting ? formatDisplayDateLong(deleting.date) : ''} from the client's timeline.`}
          confirmLabel="Delete interaction"
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
