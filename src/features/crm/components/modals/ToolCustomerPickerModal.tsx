/**
 * ToolCustomerPickerModal — "which customer?", asked once a tool has been
 * chosen from the Overview shortcut row.
 *
 * Every planning route is a sub-route of a customer (`PlanningToolFrame` reads
 * `useParams().id` and renders an empty state without one), so this modal is
 * what makes a tool launchable from a page that has no customer in scope. It
 * resolves a customer and hands it back; the caller owns the navigation.
 *
 * SCOPE: the advisor's OWN customers only — `useOwnClientOptions` filters on
 * `user_id` rather than leaning on RLS, which would show a manager the whole
 * firm's book in a dropdown that exists to launch their own work.
 *
 * `SearchableMultiSelect` in single-select mode is the mandated picker
 * (`.claude/rules/ui-components.md`) and must NOT be portaled inside a Dialog —
 * it isn't: `Modal`'s content is a transform-free flex centerer precisely so the
 * non-portaled popover positions to the viewport.
 */

import { useEffect, useState } from 'react';
import { Modal, ModalGhostAction, ModalPrimaryAction } from '@/components/primitives/overlays/Modal';
import { SearchableMultiSelect, type SMSOption } from '@/components/primitives/overlays';
import { useOwnClientOptions } from '../../hooks/useOwnClientOptions';
import type { ToolShortcut, ToolShortcutCustomer } from '../../lib/dashboardToolShortcuts';

interface ToolCustomerPickerModalProps {
  /** The chosen tool — `null` closes the modal. */
  shortcut: ToolShortcut | null;
  onOpenChange: (next: boolean) => void;
  onConfirm: (shortcut: ToolShortcut, customer: ToolShortcutCustomer) => void;
}

export function ToolCustomerPickerModal({
  shortcut,
  onOpenChange,
  onConfirm,
}: ToolCustomerPickerModalProps) {
  const open = shortcut !== null;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch only once the picker is open, and drop the selection between
  // openings — the next tool is rarely for the same customer, and a pre-filled
  // name the advisor didn't choose is how the wrong record gets opened.
  const { data: customers, isLoading, isError, refetch } = useOwnClientOptions(open);

  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

  const options: SMSOption[] = (customers ?? []).map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  const selected = customers?.find((customer) => customer.id === selectedId) ?? null;
  const isEmpty = !isLoading && !isError && options.length === 0;

  const handleConfirm = () => {
    if (!shortcut || !selected) return;
    onConfirm(shortcut, { id: selected.id, name: selected.name });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={shortcut ? `Open ${shortcut.label}` : ''}
      description={shortcut?.pickerHint}
      testId="home-tool-customer-picker"
      footer={
        <>
          <ModalGhostAction onClick={() => onOpenChange(false)}>Cancel</ModalGhostAction>
          <ModalPrimaryAction
            onClick={handleConfirm}
            disabled={!selected}
            data-testid="home-tool-customer-picker-confirm"
          >
            Open
          </ModalPrimaryAction>
        </>
      }
    >
      {isLoading && (
        <p className="m-0 text-[13px] leading-[1.6] text-[color:var(--fg-dim)]">
          Loading your customers…
        </p>
      )}

      {isError && (
        // Row-level, not a filled red panel (.claude/rules/light-theme.md).
        <p className="m-0 text-[13px] leading-[1.6] text-[color:var(--negative-text)]">
          Your customers could not be read.{' '}
          <button
            type="button"
            className="underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[color:var(--ring)]"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </p>
      )}

      {isEmpty && (
        <p className="m-0 text-[13px] leading-[1.6] text-[color:var(--fg-dim)]">
          You have no customers yet. Add one from the Overview first — a tool always runs on a
          customer's record.
        </p>
      )}

      {!isLoading && !isError && !isEmpty && (
        <SearchableMultiSelect
          options={options}
          value={selectedId}
          onValueChange={setSelectedId}
          label="Customer"
          placeholder="Search your customers…"
          triggerTestId="home-tool-customer-select"
          optionTestIdPrefix="home-tool-customer-option"
        />
      )}
    </Modal>
  );
}
