/**
 * useRecoverySession — is the visitor holding a valid password-recovery
 * session, or did they arrive on a dead link?
 *
 * The client runs Supabase's implicit flow (no `flowType` is set on the client,
 * so supabase-js defaults to it) with `detectSessionInUrl` on, which means the
 * library trades the `#access_token=…&type=recovery` hash for a real session
 * before any consumer of this hook mounts. That session IS the authorisation to
 * change the password — which is why the reset screen never asks for the
 * current one. A dead or already-used link creates no session and leaves
 * `#error=…&error_code=otp_expired` in the hash instead.
 *
 * `getSession()` awaits the URL parsing internally, so one call is enough; the
 * PASSWORD_RECOVERY subscription is a belt-and-braces catch for the event
 * landing after that first read.
 *
 * Note the third state: AuthContext signs unapproved/inactive users straight
 * back out, so such a user can hold a technically valid recovery link and still
 * end up here with no session. Callers should phrase the dead-link copy to
 * cover "ask your administrator" as well as "expired".
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type RecoverySessionState = 'checking' | 'ready' | 'invalid';

export interface RecoverySession {
  state: RecoverySessionState;
  /** Supabase's own reason from the URL hash, when it gave one. */
  linkError?: string;
}

export function useRecoverySession(): RecoverySession {
  const [state, setState] = useState<RecoverySessionState>('checking');
  const [linkError, setLinkError] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const hashError = hash.get('error_description') || hash.get('error');

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setState('ready');
        return;
      }
      setLinkError(hashError ?? undefined);
      setState('invalid');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setLinkError(undefined);
        setState('ready');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { state, linkError };
}
