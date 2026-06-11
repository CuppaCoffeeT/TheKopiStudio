/**
 * useLoginRedirect — session-aware redirect for the /login page.
 *
 * When an already-authenticated user lands on /login (a user pressing Back
 * after sign-in, or a Playwright spec running under a saved storageState),
 * redirect straight to /dashboard so the form never collects a second,
 * redundant sign-in. The E2E harness relies on this contract: under
 * storageState, tests/pom/LoginPage.ts treats "bounced off /login" as proof
 * of an authed session, making in-spec signIn() an instant no-op — which is
 * what lets playwright.parallel.config.ts run many workers without parallel
 * UI sign-ins racing on Supabase session tokens.
 *
 * The guard mirrors ProtectedRoute's pass condition exactly (user present AND
 * not blocked by an unapproved/inactive profile) so the pair can never
 * ping-pong a blocked user between /login and /dashboard. In practice
 * AuthContext already signs unapproved users out during checkAuth, but
 * mirroring the condition keeps the no-loop property even if that changes.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function useLoginRedirect(): void {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (profile && (!profile.is_approved || !profile.is_active)) return;
    navigate('/dashboard', { replace: true });
  }, [loading, user, profile, navigate]);
}
