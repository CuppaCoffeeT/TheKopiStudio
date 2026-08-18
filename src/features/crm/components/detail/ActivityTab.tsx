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
import { Badge, type BadgeTone } from '@/components/primitives/shell/Badge';
import { Button } from '@/components/primitives/shell/Button';
import { formatDisplayDateLong, formatDisplayDateTimeLong } from '@/utils/timezoneUtils';
import {
  ACTIVITY_TOOL_LABEL,
  formatChange,
  type CustomerActivityEntry,
} from '../../lib/customerActivity';
import { InteractionFormModal } from '../modals/InteractionFormModal';
import { ListSection } from './ListSection';

/** Tone per activity kind. Manual contacts keep the interaction-type tones. */
const TYPE_TONES: Record<string, BadgeTone> = {
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
}

export function ActivityTab({ clientId, readOnly, activity }: ActivityTabProps) {
  const [formOpen, setFormOpen] = useState(false);
  const rows = activity.data ?? [];

  return (
    <>
      <ListSection
        title="Activity"
        action={
          !readOnly ? (
            <Button
              variant="outline"
              size="sm"
              className="pointer-coarse:min-h-11"
              leadingIcon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
              onClick={() => setFormOpen(true)}
              data-testid="crm-log-contact-btn"
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
        emptySubtext="Running the profiler, editing the information or generating a report will each appear here on their own — there is nothing to add by hand."
        testId="crm-activity-section"
      >
        {rows.length > 0 && (
          <ul className="m-0 list-none px-5 py-1" data-testid="crm-activity-list">
            {rows.map((entry) => (
              <li
                key={`${entry.manual ? 'manual' : 'auto'}-${entry.id}`}
                data-testid={`crm-activity-row-${entry.id}`}
                className="flex flex-col gap-1.5 border-b border-[color:var(--border-soft)] py-3.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-4"
              >
                <span className="w-[132px] flex-none text-[12px] text-[color:var(--fg-dim)]">
                  {entry.manual && entry.loggedDate
                    ? formatDisplayDateLong(entry.loggedDate)
                    : formatDisplayDateTimeLong(entry.occurredAt)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TYPE_TONES[entry.type] ?? 'neutral'}>{badgeLabel(entry)}</Badge>
                    <span className="text-[13px] text-foreground">{entryTitle(entry)}</span>
                  </div>

                  {entry.changes.length > 0 && (
                    <ul
                      className="m-0 mt-1.5 list-none space-y-0.5 p-0"
                      data-testid={`crm-activity-changes-${entry.id}`}
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
            ))}
          </ul>
        )}
      </ListSection>

      {!readOnly && (
        <InteractionFormModal open={formOpen} onOpenChange={setFormOpen} clientId={clientId} />
      )}
    </>
  );
}
