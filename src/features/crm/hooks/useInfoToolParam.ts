/**
 * useInfoToolParam — honours `/clients/:id?tool=info`.
 *
 * Step 02 (Customer information) is the one tool with no route of its own: on
 * the record it has always been `ClientFormModal` opened in place. A caller
 * therefore carries its intent in a query param, and this hook is what turns
 * that param back into the open form — so the advisor lands ON the tool instead
 * of on the record, hunting for it.
 *
 * The constants used to live in `lib/dashboardToolShortcuts`, deleted with the
 * Overview shortcut row (2026-08-18). They live here now because this hook is
 * the only thing that reads them, and anything that WRITES the param is writing
 * it for this hook.
 *
 * Three details are load-bearing:
 * - it waits for the record to RESOLVE (`ready`), because the form seeds itself
 *   from the client row;
 * - it opens nothing for a customer the viewer doesn't own — that record is
 *   read-only, and a form they cannot save is worse than no form;
 * - it strips the param either way. Left in the URL, a refresh or a Back would
 *   reopen a form the advisor had already dismissed.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/** `?tool=info` — the only intent the record route carries in a query param. */
export const INFO_TOOL_PARAM = 'tool';
export const INFO_TOOL_VALUE = 'info';

export function useInfoToolParam(
  ready: boolean,
  isOwn: boolean,
  openEditForm: () => void,
): void {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get(INFO_TOOL_PARAM) !== INFO_TOOL_VALUE || !ready) return;
    if (isOwn) openEditForm();
    const next = new URLSearchParams(searchParams);
    next.delete(INFO_TOOL_PARAM);
    setSearchParams(next, { replace: true });
    // `openEditForm` is a setState dispatcher (stable); listing it would only
    // re-run this on identity churn if a caller ever passes an inline closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams, ready, isOwn]);
}
