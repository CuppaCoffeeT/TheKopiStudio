/**
 * ToolShortcutLauncher — the Overview tool shortcuts, end to end.
 *
 * Composes the button row with the customer picker it opens, and owns the one
 * piece of state between them: which tool is waiting on a customer. Kept as a
 * single unit because neither half means anything alone — a row that cannot ask
 * "who?" navigates nowhere, and a picker with no tool has nothing to open.
 *
 * It renders as `CustomerQueueBoard`'s `belowStats` slot, modal included: the
 * picker is a Radix Dialog and portals to `document.body`, so it is unaffected
 * by sitting inside the queue's markup.
 *
 * Module gating happens here rather than at the page: `visibleToolShortcuts`
 * hides any tool the viewer's modules don't grant, so the row can never
 * advertise a route the guard would refuse.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ToolShortcutRow } from './ToolShortcutRow';
import { ToolCustomerPickerModal } from './modals/ToolCustomerPickerModal';
import {
  visibleToolShortcuts,
  type ToolShortcut,
  type ToolShortcutCustomer,
} from '../lib/dashboardToolShortcuts';

export function ToolShortcutLauncher() {
  const navigate = useNavigate();
  const { modules } = useAuth();
  /** The tool waiting on a customer — non-null while the picker is open. */
  const [pendingTool, setPendingTool] = useState<ToolShortcut | null>(null);

  const shortcuts = visibleToolShortcuts(modules);
  if (shortcuts.length === 0) return null;

  /**
   * The shortcut contract: the tool decides the route, the picker decides the
   * customer, and the destination is byte-identical to the one
   * `ClientDetailPage`'s launcher would have navigated to for that customer.
   */
  const handleConfirm = (shortcut: ToolShortcut, customer: ToolShortcutCustomer) => {
    setPendingTool(null);
    navigate(shortcut.href(customer));
  };

  return (
    <>
      <ToolShortcutRow shortcuts={shortcuts} onPick={setPendingTool} />
      <ToolCustomerPickerModal
        shortcut={pendingTool}
        onOpenChange={(next) => {
          if (!next) setPendingTool(null);
        }}
        onConfirm={handleConfirm}
      />
    </>
  );
}
