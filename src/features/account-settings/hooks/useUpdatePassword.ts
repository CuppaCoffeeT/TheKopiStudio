/**
 * useUpdatePassword — password change via `supabase.auth.updateUser`.
 *
 * Client-side validation (min length + confirm match) lives in the form;
 * this hook only performs the auth call + toast feedback.
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toastHelper';

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Password updated', 'Use your new password the next time you sign in.');
    },
    onError: (error: Error) => {
      showError('Failed to update password', error);
    },
  });
}
