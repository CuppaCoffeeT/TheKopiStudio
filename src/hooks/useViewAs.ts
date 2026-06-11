/**
 * useViewAs — connector hook for the `<ViewAsSelector>` primitive.
 *
 * Wires auth (real user + start/stop) + the `get_all_users` RPC. Returns the
 * exact prop shape the primitive expects, so the call site is:
 *
 *   <ViewAsSelector {...useViewAs()} />
 *
 * The primitive self-guards (renders null when `realUser` is missing or not
 * super_admin) so the hook always returns a valid prop bag.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';
import type { ViewAsSelectorUser } from '@/components/primitives/shell/ViewAsSelector';

interface AllUsersRow extends ViewAsSelectorUser {
  is_active?: boolean;
  is_approved?: boolean;
}

export function useViewAs() {
  const {
    isImpersonating,
    realUser,
    user,
    startImpersonation,
    stopImpersonation,
    impersonationLoading,
  } = useAuth();

  const { data: allUsers = [] } = useQuery<AllUsersRow[]>({
    queryKey: queryKeys.users.list({ purpose: 'impersonation' }),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users');
      if (error) throw error;
      return (data || []) as AllUsersRow[];
    },
    enabled: realUser?.role === 'super_admin',
    staleTime: 5 * 60 * 1000,
  });

  const users = useMemo<ViewAsSelectorUser[]>(
    () =>
      allUsers
        .filter((u) => u.is_active && u.is_approved)
        .map(({ id, name, email, role }) => ({ id, name, email, role }))
        .sort((a, b) => {
          const roleCompare = a.role.localeCompare(b.role);
          if (roleCompare !== 0) return roleCompare;
          return a.name.localeCompare(b.name);
        }),
    [allUsers],
  );

  return {
    realUser: realUser
      ? { id: realUser.id, email: realUser.email, role: realUser.role }
      : null,
    users,
    activeImpersonatedUserId: isImpersonating ? user?.id ?? null : null,
    isImpersonating,
    impersonationLoading,
    onSelect: startImpersonation,
    onExit: stopImpersonation,
  };
}
