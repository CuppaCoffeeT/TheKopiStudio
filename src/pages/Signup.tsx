import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toastHelper';
import { useLoginRedirect } from '@/hooks/useLoginRedirect';
import { AuthShell, AUTH_LINK_CLASS } from '@/components/shared/auth-shell/AuthShell';
import { Button } from '@/components/primitives/shell';
import { Field, Input } from '@/components/primitives/form';

const MIN_PASSWORD_LENGTH = 8; // matches SecurityPasswordForm

/**
 * Signup — self-serve account creation, gated by admin approval.
 *
 * The backend half of this flow has been live all along; only the screen was
 * missing. `supabase.auth.signUp` inserts into `auth.users`, the
 * `on_auth_user_created` trigger mirrors a `public.users` row with
 * `role = 'advisor'` and `is_approved = false` (role is hardcoded there — the
 * metadata we pass can never self-elevate), and an admin flips approval from
 * /manage-accounts. So a new account is inert until two things happen: the
 * address is confirmed, and someone approves it.
 *
 * Email confirmation is REQUIRED (`mailer_autoconfirm` is false on the
 * project), so `signUp` returns no session and the user must click the link in
 * their inbox first. `emailRedirectTo` sends that link back to /login.
 *
 * NO ENUMERATION: when confirmations are on, Supabase answers a signup for an
 * already-registered address with a normal-looking user whose `identities`
 * array is empty, precisely so the form can't be used to test which emails
 * exist. We render the identical "check your inbox" panel either way and never
 * branch on it.
 */
export default function Signup() {
  useLoginRedirect();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const lengthError =
    password.length > 0 && password.length < MIN_PASSWORD_LENGTH
      ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      : undefined;
  const matchError =
    confirm.length > 0 && confirm !== password ? 'Passwords do not match.' : undefined;
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= MIN_PASSWORD_LENGTH &&
    confirm === password &&
    !loading;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    setLoading(false);
    if (error) {
      showError(`Sign up failed: ${error.message}`);
      return;
    }
    setSubmitted(true);
  }

  const footer = (
    <>
      Already have an account?{' '}
      <Link to="/login" className={AUTH_LINK_CLASS} data-testid="signup-login-link">
        Sign in
      </Link>
    </>
  );

  if (submitted) {
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${email.trim()}.`}
        testId="signup-confirmation"
        footer={footer}
      >
        <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--border-soft)] pt-5">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Confirm the address to activate your credentials. An administrator then approves the
            account before it can reach the suite — you'll be able to sign in once that's done.
          </p>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            No email after a few minutes? Check spam, or ask your administrator to set the account
            up directly.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="New accounts need an administrator's approval before they open."
      testId="signup-card"
      footer={footer}
    >
      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-4 border-t border-[color:var(--border-soft)] pt-5"
      >
        <Field label="Full name" required>
          <Input
            size="lg"
            type="text"
            className="bg-popover"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Jane Tan"
            autoComplete="name"
            aria-label="Full name"
            data-testid="signup-name-input"
            required
          />
        </Field>
        <Field label="Email" required>
          <Input
            size="lg"
            type="email"
            className="bg-popover"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-label="Email"
            data-testid="signup-email-input"
            required
          />
        </Field>
        <Field
          label="Password"
          required
          error={lengthError}
          hint={lengthError ? undefined : `At least ${MIN_PASSWORD_LENGTH} characters.`}
        >
          <Input
            size="lg"
            type="password"
            className="bg-popover"
            value={password}
            error={!!lengthError}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-label="Password"
            data-testid="signup-password-input"
            required
          />
        </Field>
        <Field label="Confirm password" required error={matchError}>
          <Input
            size="lg"
            type="password"
            className="bg-popover"
            value={confirm}
            error={!!matchError}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            aria-label="Confirm password"
            data-testid="signup-confirm-input"
            required
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!canSubmit}
          className="mt-1 w-full justify-center"
          data-testid="signup-submit-btn"
        >
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
