/**
 * useUpdateProfile — self name/phone mutation (users_update policy).
 *
 * On success: invalidates users.all + users.detail(uid) (per react-query rule)
 * and calls AuthContext.refreshAuth() so the header user menu reflects the new
 * name immediately.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { queryKeys } from '@/utils/queryKeys';
import { showSuccess, showError } from '@/utils/toastHelper';
import { updateSelf } from '../api/accountService';
import type { UpdateSelfInput } from '../types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, refreshAuth } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateSelfInput) => {
      if (!user?.id) {
        throw new Error('You must be signed in to update your profile');
      }
      return updateSelf(user.id, input);
    },
    onSuccess: async (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(updated.id) });
      await refreshAuth();
      showSuccess('Profile updated');
    },
    onError: (error: Error) => {
      showError('Failed to update profile', error);
    },
  });
}
