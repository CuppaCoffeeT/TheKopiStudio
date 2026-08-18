/**
 * CustomerToolRedirect — keeps the old `/clients/:id/<tool>` URLs alive.
 *
 * The planning tools moved to top-level `/tools/*` routes on 2026-08-18 and now
 * carry their customer as `?customer=<id>` (see `lib/toolRoutes`). Deleting the
 * old paths would 404 every bookmark, every browser-history entry and every
 * link already sent to a colleague, so each one redirects instead, carrying the
 * customer across so the advisor lands exactly where the old URL pointed.
 *
 * `replace` — the old URL must not sit in history, or Back from the tool would
 * bounce straight through it and forward again.
 */

import { Navigate, useParams } from 'react-router-dom';
import { CUSTOMER_PARAM } from '@/lib/toolRoutes';

export function CustomerToolRedirect({ to }: { to: string }) {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `${to}?${CUSTOMER_PARAM}=${id}` : to} replace />;
}
