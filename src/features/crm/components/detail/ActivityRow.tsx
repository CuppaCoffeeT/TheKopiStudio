/**
 * ActivityRow — one entry on a customer's timeline.
 *
 * Split from `ActivityTab` at the seam that was already there: the tab owns the
 * query, the "Log contact" affordance and the two modals; this owns what a
 * single entry LOOKS like. It is also the file that encodes the one rule the
 * timeline turns on — only MANUAL rows get controls.
 *
 * - **Manual** (from `interactions`) — keeps the original
 *   `clients-interaction-*` testids for the row and its Edit / Delete buttons.
 *   A human typed it, so a human can correct it, and the E2E cleanup path
 *   (`ClientsPage.deleteAllChildRows('interactions')`) still finds what it
 *   needs.
 * - **Automatic** (from `customer_activity`) — `clients-activity-row-*`, and no
 *   actions at all. That table carries no UPDATE or DELETE policy: an audit
 *   trail the audited party can rewrite is not one, and offering a control RLS
 *   would refuse is worse than offering none.
 *
 * An edit entry expands to its field-level diff — `Annual income: $4,500 →
 * $5,000` — which is the difference between a log that says the tool ran and
 * one that says what it did.
 *
 * Names are NOT masked here: you are already looking at this customer's
 * record, so the privacy eye has nothing left to protect on this page.
 */

import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { formatDisplayDateLong, formatDisplayDateTimeLong } from '@/utils/timezoneUtils';
import { ACTIVITY_TOOL_LABEL, formatChange, type CustomerActivityEntry } from '../../lib/customerActivity';
import type { CrmInteraction } from '../../types';
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

interface ActivityRowProps {
  entry: CustomerActivityEntry;
  /** The full model behind a MANUAL entry — absent for automatic ones, and
   *  absent in read-only mode, which is what removes the controls. */
  interaction?: CrmInteraction;
  onEdit: (interaction: CrmInteraction) => void;
  onDelete: (interaction: CrmInteraction) => void;
}

export function ActivityRow({ entry, interaction, onEdit, onDelete }: ActivityRowProps) {
  return (
    <li
      data-testid={
        entry.manual ? `clients-interaction-row-${entry.id}` : `clients-activity-row-${entry.id}`
      }
      className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-start sm:gap-4"
    >
      <span className="w-[136px] flex-none text-[11.5px] text-[color:var(--fg-dim)]">
        {/* A logged contact prints the date the advisor SAID it happened, not
            when they typed it up — logging last Tuesday's call today must read
            as last Tuesday. */}
        {entry.manual && entry.loggedDate
          ? formatDisplayDateLong(entry.loggedDate)
          : formatDisplayDateTimeLong(entry.occurredAt)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TYPE_TONES[entry.type] ?? 'neutral'}>{badgeLabel(entry)}</Badge>
          <span className="text-[13px] text-foreground">{entryTitle(entry)}</span>
          {interaction && (
            <RowActions
              onEdit={() => onEdit(interaction)}
              onDelete={() => onDelete(interaction)}
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
              <li key={change.field} className="text-[12px] leading-[1.6] text-[color:var(--fg-dim)]">
                <span className="text-muted-foreground">{change.label}:</span>{' '}
                {formatChange(change)}
              </li>
            ))}
          </ul>
        )}

        {entry.actorName && (
          <p className="m-0 mt-1 text-[11.5px] text-[color:var(--fg-dim)]">by {entry.actorName}</p>
        )}
      </div>
    </li>
  );
}
