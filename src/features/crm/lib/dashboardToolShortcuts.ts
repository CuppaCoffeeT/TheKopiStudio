/**
 * Dashboard tool shortcuts — the pure model behind `ToolShortcutRow`.
 *
 * The six tools already live on the customer record (`CustomerToolLauncher`),
 * which is the right home for them: a tool always acts on a specific customer.
 * These shortcuts do NOT change that contract — they invert the ORDER of the
 * two questions. From the record the advisor has already chosen the customer
 * and picks the tool; from the Overview they know the tool and still owe the
 * app a customer, so every shortcut opens the picker first and only then
 * navigates to exactly the same route the launcher would have used.
 *
 * WHY THIS FILE IS NOT `customerToolCards.ts`: that model answers "what may
 * this customer's chain do next" — its cards carry per-customer STATE (done /
 * locked / the missing-info count) and gate each other. A shortcut is asked
 * before any customer exists, so it can carry no state and no gating; the only
 * thing it can honour up front is MODULE access. Folding the two together would
 * mean building a journey for a customer nobody has picked yet.
 *
 * Gating: module-only (`.claude/rules/module-access.md`) — never a role string.
 * A shortcut whose module the viewer does not hold is HIDDEN rather than
 * disabled, matching `AddCustomerChoiceModal`: advertising a route the guard
 * would then refuse is worse than not advertising it.
 */

import {
  Calculator,
  ClipboardList,
  FileText,
  PiggyBank,
  Scroll,
  UserSearch,
  type LucideIcon,
} from 'lucide-react';
import { JOURNEY_STEP_LABEL } from './customerJourney';
import { PROFILER_PATH, profilerHrefFor, type ProfilerEntryCustomer } from './profilerEntry';

/** The customer fields a shortcut needs to build its destination. */
export type ToolShortcutCustomer = ProfilerEntryCustomer;

export type ToolShortcutKey = 'profiler' | 'info' | 'report' | 'tax' | 'srs' | 'legacy';

export interface ToolShortcut {
  key: ToolShortcutKey;
  /** Same wording as the customer-record launcher — one name per tool, app-wide. */
  label: string;
  icon: LucideIcon;
  /** Sub-line in the picker: what opening this tool for the chosen customer does. */
  pickerHint: string;
  /** Module path the viewer must hold. Hidden when they don't. */
  module: string;
  /** The destination — identical to what `ClientDetailPage` navigates to. */
  href: (customer: ToolShortcutCustomer) => string;
}

const CLIENTS_MODULE = '/clients';

/**
 * `?tool=info` rather than a route of its own: step 02 has never had one — on
 * the record it is `ClientFormModal` opened in place. `ClientDetailPage` reads
 * the param, opens that same modal and strips it, so the shortcut lands ON the
 * tool instead of dropping the advisor on the record to hunt for it.
 */
export const INFO_TOOL_PARAM = 'tool';
export const INFO_TOOL_VALUE = 'info';

export const TOOL_SHORTCUTS: readonly ToolShortcut[] = [
  {
    key: 'profiler',
    label: JOURNEY_STEP_LABEL.profiler,
    icon: UserSearch,
    pickerHint: 'Runs the risk profile and saves the result onto their record.',
    module: PROFILER_PATH,
    // Carries BOTH halves of the entry contract (name + id) — see profilerEntry.
    href: (customer) => profilerHrefFor(customer),
  },
  {
    key: 'info',
    label: JOURNEY_STEP_LABEL.info,
    icon: ClipboardList,
    pickerHint: 'Opens their record with the information form ready to edit.',
    module: CLIENTS_MODULE,
    href: (customer) =>
      `/clients/${customer.id}?${INFO_TOOL_PARAM}=${INFO_TOOL_VALUE}`,
  },
  {
    key: 'report',
    label: JOURNEY_STEP_LABEL.report,
    icon: FileText,
    pickerHint: 'Needs the risk profile and their information already on file.',
    module: CLIENTS_MODULE,
    href: (customer) => `/clients/${customer.id}/report`,
  },
  {
    key: 'tax',
    label: 'Tax calculator',
    icon: Calculator,
    pickerHint: 'Pre-fills age and income from their record.',
    module: CLIENTS_MODULE,
    href: (customer) => `/clients/${customer.id}/tax-calculator`,
  },
  {
    key: 'srs',
    label: 'SRS planner',
    icon: PiggyBank,
    pickerHint: 'Pre-fills age and income from their record.',
    module: CLIENTS_MODULE,
    href: (customer) => `/clients/${customer.id}/srs`,
  },
  {
    key: 'legacy',
    label: 'Legacy Map',
    icon: Scroll,
    pickerHint: 'Reads their policies and dependants to draw who inherits.',
    module: CLIENTS_MODULE,
    href: (customer) => `/clients/${customer.id}/legacy-planner`,
  },
];

/** The shortcuts this viewer may actually be offered, in fixed 01–06 order. */
export function visibleToolShortcuts(
  modules: readonly { path: string }[],
): ToolShortcut[] {
  return TOOL_SHORTCUTS.filter((shortcut) =>
    modules.some((mod) => mod.path === shortcut.module),
  );
}
