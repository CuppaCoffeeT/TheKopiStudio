/**
 * useUpdateEmail — auth email change via `supabase.auth.updateUser`.
 *
 * NEVER writes `public.users.email` directly — the address only changes after
 * the user clicks the confirmation link(s) Supabase sends, and the foundation
 * trigger mirrors it into `public.users` from auth.
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toastHelper';

export function useUpdateEmail() {
  return useMutation({
    mutationFn: async (newEmail: string) => {
      const { data, error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess(
        'Confirmation email sent',
        'Open the link in the email to finish changing your address. Until then your current email stays active.',
      );
    },
    onError: (error: Error) => {
      showError('Failed to start email change', error);
    },
  });
}
