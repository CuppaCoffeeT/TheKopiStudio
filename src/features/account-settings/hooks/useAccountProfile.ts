/**
 * useAccountProfile — combined self-profile query for Account Settings.
 *
 * Keyed on `queryKeys.users.detail(uid)` so the self-update mutation's
 * invalidation (users.all + users.detail) refreshes this view too.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { getAccountProfile } from '../api/accountService';

export function useAccountProfile() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => getAccountProfile(userId),
    enabled: userId.length > 0,
  });
}
