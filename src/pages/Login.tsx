import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toastHelper';
import { useLoginRedirect } from '@/hooks/useLoginRedirect';
import { AuthShell, AUTH_LINK_CLASS } from '@/components/shared/auth-shell/AuthShell';
import { Button } from '@/components/primitives/shell';
import { Field, Input } from '@/components/primitives/form';

/**
 * Login — signed-out entry, in the 2a "Kopi House" language.
 *
 * Auth runs against Supabase Auth (`signInWithPassword`). On success the
 * AuthProvider's `onAuthStateChange` rehydrates the session and we land on
 * `/dashboard`. Already-authenticated visitors are bounced straight to
 * `/dashboard` by useLoginRedirect (the contract the E2E storageState
 * harness depends on).
 *
 * Page chrome lives in AuthShell, shared with /signup, /forgot-password and
 * /reset-password.
 *
 * The inputs step UP to the raised white (`bg-popover`): the shared `Input`
 * primitive paints card cream, which is the card's own colour here, so the
 * field would dissolve into its panel. `--popover` is the token the spec
 * assigns to inputs ("the only place white appears in the comp").
 *
 * PENDING ACCOUNTS: sign-up creates the `public.users` row with
 * `is_approved = false` (the `on_auth_user_created` trigger), and both
 * AuthContext and ProtectedRoute sign such a user straight back out. Left
 * alone that reads as a silent bounce back to this form, so after a valid
 * password we read `get_user_profile` ourselves and, if the account is not
 * approved/active yet, sign out and say so in words. Empty RPC result is
 * treated the same way — AuthContext may have won the race and signed out
 * already, and "waiting on approval" is the only reason a correct password
 * lands here.
 */
export default function Login() {
  useLoginRedirect();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setPending(false);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      showError(`Sign in failed: ${error.message}`);
      return;
    }

    const { data: profileRows } = await supabase.rpc('get_user_profile');
    const profile = profileRows?.[0];
    if (!profile || !profile.is_approved || !profile.is_active) {
      await supabase.auth.signOut();
      setLoading(false);
      setPassword('');
      setPending(true);
      return;
    }

    setLoading(false);
    navigate('/dashboard');
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your account credentials to continue."
      testId="login-card"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className={AUTH_LINK_CLASS} data-testid="login-signup-link">
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-5"
      >
        <Field label="Email">
          <Input
            size="lg"
            type="email"
            className="bg-popover"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email"
            data-testid="login-email-input"
            required
          />
        </Field>
        <Field label="Password">
          <Input
            size="lg"
            type="password"
            className="bg-popover"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            aria-label="Password"
            data-testid="login-password-input"
            required
          />
        </Field>

        {pending && (
          <p
            className="text-[12.5px] leading-relaxed text-[color:var(--negative-text)]"
            role="status"
            data-testid="login-pending-approval"
          >
            Your account is waiting for an administrator to approve it. You'll be able to sign in
            once it's approved.
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="mt-1 w-full justify-center"
          data-testid="login-submit-btn"
        >
          Sign in
        </Button>

        <Link
          to="/forgot-password"
          className={`${AUTH_LINK_CLASS} self-center text-[12.5px]`}
          data-testid="login-forgot-link"
        >
          Forgot your password?
        </Link>
      </form>
    </AuthShell>
  );
}
