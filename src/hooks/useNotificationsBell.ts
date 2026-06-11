/**
 * useNotificationsBell — connector hook for the `<NotificationsBell>` primitive.
 *
 * Returns the `{ items, total, onPick }` shape the primitive expects:
 *
 *   <NotificationsBell {...useNotificationsBell()} />
 *
 * The base ships with NO notification source wired — `items` is empty so the
 * bell renders an empty state. Populate `items` from your own data (e.g. a
 * query against the `notifications` table, or per-module attention counts) when
 * you build notifications out.
 */
import { useNavigate } from 'react-router-dom';
import { addRecentModule } from '@/utils/dashboardHelpers';
import type { NotificationsBellItem } from '@/components/primitives/shell/NotificationsBell';

export function useNotificationsBell() {
  const navigate = useNavigate();

  const items: NotificationsBellItem[] = [];
  const total = 0;

  const onPick = (path: string) => {
    addRecentModule(path);
    navigate(path);
  };

  return { items, total, onPick };
}
