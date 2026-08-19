/**
 * ToolSaveBar — the save row the tax calculator and the SRS planner share.
 *
 * Both tools used to end with a note saying nothing was saved. They now write
 * their figures onto the customer, so the honest thing in that spot is a state
 * line plus a button, mirroring the Legacy Map's bar exactly (same wording
 * shape, same `isOwn` rule, same `Save` icon) — three planning tools that
 * persist should not each explain saving differently.
 *
 * FOUR STATES, and each is a real one:
 * - no customer chosen → nothing to save to, so say what a customer would buy
 * - another advisor's customer → read-only; the button is not rendered at all,
 *   because RLS would reject the write and a disabled button that never
 *   enables is a worse explanation than its absence
 * - never saved → "Not saved to <name> yet."
 * - saved before → when
 *
 * NO DIRTY TRACKING, unlike the Legacy Map. These tools are calculators: an
 * advisor may open one, change nothing, and still want today's figures stamped
 * onto the record. Save stays enabled.
 */

import { Save } from 'lucide-react';
import { Button } from '@/components/primitives/shell/Button';
import { formatDisplayDateTimeLong } from '@/utils/timezoneUtils';

interface ToolSaveBarProps {
  /** The customer's name, for the state line. Ignored when `customerId` is null. */
  customerName: string;
  customerId: string | null;
  /** False when a manager is reading another advisor's customer. */
  isOwn: boolean;
  /** ISO timestamp of the last save for THIS tool, '' = never. */
  savedAt: string;
  saving: boolean;
  onSave: () => void;
  /** e.g. "Save to customer". */
  label: string;
  /** What choosing a customer would enable, shown when none is chosen. */
  blankHint: string;
  testId: string;
}

export function ToolSaveBar({
  customerName,
  customerId,
  isOwn,
  savedAt,
  saving,
  onSave,
  label,
  blankHint,
  testId,
}: ToolSaveBarProps) {
  const state = !customerId
    ? blankHint
    : !isOwn
      ? 'Read-only — this customer belongs to another advisor.'
      : savedAt
        ? `Saved to ${customerName} ${formatDisplayDateTimeLong(savedAt)}.`
        : `Not saved to ${customerName} yet.`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="m-0 text-[12px] text-[color:var(--fg-dim)]" data-testid={`${testId}-state`}>
        {state}
      </p>
      {customerId && isOwn && (
        <Button
          className="flex-none pointer-coarse:min-h-11"
          onClick={onSave}
          loading={saving}
          leadingIcon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}
          data-testid={`${testId}-btn`}
        >
          {label}
        </Button>
      )}
    </div>
  );
}
