/**
 * useRoleSync — the ONLY sanctioned mutation path for role/approval changes.
 *
 * POSTs to the role-sync edge function with the CALLER's access token as the
 * Bearer (the function authorizes from the database, but identifies the caller
 * from this JWT). Direct `users` UPDATEs are blocked by design (self-only RLS
 * + `protect_user_privileges` trigger), so there is no fallback path.
 *
 * Non-2xx responses carry actionable `{ error }` messages (incl. the
 * last-super-admin 400 guard) — surfaced VERBATIM via showError.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/utils/queryKeys';
import { showError, showSuccess } from '@/utils/toastHelper';
import type { AssignableRole } from '../types';
import { ROLE_LABELS } from '../lib/roleLabels';

export interface RoleSyncInput {
  user_id: string;
  role?: AssignableRole;
  is_approved?: boolean;
}

export interface RoleSyncResponse {
  success: boolean;
  user_id: string;
  role: string;
  is_approved: boolean;
  /** v2: legacy `public.profiles.role` mirror outcome (only on role changes). */
  profiles_mirror?: 'ok' | 'failed';
}

async function postRoleSync(input: RoleSyncInput): Promise<RoleSyncResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Your session has expired — please sign in again.');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/role-sync`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body (e.g. gateway error page) — fall through to status message.
  }

  if (!response.ok) {
    const serverError =
      body !== null &&
      typeof body === 'object' &&
      typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Role sync failed (HTTP ${response.status})`;
    throw new Error(serverError);
  }

  return body as RoleSyncResponse;
}

export function useRoleSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postRoleSync,
    onSuccess: (_data, input) => {
      if (input.is_approved !== undefined) {
        showSuccess(input.is_approved ? 'Account approved' : 'Approval revoked');
      } else if (input.role) {
        showSuccess(`Role updated to ${ROLE_LABELS[input.role]}`);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });
}
