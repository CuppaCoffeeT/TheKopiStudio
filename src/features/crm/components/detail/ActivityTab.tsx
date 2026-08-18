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
 * TWO KINDS OF ROW, and only one is editable:
 *
 * - **Manual** (`interactions`) — keeps the old Edit / Delete row actions and
 *   their exact testids. A human typed it, so a human can correct it, and the
 *   E2E cleanup path (`ClientsPage.deleteAllChildRows('interactions')`) still
 *   finds what it needs.
 * - **Automatic** (`customer_activity`) — no actions at all. The table carries
 *   no UPDATE or DELETE policy; an audit trail the audited party can rewrite is
 *   not one, and offering a control RLS would refuse is worse than offering
 *   none.
 *
 * An edit entry expands to its field-level diff — `Annual income: $4,500 →
 * $5,000` — which is the difference between a log that says the tool ran and
 * one that says what it did.
 *
 * Names inside entries are NOT masked here: you are already looking at this
 * customer's record, so the eye has nothing left to protect on this page.
 */

import { useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { DestructiveConfirmDialog } from '@/components/primitives/detail/DestructiveConfirmDialog';
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { formatDisplayDateLong, formatDisplayDateTimeLong } from '@/utils/timezoneUtils';
import { useSoftDeleteInteraction } from '../../hooks/useInteractionMutations';
import {
  ACTIVITY_TOOL_LABEL,
  formatChange,
  type CustomerActivityEntry,
} from '../../lib/customerActivity';
import type { CrmInteraction } from '../../types';
import { InteractionFormModal } from '../modals/InteractionFormModal';
import { ListSection } from './ListSection';
import { RowActions } from './RowActions';

/** Tone per activity kind. Manual contacts keep the interaction-type tones. */
const TYPE_TONES: Record<string, BadgeTone> = {
  customer_created: 'neutral',
  profile_created: 'success',
  profile_updated: 'success',
  info_updated: 'info',
  tool_opened: 'neutral',
  report_generated: 'accent',
  policy_changed: 'warning',
  balance_updated: 'warning',
  contact_logged: 'info',
};

/** The word printed on an entry's badge. */
function badgeLabel(entry: CustomerActivityEntry): string {
  if (entry.manual) return entry.summary;
  if (entry.tool) return ACTIVITY_TOOL_LABEL[entry.tool] ?? entry.tool;
  return entry.type === 'info_updated' ? 'Information' : 'Record';
}

/** The headline line of an entry. */
function entryTitle(entry: CustomerActivityEntry): string {
  if (!entry.manual) return entry.summary;
  return entry.notes?.trim() ? entry.notes : 'Contact logged';
}

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
        {rows.map((entry) => {
          const interaction = entry.manual ? interactionById.get(entry.id) : undefined;
          return (
            <li
              key={`${entry.manual ? 'manual' : 'auto'}-${entry.id}`}
              data-testid={
                entry.manual
                  ? `clients-interaction-row-${entry.id}`
                  : `clients-activity-row-${entry.id}`
              }
              className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-start sm:gap-4"
            >
              <span className="w-[136px] flex-none text-[11.5px] text-[color:var(--fg-dim)]">
                {entry.manual && entry.loggedDate
                  ? formatDisplayDateLong(entry.loggedDate)
                  : formatDisplayDateTimeLong(entry.occurredAt)}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TYPE_TONES[entry.type] ?? 'neutral'}>{badgeLabel(entry)}</Badge>
                  <span className="text-[13px] text-foreground">{entryTitle(entry)}</span>
                  {/* Only manual rows. See the docblock: the automatic table
                      carries no UPDATE/DELETE policy, so a control here would
                      be one RLS refuses. */}
                  {!readOnly && interaction && (
                    <RowActions
                      onEdit={() => {
                        setEditing(interaction);
                        setFormOpen(true);
                      }}
                      onDelete={() => setDeleting(interaction)}
                      editLabel={`Edit ${interaction.type} contact`}
                      deleteLabel={`Delete ${interaction.type} contact`}
                      editTestId={`clients-interaction-edit-btn-${interaction.id}`}
                      deleteTestId={`clients-interaction-delete-btn-${interaction.id}`}
                    />
                  )}
                </div>

                {entry.changes.length > 0 && (
                  <ul
                    className="m-0 mt-1.5 list-none space-y-0.5 p-0"
                    data-testid={`clients-activity-changes-${entry.id}`}
                  >
                    {entry.changes.map((change) => (
                      <li
                        key={change.field}
                        className="text-[12px] leading-[1.6] text-[color:var(--fg-dim)]"
                      >
                        <span className="text-muted-foreground">{change.label}:</span>{' '}
                        {formatChange(change)}
                      </li>
                    ))}
                  </ul>
                )}

                {entry.actorName && (
                  <p className="m-0 mt-1 text-[11.5px] text-[color:var(--fg-dim)]">
                    by {entry.actorName}
                  </p>
                )}
              </div>
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
