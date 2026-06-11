/**
 * Collapsible — Radix Collapsible wrapper with AppBase tokens.
 *
 * Exposes shadcn-compat API (`Collapsible`, `CollapsibleTrigger`,
 * `CollapsibleContent`) for drop-in import-swap migration.
 */

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';

export const Collapsible = CollapsiblePrimitive.Root;
export const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
export const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;
